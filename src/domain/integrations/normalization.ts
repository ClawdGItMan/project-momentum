import type {
  CoverageReason,
  IntegrationProvider,
  MetricCoverage,
  MetricKey,
  MetricValue,
  MetricWindow,
  ProviderSnapshot,
} from "./types";

export interface RawMetricInput {
  key: MetricKey;
  value: number | string | boolean | null | undefined;
  unit?: string;
}

export const createWindow = (
  startAt: string,
  endAt: string,
  bucket: MetricWindow["bucket"],
): MetricWindow => ({ startAt, endAt, bucket });

export const normalizeMetricValue = (
  provider: IntegrationProvider,
  window: MetricWindow,
  input: RawMetricInput,
  observedAt = new Date().toISOString(),
): MetricValue => ({
  key: input.key,
  value: input.value ?? null,
  unit: input.unit,
  source: provider === "manual" ? "manual" : provider === "mock" ? "mock" : "live",
  provider,
  observedAt,
  window,
  confidence: provider === "manual" ? "medium" : "high",
});

export const createCoverage = (
  key: MetricKey,
  available: boolean,
  reason?: CoverageReason,
): MetricCoverage => ({ key, available, reason });

export const normalizeSnapshot = (
  provider: IntegrationProvider,
  metrics: MetricValue[],
  coverage: MetricCoverage[],
  capturedAt = new Date().toISOString(),
): ProviderSnapshot => ({
  provider,
  capturedAt,
  metrics,
  coverage,
});

export const coverageMap = (coverage: MetricCoverage[]): Record<MetricKey, MetricCoverage> =>
  coverage.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<MetricKey, MetricCoverage>,
  );

export const hasRequiredWorkoutBundle = (coverage: MetricCoverage[]): boolean => {
  const coverageByKey = coverageMap(coverage);
  const required: MetricKey[] = [
    "workouts",
    "steps",
    "sleep-duration",
    "active-energy",
  ];
  return required.every((key) => coverageByKey[key]?.available);
};

export const mergeSnapshots = (snapshots: ProviderSnapshot[]): ProviderSnapshot => {
  if (snapshots.length === 0) {
    return {
      provider: "mock",
      capturedAt: new Date().toISOString(),
      metrics: [],
      coverage: [],
    };
  }

  const latest = [...snapshots].sort((a, b) =>
    a.capturedAt < b.capturedAt ? 1 : -1,
  )[0];

  return snapshots.reduce(
    (acc, snapshot) => ({
      ...acc,
      capturedAt: latest.capturedAt,
      metrics: acc.metrics.concat(snapshot.metrics),
      coverage: acc.coverage.concat(snapshot.coverage),
    }),
    {
      provider: latest.provider,
      capturedAt: latest.capturedAt,
      metrics: [] as MetricValue[],
      coverage: [] as MetricCoverage[],
    },
  );
};

