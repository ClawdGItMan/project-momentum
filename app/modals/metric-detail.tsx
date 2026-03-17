import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import {
  formatConnectionState,
  formatCoverageReason,
  formatMetricLabel,
} from "@/src/lib/formatters";
import { Card, EmptyState, Screen, StatRow } from "@/src/ui/primitives";

export default function MetricDetailModal() {
  const { healthConnection, healthSnapshot } = useMomentumSession();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Metric detail</Text>
        <Card subtitle={`Apple Health status: ${formatConnectionState(healthConnection.state)}`}>
          {healthConnection.coverage.map((metric) => (
            <StatRow
              key={metric.key}
              label={formatMetricLabel(metric.key)}
              value={metric.available ? "Available" : "Missing"}
              hint={formatCoverageReason(metric.reason)}
            />
          ))}
        </Card>
        {healthSnapshot?.metrics.length ? (
          <Card subtitle="Normalized locally from the Apple Health boundary or manual fallback.">
            {healthSnapshot.metrics.map((metric) => (
              <StatRow
                key={metric.key}
                label={formatMetricLabel(metric.key)}
                value={`${metric.value ?? 0}${metric.unit ? ` ${metric.unit}` : ""}`}
                hint={`${metric.provider} • ${metric.source}`}
              />
            ))}
          </Card>
        ) : (
          <EmptyState
            title="No metrics attached yet"
            message="Connect Apple Health or use manual fallback in the composer to populate this detail view."
          />
        )}
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
});
