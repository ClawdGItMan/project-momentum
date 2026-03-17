import type {
  ConsistencyDayInput,
  ConsistencyLabel,
  ConsistencyResult,
} from "./types";

const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

const getLabelForScore = (score: number): ConsistencyLabel => {
  if (score <= 24) return "Starting";
  if (score <= 49) return "Building";
  if (score <= 74) return "Steady";
  if (score <= 89) return "Locked In";
  return "Dialed";
};

const hasFitnessPillar = (pillars: string[]): boolean =>
  pillars.some((pillar) => pillar.trim().toLowerCase() === "fitness");

const toSevenDayWindow = (days: ConsistencyDayInput[]): ConsistencyDayInput[] =>
  [...days]
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-7);

export interface ConsistencyCalculationInput {
  days: ConsistencyDayInput[];
  selectedPillars?: string[];
}

export const calculateConsistency = ({
  days,
  selectedPillars = [],
}: ConsistencyCalculationInput): ConsistencyResult => {
  const window = toSevenDayWindow(days);
  const totalDays = window.length;

  if (totalDays === 0) {
    return {
      score: 0,
      label: "Starting",
      windowDays: 0,
      breakdown: {
        checkInRate: 0,
        habitCompletionRate: 0,
        workoutRate: 0,
        checkInContribution: 0,
        habitContribution: 0,
        workoutContribution: 0,
      },
    };
  }

  const checkIns = window.filter((item) => item.checkedIn).length;
  const completedWorkouts = window.filter((item) => item.workoutCompleted).length;
  const totalScheduledHabits = window.reduce(
    (sum, item) => sum + Math.max(item.scheduledHabits, 0),
    0,
  );
  const totalCompletedHabits = window.reduce(
    (sum, item) => sum + Math.max(item.completedHabits, 0),
    0,
  );

  const checkInRate = clamp(checkIns / totalDays);
  const workoutRate = clamp(completedWorkouts / totalDays);
  const habitCompletionRate =
    totalScheduledHabits > 0
      ? clamp(totalCompletedHabits / totalScheduledHabits)
      : 0;

  const includeWorkoutWeight = hasFitnessPillar(selectedPillars);
  const checkInWeight = includeWorkoutWeight ? 0.4 : 0.4;
  const habitWeight = includeWorkoutWeight ? 0.4 : 0.6;
  const workoutWeight = includeWorkoutWeight ? 0.2 : 0;

  const checkInContribution = checkInRate * checkInWeight;
  const habitContribution = habitCompletionRate * habitWeight;
  const workoutContribution = workoutRate * workoutWeight;

  const score = Math.round(
    (checkInContribution + habitContribution + workoutContribution) * 100,
  );

  return {
    score,
    label: getLabelForScore(score),
    windowDays: totalDays,
    breakdown: {
      checkInRate,
      habitCompletionRate,
      workoutRate,
      checkInContribution,
      habitContribution,
      workoutContribution,
    },
  };
};

