import type { ConsistencyLabel, MetricKey } from "@/src/domain/models";

export type FocusPillar = "fitness" | "mindset" | "learning" | "recovery";

export type AudienceVisibility = "only-me" | "friends" | "squad";

export type PostType = "workout" | "habit-win" | "recovery" | "reflection";

export type HomeSegment = "squads" | "friends";

export type AccountabilityStyle = "friends" | "squad-first" | "mixed";

export interface Friend {
  id: string;
  name: string;
  username: string;
  streakLabel: string;
}

export interface Squad {
  id: string;
  name: string;
  handle: string;
  description: string;
  memberCount: number;
  currentFocus: string;
}

export interface Habit {
  id: string;
  title: string;
  cadence: string;
  completedToday: boolean;
  completionRate: number;
  streakDays: number;
  friendVisible: boolean;
}

export interface PostMetricDisplay {
  key?: MetricKey;
  label: string;
  value: number | string;
  unit?: string;
}

export interface ProgressPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  squadId?: string;
  squadName?: string;
  type: PostType;
  audience: AudienceVisibility;
  caption: string;
  createdAt: string;
  metrics: PostMetricDisplay[];
  consistencyScore: number;
  consistencyLabel: ConsistencyLabel;
  reactions: {
    didThisToo: number;
    commentCount: number;
    emojis: string[];
    didThisTooByCurrentUser?: boolean;
  };
  isCurrentUser?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  missionLine: string;
  city?: string;
  pillars: FocusPillar[];
  goals: string[];
  accountabilityStyle: AccountabilityStyle;
  selectedSquadId?: string;
}

export interface OnboardingDraft {
  goals: string[];
  pillars: FocusPillar[];
  accountabilityStyle: AccountabilityStyle;
  defaultAudience: AudienceVisibility;
  name: string;
  username: string;
  missionLine: string;
  city: string;
  selectedSquadId?: string;
}

export interface CheckInDraft {
  type: PostType;
  audience: AudienceVisibility;
  squadId?: string;
  caption: string;
  manualWorkoutName: string;
  manualDurationMinutes: string;
  manualEnergy: string;
}
