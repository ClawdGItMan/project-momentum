import React, { useCallback, useEffect, useMemo, useState } from "react";

import { fetchSquadMembers } from "@/src/data/repositories/appRepository";
import { AccountSettingsScreen } from "@/src/features/account/AccountSettingsScreen";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import type { SquadMemberSummary } from "@/src/features/app/sessionTypes";

export default function AccountRoute() {
  const {
    connectProvider,
    currentUser,
    deleteAccount,
    disconnectProvider,
    healthLoading,
    healthPreviewActive,
    manualFallbackEnabled,
    providerConnections,
    providerSnapshots,
    refreshProvider,
    signOut,
    squads,
    transferSquadOwnership,
  } = useMomentumSession();

  const [ownershipLoading, setOwnershipLoading] = useState(false);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);
  const [transferCandidatesBySquad, setTransferCandidatesBySquad] = useState<
    Record<string, SquadMemberSummary[]>
  >({});

  const ownedSquads = useMemo(
    () => squads.filter((squad) => squad.ownerId === currentUser.id),
    [currentUser.id, squads],
  );

  const loadTransferCandidates = useCallback(async () => {
    if (!ownedSquads.length || !currentUser.id) {
      setTransferCandidatesBySquad({});
      setOwnershipError(null);
      setOwnershipLoading(false);
      return;
    }

    setOwnershipLoading(true);
    setOwnershipError(null);
    setTransferCandidatesBySquad({});

    try {
      const entries = await Promise.all(
        ownedSquads.map(async (squad) => {
          const members = await fetchSquadMembers(squad.id);
          return [
            squad.id,
            members.filter((member) => !member.isCurrentUser),
          ] as const;
        }),
      );

      setTransferCandidatesBySquad(Object.fromEntries(entries));
    } catch (error) {
      setOwnershipError(
        error instanceof Error
          ? error.message
          : "Unable to load squad transfer options right now.",
      );
    } finally {
      setOwnershipLoading(false);
    }
  }, [currentUser.id, ownedSquads]);

  useEffect(() => {
    void loadTransferCandidates();
  }, [loadTransferCandidates]);

  return (
    <AccountSettingsScreen
      currentUser={currentUser}
      squads={squads}
      providerConnections={providerConnections}
      providerSnapshots={providerSnapshots}
      healthLoading={healthLoading}
      healthPreviewActive={healthPreviewActive}
      manualFallbackEnabled={manualFallbackEnabled}
      ownershipLoading={ownershipLoading}
      ownershipError={ownershipError}
      transferCandidatesBySquad={transferCandidatesBySquad}
      onConnectProvider={async (provider) => {
        await connectProvider(provider);
      }}
      onRefreshProvider={async (provider) => {
        await refreshProvider(provider);
      }}
      onDisconnectProvider={async (provider) => {
        await disconnectProvider(provider);
      }}
      onRetryOwnershipLoad={async () => {
        await loadTransferCandidates();
      }}
      onSignOut={async () => {
        await signOut();
      }}
      onDeleteAccount={async () => {
        await deleteAccount();
      }}
      onTransferSquadOwnership={async (squadId, newOwnerId) => {
        await transferSquadOwnership(squadId, newOwnerId);
      }}
    />
  );
}
