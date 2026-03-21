import type { MomentumTier } from "./types";
import { getTierForScore } from "./tiers";

export type MuscleGroupKey =
  | "shoulders"
  | "chest"
  | "back"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "traps";

export interface MuscleGroupRating {
  key: MuscleGroupKey;
  label: string;
  score: number;
  tier: MomentumTier;
}

export const muscleGroupMeta: Record<
  MuscleGroupKey,
  { label: string; side: "left" | "right" }
> = {
  shoulders: { label: "Shoulders", side: "left" },
  chest: { label: "Chest", side: "left" },
  back: { label: "Back", side: "right" },
  biceps: { label: "Biceps", side: "right" },
  triceps: { label: "Triceps", side: "left" },
  forearms: { label: "Forearms", side: "right" },
  abs: { label: "Abs", side: "left" },
  quads: { label: "Quads", side: "left" },
  hamstrings: { label: "Hamstrings", side: "right" },
  glutes: { label: "Glutes", side: "right" },
  calves: { label: "Calves", side: "left" },
  traps: { label: "Traps", side: "right" },
};

export function buildMuscleGroupRating(
  key: MuscleGroupKey,
  score: number,
): MuscleGroupRating {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return {
    key,
    label: muscleGroupMeta[key].label,
    score: clamped,
    tier: getTierForScore(clamped),
  };
}

export const allMuscleGroupKeys: MuscleGroupKey[] = [
  "shoulders",
  "chest",
  "back",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "traps",
];
