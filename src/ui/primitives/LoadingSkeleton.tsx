import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { motion } from "@/src/design/motion";
import { theme } from "@/src/design/theme";

type LoadingSkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function LoadingSkeleton({
  width = "100%",
  height = 16,
  radius = theme.radius.sm,
  style,
}: LoadingSkeletonProps) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.92,
          duration: motion.duration.base,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: motion.duration.slow,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.color.stroke.subtle,
  },
});

