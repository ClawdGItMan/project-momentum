import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design/theme";

type StatRowProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatRow({ label, value, hint }: StatRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.color.stroke.subtle,
    paddingVertical: theme.spacing.xs,
  },
  left: {
    gap: 2,
    flexShrink: 1,
    paddingRight: theme.spacing.sm,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.color.fg.secondary,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
  value: {
    ...theme.typography.metric,
    color: theme.color.fg.primary,
  },
});

