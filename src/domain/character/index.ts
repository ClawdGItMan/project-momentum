export { calculateMomentumScore } from "./calculateMomentumScore";
export type { MomentumScoreInput } from "./calculateMomentumScore";

export { calculatePillarRating } from "./calculatePillarRating";
export type { PillarRatingInput } from "./calculatePillarRating";

export {
  achievementDefinitions,
  buildUnlockedAchievement,
  checkNewAchievements,
  getAchievementById,
  getAchievementsByCategory,
} from "./achievements";

export {
  getNextTier,
  getTierDescription,
  getTierForScore,
  getTierIndex,
  tierThresholds,
} from "./tiers";

export {
  getDominantGlow,
  getPillarTierColor,
  getTierColor,
  getTierGlowOpacity,
} from "./tierColors";
export type { TierThreshold } from "./tiers";

export {
  allMuscleGroupKeys,
  buildMuscleGroupRating,
  muscleGroupMeta,
} from "./muscleGroups";
export type { MuscleGroupKey, MuscleGroupRating } from "./muscleGroups";

export type {
  AchievementCategory,
  AchievementDefinition,
  CharacterProfile,
  MomentumTier,
  PillarBreakdown,
  PillarRating,
  PostCheckinReward,
  RewardCardStat,
  UnlockedAchievement,
} from "./types";
