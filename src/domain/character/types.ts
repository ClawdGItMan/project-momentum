import type { FocusPillar } from "@/src/features/app/sessionTypes";

export type MomentumTier =
  | "Newcomer"
  | "Building"
  | "Committed"
  | "Driven"
  | "Elite"
  | "Legendary";

export type AchievementCategory =
  | "consistency"
  | "fitness"
  | "mindset"
  | "learning"
  | "recovery"
  | "social";

export interface PillarRating {
  pillar: FocusPillar;
  score: number;
  tier: MomentumTier;
  breakdown: PillarBreakdown;
}

export interface PillarBreakdown {
  consistencyRate: number;
  habitCompletionRate: number;
  streakDays: number;
  checkInRate: number;
}

export interface CharacterProfile {
  momentumScore: number;
  momentumTier: MomentumTier;
  pillarRatings: PillarRating[];
  achievements: UnlockedAchievement[];
  totalCheckIns: number;
  longestStreak: number;
  memberSince: string;
}

export interface AchievementDefinition {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  threshold: number;
  thresholdUnit: string;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
}

export interface RewardCardStat {
  label: string;
  value: string;
  funComparison?: string;
}

export interface PostCheckinReward {
  headline: string;
  stats: RewardCardStat[];
  streakMessage?: string;
  newAchievements: AchievementDefinition[];
}
