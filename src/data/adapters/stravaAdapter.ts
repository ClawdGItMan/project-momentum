import type { HealthProviderAdapter } from "@/src/domain/integrations/adapter";
import { getSupportedMetricKeys } from "@/src/domain/integrations/catalog";
import {
  createCoverage,
  normalizeSnapshot,
} from "@/src/domain/integrations/normalization";
import type {
  ConnectionRecord,
  MetricKey,
  MetricWindow,
  ProviderSnapshot,
} from "@/src/domain/integrations/types";

const keys: MetricKey[] = getSupportedMetricKeys("strava");

const placeholderCoverage = () =>
  keys.map((key) => createCoverage(key, false, "not_requested"));

export class StravaAdapter implements HealthProviderAdapter {
  readonly provider = "strava" as const;

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async getConnection(): Promise<ConnectionRecord> {
    return {
      provider: this.provider,
      state: "disconnected",
      coverage: placeholderCoverage(),
    };
  }

  async connect(): Promise<ConnectionRecord> {
    return this.getConnection();
  }

  async disconnect(): Promise<void> {
    return;
  }

  async refresh(_window?: MetricWindow): Promise<ProviderSnapshot> {
    return normalizeSnapshot(this.provider, [], placeholderCoverage());
  }
}
