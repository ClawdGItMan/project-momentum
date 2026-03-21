import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { AchievementDefinition } from "@/src/domain/models";
import { theme } from "@/src/design";
import { Surface } from "@/src/ui/primitives";
import { Feather } from "@expo/vector-icons";

type AchievementBadgeProps = {
  achievement: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: string;
  compact?: boolean;
};

export function AchievementBadge({
  achievement,
  unlocked,
  compact = false,
}: AchievementBadgeProps) {
  const iconName = achievement.icon as keyof typeof Feather.glyphMap;

  return (
    <Surface elevated={unlocked} style={[styles.container, !unlocked && styles.locked]}>
      <View style={[styles.iconCircle, unlocked ? styles.iconUnlocked : styles.iconLocked]}>
        <Feather
          name={iconName}
          size={compact ? 18 : 22}
          color={unlocked ? theme.color.fg.inverse : theme.color.fg.muted}
        />
      </View>
      {!compact && (
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, !unlocked && styles.lockedText]}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
          <Text
            style={[styles.description, !unlocked && styles.lockedText]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>
        </View>
      )}
      {compact && (
        <Text
          style={[styles.compactTitle, !unlocked && styles.lockedText]}
          numberOfLines={1}
        >
          {achievement.title}
        </Text>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.sm,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  locked: {
    opacity: theme.opacity.disabled,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnlocked: {
    backgroundColor: theme.color.accent.energy,
  },
  iconLocked: {
    backgroundColor: theme.color.bg.elevated,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
  },
  textContainer: {
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  title: {
    ...theme.typography.label,
    color: theme.color.fg.primary,
    textAlign: "center",
  },
  description: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
    textAlign: "center",
  },
  compactTitle: {
    ...theme.typography.caption,
    color: theme.color.fg.primary,
    textAlign: "center",
  },
  lockedText: {
    color: theme.color.fg.muted,
  },
});
