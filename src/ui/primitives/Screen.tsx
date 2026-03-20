import React, { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/src/design";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, padded = true, style }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg.canvas,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
});
