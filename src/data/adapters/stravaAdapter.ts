import type { HealthProviderAdapter } from "@/src/domain/integrations/adapter";
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

const keys: MetricKey[] = [
  "workouts",
  "steps",
  "sleep-duration",
  "active-energy",
  "resting-heart-rate",
  "mindfulness-minutes",
];

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
      state: "mocked",
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
