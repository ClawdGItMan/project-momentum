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
    paddingVertical: 4,
    borderWidth: theme.borderWidth.hairline,
  },
  label: {
    ...theme.typography.caption,
  },
});

const toneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: theme.color.bg.elevated,
    borderColor: theme.color.stroke.subtle,
  },
  success: {
    backgroundColor: "#EAF9F2",
    borderColor: "#A7E9CC",
  },
  warning: {
    backgroundColor: "#FFF7E8",
    borderColor: "#FCDDA5",
  },
  danger: {
    backgroundColor: "#FFECEF",
    borderColor: "#F9B8C6",
  },
  accent: {
    backgroundColor: theme.color.chip.bg,
    borderColor: "#9ADAF4",
  },
});

const labelToneStyles = StyleSheet.create({
  neutral: {
    color: theme.color.fg.secondary,
  },
  success: {
    color: "#0F8A58",
  },
  warning: {
    color: "#A46200",
  },
  danger: {
    color: "#B42348",
  },
  accent: {
    color: theme.color.accent.energy,
  },
});

