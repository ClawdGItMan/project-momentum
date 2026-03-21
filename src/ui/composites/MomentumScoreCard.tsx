import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { CharacterProfile } from "@/src/domain/models";
import { getNextTier, getTierDescription } from "@/src/domain/character";
import { theme } from "@/src/design";
import { Badge, Card } from "@/src/ui/primitives";

type MomentumScoreCardProps = {
  character: CharacterProfile;
  compact?: boolean;
};

function tierTone(score: number): "success" | "accent" | "warning" | "neutral" {
  if (score >= 80) return "success";
  if (score >= 40) return "accent";
  if (score >= 20) return "warning";
  return "neutral";
}

export function MomentumScoreCard({
  character,
  compact = false,
}: MomentumScoreCardProps) {
  const nextTier = getNextTier(character.momentumTier);
  const tierDesc = getTierDescription(character.momentumTier);

  return (
    <Card
      title="Momentum Score"
      subtitle="Your overall progress across all active pillars."
      elevated
    >
      <View style={styles.heroRow}>
        <View>
          <Text style={styles.score}>{character.momentumScore}</Text>
          <Text style={styles.scoreLabel}>out of 100</Text>
        </View>
        <Badge label={character.momentumTier} tone={tierTone(character.momentumScore)} />
      </View>

      {!compact && (
        <View style={styles.detailSection}>
          <Text style={styles.tierDescription}>{tierDesc}</Text>
          {nextTier && (
            <Text style={styles.nextTierHint}>
              Next tier: {nextTier.label} at {nextTier.minScore}+
            </Text>
          )}
        </View>
      )}

      {!compact && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{character.totalCheckIns}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{character.longestStreak}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{character.achievements.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      )}
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
  detailSection: {
    gap: theme.spacing.xxs,
  },
  tierDescription: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  nextTierHint: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: theme.spacing.sm,
    borderTopWidth: theme.borderWidth.hairline,
    borderTopColor: theme.color.stroke.subtle,
  },
  statItem: {
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  statValue: {
    ...theme.typography.metric,
    color: theme.color.fg.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
});
