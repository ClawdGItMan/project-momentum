import React, { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/src/design";
import { Surface } from "./Surface";

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}>;

export function Card({ title, subtitle, children, style, elevated = false }: CardProps) {
  return (
    <Surface elevated={elevated} style={[styles.container, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.heading,
    color: theme.color.fg.primary,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  body: {
    gap: theme.spacing.md,
  },
});
