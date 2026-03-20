import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";
import { Badge, Button, Card, ErrorState, LoadingSkeleton, ScrollScreen } from "@/src/ui/primitives";

type SessionGateScreenProps = {
  title: string;
  message: string;
  error?: string | null;
  onRetry?: () => void;
  onSignOut?: () => void;
};

export function SessionGateScreen({
  title,
  message,
  error,
  onRetry,
  onSignOut,
}: SessionGateScreenProps) {
  const isError = Boolean(error);

  return (
    <ScrollScreen contentContainerStyle={styles.content}>
      <Card
        title={title}
        subtitle={message}
      >
        <View style={styles.stack}>
          <Badge label={isError ? "Needs attention" : "Loading your account"} tone={isError ? "warning" : "accent"} />
          {isError ? (
            <ErrorState
              title="Account bootstrap failed"
              message={error ?? "We could not load this account yet."}
              onRetry={onRetry}
            />
          ) : (
            <View style={styles.loadingStack}>
              <LoadingSkeleton height={22} width="62%" />
              <LoadingSkeleton height={16} width="100%" />
              <LoadingSkeleton height={16} width="88%" />
              <LoadingSkeleton height={16} width="74%" />
            </View>
          )}
          {isError && onSignOut ? (
            <Button
              label="Sign out"
              variant="ghost"
              fullWidth={false}
              onPress={onSignOut}
            />
          ) : null}
          {!isError ? (
            <Text style={styles.helper}>
              We are validating the current session and loading private account state before routing.
            </Text>
          ) : null}
        </View>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  stack: {
    gap: theme.spacing.md,
  },
  loadingStack: {
    gap: theme.spacing.sm,
  },
  helper: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.muted,
  },
});
