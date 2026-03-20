import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design";
import type { ProgressPost } from "@/src/features/app/sessionTypes";
import {
  formatMetricValue,
  formatProviderLabel,
  formatTimestamp,
} from "@/src/lib/formatters";
import { Badge, Button, Card, MetricPill } from "@/src/ui/primitives";

type ProgressPostCardProps = {
  post: ProgressPost;
  onDidThisToo?: (postId: string) => void;
  showActions?: boolean;
};

export function ProgressPostCard({
  post,
  onDidThisToo,
  showActions = true,
}: ProgressPostCardProps) {
  const audienceLabel =
    post.audience === "squad"
      ? post.squadName ?? "Squad"
      : post.audience === "only-me"
        ? "Only me"
        : "Friends";
  const visibilityCopy =
    post.audience === "squad"
      ? `Visible in ${post.squadName ?? "your squad"}.`
      : post.audience === "only-me"
        ? "Visible only to you."
        : "Visible in your trusted accountability lane.";
  const sourceProviders = Array.from(
    new Set(
      [
        post.sourceProvider,
        ...(post.sourceProviders ?? []),
        ...post.metrics.map((metric) => metric.provider),
      ].filter((provider): provider is NonNullable<typeof provider> => Boolean(provider)),
    ),
  );
  const provenanceCopy = sourceProviders.length
    ? `Source${sourceProviders.length === 1 ? "" : "s"}: ${sourceProviders
        .map((provider) => formatProviderLabel(provider))
        .join(" + ")}`
    : "Source: manual";

  return (
    <Card elevated style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{post.authorName}</Text>
          <Text style={styles.meta}>
            @{post.authorUsername} • {formatTimestamp(post.createdAt)}
          </Text>
        </View>
        <Badge
          label={audienceLabel}
          tone={post.audience === "squad" ? "accent" : "neutral"}
        />
      </View>
      <Text style={styles.caption}>{post.caption}</Text>
      {post.metrics.length ? (
        <View style={styles.metricsWrap}>
          {post.metrics.map((metric) => (
            <MetricPill
              key={`${post.id}-${metric.label}`}
              label={metric.label}
              value={formatMetricValue(metric.value)}
              unit={metric.unit}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {post.consistencyLabel} • {post.consistencyScore}
        </Text>
        <Text style={styles.footerText}>{provenanceCopy}</Text>
        {post.reactions.emojis.length ? (
          <Text style={styles.emojiRow}>{post.reactions.emojis.join(" ")}</Text>
        ) : null}
        {!showActions ? null : post.isCurrentUser ? (
          <Text style={styles.footerText}>{visibilityCopy}</Text>
        ) : (
          <View style={styles.actions}>
            <Button
              label={`${post.reactions.didThisTooByCurrentUser ? "Counted in" : "I did this too"} • ${post.reactions.didThisToo}`}
              variant="secondary"
              fullWidth={false}
              onPress={() => onDidThisToo?.(post.id)}
              disabled={!onDidThisToo}
            />
            <Button
              label={`Comments • ${post.reactions.commentCount}`}
              variant="ghost"
              fullWidth={false}
              disabled
            />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...theme.typography.label,
    color: theme.color.fg.primary,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  caption: {
    ...theme.typography.body,
    color: theme.color.fg.primary,
  },
  metricsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  footer: {
    gap: theme.spacing.sm,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.color.fg.secondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  emojiRow: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
});
