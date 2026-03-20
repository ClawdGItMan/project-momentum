import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { HiddenDevToolsTrigger } from "@/src/features/dev/HiddenDevToolsTrigger";
import { Badge, Button, Card, EmptyState, ScrollScreen, TextField } from "@/src/ui/primitives";

export function SquadsScreen() {
  const router = useRouter();
  const {
    acceptInvite,
    chatOverviews,
    createSquad,
    createSquadInviteToken,
    currentUser,
    friends,
    sendFriendInvite,
    setSelectedSquad,
    squads,
  } = useMomentumSession();

  const [friendUsername, setFriendUsername] = useState("");
  const [friendMessage, setFriendMessage] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [squadName, setSquadName] = useState("");
  const [squadHandle, setSquadHandle] = useState("");
  const [squadFocus, setSquadFocus] = useState("");
  const [squadDescription, setSquadDescription] = useState("");
  const [inviteSquadId, setInviteSquadId] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const ownedSquads = squads.filter((squad) => squad.ownerId === currentUser.id);
  const inviteSquad =
    ownedSquads.find((squad) => squad.id === inviteSquadId) ?? ownedSquads[0] ?? null;

  useEffect(() => {
    if (!ownedSquads.length) {
      if (inviteSquadId) {
        setInviteSquadId(null);
      }
      return;
    }

    if (!inviteSquadId || !ownedSquads.some((squad) => squad.id === inviteSquadId)) {
      setInviteSquadId(ownedSquads[0].id);
    }
  }, [inviteSquadId, ownedSquads]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setSubmittingKey(key);
    setActionError(null);
    setActionNotice(null);

    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to complete that action.");
    } finally {
      setSubmittingKey(null);
    }
  };

  const submitFriendInvite = async () => {
    const username = friendUsername.trim().replace(/^@/, "");
    if (!username) {
      setActionError("Enter the exact username you want to invite.");
      return;
    }

    await runAction("friend-invite", async () => {
      const result = await sendFriendInvite(username, friendMessage);
      setFriendUsername("");
      setFriendMessage("");
      setActionNotice(`Invite sent to @${username}. Share this token: ${result.inviteToken}`);
    });
  };

  const submitCreateSquad = async () => {
    if (!squadName.trim() || !squadHandle.trim()) {
      setActionError("Squad name and handle are required.");
      return;
    }

    await runAction("create-squad", async () => {
      const result = await createSquad({
        name: squadName.trim(),
        handle: squadHandle.trim().replace(/^@/, ""),
        currentFocus: squadFocus.trim(),
        description: squadDescription.trim(),
      });
      setSquadName("");
      setSquadHandle("");
      setSquadFocus("");
      setSquadDescription("");
      setInviteSquadId(result.squadId);
      setActionNotice(
        `Squad created. Invite your friends below or share this open token: ${result.inviteToken}`,
      );
    });
  };

  const submitAcceptInvite = async (kind: "friend" | "squad") => {
    if (!inviteToken.trim()) {
      setActionError("Paste a valid invite token first.");
      return;
    }

    await runAction(`accept-${kind}`, async () => {
      await acceptInvite({ kind, token: inviteToken.trim() });
      setInviteToken("");
      setActionNotice(
        kind === "friend"
          ? "Friend invite accepted."
          : "Squad invite accepted and added to your account.",
      );
    });
  };

  const submitSquadFriendInvite = async (friendId: string, friendName: string, username: string) => {
    if (!inviteSquad) {
      setActionError("Create or select a squad you own before inviting friends.");
      return;
    }

    await runAction(`invite-friend-${inviteSquad.id}-${friendId}`, async () => {
      const result = await createSquadInviteToken(inviteSquad.id, friendId);
      setActionNotice(
        `${friendName} can join ${inviteSquad.name}. Share this token with @${username}: ${result.inviteToken}`,
      );
    });
  };

  const submitOpenSquadInvite = async () => {
    if (!inviteSquad) {
      setActionError("Create or select a squad you own before generating an invite.");
      return;
    }

    await runAction(`open-invite-${inviteSquad.id}`, async () => {
      const result = await createSquadInviteToken(inviteSquad.id);
      setActionNotice(`${inviteSquad.name} invite token: ${result.inviteToken}`);
    });
  };

  return (
    <ScrollScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.container}>
        <HiddenDevToolsTrigger>
          <View style={styles.titleStack}>
            <Text style={styles.title}>Squads</Text>
            <Text style={styles.pageIntro}>
              Pick the room you want to show up with, jump into chat, and keep invites moving
              without leaving this space.
            </Text>
          </View>
        </HiddenDevToolsTrigger>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        {actionNotice ? <Text style={styles.notice}>{actionNotice}</Text> : null}

        <Card
          title="Your squads"
          subtitle="Private groups keep accountability focused, supportive, and low-noise."
        >
          <View style={styles.list}>
            {squads.length ? (
              squads.map((squad) => {
                const overview = chatOverviews.find((item) => item.squadId === squad.id);
                const isOwnedByCurrentUser = squad.ownerId === currentUser.id;

                return (
                  <View key={squad.id} style={styles.row}>
                    <View style={styles.copy}>
                      <Text style={styles.rowTitle}>{squad.name}</Text>
                      <Text style={styles.rowSubtitle}>
                        @{squad.handle} • {squad.memberCount} people
                      </Text>
                      <View style={styles.metaRow}>
                        {isOwnedByCurrentUser ? <Badge label="Yours" tone="accent" /> : null}
                        {currentUser.selectedSquadId === squad.id ? (
                          <Badge label="Selected" tone="accent" />
                        ) : null}
                        {(overview?.unreadCount ?? 0) > 0 ? (
                          <Badge label={`${overview?.unreadCount ?? 0} unread`} tone="warning" />
                        ) : null}
                      </View>
                      {squad.currentFocus ? (
                        <Text style={styles.chatPreview}>Focus: {squad.currentFocus}</Text>
                      ) : null}
                      {overview?.lastMessagePreview ? (
                        <Text style={styles.chatPreview}>{overview.lastMessagePreview}</Text>
                      ) : (
                        <Text style={styles.chatPreview}>No squad chat messages yet.</Text>
                      )}
                    </View>
                    <View style={styles.badgeColumn}>
                      <Button
                        label="Chat"
                        fullWidth={false}
                        variant="ghost"
                        onPress={() =>
                          router.push({
                            pathname: "/(app)/squads/[squadId]" as never,
                            params: { squadId: squad.id },
                          })
                        }
                      />
                      {isOwnedByCurrentUser ? (
                        <Button
                          label={inviteSquad?.id === squad.id ? "Inviting" : "Invite friends"}
                          fullWidth={false}
                          variant={inviteSquad?.id === squad.id ? "secondary" : "ghost"}
                          onPress={() => setInviteSquadId(squad.id)}
                        />
                      ) : null}
                      {currentUser.selectedSquadId !== squad.id ? (
                        <Button
                          label="Select"
                          fullWidth={false}
                          variant="secondary"
                          onPress={() => void setSelectedSquad(squad.id)}
                        />
                      ) : null}
                    </View>
                  </View>
                );
              })
            ) : (
              <EmptyState
                title="No squads yet"
                message="Create the first private accountability room here, then use squad audience posts and live chat."
              />
            )}
          </View>
        </Card>

        <Card
          title="Create your own squad"
          subtitle="Start the room, set the focus, and bring in the friends you want doing the work with you."
        >
          <View style={styles.stack}>
            <TextField
              label="Squad name"
              value={squadName}
              onChangeText={setSquadName}
            />
            <TextField
              label="Handle"
              value={squadHandle}
              onChangeText={setSquadHandle}
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Use a simple internal handle like morning-run-club."
            />
            <TextField
              label="Current focus"
              value={squadFocus}
              onChangeText={setSquadFocus}
              helperText="Example: Four workouts before Sunday."
            />
            <TextField
              label="Description"
              value={squadDescription}
              onChangeText={setSquadDescription}
              multiline
            />
            <Button
              label="Create squad"
              disabled={!squadName.trim() || !squadHandle.trim()}
              loading={submittingKey === "create-squad"}
              onPress={() => void submitCreateSquad()}
            />
          </View>
        </Card>

        {inviteSquad ? (
          <Card
            title={`Invite friends to ${inviteSquad.name}`}
            subtitle="Keep the room intentional: invite people already in your private loop or create one open token when you need it."
          >
            <View style={styles.stack}>
              <View style={styles.actions}>
                <Badge label={`@${inviteSquad.handle}`} tone="neutral" />
                <Badge
                  label={
                    inviteSquad.memberCount === 1
                      ? "Just you so far"
                      : `${inviteSquad.memberCount} members`
                  }
                  tone="accent"
                />
              </View>
              {inviteSquad.currentFocus ? (
                <Text style={styles.helper}>Current focus: {inviteSquad.currentFocus}</Text>
              ) : null}
              {friends.length ? (
                <View style={styles.list}>
                  {friends.map((friend) => (
                    <View key={friend.id} style={styles.row}>
                      <View style={styles.copy}>
                        <Text style={styles.rowTitle}>{friend.name}</Text>
                        <Text style={styles.rowSubtitle}>@{friend.username}</Text>
                        <Text style={styles.chatPreview}>{friend.streakLabel}</Text>
                      </View>
                      <Button
                        label="Invite to squad"
                        fullWidth={false}
                        variant="secondary"
                        loading={submittingKey === `invite-friend-${inviteSquad.id}-${friend.id}`}
                        onPress={() =>
                          void submitSquadFriendInvite(friend.id, friend.name, friend.username)
                        }
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="No friends ready to invite yet"
                  message="Send or accept a friend invite first, then bring that person into your squad."
                />
              )}
              <Button
                label="Create open invite token"
                variant="ghost"
                loading={submittingKey === `open-invite-${inviteSquad.id}`}
                onPress={() => void submitOpenSquadInvite()}
              />
            </View>
          </Card>
        ) : null}

        <Card
          title="Accept an invite"
          subtitle="Paste the code for a friend invite or a squad invite."
        >
          <View style={styles.stack}>
            <TextField
              label="Invite token"
              value={inviteToken}
              onChangeText={setInviteToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.actions}>
              <Button
                label="Accept friend invite"
                fullWidth={false}
                variant="secondary"
                disabled={!inviteToken.trim()}
                loading={submittingKey === "accept-friend"}
                onPress={() => void submitAcceptInvite("friend")}
              />
              <Button
                label="Accept squad invite"
                fullWidth={false}
                disabled={!inviteToken.trim()}
                loading={submittingKey === "accept-squad"}
                onPress={() => void submitAcceptInvite("squad")}
              />
            </View>
          </View>
        </Card>

        <Card
          title="Invite a friend"
          subtitle="Use the exact username to keep your private circle intentional."
        >
          <View style={styles.stack}>
            <TextField
              label="Username"
              value={friendUsername}
              onChangeText={setFriendUsername}
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Ask for the handle they use in Outtcast."
            />
            <TextField
              label="Optional message"
              value={friendMessage}
              onChangeText={setFriendMessage}
              multiline
              helperText="Short context helps the invite feel intentional."
            />
            <Button
              label="Send friend invite"
              disabled={!friendUsername.trim()}
              loading={submittingKey === "friend-invite"}
              onPress={() => void submitFriendInvite()}
            />
          </View>
        </Card>

        <Card
          title="Friends in your circle"
          subtitle="Mutual acceptance only. No followers and no public profile browsing."
        >
          <View style={styles.list}>
            {friends.length ? (
              friends.map((friend) => (
                <View key={friend.id} style={styles.row}>
                  <View style={styles.copy}>
                    <Text style={styles.rowTitle}>{friend.name}</Text>
                    <Text style={styles.rowSubtitle}>@{friend.username}</Text>
                  </View>
                  <Text style={styles.pulse}>{friend.streakLabel}</Text>
                </View>
              ))
            ) : (
              <EmptyState
                title="No friends connected yet"
                message="Send an exact-username invite or accept one to unlock your private friends lane."
              />
            )}
          </View>
        </Card>

        <Card
          title="Account and health settings"
          subtitle="Provider management moved into the private account hub so existing users can reconnect without replaying setup."
        >
          <View style={styles.stack}>
            <Text style={styles.helper}>
              Use account settings to connect or refresh Apple Health, Strava, or WHOOP, review
              the latest saved summaries, and manage sign-out or deletion safely.
            </Text>
            <Button
              label="Open account settings"
              fullWidth={false}
              variant="secondary"
              onPress={() => router.push("/(app)/account")}
            />
          </View>
        </Card>
      </View>
    </ScrollScreen>
  );
}

export const ConnectionsScreen = SquadsScreen;

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  container: {
    gap: theme.spacing.md,
  },
  titleStack: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title,
    color: theme.color.fg.primary,
  },
  pageIntro: {
    ...theme.typography.body,
    color: theme.color.fg.muted,
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
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
  badgeColumn: {
    gap: theme.spacing.xs,
    alignItems: "flex-end",
  },
  chatPreview: {
    ...theme.typography.caption,
    color: theme.color.fg.secondary,
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
  stack: {
    gap: theme.spacing.sm,
  },
  error: {
    ...theme.typography.caption,
    color: theme.color.accent.danger,
  },
  notice: {
    ...theme.typography.caption,
    color: theme.color.accent.success,
  },
});
