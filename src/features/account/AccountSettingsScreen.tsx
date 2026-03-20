import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { ManagedIntegrationProvider } from "@/src/domain/models";
import { theme } from "@/src/design";
import { managedProviders } from "@/src/lib/providers";
import {
  formatConnectionState,
  formatCoverageReason,
  formatMetricLabel,
  formatProviderLabel,
  formatTimestamp,
} from "@/src/lib/formatters";
import { getSnapshotFlags } from "@/src/lib/providers";
import type {
  ProviderConnectionMap,
  ProviderSnapshotMap,
  Squad,
  SquadMemberSummary,
  UserProfile,
} from "@/src/features/app/sessionTypes";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  MetricPill,
  ScrollScreen,
  StatRow,
  TextField,
} from "@/src/ui/primitives";

type AccountSettingsScreenProps = {
  currentUser: UserProfile;
  squads: Squad[];
  providerConnections: ProviderConnectionMap;
  providerSnapshots: ProviderSnapshotMap;
  healthLoading: boolean;
  healthPreviewActive: boolean;
  manualFallbackEnabled: boolean;
  ownershipLoading: boolean;
  ownershipError: string | null;
  transferCandidatesBySquad: Record<string, SquadMemberSummary[]>;
  onConnectProvider: (provider: ManagedIntegrationProvider) => Promise<void>;
  onRefreshProvider: (provider: ManagedIntegrationProvider) => Promise<void>;
  onDisconnectProvider: (
    provider: Exclude<ManagedIntegrationProvider, "apple-health">,
  ) => Promise<void>;
  onRetryOwnershipLoad: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onTransferSquadOwnership: (squadId: string, newOwnerId: string) => Promise<void>;
};

function providerTone(state: ProviderConnectionMap[ManagedIntegrationProvider]["state"]) {
  switch (state) {
    case "connected":
      return "success" as const;
    case "connected_limited":
    case "needs_attention":
    case "syncing":
    case "authorizing":
      return "warning" as const;
    case "error":
    case "unavailable":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function providerActionLabel(
  provider: ManagedIntegrationProvider,
  state: ProviderConnectionMap[ManagedIntegrationProvider]["state"],
  hasError: boolean,
) {
  const label = formatProviderLabel(provider);

  if (provider === "apple-health") {
    if (state === "connected" || state === "connected_limited") {
      return `Refresh ${label}`;
    }

    return hasError || state === "needs_attention" || state === "error"
      ? `Reconnect ${label}`
      : `Connect ${label}`;
  }

  return state === "connected" || state === "connected_limited" || state === "syncing"
    ? `Refresh ${label}`
    : hasError || state === "needs_attention" || state === "error"
      ? `Reconnect ${label}`
      : `Connect ${label}`;
}

function providerDescription(provider: ManagedIntegrationProvider) {
  switch (provider) {
    case "apple-health":
      return "Default workout source. Reads workouts, steps, sleep, and active energy from HealthKit on this device.";
    case "strava":
      return "Adapter-ready workout provider for distance and duration once the server-side OAuth flow is live.";
    case "whoop":
      return "Recovery-first provider for recovery score, strain, and sleep once the server-side OAuth flow is live.";
  }
}

function providerCoverageHint(provider: ManagedIntegrationProvider) {
  switch (provider) {
    case "apple-health":
      return "Apple Health stays the default source when multiple providers have workout coverage.";
    case "strava":
      return "Workout auto-order prefers Apple Health, then Strava, then WHOOP.";
    case "whoop":
      return "Recovery auto-order prefers WHOOP first, then Apple Health.";
  }
}

export function AccountSettingsScreen({
  currentUser,
  squads,
  providerConnections,
  providerSnapshots,
  healthLoading,
  healthPreviewActive,
  manualFallbackEnabled,
  ownershipLoading,
  ownershipError,
  transferCandidatesBySquad,
  onConnectProvider,
  onRefreshProvider,
  onDisconnectProvider,
  onRetryOwnershipLoad,
  onSignOut,
  onDeleteAccount,
  onTransferSquadOwnership,
}: AccountSettingsScreenProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [errorScope, setErrorScope] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const ownedSquads = useMemo(
    () => squads.filter((squad) => squad.ownerId === currentUser.id),
    [currentUser.id, squads],
  );
  const ownershipReady =
    ownedSquads.length === 0 ||
    ownedSquads.every((squad) => squad.id in transferCandidatesBySquad);
  const blockingSquads = ownedSquads.filter(
    (squad) => (transferCandidatesBySquad[squad.id] ?? []).length > 0,
  );

  const runAction = async (
    busyScope: string,
    fn: () => Promise<void>,
    errorDisplayScope = busyScope,
  ) => {
    setBusyAction(busyScope);
    setActionError(null);
    setErrorScope(null);
    try {
      await fn();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Something needs attention.");
      setErrorScope(errorDisplayScope);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <ScrollScreen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Badge label="Private settings" tone="accent" />
          <Text style={styles.title}>Account settings</Text>
          <Text style={styles.body}>
            Manage providers, review squad ownership, and control the account lifecycle
            without replaying onboarding.
          </Text>
        </View>
        <Button
          label="Back to profile"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.back()}
        />
      </View>

      {managedProviders.map((provider) => {
        const connection = providerConnections[provider];
        const snapshot = providerSnapshots[provider] ?? null;
        const flags = getSnapshotFlags(connection, snapshot, {
          preview: provider === "apple-health" && healthPreviewActive,
        });
        const latestSummaryHint = snapshot?.capturedAt
          ? !snapshot.id
            ? `Latest ${formatProviderLabel(provider)} read is only on this device until save succeeds`
            : connection.lastError
              ? `Historical ${formatProviderLabel(provider)} summary saved before the latest failed refresh`
              : !flags.isFresh
                ? `${formatProviderLabel(provider)} summary is older than the current live freshness window`
                : "Latest saved summary"
          : "No saved summary yet";

        return (
          <Card
            key={provider}
            title={formatProviderLabel(provider)}
            subtitle={providerDescription(provider)}
          >
            {actionError && errorScope === provider ? (
              <ErrorState
                title={`${formatProviderLabel(provider)} needs attention`}
                message={actionError}
              />
            ) : null}

            <View style={styles.row}>
              <Badge
                label={formatConnectionState(connection.state)}
                tone={providerTone(connection.state)}
              />
              {provider === "apple-health" ? (
                <Badge label="Default" tone="accent" />
              ) : null}
              {flags.showHistoricalSummary ? (
                <Badge label="Historical summary" tone="warning" />
              ) : null}
              {flags.showUnsavedSummary ? <Badge label="Local summary" tone="accent" /> : null}
              {provider === "apple-health" && manualFallbackEnabled ? (
                <Badge label="Manual fallback active" tone="warning" />
              ) : null}
            </View>

            <Text style={styles.body}>
              {flags.showUnsavedSummary
                ? `${formatProviderLabel(provider)} returned fresh data on this device, but the latest save still needs a retry.`
                : flags.showHistoricalSummary && !connection.lastError
                  ? `Your last saved ${formatProviderLabel(provider)} summary is older than the live freshness window. Refresh to pull a newer one.`
                  : connection.lastError
                    ? connection.lastError
                    : providerCoverageHint(provider)}
            </Text>

            <View style={styles.stack}>
              <StatRow
                label="Latest saved summary"
                value={snapshot?.capturedAt ? formatTimestamp(snapshot.capturedAt) : "None yet"}
                hint={latestSummaryHint}
              />
              <StatRow
                label="Latest sync"
                value={connection.lastSyncAt ? formatTimestamp(connection.lastSyncAt) : "Not synced yet"}
                hint={connection.lastError ? "Latest refresh failed" : "Use refresh when you want the newest state"}
              />
            </View>

            {(snapshot?.metrics ?? []).length ? (
              <View style={styles.metricsWrap}>
                {(snapshot?.metrics ?? []).map((metric) => (
                  <MetricPill
                    key={`${provider}-${metric.key}`}
                    label={formatMetricLabel(metric.key)}
                    value={String(metric.value ?? 0)}
                    unit={metric.unit}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                title={`No ${formatProviderLabel(provider)} summary yet`}
                message={`Connect ${formatProviderLabel(provider)} here to create the first saved summary for this account.`}
              />
            )}

            {flags.showHistoricalSummary ? (
              <Text style={styles.helper}>
                These metrics are from the last saved {formatProviderLabel(provider)} summary, not
                the latest refresh attempt.
              </Text>
            ) : flags.showUnsavedSummary ? (
              <Text style={styles.helper}>
                These metrics came from the latest {formatProviderLabel(provider)} read on this
                device and have not been saved to the backend yet.
              </Text>
            ) : null}

            <View style={styles.stack}>
              <Text style={styles.sectionLabel}>Coverage summary</Text>
              <View style={styles.list}>
                {connection.coverage.map((item) => (
                  <StatRow
                    key={`${provider}-${item.key}`}
                    label={formatMetricLabel(item.key)}
                    value={item.available ? "Available" : "Missing"}
                    hint={
                      item.available
                        ? "Ready when this provider is selected"
                        : formatCoverageReason(item.reason)
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              {(() => {
                const useRefreshAction =
                  provider === "apple-health"
                    ? connection.state === "connected" ||
                      connection.state === "connected_limited"
                    : connection.state === "connected" ||
                      connection.state === "connected_limited" ||
                      connection.state === "syncing";
                const primaryAction = useRefreshAction ? onRefreshProvider : onConnectProvider;

                return (
              <Button
                label={providerActionLabel(provider, connection.state, Boolean(connection.lastError))}
                loading={
                  provider === "apple-health"
                    ? healthLoading || busyAction === provider
                    : busyAction === provider
                }
                onPress={() => void runAction(provider, async () => primaryAction(provider))}
              />
                );
              })()}
              {provider !== "apple-health" &&
              connection.state !== "disconnected" &&
              connection.state !== "unavailable" ? (
                <Button
                  label="Disconnect"
                  variant="ghost"
                  loading={busyAction === `${provider}:disconnect`}
                  onPress={() =>
                    void runAction(`${provider}:disconnect`, async () =>
                      onDisconnectProvider(provider),
                      provider,
                    )
                  }
                />
              ) : null}
            </View>

            <Text style={styles.helper}>
              {provider === "apple-health"
                ? "Apple Health is still the default source. Old summaries stay labeled as historical instead of live current data."
                : "Remote provider OAuth is staged through the backend. Until the server flow is live, connect attempts should fail honestly instead of faking a connection."}
            </Text>
          </Card>
        );
      })}

      <Card
        title="Squad ownership"
        subtitle="Deleting an account is blocked while this user still owns a squad with other active members."
      >
        {ownershipError ? (
          <ErrorState
            title="Could not load ownership blockers"
            message={ownershipError}
            onRetry={() => void onRetryOwnershipLoad()}
          />
        ) : null}
        {actionError && errorScope === "ownership" ? (
          <ErrorState title="Ownership transfer failed" message={actionError} />
        ) : null}
        {!ownershipError && (ownershipLoading || !ownershipReady) ? (
          <Text style={styles.helper}>
            Loading active squad members so deletion rules stay accurate.
          </Text>
        ) : null}

        <View style={styles.list}>
          {ownedSquads.length ? (
            ownedSquads.map((squad) => {
              const transferCandidates = transferCandidatesBySquad[squad.id] ?? [];
              const requiresTransfer = !ownershipReady || transferCandidates.length > 0;

              return (
                <View key={squad.id} style={styles.squadCard}>
                  <View style={styles.row}>
                    <View style={styles.copy}>
                      <Text style={styles.rowTitle}>{squad.name}</Text>
                      <Text style={styles.rowSubtitle}>@{squad.handle}</Text>
                    </View>
                    <Badge
                      label={requiresTransfer ? "Transfer required" : "Solo-owned"}
                      tone={requiresTransfer ? "warning" : "accent"}
                    />
                  </View>
                  <Text style={styles.helper}>
                    {requiresTransfer
                      ? "Choose another active member to keep the squad and its chat alive."
                      : "This squad can leave with the account because no other active members remain."}
                  </Text>

                  {transferCandidates.length ? (
                    <View style={styles.transferList}>
                      {transferCandidates.map((candidate) => {
                        const actionKey = `transfer-${squad.id}-${candidate.userId}`;

                        return (
                          <View key={candidate.id} style={styles.transferCard}>
                            <View style={styles.copy}>
                              <Text style={styles.rowTitle}>{candidate.displayName}</Text>
                              <Text style={styles.rowSubtitle}>@{candidate.username}</Text>
                            </View>
                            <Button
                              label="Transfer"
                              fullWidth={false}
                              variant="secondary"
                              loading={busyAction === actionKey}
                              onPress={() =>
                                void runAction(actionKey, async () =>
                                  onTransferSquadOwnership(squad.id, candidate.userId),
                                  "ownership",
                                )
                              }
                            />
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <EmptyState
              title="No owned squads"
              message="This account is free to delete once you confirm the action."
            />
          )}
        </View>
      </Card>

      <Card title="Session" subtitle="Keep the account boundary explicit while testing across devices.">
        {actionError && errorScope === "session" ? (
          <ErrorState title="Sign out failed" message={actionError} />
        ) : null}
        <Button
          label="Sign out"
          variant="secondary"
          loading={busyAction === "session"}
          onPress={() => void runAction("session", onSignOut)}
        />
      </Card>

      <Card
        title="Delete account"
        subtitle="Permanent. This removes the account, private social graph, and saved summaries that belong to it."
      >
        {actionError && errorScope === "delete" ? (
          <ErrorState title="Delete account failed" message={actionError} />
        ) : null}

        {!showDeleteFlow ? (
          <View style={styles.stack}>
            <Text style={styles.helper}>
              If this user still owns a squad with other active members, transfer ownership first.
            </Text>
            <Button
              label="Start delete flow"
              variant="ghost"
              onPress={() => setShowDeleteFlow(true)}
              disabled={Boolean(blockingSquads.length)}
            />
          </View>
        ) : (
          <View style={styles.stack}>
            <Text style={styles.body}>
              This is permanent. Type <Text style={styles.deleteToken}>DELETE</Text> to confirm.
            </Text>
            {blockingSquads.length ? (
              <Text style={styles.helper}>
                Transfer these squads first:{" "}
                {blockingSquads.map((squad) => squad.name).join(", ")}.
              </Text>
            ) : null}
            <TextField
              label="Confirmation"
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              helperText="This action cannot be undone."
            />
            <View style={styles.actions}>
              <Button
                label="Cancel"
                fullWidth={false}
                variant="secondary"
                onPress={() => {
                  setShowDeleteFlow(false);
                  setConfirmText("");
                }}
              />
              <Button
                label="Delete permanently"
                fullWidth={false}
                loading={busyAction === "delete"}
                disabled={confirmText.trim().toUpperCase() !== "DELETE" || Boolean(blockingSquads.length)}
                onPress={() => void runAction("delete", onDeleteAccount)}
              />
            </View>
          </View>
        )}
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
  },
  hero: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  body: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    alignItems: "center",
  },
  stack: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.color.fg.primary,
  },
  list: {
    gap: theme.spacing.sm,
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
  actions: {
    gap: theme.spacing.sm,
  },
  squadCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.elevated,
  },
  transferList: {
    gap: theme.spacing.xs,
  },
  transferCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
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
  deleteToken: {
    color: theme.color.accent.danger,
    fontWeight: "700",
  },
});
