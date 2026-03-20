import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { HiddenDevToolsTrigger } from "@/src/features/dev/HiddenDevToolsTrigger";
import {
  formatConnectionState,
  formatMetricLabel,
  formatProviderLabel,
} from "@/src/lib/formatters";
import { managedProviders } from "@/src/lib/providers";
import { getSnapshotFlags } from "@/src/lib/providers";
import { ConsistencyCard } from "@/src/ui/composites/ConsistencyCard";
import { ProgressPostCard } from "@/src/ui/composites/ProgressPostCard";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  MetricPill,
  Pill,
  ScrollScreen,
} from "@/src/ui/primitives";

export function ProfileScreen() {
  const router = useRouter();
  const {
    authState,
    consistency,
    currentUser,
    feedPosts,
    healthPreviewActive,
    providerConnections,
    providerSnapshots,
  } = useMomentumSession();

  const myPosts = feedPosts.filter((post) => post.authorId === currentUser.id);
  const healthConnection = providerConnections["apple-health"];
  const healthSnapshot = providerSnapshots["apple-health"] ?? null;
  const healthFlags = getSnapshotFlags(healthConnection, healthSnapshot, {
    preview: healthPreviewActive,
  });
  const connectedProviders = managedProviders.filter((provider) => {
    const state = providerConnections[provider].state;
    return state === "connected" || state === "connected_limited";
  });

  return (
    <ScrollScreen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <HiddenDevToolsTrigger style={styles.headerCopy}>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
        </HiddenDevToolsTrigger>
        <View style={styles.wrap}>
          <Badge label={formatConnectionState(healthConnection.state)} tone="accent" />
          {connectedProviders
            .filter((provider) => provider !== "apple-health")
            .map((provider) => (
              <Badge key={provider} label={formatProviderLabel(provider)} tone="neutral" />
            ))}
        </View>
      </View>

      <Text style={styles.mission}>{currentUser.missionLine}</Text>

      <View style={styles.wrap}>
        {currentUser.pillars.map((pillar) => (
          <Pill key={pillar} label={pillar} />
        ))}
      </View>

      <ConsistencyCard consistency={consistency} />

      <Card
        title="Privacy posture"
        subtitle="Selective, trusted visibility is part of the product value."
      >
        <Text style={styles.supportingCopy}>
          This profile is built for friends and squads only. It is not a public timeline
          for raw personal data.
        </Text>
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health layer</Text>
          <Button
            label="Why this score?"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push("/modals/consistency-detail")}
          />
        </View>
        <Card
          subtitle={`Default source: ${formatProviderLabel("apple-health")} • ${formatConnectionState(healthConnection.state)}`}
        >
          <Text style={styles.supportingCopy}>
            Apple Health remains the default proof surface, while connected providers add recovery
            and workout provenance where available.
          </Text>
          {(healthSnapshot?.metrics ?? []).length &&
          (!healthFlags.showHistoricalSummary || healthFlags.showUnsavedSummary) ? (
            <View style={styles.wrap}>
              {(healthSnapshot?.metrics ?? []).map((metric) => (
                <MetricPill
                  key={metric.key}
                  label={formatMetricLabel(metric.key)}
                  value={String(metric.value ?? 0)}
                  unit={metric.unit}
                />
              ))}
            </View>
          ) : null}
          {healthFlags.showUnsavedSummary ? (
            <Text style={styles.supportingCopy}>
              This summary is fresh from Apple Health on this device, but it has not saved to the
              backend yet.
            </Text>
          ) : healthFlags.showHistoricalSummary ? (
            <Card
              subtitle={`Last saved summary from ${healthSnapshot?.capturedAt ? new Date(healthSnapshot.capturedAt).toLocaleString() : "earlier"}`}
            >
              <Text style={styles.supportingCopy}>
                Apple Health needs another refresh, so these stats are not being treated as live
                profile data right now.
              </Text>
              <Button
                label="Refresh in account settings"
                variant="secondary"
                fullWidth={false}
                onPress={() => router.push("/(app)/account")}
              />
            </Card>
          ) : (
            <EmptyState
              title="No live metrics attached yet"
              message="Your mission, pillars, and consistency are already here. Sync health or publish a manual check-in to add activity details."
              actionLabel="Manage provider settings"
              onActionPress={() => router.push("/(app)/account")}
            />
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent proof</Text>
          <Button
            label="Metric detail"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push("/modals/metric-detail")}
          />
        </View>
        {myPosts.length ? (
          <View style={styles.list}>
            {myPosts.map((post) => (
              <ProgressPostCard key={post.id} post={post} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="Your proof feed starts with one check-in"
            message="Publish a workout and it will anchor the profile immediately."
            actionLabel="Create check-in"
            onActionPress={() => router.push("/(app)/check-in")}
          />
        )}
      </View>

      {authState === "authenticated" ? (
        <Card
          title="Account"
          subtitle="Providers, session, and account controls live in one private settings surface."
        >
          <View style={styles.accountRow}>
            <Button
              label="Open account settings"
              fullWidth={false}
              variant="secondary"
              onPress={() => router.push("/(app)/account")}
            />
            <Text style={styles.supportingCopy}>
              Use this hub to manage Apple Health, Strava, WHOOP, sign out, and handle account
              deletion.
            </Text>
          </View>
        </Card>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  headerCopy: {
    gap: 2,
    flex: 1,
  },
  name: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  username: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.muted,
  },
  mission: {
    ...theme.typography.body,
    color: theme.color.fg.primary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.heading,
    color: theme.color.fg.primary,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  list: {
    gap: theme.spacing.md,
  },
  supportingCopy: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  accountRow: {
    gap: theme.spacing.sm,
  },
});
