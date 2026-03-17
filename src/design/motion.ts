import { Easing } from "react-native";

export const motion = {
  duration: {
    quick: 120,
    base: 220,
    slow: 360,
  },
  easing: {
    standard: Easing.out(Easing.cubic),
    emphasized: Easing.bezier(0.2, 0.9, 0.2, 1),
    gentle: Easing.inOut(Easing.quad),
  },
  spring: {
    soft: {
      damping: 18,
      stiffness: 210,
      mass: 0.8,
    },
    snappy: {
      damping: 14,
      stiffness: 280,
      mass: 0.7,
    },
  },
} as const;

