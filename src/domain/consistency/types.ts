export type ConsistencyLabel =
  | "Starting"
  | "Building"
  | "Steady"
  | "Locked In"
  | "Dialed";

export interface ConsistencyDayInput {
  date: string;
  checkedIn: boolean;
  scheduledHabits: number;
  completedHabits: number;
  workoutCompleted: boolean;
}

export interface ConsistencyBreakdown {
  checkInRate: number;
  habitCompletionRate: number;
  workoutRate: number;
  checkInContribution: number;
  habitContribution: number;
  workoutContribution: number;
}

export interface ConsistencyResult {
  score: number;
  label: ConsistencyLabel;
  windowDays: number;
  breakdown: ConsistencyBreakdown;
}

