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

export const getDemoMetricWindow = (): MetricWindow =>
  createWindow(
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  new Date().toISOString(),
  "today",
  );

type HealthModule = {
  Constants: {
    Permissions: Record<string, string>;
  };
  isAvailable: (callback: (error: object | null, results: boolean) => void) => void;
  initHealthKit: (
    permissions: { permissions: { read: string[]; write: string[] } },
    callback: (error: string | null, result?: unknown) => void,
  ) => void;
  getDailyStepCountSamples: (
    options: { startDate: string; endDate?: string },
    callback: (error: string | null, results: Array<{ value: number }>) => void,
  ) => void;
  getSleepSamples: (
    options: { startDate: string; endDate?: string },
    callback: (
      error: string | null,
      results: Array<{ startDate: string; endDate: string; value: string }>,
    ) => void,
  ) => void;
  getActiveEnergyBurned: (
    options: { startDate: string; endDate?: string },
    callback: (
      error: string | null,
      results: Array<{ value: number }> | { value?: number },
    ) => void,
  ) => void;
  getSamples: (
    options: { startDate: string; endDate?: string; type: string },
    callback: (
      error: string | null,
      results: Array<{ calories?: number; start?: string; end?: string }>,
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
      typeof candidate.getDailyStepCountSamples === "function" &&
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
  run: (callback: (error: string | null, results: T[]) => void) => void,
): Promise<T[]> =>
  new Promise((resolve) => {
    run((error, results) => {
      resolve(error ? [] : Array.isArray(results) ? results : []);
    });
  });

const callEnergyQuery = async (
  healthModule: HealthModule,
  window: MetricWindow,
): Promise<number | null> => {
  const result = await new Promise<Array<{ value: number }> | { value?: number }>(
    (resolve) => {
      healthModule.getActiveEnergyBurned(
        { startDate: window.startAt, endDate: window.endAt },
        (_error, results) => resolve(results ?? []),
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

const hoursBetween = (startDate: string, endDate: string) =>
  (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60);

const createNativeBridge = (): AppleHealthBridge | undefined => {
  if (Platform.OS !== "ios") return undefined;
  const healthModule = loadHealthModule();
  if (!healthModule) return undefined;

  return {
    isAvailable: () => callAvailability(healthModule),
    authorize: () => authorizeHealthKit(healthModule),
    readMetrics: async (window) => {
      const [steps, sleepSamples, workouts] = await Promise.all([
        callArrayQuery<{ value: number }>((callback) =>
          healthModule.getDailyStepCountSamples(
            { startDate: window.startAt, endDate: window.endAt },
            callback,
          ),
        ),
        callArrayQuery<{ startDate: string; endDate: string; value: string }>(
          (callback) =>
            healthModule.getSleepSamples(
              { startDate: window.startAt, endDate: window.endAt },
              callback,
            ),
        ),
        callArrayQuery<{ calories?: number }>((callback) =>
          healthModule.getSamples(
            { startDate: window.startAt, endDate: window.endAt, type: "Workout" },
            callback,
          ),
        ),
      ]);

      const activeEnergy = await callEnergyQuery(healthModule, window);
      const stepTotal = steps.reduce((sum, item) => sum + Number(item.value || 0), 0);
      const sleepHours = sleepSamples
        .filter((sample) => String(sample.value).toUpperCase() !== "INBED")
        .reduce(
          (sum, sample) => sum + hoursBetween(sample.startDate, sample.endDate),
          0,
        );

      return {
        workouts: {
          value: workouts.length,
          unit: "count",
          available: workouts.length > 0,
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
  manualEntryAdapter.setMetric("steps", {
    value: 0,
    unit: "count",
  });

  return manualEntryAdapter.refresh(getDemoMetricWindow());
};
