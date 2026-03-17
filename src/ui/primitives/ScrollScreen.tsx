import React, { PropsWithChildren } from "react";
import {
  SafeAreaView,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

import { theme } from "@/src/design";

type ScrollScreenProps = PropsWithChildren<{
  padded?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
}>;

export function ScrollScreen({
  children,
  padded = true,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
}: ScrollScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          padded && styles.padded,
          contentContainerStyle,
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg.canvas,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },
  padded: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
});
