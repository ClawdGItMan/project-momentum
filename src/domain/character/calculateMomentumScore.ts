import type { CharacterProfile, PillarRating } from "./types";
import { getTierForScore } from "./tiers";

export interface MomentumScoreInput {
  pillarRatings: PillarRating[];
  totalCheckIns: number;
  longestStreak: number;
  memberSince: string;
}

export function calculateMomentumScore(
  input: MomentumScoreInput,
): Pick<CharacterProfile, "momentumScore" | "momentumTier"> {
  const { pillarRatings } = input;

  if (pillarRatings.length === 0) {
    return { momentumScore: 0, momentumTier: "Newcomer" };
  }

  // Equal weight across all active pillars
  const pillarAverage =
    pillarRatings.reduce((sum, r) => sum + r.score, 0) / pillarRatings.length;

  // Small bonus for multi-pillar engagement (up to 5 points for all 4 pillars)
  const diversityBonus = Math.min((pillarRatings.length - 1) * 1.67, 5);

  const momentumScore = Math.round(
    Math.max(0, Math.min(100, pillarAverage + diversityBonus)),
  );
  const momentumTier = getTierForScore(momentumScore);

  return { momentumScore, momentumTier };
}
