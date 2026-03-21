import type { FocusPillar } from "@/src/features/app/sessionTypes";
import type { ConsistencyResult } from "@/src/domain/consistency/types";
import type { PillarBreakdown, PillarRating } from "./types";
import { getTierForScore } from "./tiers";

export interface PillarRatingInput {
  pillar: FocusPillar;
  consistency: ConsistencyResult;
  habitCompletionRate: number;
  streakDays: number;
  checkInRate: number;
}

export function calculatePillarRating(
  input: PillarRatingInput,
): PillarRating {
  const { pillar, consistency, habitCompletionRate, streakDays, checkInRate } =
    input;

  const consistencyRate = consistency.score / 100;

  // Weighted blend: consistency 40%, habits 30%, streak bonus 20%, check-in rate 10%
  const streakBonus = Math.min(streakDays / 30, 1);
  const rawScore =
    consistencyRate * 0.4 +
    habitCompletionRate * 0.3 +
    streakBonus * 0.2 +
    checkInRate * 0.1;

  const score = Math.round(Math.max(0, Math.min(100, rawScore * 100)));
  const tier = getTierForScore(score);

  const breakdown: PillarBreakdown = {
    consistencyRate,
    habitCompletionRate,
    streakDays,
    checkInRate,
  };

  return { pillar, score, tier, breakdown };
}
