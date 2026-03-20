import React, { PropsWithChildren } from "react";
import {
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
});
