import React, { PropsWithChildren } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { theme } from "@/src/design";

type SurfaceProps = PropsWithChildren<{
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Surface({ children, elevated = false, style }: SurfaceProps) {
  return (
    <View style={[styles.base, elevated ? styles.elevated : styles.flat, style]}>
      {children}
    </View>
  );
}

const elevatedShadow =
  Platform.OS === "web"
    ? ({ boxShadow: "0px 12px 28px rgba(11, 28, 48, 0.06)" } as ViewStyle)
    : (theme.shadow.soft as ViewStyle);

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.stroke.subtle,
  },
  flat: {
    backgroundColor: theme.color.bg.surface,
  },
  elevated: {
    backgroundColor: theme.color.bg.elevated,
    ...elevatedShadow,
  },
});
