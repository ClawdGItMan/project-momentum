export type IntegrationProvider = "apple-health" | "strava" | "manual" | "mock";

export type ConnectionState =
  | "unavailable"
  | "disconnected"
  | "authorizing"
  | "connected"
  | "connected_limited"
  | "needs_attention"
  | "syncing"
  | "error"
  | "mocked";

export type MetricKey =
  | "workouts"
  | "steps"
  | "sleep-duration"
  | "active-energy"
  | "resting-heart-rate"
  | "mindfulness-minutes";

export type MetricSource = "live" | "manual" | "mock" | "derived";

export type MetricWindowBucket = "today" | "yesterday" | "7d" | "30d" | "custom";

export type CoverageReason =
  | "not_requested"
  | "not_supported"
  | "no_samples"
  | "permission_unknown"
  | "permission_missing"
  | "provider_disconnected"
  | "provider_unavailable"
  | "platform_unsupported";

export interface MetricWindow {
  startAt: string;
  endAt: string;
  bucket: MetricWindowBucket;
}

export interface MetricCoverage {
  key: MetricKey;
  available: boolean;
  reason?: CoverageReason;
}

export interface MetricValue {
  key: MetricKey;
  value: number | string | boolean | null;
  unit?: string;
  source: MetricSource;
  provider: IntegrationProvider;
  observedAt: string;
  window: MetricWindow;
  confidence: "high" | "medium" | "low";
}

export interface ProviderSnapshot {
  id?: string;
  provider: IntegrationProvider;
  capturedAt: string;
  metrics: MetricValue[];
  coverage: MetricCoverage[];
}

export interface ConnectionRecord {
  provider: IntegrationProvider;
  state: ConnectionState;
  connectedAt?: string;
  lastSyncAt?: string;
  lastError?: string;
  coverage: MetricCoverage[];
}
