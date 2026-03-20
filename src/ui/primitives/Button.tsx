import React from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
  const isPrimary = variant === "primary";
  const indicatorColor =
    variant === "primary"
      ? theme.color.fg.inverse
      : variant === "danger"
        ? theme.color.accent.danger
      : theme.color.fg.primary;

  const resolveCallerStyle = (
    state: PressableStateCallbackType,
  ): StyleProp<ViewStyle> => (typeof style === "function" ? style(state) : style);

  const content = loading ? (
    <ActivityIndicator size="small" color={indicatorColor} />
  ) : (
    <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabledState}
      style={(state) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant],
        state.pressed && !disabledState && styles.pressed,
        disabledState && styles.disabled,
        resolveCallerStyle(state),
      ]}
      {...props}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[theme.color.accent.energy, theme.color.accent.energySoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.fill, fillStyles[variant]]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth.regular,
    backgroundColor: theme.color.bg.surface,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  fill: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
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
    borderColor: theme.color.accent.energy,
  },
  secondary: {
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.elevated,
  },
  ghost: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  danger: {
    borderColor: theme.color.accent.danger,
    backgroundColor: theme.color.bg.elevated,
  },
});

const fillStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.color.accent.energy,
  },
  secondary: {
    backgroundColor: "transparent",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: "transparent",
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
    color: theme.color.accent.danger,
  },
});
