import React, { PropsWithChildren } from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import { useRouter } from "expo-router";

type HiddenDevToolsTriggerProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function HiddenDevToolsTrigger({
  children,
  style,
}: HiddenDevToolsTriggerProps) {
  const router = useRouter();

  if (!__DEV__) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Pressable
      accessible={false}
      delayLongPress={900}
      onLongPress={() => router.push("/modals/dev-tools")}
      style={style}
    >
      {children}
    </Pressable>
  );
}
