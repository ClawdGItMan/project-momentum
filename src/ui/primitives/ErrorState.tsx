import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design/theme";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something needs attention",
  message,
  actionLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button
          label={actionLabel}
          variant="danger"
          onPress={onRetry}
          fullWidth={false}
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
    borderColor: "#F2BEC9",
    backgroundColor: "#FFF1F4",
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.heading,
    color: "#A52245",
  },
  message: {
    ...theme.typography.body,
    color: theme.color.fg.secondary,
  },
});

