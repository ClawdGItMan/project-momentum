import type {
  ConnectionRecord,
  IntegrationProvider,
  MetricWindow,
  ProviderSnapshot,
} from "./types";

export interface HealthProviderAdapter {
  provider: IntegrationProvider;
  isAvailable(): Promise<boolean>;
  getConnection(): Promise<ConnectionRecord>;
  connect(): Promise<ConnectionRecord>;
  disconnect(): Promise<void>;
  refresh(window?: MetricWindow): Promise<ProviderSnapshot>;
}

