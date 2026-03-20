import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/src/design";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
};

export function Badge({ label, tone = "neutral", style }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone], style]}>
      <Text style={[styles.label, labelToneStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderWidth: theme.borderWidth.hairline,
  },
  label: {
    ...theme.typography.caption,
    letterSpacing: 0.7,
  },
});

const toneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: theme.color.bg.elevated,
    borderColor: theme.color.stroke.subtle,
  },
  success: {
    backgroundColor: theme.color.bg.elevated,
    borderColor: theme.color.accent.success,
  },
  warning: {
    backgroundColor: theme.color.bg.elevated,
    borderColor: theme.color.accent.warning,
  },
  danger: {
    backgroundColor: theme.color.bg.elevated,
    borderColor: theme.color.accent.danger,
  },
  accent: {
    backgroundColor: theme.color.chip.bg,
    borderColor: theme.color.stroke.subtle,
  },
});

const labelToneStyles = StyleSheet.create({
  neutral: {
    color: theme.color.fg.secondary,
  },
  success: {
    color: theme.color.accent.success,
  },
  warning: {
    color: theme.color.accent.warning,
  },
  danger: {
    color: theme.color.accent.danger,
  },
  accent: {
    color: theme.color.accent.energy,
  },
});
