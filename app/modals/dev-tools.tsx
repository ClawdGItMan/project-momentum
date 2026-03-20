import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { formatConnectionState } from "@/src/lib/formatters";
import { Badge, Button, Card, ScrollScreen } from "@/src/ui/primitives";

function getActionMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export default function DevToolsModal() {
  const router = useRouter();
  const {
    authState,
    connectHealth,
    enableManualFallback,
    healthConnection,
    healthLoading,
    healthPreviewActive,
    manualFallbackEnabled,
    resetDemoSession,
    startDemoSession,
  } = useMomentumSession();
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const badges = useMemo(
    () => [
      { label: `Auth: ${authState}`, tone: "neutral" as const },
      {
        label: `Health: ${formatConnectionState(healthConnection.state)}`,
        tone:
          healthConnection.state === "connected" ||
          healthConnection.state === "connected_limited"
            ? ("success" as const)
            : healthConnection.state === "needs_attention" ||
                healthConnection.state === "unavailable" ||
                healthConnection.state === "error"
              ? ("warning" as const)
              : ("neutral" as const),
      },
      ...(healthPreviewActive
        ? [{ label: "Sample health data", tone: "accent" as const }]
        : []),
      ...(manualFallbackEnabled
        ? [{ label: "Manual entry active", tone: "warning" as const }]
        : []),
    ],
    [authState, healthConnection.state, healthPreviewActive, manualFallbackEnabled],
  );

  const runAction = async (
    action: () => Promise<void>,
    notice: string,
    fallback: string,
  ) => {
    setActionError(null);
    setActionNotice(null);

    try {
      await action();
      setActionNotice(notice);
    } catch (error) {
      setActionError(getActionMessage(error, fallback));
    }
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <ScrollScreen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Debug Tools</Text>
          <Text style={styles.subtitle}>
            Hidden development controls for staging auth, health, and reset
            states while we build.
          </Text>
        </View>
        <Button
          label="Close"
          fullWidth={false}
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>

      <Card
        title="Current state"
        subtitle="These controls stay off normal product surfaces."
      >
        <View style={styles.badges}>
          {badges.map((badge) => (
            <Badge key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
        </View>
        {healthConnection.lastError ? (
          <Text style={styles.helper}>
            Last Apple Health error: {healthConnection.lastError}
          </Text>
        ) : null}
      </Card>

      <Card
        title="Session tools"
        subtitle="Use sample state or clear the local session without changing app copy."
      >
        <View style={styles.stack}>
          <Button
            label="Start demo session"
            variant="secondary"
            onPress={() =>
              void runAction(
                async () => {
                  await startDemoSession();
                  router.replace("/(app)/home");
                },
                "Demo session loaded.",
                "Unable to start the demo session.",
              )
            }
          />
          <Button
            label="Reset local session"
            variant="ghost"
            onPress={() =>
              void runAction(
                async () => {
                  await resetDemoSession();
                  router.replace("/(auth)/sign-in");
                },
                "Local session reset.",
                "Unable to reset the local session.",
              )
            }
          />
        </View>
      </Card>

      <Card
        title="Health tools"
        subtitle="Keep these here so the main app can stay product-facing."
      >
        <View style={styles.stack}>
          <Button
            label={healthLoading ? "Refreshing Apple Health" : "Try Apple Health"}
            loading={healthLoading}
            onPress={() =>
              void runAction(
                async () => {
                  await connectHealth();
                },
                "Apple Health refresh finished.",
                "Unable to refresh Apple Health.",
              )
            }
          />
          <Button
            label="Load sample health data"
            variant="secondary"
            onPress={() =>
              void runAction(
                async () => {
                  await connectHealth({ preview: true });
                },
                "Sample health data loaded.",
                "Unable to load sample health data.",
              )
            }
          />
          <Button
            label="Enable manual entry fallback"
            variant="ghost"
            onPress={() => {
              enableManualFallback();
              setActionError(null);
              setActionNotice("Manual entry fallback enabled.");
            }}
          />
        </View>
      </Card>

      {actionNotice ? <Text style={styles.notice}>{actionNotice}</Text> : null}
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  stack: {
    gap: theme.spacing.sm,
  },
  helper: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  notice: {
    ...theme.typography.bodySmall,
    color: theme.color.accent.success,
  },
  error: {
    ...theme.typography.bodySmall,
    color: theme.color.accent.danger,
  },
});
