import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import {
  formatConnectionState,
  formatCoverageReason,
  formatMetricLabel,
  formatProviderLabel,
  formatTimestamp,
} from "@/src/lib/formatters";
import { managedProviders } from "@/src/lib/providers";
import { getSnapshotFlags } from "@/src/lib/providers";
import { Badge, Card, EmptyState, Screen, StatRow } from "@/src/ui/primitives";

export default function MetricDetailModal() {
  const { healthPreviewActive, providerConnections, providerSnapshots } = useMomentumSession();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Metric detail</Text>
        {managedProviders.map((provider) => {
          const connection = providerConnections[provider];
          const snapshot = providerSnapshots[provider] ?? null;
          const flags = getSnapshotFlags(connection, snapshot, {
            preview: provider === "apple-health" && healthPreviewActive,
          });

          return (
            <Card
              key={provider}
              title={formatProviderLabel(provider)}
              subtitle={`Status: ${formatConnectionState(connection.state)}`}
            >
              {connection.coverage.map((metric) => (
                <StatRow
                  key={`${provider}-${metric.key}`}
                  label={formatMetricLabel(metric.key)}
                  value={metric.available ? "Available" : "Missing"}
                  hint={formatCoverageReason(metric.reason)}
                />
              ))}
              {snapshot?.metrics.length ? (
                <View style={styles.notice}>
                  {flags.showHistoricalSummary ? (
                    <Badge label="Historical summary" tone="warning" />
                  ) : flags.showUnsavedSummary ? (
                    <Badge label="Local summary" tone="accent" />
                  ) : null}
                  <Text style={styles.helper}>
                    {snapshot.capturedAt
                      ? `Captured ${formatTimestamp(snapshot.capturedAt)}`
                      : "Latest provider summary"}
                  </Text>
                  {snapshot.metrics.map((metric) => (
                    <StatRow
                      key={`${provider}-metric-${metric.key}`}
                      label={formatMetricLabel(metric.key)}
                      value={`${metric.value ?? 0}${metric.unit ? ` ${metric.unit}` : ""}`}
                      hint={`${formatProviderLabel(metric.provider)} • ${metric.source}`}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title={`No ${formatProviderLabel(provider)} metrics yet`}
                  message={`Connect ${formatProviderLabel(provider)} or publish a manual check-in to populate this view.`}
                />
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  notice: {
    gap: theme.spacing.xs,
  },
  helper: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
});
