import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { theme } from "@/src/design";

type TextFieldProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
};

export function TextField({
  label,
  helperText,
  errorText,
  style,
  multiline,
  onBlur,
  onFocus,
  ...props
}: TextFieldProps) {
  const hasError = Boolean(errorText);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text
          style={[
            styles.label,
            focused && !hasError ? styles.labelFocused : null,
            hasError ? styles.labelError : null,
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        multiline={multiline}
        placeholderTextColor={theme.color.fg.muted}
        selectionColor={theme.color.accent.energy}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          focused && !hasError ? styles.inputFocused : null,
          hasError ? styles.inputError : null,
          style,
        ]}
        textAlignVertical={multiline ? "top" : "center"}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
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
  labelFocused: {
    color: theme.color.accent.energy,
  },
  labelError: {
    color: theme.color.accent.danger,
  },
  input: {
    ...theme.typography.body,
    minHeight: 56,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth.regular,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.elevated,
    color: theme.color.fg.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inputMultiline: {
    minHeight: 120,
  },
  inputFocused: {
    borderColor: theme.color.stroke.focus,
    backgroundColor: theme.color.bg.surface,
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
