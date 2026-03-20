export type {
  ConnectionRecord,
  ConnectionState,
  CoverageReason,
  IntegrationProvider,
  ManagedIntegrationProvider,
  MetricCoverage,
  MetricKey,
  MetricSource,
  MetricValue,
  MetricWindow,
  MetricWindowBucket,
  ProviderSnapshot,
} from "@/src/domain/integrations/types";

export type {
  ConsistencyBreakdown,
  ConsistencyDayInput,
  ConsistencyLabel,
  ConsistencyResult,
} from "@/src/domain/consistency/types";

export type { HealthProviderAdapter } from "@/src/domain/integrations/adapter";
