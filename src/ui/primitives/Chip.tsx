import React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { theme } from "@/src/design";

type ChipProps = Omit<PressableProps, "style"> & {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected = false, style, ...props }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borderWidth.regular,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.surface,
    alignSelf: "flex-start",
  },
  selected: {
    borderColor: theme.color.accent.energy,
    backgroundColor: theme.color.chip.bg,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...theme.typography.label,
    color: theme.color.fg.secondary,
  },
  labelSelected: {
    color: theme.color.chip.fg,
  },
});
