import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "@/src/design/theme";

const selectedShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0px 10px 20px rgba(11, 28, 48, 0.05)" } as ViewStyle)
    : (theme.shadow.soft as ViewStyle);

type SegmentedOption<T extends string> = {
  icon?: React.ReactNode;
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
            <View style={styles.segmentContent}>
              {option.icon ? (
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                  {option.icon}
                </View>
              ) : null}
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {option.label}
              </Text>
            </View>
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
    backgroundColor: theme.color.bg.elevated,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
    minHeight: 42,
    paddingHorizontal: theme.spacing.sm,
  },
  segmentSelected: {
    backgroundColor: theme.color.bg.surface,
    ...selectedShadow,
  },
  segmentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    transform: [{ translateY: -0.5 }],
  },
  label: {
    ...theme.typography.label,
    color: theme.color.fg.secondary,
  },
  labelSelected: {
    color: theme.color.fg.primary,
  },
});
