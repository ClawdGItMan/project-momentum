import { calculateMomentumScore } from "@/src/domain/character/calculateMomentumScore";
import { calculatePillarRating } from "@/src/domain/character/calculatePillarRating";
import type { CharacterProfile, UnlockedAchievement } from "@/src/domain/character/types";
import type { FocusPillar } from "@/src/features/app/sessionTypes";
import { consistencySeed } from "./appSeed";

const seededPillars: FocusPillar[] = ["fitness", "recovery"];

const seededPillarInputs: Array<{
  pillar: FocusPillar;
  habitCompletionRate: number;
  streakDays: number;
  checkInRate: number;
}> = [
  {
    pillar: "fitness",
    habitCompletionRate: 0.82,
    streakDays: 12,
    checkInRate: 0.86,
  },
  {
    pillar: "recovery",
    habitCompletionRate: 0.71,
    streakDays: 5,
    checkInRate: 0.71,
  },
];

const seededPillarRatings = seededPillarInputs.map((input) =>
  calculatePillarRating({
    ...input,
    consistency: consistencySeed,
  }),
);

const seededUnlockedAchievements: UnlockedAchievement[] = [
  { achievementId: "ach-first-checkin", unlockedAt: "2026-03-10T08:00:00.000Z" },
  { achievementId: "ach-week-streak", unlockedAt: "2026-03-16T08:00:00.000Z" },
  { achievementId: "ach-ten-checkins", unlockedAt: "2026-03-17T08:00:00.000Z" },
  { achievementId: "ach-first-workout", unlockedAt: "2026-03-10T08:30:00.000Z" },
  { achievementId: "ach-first-squad", unlockedAt: "2026-03-10T09:00:00.000Z" },
];

const { momentumScore, momentumTier } = calculateMomentumScore({
  pillarRatings: seededPillarRatings,
  totalCheckIns: 18,
  longestStreak: 12,
  memberSince: "2026-03-10T00:00:00.000Z",
});

export const characterSeed: CharacterProfile = {
  momentumScore,
  momentumTier,
  pillarRatings: seededPillarRatings,
  achievements: seededUnlockedAchievements,
  totalCheckIns: 18,
  longestStreak: 12,
  memberSince: "2026-03-10T00:00:00.000Z",
};
