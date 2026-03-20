import { NativeModules, Platform } from "react-native";

import { createWindow } from "@/src/domain/integrations/normalization";
import type {
  ConnectionRecord,
  MetricWindow,
  ProviderSnapshot,
} from "@/src/domain/models";
import { seededAppleHealthMetrics } from "@/src/data/fixtures/metrics";
import { AppleHealthAdapter, type AppleHealthBridge } from "@/src/data/adapters/appleHealth";
import { ManualEntryAdapter } from "@/src/data/adapters/manualEntry";
import { StravaAdapter } from "@/src/data/adapters/strava";
import { WhoopAdapter } from "@/src/data/adapters/whoop";

export const getDemoMetricWindow = (): MetricWindow =>
  createWindow(
    (() => {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start.toISOString();
    })(),
    new Date().toISOString(),
    "today",
  );

const getSleepLookbackWindow = (): MetricWindow => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const lookbackStart = new Date(startOfToday.getTime() - 12 * 60 * 60 * 1000);

  return createWindow(lookbackStart.toISOString(), now.toISOString(), "today");
};

type HealthModule = {
  Constants: {
    Permissions: Record<string, string>;
  };
  isAvailable: (callback: (error: object | null, results: boolean) => void) => void;
  initHealthKit: (
    permissions: { permissions: { read: string[]; write: string[] } },
    callback: (error: string | null, result?: unknown) => void,
  ) => void;
  getStepCount: (
    options: { date?: string; includeManuallyAdded?: boolean },
    callback: (
      error: string | object | null,
      results: { value?: number; startDate?: string; endDate?: string },
    ) => void,
  ) => void;
  getSleepSamples: (
    options: { startDate: string; endDate?: string; limit?: number; ascending?: boolean },
    callback: (
      error: string | object | null,
      results: Array<{ startDate: string; endDate: string; value: string }>,
    ) => void,
  ) => void;
  getActiveEnergyBurned: (
    options: {
      startDate: string;
      endDate?: string;
      period?: number;
      ascending?: boolean;
      includeManuallyAdded?: boolean;
    },
    callback: (
      error: string | object | null,
      results: Array<{ value: number }> | { value?: number },
    ) => void,
  ) => void;
  getSamples: (
    options: {
      startDate: string;
      endDate?: string;
      type: string;
      limit?: number;
      ascending?: boolean;
    },
    callback: (
      error: string | object | null,
      results: Array<{ calories?: number; start?: string; end?: string; startDate?: string; endDate?: string }>,
    ) => void,
  ) => void;
};

const normalizeHealthError = (error: unknown): string | undefined => {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length) {
      return message;
    }
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch {
    // Ignore serialization failures and fall back to String(error).
  }

  const fallback = String(error);
  return fallback === "[object Object]" ? undefined : fallback;
};

const healthPermissionConstants = {
  Permissions: {
    ActiveEnergyBurned: "ActiveEnergyBurned",
    SleepAnalysis: "SleepAnalysis",
    StepCount: "StepCount",
    Workout: "Workout",
  },
} as const;

const createPreviewBridge = (): AppleHealthBridge => ({
  isAvailable: async () => true,
  authorize: async () => ({ authorized: true }),
  readMetrics: async () =>
    seededAppleHealthMetrics.reduce<
      Record<string, { value: number | string | boolean | null; unit?: string }>
    >(
      (
        acc: Record<
          string,
          { value: number | string | boolean | null; unit?: string }
        >,
        metric,
      ) => {
      acc[metric.key] = {
        value: metric.value,
        unit: metric.unit,
      };
      return acc;
      },
      {},
    ),
});

const hasRequiredHealthModuleMethods = (
  candidate?: Partial<HealthModule> | null,
): candidate is HealthModule =>
  Boolean(
    candidate &&
      typeof candidate.isAvailable === "function" &&
      typeof candidate.initHealthKit === "function" &&
      typeof candidate.getStepCount === "function" &&
      typeof candidate.getSleepSamples === "function" &&
      typeof candidate.getActiveEnergyBurned === "function" &&
      typeof candidate.getSamples === "function",
  );

const loadHealthModule = (): HealthModule | undefined => {
  const nativeModule = (NativeModules?.AppleHealthKit ?? null) as Partial<HealthModule> | null;

  try {
    const loaded = require("react-native-health") as {
      default?: HealthModule;
      HealthKit?: HealthModule;
      Constants?: HealthModule["Constants"];
      [key: string]: unknown;
    };
    const resolved =
      loaded?.default ??
      loaded?.HealthKit ??
      (loaded as unknown as HealthModule);

    const constants =
      resolved?.Constants ??
      loaded?.Constants ??
      healthPermissionConstants;

    const candidate = nativeModule
      ? ({
          ...resolved,
          ...nativeModule,
          Constants: constants,
        } as HealthModule)
      : (resolved as HealthModule);

    if (hasRequiredHealthModuleMethods(candidate) && candidate.Constants?.Permissions) {
      return candidate;
    }
  } catch (error) {
    console.warn("Failed to load react-native-health", error);
  }

  if (hasRequiredHealthModuleMethods(nativeModule)) {
    return {
      ...(nativeModule as HealthModule),
      Constants: healthPermissionConstants,
    };
  }

  return undefined;
};

const callAvailability = async (healthModule: HealthModule): Promise<boolean> =>
  new Promise((resolve) => {
    healthModule.isAvailable((error, results) => {
      const normalizedError = normalizeHealthError(error);
      if (normalizedError) {
        console.warn("Apple Health availability check failed", normalizedError);
      }
      resolve(!error && Boolean(results));
    });
  });

const authorizeHealthKit = async (
  healthModule: HealthModule,
): Promise<{ authorized: boolean; error?: string }> =>
  new Promise((resolve) => {
    const permissions = {
      permissions: {
        read: [
          healthModule.Constants.Permissions.StepCount,
          healthModule.Constants.Permissions.SleepAnalysis,
          healthModule.Constants.Permissions.ActiveEnergyBurned,
          healthModule.Constants.Permissions.Workout,
        ],
        write: [],
      },
    };

    healthModule.initHealthKit(permissions, (error) => {
      const normalizedError = normalizeHealthError(error);
      resolve(
        normalizedError
          ? {
              authorized: false,
              error: normalizedError,
            }
          : { authorized: true },
      );
    });
  });

const callArrayQuery = async <T>(
  run: (callback: (error: string | object | null, results: T[]) => void) => void,
): Promise<T[]> =>
  new Promise((resolve, reject) => {
    run((error, results) => {
      const normalizedError = normalizeHealthError(error);
      if (normalizedError) {
        reject(new Error(normalizedError));
        return;
      }

      resolve(Array.isArray(results) ? results : []);
    });
  });

const callQuery = async <T>(
  run: (callback: (error: string | object | null, results: T) => void) => void,
): Promise<T> =>
  new Promise((resolve, reject) => {
    run((error, results) => {
      const normalizedError = normalizeHealthError(error);
      if (normalizedError) {
        reject(new Error(normalizedError));
        return;
      }

      resolve(results);
    });
  });

const callEnergyQuery = async (
  healthModule: HealthModule,
  window: MetricWindow,
): Promise<number | null> => {
  const result = await new Promise<Array<{ value: number }> | { value?: number }>(
    (resolve, reject) => {
      healthModule.getActiveEnergyBurned(
        {
          startDate: window.startAt,
          endDate: window.endAt,
          period: 1440,
          ascending: true,
          includeManuallyAdded: true,
        },
        (error, results) => {
          const normalizedError = normalizeHealthError(error);
          if (normalizedError) {
            reject(new Error(normalizedError));
            return;
          }

          resolve(results ?? []);
        },
      );
    },
  );

  if (Array.isArray(result)) {
    const total = result.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return total > 0 ? total : null;
  }

  const single = Number(result?.value || 0);
  return single > 0 ? single : null;
};

type SleepSample = {
  startDate: string;
  endDate: string;
  value: string;
};

type SleepInterval = {
  start: number;
  end: number;
};

const sleepStateAllowsDuration = new Set(["ASLEEP", "CORE", "DEEP", "REM"]);

function mergeSleepIntervals(samples: SleepSample[]): SleepInterval[] {
  const intervals = samples
    .filter((sample) => sleepStateAllowsDuration.has(String(sample.value).toUpperCase()))
    .map((sample) => ({
      start: new Date(sample.startDate).getTime(),
      end: new Date(sample.endDate).getTime(),
    }))
    .filter((interval) => Number.isFinite(interval.start) && Number.isFinite(interval.end))
    .filter((interval) => interval.end > interval.start)
    .sort((left, right) => left.start - right.start);

  if (!intervals.length) {
    return [];
  }

  return intervals.reduce<SleepInterval[]>((acc, interval) => {
    const last = acc[acc.length - 1];
    if (!last) {
      acc.push(interval);
      return acc;
    }

    if (interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
      return acc;
    }

    acc.push(interval);
    return acc;
  }, []);
}

function buildSleepSessions(intervals: SleepInterval[]) {
  const gapThresholdMs = 90 * 60 * 1000;

  return intervals.reduce<Array<{ start: number; end: number; durationHours: number }>>(
    (acc, interval) => {
      const last = acc[acc.length - 1];
      if (!last) {
        acc.push({
          start: interval.start,
          end: interval.end,
          durationHours: (interval.end - interval.start) / (1000 * 60 * 60),
        });
        return acc;
      }

      if (interval.start - last.end <= gapThresholdMs) {
        last.end = Math.max(last.end, interval.end);
        last.durationHours = (last.end - last.start) / (1000 * 60 * 60);
        return acc;
      }

      acc.push({
        start: interval.start,
        end: interval.end,
        durationHours: (interval.end - interval.start) / (1000 * 60 * 60),
      });
      return acc;
    },
    [],
  );
}

function getLatestSleepDuration(samples: SleepSample[]) {
  const sessions = buildSleepSessions(mergeSleepIntervals(samples));
  if (!sessions.length) {
    return null;
  }

  const likelyNightSleep =
    [...sessions]
      .filter((session) => session.durationHours >= 3)
      .sort((left, right) => right.end - left.end)[0] ??
    [...sessions].sort((left, right) => right.end - left.end)[0];

  if (!likelyNightSleep) {
    return null;
  }

  return Number(likelyNightSleep.durationHours.toFixed(1));
}

const createNativeBridge = (): AppleHealthBridge | undefined => {
  if (Platform.OS !== "ios") return undefined;
  const healthModule = loadHealthModule();
  if (!healthModule) return undefined;

  return {
    isAvailable: () => callAvailability(healthModule),
    authorize: () => authorizeHealthKit(healthModule),
    readMetrics: async (window) => {
      const sleepWindow = getSleepLookbackWindow();
      const [stepCount, sleepSamples, workouts] = await Promise.all([
        callQuery<{ value?: number }>((callback) =>
          healthModule.getStepCount(
            {
              date: window.endAt,
              includeManuallyAdded: true,
            },
            callback,
          ),
        ),
        callArrayQuery<SleepSample>((callback) =>
          healthModule.getSleepSamples(
            {
              startDate: sleepWindow.startAt,
              endDate: sleepWindow.endAt,
              ascending: true,
            },
            callback,
          ),
        ),
        callArrayQuery<{
          calories?: number;
          start?: string;
          end?: string;
          startDate?: string;
          endDate?: string;
        }>((callback) =>
          healthModule.getSamples(
            {
              startDate: window.startAt,
              endDate: window.endAt,
              type: "Workout",
              ascending: false,
              limit: 50,
            },
            callback,
          ),
        ),
      ]);

      const activeEnergy = await callEnergyQuery(healthModule, window);
      const stepTotal = Number(stepCount.value ?? 0);
      const sleepHours = getLatestSleepDuration(sleepSamples) ?? 0;
      const workoutCount = workouts.filter((workout) => {
        const workoutStart = new Date(workout.start ?? workout.startDate ?? 0).getTime();
        const workoutEnd = new Date(workout.end ?? workout.endDate ?? 0).getTime();
        const windowStart = new Date(window.startAt).getTime();
        const windowEnd = new Date(window.endAt).getTime();

        if (!Number.isFinite(workoutStart) || !Number.isFinite(workoutEnd)) {
          return true;
        }

        return workoutEnd >= windowStart && workoutStart <= windowEnd;
      }).length;

      return {
        workouts: {
          value: workoutCount,
          unit: "count",
          available: workoutCount > 0,
        },
        steps: {
          value: stepTotal,
          unit: "count",
          available: stepTotal > 0,
        },
        "sleep-duration": {
          value: Number(sleepHours.toFixed(1)),
          unit: "hours",
          available: sleepHours > 0,
        },
        "active-energy": {
          value: activeEnergy ?? 0,
          unit: "kcal",
          available: Boolean(activeEnergy && activeEnergy > 0),
        },
      };
    },
  };
};

export const manualEntryAdapter = new ManualEntryAdapter();
export const stravaAdapter = new StravaAdapter();
export const whoopAdapter = new WhoopAdapter();

export const createAppleHealthAdapter = (usePreview = false) =>
  new AppleHealthAdapter(usePreview ? createPreviewBridge() : createNativeBridge());

export const connectAppleHealth = async (options?: {
  usePreview?: boolean;
}): Promise<{
  connection: ConnectionRecord;
  snapshot: ProviderSnapshot | null;
}> => {
  const adapter = createAppleHealthAdapter(Boolean(options?.usePreview));
  const connection = await adapter.connect();

  if (connection.state === "connected" || connection.state === "connected_limited") {
    const snapshot = await adapter.refresh(getDemoMetricWindow());
    return { connection, snapshot };
  }

  return { connection, snapshot: null };
};

export const seedManualWorkoutFallback = async (options: {
  workoutName: string;
  durationMinutes: number;
  activeEnergy: number;
}): Promise<ProviderSnapshot> => {
  manualEntryAdapter.setMetric("workouts", {
    value: 1,
    unit: options.workoutName,
  });
  manualEntryAdapter.setMetric("active-energy", {
    value: options.activeEnergy,
    unit: "kcal",
  });
  manualEntryAdapter.setMetric("duration", {
    value: options.durationMinutes,
    unit: "min",
  });
  manualEntryAdapter.setMetric("steps", {
    value: 0,
    unit: "count",
  });

  return manualEntryAdapter.refresh(getDemoMetricWindow());
};
