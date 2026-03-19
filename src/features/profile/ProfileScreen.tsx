import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { HiddenDevToolsTrigger } from "@/src/features/dev/HiddenDevToolsTrigger";
import { formatConnectionState, formatMetricLabel } from "@/src/lib/formatters";
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
    healthConnection,
    healthSnapshot,
    signOut,
  } = useMomentumSession();

  const myPosts = feedPosts.filter((post) => post.authorId === currentUser.id);

  return (
    <ScrollScreen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <HiddenDevToolsTrigger style={styles.headerCopy}>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
        </HiddenDevToolsTrigger>
        <View style={styles.wrap}>
          <Badge label={formatConnectionState(healthConnection.state)} tone="accent" />
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
          subtitle={`Apple Health status: ${formatConnectionState(healthConnection.state)}`}
        >
          <Text style={styles.supportingCopy}>
            Apple Health keeps this profile grounded in the work you are
            actually doing. Manual entry stays available when sync is not ready.
          </Text>
          {(healthSnapshot?.metrics ?? []).length ? (
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
          ) : (
            <EmptyState
              title="No live metrics attached yet"
              message="Your mission, pillars, and consistency are already here. Sync health or publish a manual check-in to add activity details."
              actionLabel="Manage health state"
              onActionPress={() => router.push("/(app)/squads")}
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
        <Card title="Account">
          <Button
            label="Sign out"
            variant="ghost"
            fullWidth={false}
            onPress={() => void signOut()}
          />
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
});
