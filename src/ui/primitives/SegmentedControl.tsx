import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/src/design/theme";

const selectedShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0px 8px 18px rgba(11, 18, 32, 0.12)" } as ViewStyle)
    : (theme.shadow.soft as ViewStyle);

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth.regular,
    borderColor: theme.color.stroke.subtle,
    backgroundColor: theme.color.bg.surface,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
    minHeight: 36,
  },
  segmentSelected: {
    backgroundColor: theme.color.bg.elevated,
    ...selectedShadow,
  },
  label: {
    ...theme.typography.label,
    color: theme.color.fg.secondary,
  },
  labelSelected: {
    color: theme.color.fg.primary,
  },
});
