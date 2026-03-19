import type { HealthProviderAdapter } from "@/src/domain/integrations/adapter";
import {
  createCoverage,
  createWindow,
  hasRequiredWorkoutBundle,
  normalizeMetricValue,
  normalizeSnapshot,
} from "@/src/domain/integrations/normalization";
import type {
  ConnectionRecord,
  MetricCoverage,
  MetricWindow,
  ProviderSnapshot,
} from "@/src/domain/integrations/types";

const metricKeys = [
  "workouts",
  "steps",
  "sleep-duration",
  "active-energy",
  "resting-heart-rate",
  "mindfulness-minutes",
] as const;

export interface AppleHealthBridge {
  isAvailable(): Promise<boolean>;
  authorize(): Promise<{ authorized: boolean; error?: string }>;
  disconnect?(): Promise<void>;
  readMetrics(window: MetricWindow): Promise<
    Partial<
      Record<
        (typeof metricKeys)[number],
        { value: number | string | boolean | null; unit?: string; available?: boolean }
      >
    >
  >;
}

const defaultCoverage = (reason: MetricCoverage["reason"]): MetricCoverage[] =>
  metricKeys.map((key) => createCoverage(key, false, reason));

const unavailableMessage =
  "HealthKit is unavailable in this build. Reinstall the iOS development build after enabling HealthKit signing and make sure you are testing on a physical iPhone.";

const permissionsMessage =
  "Apple Health permissions still need attention. In the Health app, enable Workouts, Steps, Sleep, and Active Energy for Project Momentum, then try again.";

export class AppleHealthAdapter implements HealthProviderAdapter {
  readonly provider = "apple-health" as const;

  private state: ConnectionRecord = {
    provider: this.provider,
    state: "disconnected",
    coverage: defaultCoverage("provider_disconnected"),
  };

  constructor(private readonly bridge?: AppleHealthBridge) {}

  async isAvailable(): Promise<boolean> {
    if (!this.bridge) return false;
    return this.bridge.isAvailable();
  }

  async getConnection(): Promise<ConnectionRecord> {
    return this.state;
  }

  async connect(): Promise<ConnectionRecord> {
    const available = await this.isAvailable();
    if (!available || !this.bridge) {
      this.state = {
        provider: this.provider,
        state: "unavailable",
        lastError: unavailableMessage,
        coverage: defaultCoverage("provider_unavailable"),
      };
      return this.state;
    }

    this.state = {
      provider: this.provider,
      state: "authorizing",
      coverage: defaultCoverage("not_requested"),
    };

    const authorization = await this.bridge.authorize();
    if (!authorization.authorized) {
      this.state = {
        provider: this.provider,
        state: "needs_attention",
        lastError: authorization.error ?? permissionsMessage,
        coverage: defaultCoverage("permission_missing"),
      };
      return this.state;
    }

    const snapshot = await this.refresh();
    this.state = {
      provider: this.provider,
      state: hasRequiredWorkoutBundle(snapshot.coverage)
        ? "connected"
        : "connected_limited",
      connectedAt: this.state.connectedAt ?? new Date().toISOString(),
      lastSyncAt: snapshot.capturedAt,
      coverage: snapshot.coverage,
    };
    return this.state;
  }

  async disconnect(): Promise<void> {
    await this.bridge?.disconnect?.();
    this.state = {
      provider: this.provider,
      state: "disconnected",
      coverage: defaultCoverage("provider_disconnected"),
    };
  }

  async refresh(window?: MetricWindow): Promise<ProviderSnapshot> {
    const targetWindow =
      window ??
      createWindow(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        "today",
      );

    if (!this.bridge) {
      return normalizeSnapshot(this.provider, [], defaultCoverage("provider_unavailable"));
    }

    const result = await this.bridge.readMetrics(targetWindow);

    const coverage = metricKeys.map((key) => {
      const metric = result[key];
      if (!metric) return createCoverage(key, false, "no_samples");
      const explicitAvailability = typeof metric.available === "boolean" ? metric.available : true;
      if (!explicitAvailability) return createCoverage(key, false, "no_samples");
      return createCoverage(key, true);
    });

    const metrics = metricKeys
      .map((key) => {
        const metric = result[key];
        if (!metric || metric.value == null) return null;
        const explicitAvailability =
          typeof metric.available === "boolean" ? metric.available : true;
        if (!explicitAvailability) return null;
        return normalizeMetricValue(this.provider, targetWindow, {
          key,
          value: metric.value,
          unit: metric.unit,
        });
      })
      .filter((metric): metric is NonNullable<typeof metric> => metric !== null);

    return normalizeSnapshot(this.provider, metrics, coverage);
  }
}
