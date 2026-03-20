import type { HealthProviderAdapter } from "@/src/domain/integrations/adapter";
import { getSupportedMetricKeys } from "@/src/domain/integrations/catalog";
import {
  createCoverage,
  createWindow,
  normalizeMetricValue,
  normalizeSnapshot,
} from "@/src/domain/integrations/normalization";
import type {
  ConnectionRecord,
  MetricKey,
  MetricWindow,
  ProviderSnapshot,
} from "@/src/domain/integrations/types";

type ManualValue = {
  value: number | string | boolean | null;
  unit?: string;
};

export class ManualEntryAdapter implements HealthProviderAdapter {
  readonly provider = "manual" as const;

  private readonly values = new Map<MetricKey, ManualValue>();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getConnection(): Promise<ConnectionRecord> {
    return {
      provider: this.provider,
      state: "connected",
      connectedAt: new Date().toISOString(),
      coverage: this.coverage(),
    };
  }

  async connect(): Promise<ConnectionRecord> {
    return this.getConnection();
  }

  async disconnect(): Promise<void> {
    this.values.clear();
  }

  setMetric(key: MetricKey, value: ManualValue): void {
    this.values.set(key, value);
  }

  async refresh(window?: MetricWindow): Promise<ProviderSnapshot> {
    const targetWindow =
      window ??
      createWindow(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        "today",
      );

    const metrics = Array.from(this.values.entries()).map(([key, manual]) =>
      normalizeMetricValue(this.provider, targetWindow, {
        key,
        value: manual.value,
        unit: manual.unit,
      }),
    );

    return normalizeSnapshot(this.provider, metrics, this.coverage());
  }

  private coverage() {
    const keys: MetricKey[] = [
      ...new Set([
        ...getSupportedMetricKeys("apple-health"),
        ...getSupportedMetricKeys("strava"),
        ...getSupportedMetricKeys("whoop"),
      ]),
    ];
    return keys.map((key) =>
      this.values.has(key)
        ? createCoverage(key, true)
        : createCoverage(key, false, "not_requested"),
    );
  }
}
