import { calculateConsistency } from "@/src/domain/consistency";
import {
  seededAppleHealthCoverage,
  seededAppleHealthMetrics,
  seededConsistencyWeek,
} from "@/src/data/fixtures/metrics";
import type { ConnectionRecord, ProviderSnapshot } from "@/src/domain/models";
import type {
  CheckInDraft,
  Friend,
  Habit,
  OnboardingDraft,
  ProgressPost,
  Squad,
  UserProfile,
} from "@/src/features/app/sessionTypes";

export const goalOptions = [
  "Train more consistently",
  "Sleep 7+ hours",
  "Build mental sharpness",
  "Stay accountable with friends",
  "Finish what I start",
] as const;

export const pillarOptions = [
  { value: "fitness", label: "Fitness" },
  { value: "mindset", label: "Mindset" },
  { value: "learning", label: "Learning" },
  { value: "recovery", label: "Recovery" },
] as const;

export const friendsSeed: Friend[] = [
  {
    id: "friend-1",
    name: "Maya Chen",
    username: "mayamoves",
    streakLabel: "5-day sleep streak",
  },
  {
    id: "friend-2",
    name: "Jordan Ellis",
    username: "jordanset",
    streakLabel: "4 workouts this week",
  },
];

export const squadsSeed: Squad[] = [
  {
    id: "squad-1",
    ownerId: "user-1",
    name: "Morning Proof",
    handle: "proof",
    description: "A tight squad that values consistency over hype.",
    memberCount: 6,
    currentFocus: "Training early and checking in honestly.",
  },
  {
    id: "squad-2",
    ownerId: "friend-1",
    name: "Steady Builders",
    handle: "builders",
    description: "Friends tracking workouts, habits, and recovery together.",
    memberCount: 8,
    currentFocus: "Show up four times a week and protect sleep.",
  },
];

export const dayOnesSquadSeed: Squad = {
  id: "squad-day-ones",
  ownerId: "friend-1",
  name: "Day ones",
  handle: "day-ones",
  description: "A starter squad for people who want to build momentum from the beginning.",
  memberCount: 12,
  currentFocus: "Show up, check in, and keep each other moving.",
};

export const habitsSeed: Habit[] = [
  {
    id: "habit-1",
    title: "10:30 lights out",
    cadence: "Daily",
    completedToday: true,
    completionRate: 0.86,
    streakDays: 5,
    friendVisible: true,
  },
  {
    id: "habit-2",
    title: "Mobility reset",
    cadence: "5x / week",
    completedToday: false,
    completionRate: 0.71,
    streakDays: 2,
    friendVisible: true,
  },
];

export const onboardingDraftSeed: OnboardingDraft = {
  goals: ["Train more consistently", "Sleep 7+ hours"],
  pillars: ["fitness", "recovery"],
  accountabilityStyle: "squad-first",
  defaultAudience: "friends",
  name: "Max Stone",
  username: "maxmomentum",
  missionLine: "Building a stronger baseline, one honest check-in at a time.",
  city: "New York",
};

export const userSeed: UserProfile = {
  id: "user-1",
  name: onboardingDraftSeed.name,
  username: onboardingDraftSeed.username,
  missionLine: onboardingDraftSeed.missionLine,
  city: onboardingDraftSeed.city,
  pillars: onboardingDraftSeed.pillars,
  goals: onboardingDraftSeed.goals,
  accountabilityStyle: onboardingDraftSeed.accountabilityStyle,
  selectedSquadId: "squad-1",
};

const seededConsistency = calculateConsistency({
  days: seededConsistencyWeek,
  selectedPillars: onboardingDraftSeed.pillars,
});

export const postsSeed: ProgressPost[] = [
  {
    id: "post-1",
    authorId: "friend-1",
    authorName: "Maya Chen",
    authorUsername: "mayamoves",
    squadId: "squad-1",
    squadName: "Morning Proof",
    type: "workout",
    audience: "squad",
    caption: "Short lift, no drama. Showed up before work and that was the win.",
    createdAt: "2026-03-16T07:18:00.000Z",
    metrics: [
      { label: "Workout", value: "Upper body" },
      { label: "Duration", value: 42, unit: "min" },
      { label: "Energy", value: 416, unit: "kcal" },
    ],
    consistencyScore: 84,
    consistencyLabel: "Locked In",
    reactions: {
      didThisToo: 3,
      commentCount: 2,
      emojis: ["💪", "🫡"],
    },
  },
  {
    id: "post-2",
    authorId: "friend-2",
    authorName: "Jordan Ellis",
    authorUsername: "jordanset",
    type: "recovery",
    audience: "friends",
    caption: "Protected sleep and skipped the revenge scroll. Feels better already.",
    createdAt: "2026-03-15T21:42:00.000Z",
    metrics: [
      { label: "Sleep", value: 7.6, unit: "hr" },
      { label: "Steps", value: 10120 },
    ],
    consistencyScore: 76,
    consistencyLabel: "Locked In",
    reactions: {
      didThisToo: 1,
      commentCount: 1,
      emojis: ["😴"],
    },
  },
];

export const checkInDraftSeed: CheckInDraft = {
  type: "workout",
  audience: "friends",
  caption: "Lifted even though the day was packed. That matters more than perfect volume.",
  manualWorkoutName: "Strength session",
  manualDurationMinutes: "42",
  manualEnergy: "420",
};

export const appleHealthPreviewConnection: ConnectionRecord = {
  provider: "apple-health",
  state: "connected",
  connectedAt: new Date().toISOString(),
  lastSyncAt: new Date().toISOString(),
  coverage: seededAppleHealthCoverage,
};

export const appleHealthPreviewSnapshot: ProviderSnapshot = {
  provider: "apple-health",
  capturedAt: new Date().toISOString(),
  metrics: seededAppleHealthMetrics,
  coverage: seededAppleHealthCoverage,
};

export const consistencySeed = seededConsistency;
