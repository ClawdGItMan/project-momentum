import {
  createDefaultConnection,
  getSupportedMetricKeys,
  managedProviders,
} from "@/src/domain/integrations/catalog";
import type {
  ConnectionRecord,
  IntegrationProvider,
  ManagedIntegrationProvider,
  MetricKey,
  ProviderSnapshot,
} from "@/src/domain/models";
import type {
  CheckInSourcePreference,
  PostType,
  ProviderConnectionMap,
  ProviderSnapshotMap,
} from "@/src/features/app/sessionTypes";
import { isProviderSnapshotFresh } from "@/src/lib/health";

export { managedProviders };

export const defaultManagedProvider = "apple-health" as const;

const metricsByPostType: Record<PostType, MetricKey[]> = {
  workout: [
    "workouts",
    "duration",
    "distance",
    "active-energy",
    "steps",
    "strain-score",
  ],
  recovery: [
    "recovery-score",
    "strain-score",
    "sleep-duration",
    "resting-heart-rate",
    "mindfulness-minutes",
  ],
  "habit-win": ["steps", "sleep-duration", "recovery-score", "mindfulness-minutes"],
  reflection: ["sleep-duration", "recovery-score", "mindfulness-minutes", "steps"],
};

const autoPriorityByPostType: Record<
  PostType,
  Array<ManagedIntegrationProvider | "manual">
> = {
  workout: ["apple-health", "strava", "whoop", "manual"],
  recovery: ["whoop", "apple-health", "manual"],
  "habit-win": ["apple-health", "whoop", "strava", "manual"],
  reflection: ["apple-health", "whoop", "strava", "manual"],
};

export function createDefaultProviderConnections(): ProviderConnectionMap {
  return {
    "apple-health": createDefaultConnection("apple-health"),
    strava: createDefaultConnection("strava"),
    whoop: createDefaultConnection("whoop"),
  };
}

export function createDefaultProviderSnapshots(): ProviderSnapshotMap {
  return {
    "apple-health": null,
    strava: null,
    whoop: null,
  };
}

export function isManagedProvider(
  value: IntegrationProvider | string | undefined | null,
): value is ManagedIntegrationProvider {
  return managedProviders.includes(value as ManagedIntegrationProvider);
}

export function formatProviderLabel(
  provider: IntegrationProvider | CheckInSourcePreference,
): string {
  switch (provider) {
    case "apple-health":
      return "Apple Health";
    case "strava":
      return "Strava";
    case "whoop":
      return "WHOOP";
    case "manual":
      return "Manual";
    case "mock":
      return "Sample data";
    case "auto":
      return "Auto";
    default:
      return provider;
  }
}

export function normalizeProviderConnection(
  provider: ManagedIntegrationProvider,
  connection?: ConnectionRecord | null,
): ConnectionRecord {
  const fallback = createDefaultConnection(provider);
  if (!connection) return fallback;

  return {
    ...fallback,
    ...connection,
    provider,
    coverage: connection.coverage?.length ? connection.coverage : fallback.coverage,
  };
}

export function toProviderConnectionMap(
  connections: ConnectionRecord[],
): ProviderConnectionMap {
  const next = createDefaultProviderConnections();

  connections.forEach((connection) => {
    if (!isManagedProvider(connection.provider)) {
      return;
    }

    next[connection.provider] = normalizeProviderConnection(
      connection.provider,
      connection,
    );
  });

  return next;
}

export function toProviderSnapshotMap(
  snapshots: ProviderSnapshot[],
): ProviderSnapshotMap {
  const next = createDefaultProviderSnapshots();

  snapshots.forEach((snapshot) => {
    if (!isManagedProvider(snapshot.provider)) {
      return;
    }

    const current = next[snapshot.provider];
    if (!current || current.capturedAt < snapshot.capturedAt) {
      next[snapshot.provider] = snapshot;
    }
  });

  return next;
}

export function getSnapshotFlags(
  connection: ConnectionRecord,
  snapshot: ProviderSnapshot | null | undefined,
  options?: { preview?: boolean },
) {
  const hasMetrics = Boolean(snapshot?.metrics.length);
  const showUnsavedSummary = Boolean(hasMetrics && snapshot && !snapshot.id);
  const isFresh = options?.preview ? hasMetrics : isProviderSnapshotFresh(snapshot ?? null);
  const showHistoricalSummary = Boolean(
    hasMetrics &&
      snapshot?.id &&
      (connection.lastError || !isFresh),
  );
  const canUseLiveMetrics = Boolean(
    hasMetrics &&
      (!connection.lastError || !snapshot?.id) &&
      (options?.preview ||
        connection.state === "connected" ||
        connection.state === "connected_limited") &&
      (showUnsavedSummary || isFresh),
  );

  return {
    hasMetrics,
    isFresh,
    showUnsavedSummary,
    showHistoricalSummary,
    canUseLiveMetrics,
  };
}

export function getMetricsForPostType(
  snapshot: ProviderSnapshot | null | undefined,
  type: PostType,
) {
  if (!snapshot) return [];
  const allowed = new Set(metricsByPostType[type]);
  return snapshot.metrics.filter((metric) => allowed.has(metric.key));
}

export function getAutoProviderPriority(
  type: PostType,
): Array<ManagedIntegrationProvider | "manual"> {
  return autoPriorityByPostType[type];
}

export function pickProviderForCheckIn(input: {
  type: PostType;
  sourcePreference: CheckInSourcePreference;
  providerConnections: ProviderConnectionMap;
  providerSnapshots: ProviderSnapshotMap;
  appleHealthPreviewActive?: boolean;
}) {
  const resolveProvider = (
    sourcePreference: CheckInSourcePreference,
  ): ManagedIntegrationProvider | "manual" | null => {
    if (sourcePreference === "manual") {
      return "manual";
    }

    if (sourcePreference !== "auto") {
      const snapshot = input.providerSnapshots[sourcePreference] ?? null;
      const flags = getSnapshotFlags(
        input.providerConnections[sourcePreference],
        snapshot,
        {
          preview:
            sourcePreference === "apple-health" && Boolean(input.appleHealthPreviewActive),
        },
      );

      return getMetricsForPostType(snapshot, input.type).length && flags.canUseLiveMetrics
        ? sourcePreference
        : null;
    }

    for (const provider of getAutoProviderPriority(input.type)) {
      if (provider === "manual") {
        return "manual";
      }

      const snapshot = input.providerSnapshots[provider] ?? null;
      const flags = getSnapshotFlags(input.providerConnections[provider], snapshot, {
        preview: provider === "apple-health" && Boolean(input.appleHealthPreviewActive),
      });

      if (getMetricsForPostType(snapshot, input.type).length && flags.canUseLiveMetrics) {
        return provider;
      }
    }

    return "manual";
  };

  const resolvedProvider = resolveProvider(input.sourcePreference);
  const resolvedSnapshot =
    resolvedProvider && resolvedProvider !== "manual"
      ? input.providerSnapshots[resolvedProvider] ?? null
      : null;

  return {
    provider: resolvedProvider,
    snapshot: resolvedSnapshot,
    metrics: resolvedSnapshot ? getMetricsForPostType(resolvedSnapshot, input.type) : [],
  };
}

export function getSupportedProvidersForPostType(type: PostType) {
  return managedProviders.filter((provider) =>
    getSupportedMetricKeys(provider).some((key) => metricsByPostType[type].includes(key)),
  );
}

export function getProvenanceProviders(metrics: Array<{ provider?: IntegrationProvider }>) {
  const providers = Array.from(
    new Set(
      metrics
        .map((metric) => metric.provider)
        .filter((provider): provider is IntegrationProvider => Boolean(provider)),
    ),
  );

  return providers;
}
