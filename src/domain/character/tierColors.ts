import { rawTokens } from "@/src/design/tokens";
import type { MomentumTier, PillarRating } from "./types";

const tierColorMap: Record<MomentumTier, string> = {
  Newcomer: rawTokens.color.graphite500,
  Building: rawTokens.color.steelTeal600,
  Committed: rawTokens.color.cobalt600,
  Driven: rawTokens.color.cobalt700,
  Elite: rawTokens.color.success600,
  Legendary: rawTokens.color.champagne200,
};

const tierGlowOpacity: Record<MomentumTier, number> = {
  Newcomer: 0,
  Building: 0,
  Committed: 0.08,
  Driven: 0.12,
  Elite: 0.18,
  Legendary: 0.25,
};

export function getTierColor(tier: MomentumTier): string {
  return tierColorMap[tier];
}

export function getPillarTierColor(rating: PillarRating): string {
  return tierColorMap[rating.tier];
}

export function getTierGlowOpacity(tier: MomentumTier): number {
  return tierGlowOpacity[tier];
}

export function getDominantGlow(ratings: PillarRating[]): {
  color: string;
  opacity: number;
} {
  if (ratings.length === 0) {
    return { color: rawTokens.color.graphite500, opacity: 0 };
  }
  const best = ratings.reduce((top, r) => (r.score > top.score ? r : top));
  return {
    color: getTierColor(best.tier),
    opacity: getTierGlowOpacity(best.tier),
  };
}
