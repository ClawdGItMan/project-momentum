import { rawTokens } from "./tokens";
import { typography } from "./typography";

const { color, spacing, radius, borderWidth, shadow, opacity } = rawTokens;

export const theme = {
  color: {
    bg: {
      canvas: color.zinc50,
      surface: color.white,
      elevated: "#F3F8FD",
      inverse: color.slate950,
    },
    fg: {
      primary: color.slate900,
      secondary: color.slate600,
      muted: color.slate500,
      inverse: color.white,
    },
    accent: {
      energy: color.sky600,
      consistency: color.cyan500,
      success: color.emerald500,
      warning: color.amber500,
      danger: color.rose500,
    },
    stroke: {
      subtle: color.slate200,
      strong: color.slate300,
      inverse: color.slate700,
    },
    chip: {
      bg: "#EAF6FD",
      fg: color.sky600,
    },
  },
  spacing,
  radius,
  borderWidth,
  shadow,
  opacity,
  typography,
} as const;

export type Theme = typeof theme;

