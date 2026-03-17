import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ConsistencyResult } from "@/src/domain/models";
import { theme } from "@/src/design";
import { Badge, Card, StatRow } from "@/src/ui/primitives";

type ConsistencyCardProps = {
  consistency: ConsistencyResult;
  compact?: boolean;
};

export function ConsistencyCard({
  consistency,
  compact = false,
}: ConsistencyCardProps) {
  return (
    <Card
      title="Consistency"
      subtitle="A rolling 7-day signal shaped by check-ins, habits, and workouts."
      elevated
    >
      <View style={styles.heroRow}>
        <View>
          <Text style={styles.score}>{consistency.score}</Text>
          <Text style={styles.scoreLabel}>out of 100</Text>
        </View>
        <Badge
          label={consistency.label}
          tone={consistency.score >= 75 ? "success" : "accent"}
        />
      </View>
      {!compact ? (
        <View>
          <StatRow
            label="Check-ins"
            value={`${Math.round(consistency.breakdown.checkInRate * 100)}%`}
            hint="40% of the score"
          />
          <StatRow
            label="Habits"
            value={`${Math.round(consistency.breakdown.habitCompletionRate * 100)}%`}
            hint="40% of the score"
          />
          <StatRow
            label="Workouts"
            value={`${Math.round(consistency.breakdown.workoutRate * 100)}%`}
            hint="20% of the score when fitness is active"
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  score: {
    ...theme.typography.metricLarge,
    color: theme.color.fg.primary,
  },
  scoreLabel: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
});
