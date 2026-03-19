import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import type {
  AudienceVisibility,
  PostMetricDisplay,
  PostType,
  ProgressPost,
} from "@/src/features/app/sessionTypes";
import { formatConnectionState, formatMetricLabel } from "@/src/lib/formatters";
import { ProgressPostCard } from "@/src/ui/composites/ProgressPostCard";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  MetricPill,
  ScrollScreen,
  SegmentedControl,
  TextField,
} from "@/src/ui/primitives";

function getErrorMessage(error: unknown, fallback: string) {
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

export function CheckInScreen() {
  const router = useRouter();
  const {
    checkInDraft,
    connectHealth,
    currentUser,
    healthConnection,
    healthLoading,
    healthSnapshot,
    manualFallbackEnabled,
    publishCheckIn,
    squads,
    updateCheckInDraft,
  } = useMomentumSession();
  const [publishing, setPublishing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const postTypeOptions: { label: string; value: PostType }[] = [
    { label: "Workout", value: "workout" },
    { label: "Habit win", value: "habit-win" },
    { label: "Recovery", value: "recovery" },
    { label: "Reflection", value: "reflection" },
  ];

  const selectedSquad = squads.find((squad) => squad.id === currentUser.selectedSquadId);
  const squadAvailable = Boolean(selectedSquad);
  const audienceOptions: { label: string; value: AudienceVisibility }[] = [
    { label: "Only me", value: "only-me" },
    { label: "Friends", value: "friends" },
    ...(squadAvailable
      ? ([{ label: "Squad", value: "squad" }] as {
          label: string;
          value: AudienceVisibility;
        }[])
      : []),
  ];

  const visibleMetrics = (healthSnapshot?.metrics ?? []).filter((metric) =>
    checkInDraft.type === "workout"
      ? ["workouts", "steps", "active-energy"].includes(metric.key)
      : ["sleep-duration", "steps", "mindfulness-minutes"].includes(metric.key),
  );
  const requiresManualEntry =
    checkInDraft.type === "workout" &&
    (manualFallbackEnabled || visibleMetrics.length === 0);
  const manualFieldsValid =
    !requiresManualEntry ||
    (Boolean(checkInDraft.manualWorkoutName.trim()) &&
      Number(checkInDraft.manualDurationMinutes) > 0 &&
      Number(checkInDraft.manualEnergy) > 0);
  const canPublish =
    manualFieldsValid && (checkInDraft.audience !== "squad" || squadAvailable);
  const previewMetrics: PostMetricDisplay[] = requiresManualEntry
    ? [
        {
          label: "Workout",
          value: checkInDraft.manualWorkoutName.trim() || "Workout",
        },
        {
          label: "Duration",
          value: Number(checkInDraft.manualDurationMinutes || 0),
          unit: "min",
        },
        {
          label: "Energy",
          value: Number(checkInDraft.manualEnergy || 0),
          unit: "kcal",
        },
      ].filter(
        (metric) =>
          metric.label === "Workout" ||
          (typeof metric.value === "number" ? metric.value > 0 : Boolean(metric.value)),
      )
    : visibleMetrics.map((metric) => ({
        key: metric.key,
        label:
          metric.key === "workouts"
            ? "Workout"
            : formatMetricLabel(metric.key),
        value:
          metric.key === "workouts" && typeof metric.value === "number"
            ? `${metric.value} ${metric.value === 1 ? "session" : "sessions"}`
            : typeof metric.value === "boolean"
              ? metric.value
                ? "Yes"
                : "No"
              : (metric.value ?? 0),
        unit: metric.key === "workouts" ? undefined : metric.unit,
      }));
  const previewPost: ProgressPost = {
    id: "preview-post",
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorUsername: currentUser.username,
    squadId: checkInDraft.audience === "squad" ? selectedSquad?.id : undefined,
    squadName: checkInDraft.audience === "squad" ? selectedSquad?.name : undefined,
    type: checkInDraft.type,
    audience:
      checkInDraft.audience === "squad" && !selectedSquad
        ? "friends"
        : checkInDraft.audience,
    caption:
      checkInDraft.caption.trim() ||
      "A short note will show up here once you add a little context.",
    createdAt: new Date().toISOString(),
    metrics: previewMetrics,
    consistencyScore: 81,
    consistencyLabel: "Locked In",
    reactions: {
      didThisToo: 0,
      commentCount: 0,
      emojis: [],
    },
    isCurrentUser: true,
  };

  const submit = async () => {
    setPublishing(true);
    setSubmitError(null);

    try {
      await publishCheckIn();
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace("/(app)/home");
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, "The check-in needs more detail before it can publish."),
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>First check-in</Text>
            <Text style={styles.subtitle}>
              Share the work while it is still fresh.
            </Text>
          </View>
          <Badge label="Under 30 sec" tone="accent" />
        </View>

        <Card title="Post type">
          <SegmentedControl
            value={checkInDraft.type}
            onChange={(value) => updateCheckInDraft({ type: value })}
            options={postTypeOptions}
          />
          <Text style={styles.helper}>
            Workout is fully polished in session one. The others stay lighter.
          </Text>
        </Card>

        <Card
          title="Health source"
          subtitle={
            checkInDraft.audience === "squad" && selectedSquad
              ? `This post will land inside ${selectedSquad.name}.`
              : "This post will land in your trusted friends lane."
          }
        >
          <View style={styles.metricsWrap}>
            <Badge
              label={formatConnectionState(healthConnection.state)}
              tone={
                healthConnection.state === "connected" ||
                healthConnection.state === "connected_limited"
                  ? "success"
                  : "warning"
              }
            />
            {manualFallbackEnabled ? (
              <Badge label="Manual entry" tone="warning" />
            ) : null}
          </View>
          <Text style={styles.helper}>
            Keep the caption short and let the activity speak for itself.
          </Text>
        </Card>

        <Card title="Metrics attached" subtitle="Apple Health leads whenever data is available.">
          {visibleMetrics.length ? (
            <View style={styles.metricsWrap}>
              {visibleMetrics.map((metric) => (
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
              title="No synced metrics attached yet"
              message={
                checkInDraft.type === "workout"
                  ? "Manual fallback will carry the first workout if Apple Health cannot provide coverage here."
                  : "Lighter post types can still publish as caption-first updates."
              }
            />
          )}

          {requiresManualEntry ? (
            <View style={styles.stack}>
              <TextField
                label="Workout name"
                value={checkInDraft.manualWorkoutName}
                onChangeText={(manualWorkoutName) =>
                  updateCheckInDraft({ manualWorkoutName })
                }
              />
              <TextField
                label="Duration (minutes)"
                value={checkInDraft.manualDurationMinutes}
                keyboardType="number-pad"
                onChangeText={(manualDurationMinutes) =>
                  updateCheckInDraft({ manualDurationMinutes })
                }
              />
              <TextField
                label="Active energy"
                value={checkInDraft.manualEnergy}
                keyboardType="number-pad"
                onChangeText={(manualEnergy) => updateCheckInDraft({ manualEnergy })}
                helperText="Fallback only. Synced values stay canonical whenever they exist."
              />
            </View>
          ) : null}

          <Button
            label={healthLoading ? "Syncing Apple Health" : "Refresh health sync"}
            fullWidth={false}
            variant="secondary"
            loading={healthLoading}
            onPress={() => void connectHealth()}
          />
          <Button
            label="Metric detail"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push("/modals/metric-detail")}
          />
        </Card>

        <Card title="Caption">
          <TextField
            value={checkInDraft.caption}
            onChangeText={(caption) => updateCheckInDraft({ caption })}
            multiline
            helperText="Short context beats overexplaining."
          />
        </Card>

        <Card title="Audience">
          <SegmentedControl
            value={
              !squadAvailable && checkInDraft.audience === "squad"
                ? "friends"
                : checkInDraft.audience
            }
            onChange={(value) =>
              updateCheckInDraft({
                audience: value,
                squadId: value === "squad" ? selectedSquad?.id : undefined,
              })
            }
            options={audienceOptions}
          />
          <Text style={styles.helper}>
            {checkInDraft.audience === "squad" && selectedSquad
              ? `Posting into ${selectedSquad.name}.`
              : squadAvailable
                ? "Workouts and habits start with Friends."
                : "Pick a squad during onboarding if you want the tighter accountability lane."}
          </Text>
          <Button
            label="Audience rules"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push("/modals/audience-selector")}
          />
        </Card>

        <Card
          title="Post preview"
          subtitle="Make sure the update feels clear before you publish."
        >
          <ProgressPostCard post={previewPost} showActions={false} />
        </Card>

        {submitError ? (
          <ErrorState
            title="Check-in needs one more pass"
            message={submitError}
          />
        ) : null}

        <View style={styles.footer}>
          {!canPublish ? (
            <Text style={styles.helper}>
              Manual workout fallback needs a workout name, duration, and active
              energy before publish.
            </Text>
          ) : null}
          <Button
            label="Publish check-in"
            loading={publishing}
            disabled={!canPublish}
            onPress={submit}
          />
        </View>
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
  metricsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  helper: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  stack: {
    gap: theme.spacing.sm,
  },
  footer: {
    paddingTop: theme.spacing.sm,
  },
});
