import { Easing } from "react-native";

export const motion = {
  duration: {
    quick: 160,
    base: 240,
    slow: 320,
  },
  easing: {
    standard: Easing.bezier(0.2, 1, 0.3, 1),
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
