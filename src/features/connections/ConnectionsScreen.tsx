import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { formatConnectionState } from "@/src/lib/formatters";
import { Badge, Button, Card, ScrollScreen } from "@/src/ui/primitives";

export function ConnectionsScreen() {
  const {
    connectHealth,
    currentUser,
    enableManualFallback,
    friends,
    healthConnection,
    healthLoading,
    healthPreviewActive,
    manualFallbackEnabled,
    resetDemoSession,
    squads,
  } = useMomentumSession();
  const showDemoControls = __DEV__ || Platform.OS === "web";

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Connections</Text>

        {showDemoControls ? (
          <Card
            title="Demo controls"
            subtitle={`Health: ${formatConnectionState(healthConnection.state)}${healthPreviewActive ? " • demo preview" : ""}${manualFallbackEnabled ? " • manual fallback active" : ""}`}
          >
            <Text style={styles.helper}>
              These controls exist for demo environments where native HealthKit is not
              available or you need to quickly reset the first-run loop.
            </Text>
            <View style={styles.actions}>
              <Button
                label="Try Apple Health"
                fullWidth={false}
                loading={healthLoading}
                onPress={() => connectHealth()}
              />
              <Button
                label="Preview metrics"
                fullWidth={false}
                variant="secondary"
                onPress={() => connectHealth({ preview: true })}
              />
              <Button
                label="Enable fallback"
                fullWidth={false}
                variant="ghost"
                onPress={enableManualFallback}
              />
              <Button
                label="Reset demo"
                fullWidth={false}
                variant="ghost"
                onPress={() => void resetDemoSession()}
              />
            </View>
          </Card>
        ) : null}

        <Card
          title="Squads"
          subtitle="Private groups stay the main accountability surface in this MVP."
        >
          <View style={styles.list}>
            {squads.map((squad) => (
              <View key={squad.id} style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.rowTitle}>{squad.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    {squad.memberCount} people • {squad.currentFocus}
                  </Text>
                </View>
                {currentUser.selectedSquadId === squad.id ? (
                  <Badge label="Selected" tone="accent" />
                ) : null}
              </View>
            ))}
          </View>
        </Card>

        <Card
          title="Friends"
          subtitle="Mutual acceptance only. No followers, no public discovery in v0.1."
        >
          <View style={styles.list}>
            {friends.map((friend) => (
              <View key={friend.id} style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.rowTitle}>{friend.name}</Text>
                  <Text style={styles.rowSubtitle}>@{friend.username}</Text>
                </View>
                <Text style={styles.pulse}>{friend.streakLabel}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  container: {
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  list: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...theme.typography.label,
    color: theme.color.fg.primary,
  },
  rowSubtitle: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  pulse: {
    ...theme.typography.caption,
    color: theme.color.accent.energy,
    maxWidth: 110,
    textAlign: "right",
  },
  helper: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
});
