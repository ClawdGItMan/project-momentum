import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import type { ManagedIntegrationProvider } from "@/src/domain/models";
import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import type {
  AudienceVisibility,
  CheckInSourcePreference,
  PostMetricDisplay,
  PostType,
  ProgressPost,
} from "@/src/features/app/sessionTypes";
import {
  formatConnectionState,
  formatMetricLabel,
  formatProviderLabel,
} from "@/src/lib/formatters";
import {
  defaultManagedProvider,
  getSnapshotFlags,
  getSupportedProvidersForPostType,
  pickProviderForCheckIn,
} from "@/src/lib/providers";
import { ProgressPostCard } from "@/src/ui/composites/ProgressPostCard";
import { EditorialIconBadge } from "@/src/ui/composites";
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

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

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

function resolveProviderActionLabel(
  provider: ManagedIntegrationProvider,
  connected: boolean,
) {
  const label = formatProviderLabel(provider);
  if (provider === "apple-health") {
    return connected ? `Refresh ${label}` : `Connect ${label}`;
  }

  return connected ? `Refresh ${label}` : `Connect ${label}`;
}

export function CheckInScreen() {
  const router = useRouter();
  const {
    checkInDraft,
    connectProvider,
    currentUser,
    healthLoading,
    healthPreviewActive,
    manualFallbackEnabled,
    providerConnections,
    providerSnapshots,
    publishCheckIn,
    refreshProvider,
    squads,
    updateCheckInDraft,
  } = useMomentumSession();
  const [publishing, setPublishing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providerBusy, setProviderBusy] = useState<ManagedIntegrationProvider | null>(null);

  const iconFor = (name: FeatherIconName, active: boolean) => (
    <Feather
      name={name}
      size={14}
      color={active ? theme.color.accent.energy : theme.color.fg.secondary}
    />
  );

  const postTypeOptions: { icon: React.ReactNode; label: string; value: PostType }[] = [
    { label: "Workout", value: "workout", icon: iconFor("activity", checkInDraft.type === "workout") },
    { label: "Habit win", value: "habit-win", icon: iconFor("check-circle", checkInDraft.type === "habit-win") },
    { label: "Recovery", value: "recovery", icon: iconFor("moon", checkInDraft.type === "recovery") },
    { label: "Reflection", value: "reflection", icon: iconFor("edit-3", checkInDraft.type === "reflection") },
  ];

  const selectedSquad = squads.find((squad) => squad.id === currentUser.selectedSquadId);
  const squadAvailable = Boolean(selectedSquad);
  const audienceOptions: { icon: React.ReactNode; label: string; value: AudienceVisibility }[] = [
    { label: "Only me", value: "only-me", icon: iconFor("lock", checkInDraft.audience === "only-me") },
    { label: "Friends", value: "friends", icon: iconFor("users", checkInDraft.audience === "friends") },
    ...(squadAvailable
      ? ([{ label: "Squad", value: "squad", icon: iconFor("shield", checkInDraft.audience === "squad") }] as {
          icon: React.ReactNode;
          label: string;
          value: AudienceVisibility;
        }[])
      : []),
  ];

  const supportedProviders = useMemo(
    () => getSupportedProvidersForPostType(checkInDraft.type),
    [checkInDraft.type],
  );
  const sourceOptions: { icon: React.ReactNode; label: string; value: CheckInSourcePreference }[] = [
    { label: "Auto", value: "auto", icon: iconFor("star", checkInDraft.sourcePreference === "auto") },
    ...supportedProviders.map((provider) => ({
      label:
        provider === "apple-health"
          ? "Health"
          : provider === "strava"
            ? "Strava"
            : "WHOOP",
      icon:
        provider === "apple-health"
          ? iconFor("heart", checkInDraft.sourcePreference === provider)
          : provider === "strava"
            ? iconFor("map", checkInDraft.sourcePreference === provider)
            : iconFor("moon", checkInDraft.sourcePreference === provider),
      value: provider,
    })),
    { label: "Manual", value: "manual", icon: iconFor("edit-3", checkInDraft.sourcePreference === "manual") },
  ];

  const sourceSelection = pickProviderForCheckIn({
    type: checkInDraft.type,
    sourcePreference: checkInDraft.sourcePreference,
    providerConnections,
    providerSnapshots,
    appleHealthPreviewActive: healthPreviewActive,
  });
  const selectedManagedProvider =
    checkInDraft.sourcePreference !== "auto" && checkInDraft.sourcePreference !== "manual"
      ? checkInDraft.sourcePreference
      : sourceSelection.provider && sourceSelection.provider !== "manual"
        ? sourceSelection.provider
        : defaultManagedProvider;
  const selectedConnection = providerConnections[selectedManagedProvider];
  const selectedSnapshot =
    selectedManagedProvider === sourceSelection.provider
      ? sourceSelection.snapshot
      : providerSnapshots[selectedManagedProvider] ?? null;
  const selectedFlags = getSnapshotFlags(selectedConnection, selectedSnapshot, {
    preview: selectedManagedProvider === "apple-health" && healthPreviewActive,
  });

  const visibleMetrics =
    checkInDraft.sourcePreference === "manual"
      ? []
      : sourceSelection.provider && sourceSelection.provider !== "manual"
        ? sourceSelection.metrics
        : [];

  const requiresManualEntry =
    checkInDraft.type === "workout" &&
    (manualFallbackEnabled ||
      checkInDraft.sourcePreference === "manual" ||
      sourceSelection.provider === "manual");
  const manualFieldsValid =
    !requiresManualEntry ||
    (Boolean(checkInDraft.manualWorkoutName.trim()) &&
      Number(checkInDraft.manualDurationMinutes) > 0 &&
      Number(checkInDraft.manualEnergy) > 0);
  const canPublish =
    manualFieldsValid && (checkInDraft.audience !== "squad" || squadAvailable);
  const selectedSourceLabel =
    sourceSelection.provider && sourceSelection.provider !== "manual"
      ? formatProviderLabel(sourceSelection.provider)
      : "Manual";
  const selectedConnectionTone =
    selectedConnection.state === "connected" ||
    selectedConnection.state === "connected_limited"
      ? ("success" as const)
      : selectedConnection.state === "syncing" ||
          selectedConnection.state === "authorizing"
        ? ("warning" as const)
        : ("neutral" as const);

  const previewMetrics: PostMetricDisplay[] = requiresManualEntry
    ? ([
        {
          label: "Workout",
          value: checkInDraft.manualWorkoutName.trim() || "Workout",
          provider: "manual" as const,
          source: "manual" as const,
        },
        {
          key: "duration",
          label: "Duration",
          value: Number(checkInDraft.manualDurationMinutes || 0),
          unit: "min",
          provider: "manual" as const,
          source: "manual" as const,
        },
        {
          key: "active-energy",
          label: "Energy",
          value: Number(checkInDraft.manualEnergy || 0),
          unit: "kcal",
          provider: "manual" as const,
          source: "manual" as const,
        },
      ].filter(
        (metric) =>
          metric.label === "Workout" ||
          (typeof metric.value === "number" ? metric.value > 0 : Boolean(metric.value)),
      ) as PostMetricDisplay[])
    : visibleMetrics.map((metric) => ({
        key: metric.key,
        label: formatMetricLabel(metric.key),
        value:
          metric.key === "workouts" && typeof metric.value === "number"
            ? `${metric.value} ${metric.value === 1 ? "session" : "sessions"}`
            : typeof metric.value === "boolean"
              ? metric.value
                ? "Yes"
                : "No"
              : (metric.value ?? 0),
        unit: metric.key === "workouts" ? undefined : metric.unit,
        provider: metric.provider,
        source: metric.source,
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
    sourceProvider:
      requiresManualEntry || checkInDraft.sourcePreference === "manual"
        ? "manual"
        : sourceSelection.provider ?? undefined,
    sourceProviders: Array.from(
      new Set(
        previewMetrics
          .map((metric) => metric.provider)
          .filter((provider): provider is NonNullable<typeof provider> => Boolean(provider)),
      ),
    ),
    consistencyScore: 81,
    consistencyLabel: "Locked In",
    reactions: {
      didThisToo: 0,
      commentCount: 0,
      emojis: [],
    },
    isCurrentUser: true,
  };

  const runProviderAction = async () => {
    setProviderBusy(selectedManagedProvider);
    setProviderError(null);

    try {
      const isConnected =
        selectedConnection.state === "connected" ||
        selectedConnection.state === "connected_limited" ||
        selectedConnection.state === "syncing";

      if (isConnected) {
        await refreshProvider(selectedManagedProvider);
      } else {
        await connectProvider(selectedManagedProvider);
      }
    } catch (error) {
      setProviderError(
        getErrorMessage(
          error,
          `${formatProviderLabel(selectedManagedProvider)} needs another pass.`,
        ),
      );
    } finally {
      setProviderBusy(null);
    }
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
        <LinearGradient
          colors={[theme.color.bg.surface, theme.color.bg.elevated, "#E7EEFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.header}>
            <Badge label="Fast ritual" tone="neutral" />
            <Badge label="Under 30 sec" tone="accent" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>First check-in</Text>
            <Text style={styles.subtitle}>
              Let the proof lead. Choose the room, attach the signal, and share one
              clean note.
            </Text>
          </View>
          <View style={styles.heroSignalRow}>
            <EditorialIconBadge icon="activity" label="Proof first" tone="inverse" compact />
            <EditorialIconBadge icon="users" label="Trusted lane" tone="inverse" compact />
          </View>
        </LinearGradient>

        <View style={styles.sequenceRail}>
          {[
            { icon: "activity" as const, label: "Move" },
            { icon: "users" as const, label: "Room" },
            { icon: "layers" as const, label: "Proof" },
            { icon: "check-circle" as const, label: "Seal" },
          ].map((step) => (
            <View key={step.label} style={styles.sequenceStep}>
              <View style={styles.sequenceIconTile}>
                <Feather
                  name={step.icon}
                  size={14}
                  color={theme.color.accent.energy}
                />
              </View>
              <Text style={styles.sequenceLabel}>{step.label}</Text>
            </View>
          ))}
        </View>

        <Card title="1. Choose the move" subtitle="Start with the kind of proof you want to publish.">
          <SegmentedControl
            value={checkInDraft.type}
            onChange={(value) =>
              updateCheckInDraft({
                type: value,
                sourcePreference: value === "recovery" ? "whoop" : "auto",
              })
            }
            options={postTypeOptions}
          />
        </Card>

        <Card
          title="2. Set the room"
          subtitle={
            checkInDraft.audience === "squad" && selectedSquad
              ? `This check-in will land inside ${selectedSquad.name}.`
              : "Choose where this proof should land."
          }
        >
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
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>Proof source</Text>
          <SegmentedControl
            value={checkInDraft.sourcePreference}
            onChange={(value) =>
              updateCheckInDraft({
                sourcePreference: value,
              })
            }
            options={sourceOptions}
          />
          <View style={styles.metricsWrap}>
            <Badge label={`Selected: ${selectedSourceLabel}`} tone="accent" />
            {checkInDraft.sourcePreference !== "manual" ? (
              <Badge
                label={formatConnectionState(selectedConnection.state)}
                tone={selectedConnectionTone}
              />
            ) : (
              <Badge label="Manual entry" tone="warning" />
            )}
            {selectedFlags.showHistoricalSummary ? (
              <Badge label="Historical summary" tone="warning" />
            ) : null}
            {selectedFlags.showUnsavedSummary ? (
              <Badge label="Local summary" tone="accent" />
            ) : null}
          </View>
          <Text style={styles.helper}>
            {checkInDraft.sourcePreference === "manual"
              ? "Manual only takes over when live coverage falls short."
              : selectedConnection.lastError
                ? selectedConnection.lastError
                : sourceSelection.provider
                  ? `${formatProviderLabel(sourceSelection.provider)} is currently feeding this check-in.`
                  : "No fresh synced source is available yet."}
          </Text>
          {providerError ? (
            <ErrorState
              title={`${formatProviderLabel(selectedManagedProvider)} needs attention`}
              message={providerError}
            />
          ) : null}
          {checkInDraft.sourcePreference !== "manual" ? (
            <Button
              label={resolveProviderActionLabel(
                selectedManagedProvider,
                selectedConnection.state === "connected" ||
                  selectedConnection.state === "connected_limited" ||
                  selectedConnection.state === "syncing",
              )}
              fullWidth={false}
              variant="secondary"
              loading={
                providerBusy === selectedManagedProvider ||
                (selectedManagedProvider === "apple-health" && healthLoading)
              }
              onPress={() => void runProviderAction()}
            />
          ) : null}
        </Card>

        <Card
          title="3. Attach proof"
          subtitle={
            checkInDraft.sourcePreference === "manual"
              ? "Manual fallback keeps the first workout moving."
              : `${formatProviderLabel(selectedManagedProvider)} is carrying the evidence for this post.`
          }
          elevated
        >
          {selectedConnection.lastError && selectedSnapshot?.capturedAt && selectedSnapshot?.id ? (
            <Text style={styles.helper}>
              The latest refresh failed, so the saved summary is labeled as historical instead
              of live.
            </Text>
          ) : null}
          {visibleMetrics.length ? (
            <View style={styles.metricsWrap}>
              {visibleMetrics.map((metric) => (
                <MetricPill
                  key={`${metric.provider}-${metric.key}`}
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
                requiresManualEntry
                  ? "Manual fallback will carry the first workout if synced coverage still falls short."
                  : "Refresh the selected provider or switch source preference to attach live metrics."
              }
            />
          )}

          {requiresManualEntry ? (
            <View style={styles.manualFallback}>
              <Text style={styles.sectionLabel}>Manual fallback</Text>
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
                helperText="Synced provider values stay canonical whenever they exist."
              />
            </View>
          ) : null}

          <View style={styles.inlineActions}>
            <Button
              label="Metric detail"
              variant="ghost"
              fullWidth={false}
              onPress={() => router.push("/modals/metric-detail")}
            />
          </View>
        </Card>

        <Card
          title="4. Seal the note"
          subtitle="One short line of context is enough. Let the proof do the talking."
        >
          <TextField
            value={checkInDraft.caption}
            onChangeText={(caption) => updateCheckInDraft({ caption })}
            multiline
            helperText="Optional."
          />
          <View style={styles.previewShell}>
            <Text style={styles.sectionLabel}>Preview</Text>
            <Text style={styles.helper}>Make sure the update feels clean before you share it.</Text>
          </View>
          <ProgressPostCard post={previewPost} showActions={false} />
          {submitError ? (
            <ErrorState title="Check-in needs one more pass" message={submitError} />
          ) : null}
          {!canPublish ? (
            <Text style={styles.helper}>
              Manual fallback needs a workout name, duration, and active energy before
              it can publish.
            </Text>
          ) : null}
          <Button
            label="Publish check-in"
            loading={publishing}
            disabled={!canPublish}
            onPress={submit}
          />
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
    gap: theme.spacing.lg,
  },
  hero: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  heroSignalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  sequenceRail: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  sequenceStep: {
    flex: 1,
    gap: theme.spacing.xxs,
    alignItems: "center",
  },
  sequenceIconTile: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.bg.elevated,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  sequenceLabel: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    ...theme.typography.hero,
    color: theme.color.fg.primary,
  },
  subtitle: {
    ...theme.typography.body,
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
  sectionDivider: {
    height: theme.borderWidth.hairline,
    backgroundColor: theme.color.stroke.subtle,
  },
  sectionLabel: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  stack: {
    gap: theme.spacing.sm,
  },
  manualFallback: {
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.bg.surface,
    padding: theme.spacing.md,
  },
  inlineActions: {
    alignItems: "flex-start",
  },
  previewShell: {
    gap: theme.spacing.xxs,
  },
  footer: {
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
});
