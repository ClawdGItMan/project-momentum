import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { formatConnectionState } from "@/src/lib/formatters";
import { ConsistencyCard } from "@/src/ui/composites/ConsistencyCard";
import { ProgressPostCard } from "@/src/ui/composites/ProgressPostCard";
import {
  Button,
  Card,
  EmptyState,
  ScrollScreen,
  SegmentedControl,
} from "@/src/ui/primitives";

export function HomeScreen() {
  const router = useRouter();
  const {
    consistency,
    currentUser,
    dismissPublishedCelebration,
    feedPosts,
    healthConnection,
    healthPreviewActive,
    homeSegment,
    lastPublishedPostId,
    manualFallbackEnabled,
    reactToPost,
    setHomeSegment,
    squads,
  } = useMomentumSession();

  const lastPublishedPost = feedPosts.find((post) => post.id === lastPublishedPostId);
  const selectedSquad = squads.find((squad) => squad.id === currentUser.selectedSquadId);
  const visiblePosts = feedPosts.filter((post) =>
    homeSegment === "squads"
      ? selectedSquad
        ? post.squadId === selectedSquad.id
        : Boolean(post.squadId)
      : post.audience !== "squad",
  );
  const showHealthPrompt =
    manualFallbackEnabled ||
    (healthConnection.state !== "connected" &&
      healthConnection.state !== "connected_limited");

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Home</Text>
            <Text style={styles.subtitle}>
              Squads stay central, friends keep the loop human.
            </Text>
          </View>
          <Button
            label="Check in"
            fullWidth={false}
            onPress={() => router.push("/(app)/check-in")}
          />
        </View>

        <SegmentedControl
          value={homeSegment}
          onChange={setHomeSegment}
          options={[
            { label: "Squads", value: "squads" },
            { label: "Friends", value: "friends" },
          ]}
        />

        <Card
          title={homeSegment === "squads" ? selectedSquad?.name ?? "Squads lane" : "Friends lane"}
          subtitle={
            homeSegment === "squads"
              ? "Private group proof stays central to the product."
              : "Mutual friends keep the loop intimate and low-noise."
          }
        >
          <View style={styles.actions}>
            <Text style={styles.bannerCopy}>
              {visiblePosts.length} visible {visiblePosts.length === 1 ? "post" : "posts"} in
              this lane.
            </Text>
            <Text style={styles.bannerCopy}>
              {formatConnectionState(healthConnection.state)}
              {healthPreviewActive ? " • demo preview" : ""}
              {manualFallbackEnabled ? " • manual fallback" : ""}
            </Text>
          </View>
        </Card>

        <ConsistencyCard consistency={consistency} compact />

        {lastPublishedPost ? (
          <Card
            title="Check-in published"
            subtitle="The first proof loop should feel immediate."
            elevated
          >
            <Text style={styles.bannerCopy}>
              Your update is now visible in{" "}
              {lastPublishedPost.audience === "squad"
                ? lastPublishedPost.squadName ?? "your squad"
                : "Friends"}
              .
            </Text>
            <View style={styles.actions}>
              <Button
                label="View profile"
                fullWidth={false}
                variant="secondary"
                onPress={() => router.push("/(app)/profile")}
              />
              <Button
                label="Dismiss"
                fullWidth={false}
                variant="ghost"
                onPress={dismissPublishedCelebration}
              />
            </View>
          </Card>
        ) : null}

        {showHealthPrompt ? (
          <Card
            title="Proof layer still needs attention"
            subtitle={`${formatConnectionState(healthConnection.state)}${manualFallbackEnabled ? " • manual fallback active" : ""}`}
          >
            <Text style={styles.bannerCopy}>
              The demo can still move with manual fallback, but the strongest path is a
              healthy Apple Health connection.
            </Text>
            <Button
              label="Manage health state"
              fullWidth={false}
              variant="ghost"
              onPress={() => router.push("/(app)/connections")}
            />
          </Card>
        ) : null}

        {visiblePosts.length ? (
          <View style={styles.list}>
            {visiblePosts.map((post) => (
              <ProgressPostCard
                key={post.id}
                post={post}
                onDidThisToo={reactToPost}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No posts in this lane yet"
            message={
              homeSegment === "squads" && !selectedSquad
                ? "Choose a squad in Connections or switch to Friends while you set up the tighter accountability lane."
                : "Your first check-in will land here with the right audience context."
            }
            actionLabel={
              homeSegment === "squads" && !selectedSquad
                ? "Open connections"
                : "Publish one now"
            }
            onActionPress={() =>
              router.push(
                homeSegment === "squads" && !selectedSquad
                  ? "/(app)/connections"
                  : "/(app)/check-in",
              )
            }
          />
        )}
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
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
  list: {
    gap: theme.spacing.md,
  },
  bannerCopy: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
});
