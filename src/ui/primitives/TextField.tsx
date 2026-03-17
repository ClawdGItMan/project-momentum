import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { theme } from "@/src/design";

type TextFieldProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
};

export function TextField({ label, helperText, errorText, style, ...props }: TextFieldProps) {
  const hasError = Boolean(errorText);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.color.fg.muted}
        style={[styles.input, hasError && styles.inputError, style]}
        {...props}
      />
      {errorText ? (
        <Text style={styles.error}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.color.fg.secondary,
  },
  input: {
    ...theme.typography.body,
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth.regular,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.surface,
    color: theme.color.fg.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.color.accent.danger,
  },
  helper: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  error: {
    ...theme.typography.caption,
    color: theme.color.accent.danger,
  },
});

