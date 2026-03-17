import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design/theme";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onActionPress ? (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          fullWidth={false}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.heading,
    color: theme.color.fg.primary,
  },
  message: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
  },
});

