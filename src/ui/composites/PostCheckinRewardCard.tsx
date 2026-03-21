import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { AchievementDefinition } from "@/src/domain/models";
import { theme } from "@/src/design";
import { Badge, Surface } from "@/src/ui/primitives";
import { Feather } from "@expo/vector-icons";

type PostCheckinRewardCardProps = {
  headline: string;
  stats: { label: string; value: string; funComparison?: string }[];
  streakMessage?: string;
  newAchievements?: AchievementDefinition[];
};

export function PostCheckinRewardCard({
  headline,
  stats,
  streakMessage,
  newAchievements = [],
}: PostCheckinRewardCardProps) {
  return (
    <Surface elevated style={styles.outer}>
      <LinearGradient
        colors={[theme.color.accent.energy, theme.color.accent.energySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.headline}>{headline}</Text>

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.funComparison && (
                <Text style={styles.funComparison}>{stat.funComparison}</Text>
              )}
            </View>
          ))}
        </View>

        {streakMessage && (
          <View style={styles.streakRow}>
            <Feather name="zap" size={16} color={theme.color.accent.champagne} />
            <Text style={styles.streakText}>{streakMessage}</Text>
          </View>
        )}

        {newAchievements.length > 0 && (
          <View style={styles.achievementSection}>
            <Text style={styles.achievementHeader}>New badges unlocked!</Text>
            <View style={styles.achievementRow}>
              {newAchievements.map((ach) => (
                <Badge key={ach.id} label={ach.title} tone="success" />
              ))}
            </View>
          </View>
        )}
      </LinearGradient>
    </Surface>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
  },
  gradient: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headline: {
    ...theme.typography.heading,
    color: theme.color.fg.inverse,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: theme.spacing.sm,
  },
  statItem: {
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  statValue: {
    ...theme.typography.metric,
    color: theme.color.fg.inverse,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.color.fg.inverse,
    opacity: 0.85,
  },
  funComparison: {
    ...theme.typography.caption,
    color: theme.color.accent.champagne,
    textAlign: "center",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  streakText: {
    ...theme.typography.label,
    color: theme.color.accent.champagne,
  },
  achievementSection: {
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: theme.borderWidth.hairline,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  achievementHeader: {
    ...theme.typography.label,
    color: theme.color.fg.inverse,
  },
  achievementRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    justifyContent: "center",
  },
});
