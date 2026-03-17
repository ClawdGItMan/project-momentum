import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { theme } from "@/src/design";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  fullWidth = true,
  style,
  ...props
}: ButtonProps) {
  const disabledState = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabledState}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant],
        pressed && !disabledState && styles.pressed,
        disabledState && styles.disabled,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? theme.color.fg.inverse : theme.color.fg.primary}
        />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.borderWidth.regular,
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: theme.opacity.disabled,
  },
  label: {
    ...theme.typography.button,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.color.accent.energy,
    borderColor: theme.color.accent.energy,
  },
  secondary: {
    backgroundColor: theme.color.bg.surface,
    borderColor: theme.color.stroke.strong,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  danger: {
    backgroundColor: theme.color.accent.danger,
    borderColor: theme.color.accent.danger,
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: theme.color.fg.inverse,
  },
  secondary: {
    color: theme.color.fg.primary,
  },
  ghost: {
    color: theme.color.accent.energy,
  },
  danger: {
    color: theme.color.fg.inverse,
  },
});

