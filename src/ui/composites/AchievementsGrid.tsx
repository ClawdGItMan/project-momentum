import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { AchievementDefinition, UnlockedAchievement } from "@/src/domain/models";
import { achievementDefinitions } from "@/src/domain/character";
import { theme } from "@/src/design";
import { Card } from "@/src/ui/primitives";
import { AchievementBadge } from "./AchievementBadge";

type AchievementsGridProps = {
  unlocked: UnlockedAchievement[];
  compact?: boolean;
};

export function AchievementsGrid({
  unlocked,
  compact = false,
}: AchievementsGridProps) {
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  const sorted = [...achievementDefinitions].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  const displayed = compact ? sorted.slice(0, 6) : sorted;

  return (
    <Card
      title="Achievements"
      subtitle={`${unlocked.length} of ${achievementDefinitions.length} unlocked`}
      elevated
    >
      <View style={styles.grid}>
        {displayed.map((achievement) => {
          const match = unlocked.find(
            (u) => u.achievementId === achievement.id,
          );
          return (
            <View key={achievement.id} style={styles.gridItem}>
              <AchievementBadge
                achievement={achievement}
                unlocked={!!match}
                unlockedAt={match?.unlockedAt}
                compact
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  gridItem: {
    width: "30%",
    flexGrow: 1,
    minWidth: 90,
  },
});
