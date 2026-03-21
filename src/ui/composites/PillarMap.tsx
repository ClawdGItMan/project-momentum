import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { PillarRating } from "@/src/domain/models";
import { theme } from "@/src/design";
import { Card } from "@/src/ui/primitives";

type PillarMapProps = {
  ratings: PillarRating[];
};

const pillarMeta: Record<string, { label: string; icon: string; color: string }> = {
  fitness: { label: "Fitness", icon: "💪", color: theme.color.accent.energy },
  mindset: { label: "Mindset", icon: "🧠", color: theme.color.accent.consistency },
  learning: { label: "Learning", icon: "📚", color: theme.color.accent.warning },
  recovery: { label: "Recovery", icon: "😴", color: theme.color.accent.success },
};

function scoreColor(score: number): string {
  if (score >= 80) return theme.color.accent.success;
  if (score >= 60) return theme.color.accent.energy;
  if (score >= 40) return theme.color.accent.consistency;
  if (score >= 20) return theme.color.accent.warning;
  return theme.color.fg.muted;
}

export function PillarMap({ ratings }: PillarMapProps) {
  if (ratings.length === 0) return null;

  return (
    <Card title="Pillar Map" subtitle="Your strength across each focus area." elevated>
      <View style={styles.grid}>
        {ratings.map((rating) => {
          const meta = pillarMeta[rating.pillar];
          const barWidth = `${Math.max(rating.score, 4)}%` as const;
          return (
            <View key={rating.pillar} style={styles.pillarRow}>
              <View style={styles.pillarHeader}>
                <Text style={styles.pillarIcon}>{meta?.icon ?? "⚡"}</Text>
                <Text style={styles.pillarLabel}>{meta?.label ?? rating.pillar}</Text>
                <Text style={styles.pillarScore}>{rating.score}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: barWidth,
                      backgroundColor: scoreColor(rating.score),
                    },
                  ]}
                />
              </View>
              <Text style={styles.pillarTier}>{rating.tier}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: theme.spacing.md,
  },
  pillarRow: {
    gap: theme.spacing.xs,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  pillarIcon: {
    fontSize: 18,
  },
  pillarLabel: {
    ...theme.typography.label,
    color: theme.color.fg.primary,
    flex: 1,
  },
  pillarScore: {
    ...theme.typography.metric,
    color: theme.color.fg.primary,
  },
  barTrack: {
    height: 8,
    backgroundColor: theme.color.bg.elevated,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: theme.radius.pill,
  },
  pillarTier: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
});
