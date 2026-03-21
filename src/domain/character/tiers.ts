import type { MomentumTier } from "./types";

export interface TierThreshold {
  tier: MomentumTier;
  minScore: number;
  label: string;
  description: string;
}

export const tierThresholds: TierThreshold[] = [
  {
    tier: "Newcomer",
    minScore: 0,
    label: "Newcomer",
    description: "Just getting started. Every check-in counts.",
  },
  {
    tier: "Building",
    minScore: 20,
    label: "Building",
    description: "Momentum is forming. Keep showing up.",
  },
  {
    tier: "Committed",
    minScore: 40,
    label: "Committed",
    description: "Consistency is becoming a habit.",
  },
  {
    tier: "Driven",
    minScore: 60,
    label: "Driven",
    description: "Serious dedication. People notice.",
  },
  {
    tier: "Elite",
    minScore: 80,
    label: "Elite",
    description: "Top-tier consistency across your pillars.",
  },
  {
    tier: "Legendary",
    minScore: 95,
    label: "Legendary",
    description: "Relentless. You set the standard.",
  },
];

export function getTierForScore(score: number): MomentumTier {
  const clamped = Math.max(0, Math.min(100, score));
  let result: MomentumTier = "Newcomer";
  for (const threshold of tierThresholds) {
    if (clamped >= threshold.minScore) {
      result = threshold.tier;
    }
  }
  return result;
}

export function getTierDescription(tier: MomentumTier): string {
  const entry = tierThresholds.find((t) => t.tier === tier);
  return entry?.description ?? "";
}

export function getTierIndex(tier: MomentumTier): number {
  return tierThresholds.findIndex((t) => t.tier === tier);
}

export function getNextTier(
  currentTier: MomentumTier,
): TierThreshold | null {
  const idx = getTierIndex(currentTier);
  if (idx < 0 || idx >= tierThresholds.length - 1) return null;
  return tierThresholds[idx + 1];
}
