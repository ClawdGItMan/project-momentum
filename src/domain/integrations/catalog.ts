import type {
  ConnectionRecord,
  ManagedIntegrationProvider,
  MetricCoverage,
  MetricKey,
  ProviderSnapshot,
} from "./types";

export const managedProviders: ManagedIntegrationProvider[] = [
  "apple-health",
  "strava",
  "whoop",
];

export const remoteProviders: Array<Exclude<ManagedIntegrationProvider, "apple-health">> = [
  "strava",
  "whoop",
];

export const allMetricKeys: MetricKey[] = [
  "workouts",
  "distance",
  "duration",
  "steps",
  "sleep-duration",
  "active-energy",
  "recovery-score",
  "strain-score",
  "resting-heart-rate",
  "mindfulness-minutes",
];

export function getProviderLabel(provider: ManagedIntegrationProvider) {
  switch (provider) {
    case "apple-health":
      return "Apple Health";
    case "strava":
      return "Strava";
    case "whoop":
      return "WHOOP";
  }
}

export function getProviderCoverageKeys(
  provider: ManagedIntegrationProvider,
): MetricKey[] {
  switch (provider) {
    case "apple-health":
      return [
        "workouts",
        "steps",
        "sleep-duration",
        "active-energy",
        "resting-heart-rate",
        "mindfulness-minutes",
      ];
    case "strava":
      return ["workouts", "distance", "duration", "active-energy"];
    case "whoop":
      return [
        "workouts",
        "distance",
        "duration",
        "sleep-duration",
        "recovery-score",
        "strain-score",
        "resting-heart-rate",
      ];
  }
}

export function createProviderCoverage(
  provider: ManagedIntegrationProvider,
  available: boolean,
  reason?: MetricCoverage["reason"],
): MetricCoverage[] {
  return getProviderCoverageKeys(provider).map((key) => ({
    key,
    available,
    ...(available || !reason ? {} : { reason }),
  }));
}

export function createDefaultProviderConnection(
  provider: ManagedIntegrationProvider,
): ConnectionRecord {
  return {
    provider,
    state: "disconnected",
    coverage: createProviderCoverage(provider, false, "provider_disconnected"),
  };
}

export const createDefaultConnection = createDefaultProviderConnection;

export function getSupportedMetricKeys(provider: ManagedIntegrationProvider) {
  return getProviderCoverageKeys(provider);
}

export function selectLatestSnapshot(
  snapshots: ProviderSnapshot[],
  predicate?: (snapshot: ProviderSnapshot) => boolean,
) {
  const filtered = predicate ? snapshots.filter(predicate) : snapshots;
  return [...filtered].sort((left, right) =>
    left.capturedAt < right.capturedAt ? 1 : -1,
  )[0] ?? null;
}

export function snapshotHasMetric(
  snapshot: ProviderSnapshot | null | undefined,
  metricKey: MetricKey,
) {
  return Boolean(snapshot?.metrics.some((metric) => metric.key === metricKey));
}
