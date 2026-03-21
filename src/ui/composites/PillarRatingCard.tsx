import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { PillarRating } from "@/src/domain/models";
import { getNextTier } from "@/src/domain/character";
import { theme } from "@/src/design";
import { Badge, Card, StatRow } from "@/src/ui/primitives";

type PillarRatingCardProps = {
  rating: PillarRating;
};

const pillarLabels: Record<string, string> = {
  fitness: "Fitness",
  mindset: "Mindset",
  learning: "Learning",
  recovery: "Recovery",
};

export function PillarRatingCard({ rating }: PillarRatingCardProps) {
  const nextTier = getNextTier(rating.tier);
  const label = pillarLabels[rating.pillar] ?? rating.pillar;

  return (
    <Card title={label} elevated>
      <View style={styles.heroRow}>
        <View>
          <Text style={styles.score}>{rating.score}</Text>
          <Text style={styles.scoreLabel}>out of 100</Text>
        </View>
        <Badge
          label={rating.tier}
          tone={rating.score >= 60 ? "success" : "accent"}
        />
      </View>

      {nextTier && (
        <Text style={styles.nextHint}>
          {nextTier.minScore - rating.score} points to {nextTier.label}
        </Text>
      )}

      <View>
        <StatRow
          label="Consistency"
          value={`${Math.round(rating.breakdown.consistencyRate * 100)}%`}
        />
        <StatRow
          label="Habit completion"
          value={`${Math.round(rating.breakdown.habitCompletionRate * 100)}%`}
        />
        <StatRow
          label="Current streak"
          value={`${rating.breakdown.streakDays}d`}
        />
        <StatRow
          label="Check-in rate"
          value={`${Math.round(rating.breakdown.checkInRate * 100)}%`}
        />
      </View>
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
  nextHint: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
});
