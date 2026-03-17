import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/design/theme";

type MetricPillProps = {
  label: string;
  value: string | number;
  unit?: string;
};

export function MetricPill({ label, value, unit }: MetricPillProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueWrap}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.bg.elevated,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 92,
    gap: 2,
  },
  label: {
    ...theme.typography.caption,
    color: theme.color.fg.secondary,
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  value: {
    ...theme.typography.metric,
    color: theme.color.fg.primary,
  },
  unit: {
    ...theme.typography.caption,
    color: theme.color.fg.muted,
  },
});

