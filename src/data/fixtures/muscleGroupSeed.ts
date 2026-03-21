import {
  buildMuscleGroupRating,
  type MuscleGroupRating,
} from "@/src/domain/character/muscleGroups";

export const muscleGroupsSeed: MuscleGroupRating[] = [
  buildMuscleGroupRating("shoulders", 72),
  buildMuscleGroupRating("chest", 68),
  buildMuscleGroupRating("back", 55),
  buildMuscleGroupRating("biceps", 78),
  buildMuscleGroupRating("triceps", 65),
  buildMuscleGroupRating("forearms", 42),
  buildMuscleGroupRating("abs", 58),
  buildMuscleGroupRating("quads", 82),
  buildMuscleGroupRating("hamstrings", 48),
  buildMuscleGroupRating("glutes", 60),
  buildMuscleGroupRating("calves", 35),
  buildMuscleGroupRating("traps", 50),
];
