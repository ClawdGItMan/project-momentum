import type {
  MetricCoverage,
  MetricValue,
  MetricWindow,
} from "@/src/domain/integrations/types";
import type { ConsistencyDayInput } from "@/src/domain/consistency/types";

const now = new Date();

export const demoMetricWindow: MetricWindow = {
  startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  endAt: now.toISOString(),
  bucket: "today",
};

export const seededAppleHealthCoverage: MetricCoverage[] = [
  { key: "workouts", available: true },
  { key: "steps", available: true },
  { key: "sleep-duration", available: true },
  { key: "active-energy", available: true },
  { key: "resting-heart-rate", available: false, reason: "no_samples" },
  { key: "mindfulness-minutes", available: false, reason: "not_requested" },
];

export const seededAppleHealthMetrics: MetricValue[] = [
  {
    key: "workouts",
    value: 1,
    unit: "count",
    source: "live",
    provider: "apple-health",
    observedAt: now.toISOString(),
    window: demoMetricWindow,
    confidence: "high",
  },
  {
    key: "steps",
    value: 9344,
    unit: "count",
    source: "live",
    provider: "apple-health",
    observedAt: now.toISOString(),
    window: demoMetricWindow,
    confidence: "high",
  },
  {
    key: "sleep-duration",
    value: 7.1,
    unit: "hours",
    source: "live",
    provider: "apple-health",
    observedAt: now.toISOString(),
    window: demoMetricWindow,
    confidence: "high",
  },
  {
    key: "active-energy",
    value: 612,
    unit: "kcal",
    source: "live",
    provider: "apple-health",
    observedAt: now.toISOString(),
    window: demoMetricWindow,
    confidence: "high",
  },
];

export const seededConsistencyWeek: ConsistencyDayInput[] = [
  { date: "2026-03-10", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
  { date: "2026-03-11", checkedIn: true, scheduledHabits: 2, completedHabits: 1, workoutCompleted: false },
  { date: "2026-03-12", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
  { date: "2026-03-13", checkedIn: true, scheduledHabits: 2, completedHabits: 1, workoutCompleted: true },
  { date: "2026-03-14", checkedIn: false, scheduledHabits: 2, completedHabits: 0, workoutCompleted: false },
  { date: "2026-03-15", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
  { date: "2026-03-16", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
];
