import React, { useEffect, useEffectEvent, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { Badge, Button, Card, EmptyState, ErrorState, ScrollScreen, TextField } from "@/src/ui/primitives";

export function SquadChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ squadId?: string }>();
  const squadId = Array.isArray(params.squadId) ? params.squadId[0] : params.squadId;
  const {
    activeSquadChatId,
    chatLoading,
    chatOverviews,
    currentUser,
    markSquadChatRead,
    openSquadChat,
    sendSquadMessage,
    squadMessages,
    squads,
  } = useMomentumSession();
  const [message, setMessage] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const squad = useMemo(
    () => squads.find((item) => item.id === squadId),
    [squadId, squads],
  );
  const overview = useMemo(
    () => chatOverviews.find((item) => item.squadId === squadId),
    [chatOverviews, squadId],
  );
  const messages = squadId ? squadMessages[squadId] ?? [] : [];

  const syncSquadChat = useEffectEvent(async (targetSquadId: string) => {
    setRoomError(null);

    try {
      await openSquadChat(targetSquadId);
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "Unable to load squad chat.");
    }
  });

  const closeSquadChat = useEffectEvent(async (targetSquadId: string) => {
    try {
      await markSquadChatRead(targetSquadId);
    } catch {
      // Keep back navigation resilient even if the read receipt cannot sync.
    }
  });

  useEffect(() => {
    if (!squadId) return;

    void syncSquadChat(squadId);
    return () => {
      void closeSquadChat(squadId);
    };
  }, [squadId]);

  const submit = async () => {
    if (!squadId || !message.trim()) return;
    setSendError(null);

    try {
      await sendSquadMessage(squadId, message);
      setMessage("");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Unable to send message.");
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(app)/squads");
  };

  if (!squadId || !squad) {
    return (
      <ScrollScreen>
        <ErrorState
          title="Squad chat not found"
          message="This room only exists for squads you currently belong to."
          actionLabel="Back to squads"
          onRetry={() => router.replace("/(app)/squads")}
        />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{squad.name}</Text>
          <Text style={styles.subtitle}>
            Join-forward squad chat for accountability, coordination, and quick encouragement.
          </Text>
        </View>
        <Button
          label="Back"
          variant="ghost"
          fullWidth={false}
          onPress={goBack}
        />
      </View>

      <Card
        title="Live room"
        subtitle={`${squad.memberCount} members • ${overview?.unreadCount ?? 0} unread`}
      >
        <View style={styles.badges}>
          <Badge label="Text only" tone="accent" />
          <Badge label="Join-forward history" tone="neutral" />
          {activeSquadChatId === squadId ? <Badge label="Live" tone="success" /> : null}
        </View>
        <Text style={styles.helper}>
          Chat stays focused on the people and momentum in this squad right now.
        </Text>
      </Card>

      <View style={styles.messages}>
        {roomError ? (
          <ErrorState
            title="Unable to load squad chat"
            message={roomError}
            actionLabel="Back to squads"
            onRetry={() => router.replace("/(app)/squads")}
          />
        ) : null}

        {chatLoading && !messages.length && !roomError ? (
          <Card subtitle="Loading the room">
            <Text style={styles.helper}>Pulling the current squad thread from Supabase.</Text>
          </Card>
        ) : null}

        {!chatLoading && !messages.length && !roomError ? (
          <EmptyState
            title="Start the room with something honest"
            message="The first message should feel like a quick pulse, not a performance."
          />
        ) : null}

        {messages.map((item) => {
          const mine = item.authorId === currentUser.id;

          return (
            <View
              key={item.id}
              style={[styles.messageRow, mine ? styles.mineRow : styles.theirRow]}
            >
              <View
                style={[
                  styles.bubble,
                  mine ? styles.mineBubble : styles.theirBubble,
                  item.failed && styles.failedBubble,
                ]}
              >
                <Text style={styles.author}>
                  {mine ? "You" : item.authorName}
                </Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.meta}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {item.pending ? " • sending" : ""}
                  {item.failed ? " • failed" : ""}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Card title="Message">
        <View style={styles.composer}>
          <TextField
            value={message}
            onChangeText={setMessage}
            multiline
            label="Send to squad"
            helperText="Keep it short, direct, and useful."
          />
          {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
          <Button
            label="Send message"
            onPress={submit}
            disabled={!message.trim()}
          />
        </View>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
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
  helper: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  messages: {
    gap: theme.spacing.sm,
  },
  messageRow: {
    flexDirection: "row",
  },
  mineRow: {
    justifyContent: "flex-end",
  },
  theirRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
    borderWidth: theme.borderWidth.regular,
  },
  mineBubble: {
    backgroundColor: theme.color.accent.energy,
    borderColor: theme.color.accent.energy,
  },
  theirBubble: {
    backgroundColor: theme.color.bg.surface,
    borderColor: theme.color.stroke.subtle,
  },
  failedBubble: {
    borderColor: theme.color.accent.danger,
  },
  author: {
    ...theme.typography.caption,
    color: theme.color.fg.secondary,
  },
  body: {
    ...theme.typography.body,
    color: theme.color.fg.primary,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  composer: {
    gap: theme.spacing.sm,
  },
  error: {
    ...theme.typography.caption,
    color: theme.color.accent.danger,
  },
});
