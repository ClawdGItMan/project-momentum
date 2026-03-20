import { rawTokens } from "./tokens";
import { typography } from "./typography";

const { color, spacing, radius, borderWidth, shadow, opacity } = rawTokens;

export const theme = {
  color: {
    bg: {
      canvas: color.mineral50,
      surface: color.white,
      elevated: color.mineral100,
      inverse: color.graphite950,
    },
    fg: {
      primary: color.graphite950,
      secondary: color.graphite700,
      muted: color.graphite500,
      inverse: color.white,
    },
    accent: {
      energy: color.cobalt700,
      energySoft: color.cobalt600,
      consistency: color.steelTeal600,
      support: color.steelTeal600,
      success: color.success600,
      warning: color.warning600,
      danger: color.danger600,
      champagne: color.champagne200,
    },
    stroke: {
      subtle: color.mineral200,
      strong: color.mineral300,
      inverse: color.graphite700,
      focus: color.cobalt700,
    },
    chip: {
      bg: "#E7EEFF",
      fg: color.cobalt700,
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
