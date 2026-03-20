import type {
  ConnectionRecord,
  ConsistencyLabel,
  IntegrationProvider,
  ManagedIntegrationProvider,
  MetricKey,
  MetricSource,
  ProviderSnapshot,
} from "@/src/domain/models";

export type FocusPillar = "fitness" | "mindset" | "learning" | "recovery";

export type AudienceVisibility = "only-me" | "friends" | "squad";

export type PostType = "workout" | "habit-win" | "recovery" | "reflection";

export type HomeSegment = "squads" | "friends";

export type AccountabilityStyle = "friends" | "squad-first" | "mixed";

export type AuthState = "signed-out" | "authenticated" | "demo";

export type BootstrapStatus =
  | "idle"
  | "loading"
  | "needs_onboarding"
  | "ready"
  | "error";

export type CheckInSourcePreference =
  | "auto"
  | ManagedIntegrationProvider
  | "manual";

export type ProviderConnectionMap = Record<
  ManagedIntegrationProvider,
  ConnectionRecord
>;

export type ProviderSnapshotMap = Partial<
  Record<ManagedIntegrationProvider, ProviderSnapshot | null>
>;

export interface Friend {
  id: string;
  name: string;
  username: string;
  streakLabel: string;
}

export interface Squad {
  id: string;
  ownerId?: string;
  name: string;
  handle: string;
  description: string;
  memberCount: number;
  currentFocus: string;
}

export interface SquadChatOverview {
  squadId: string;
  unreadCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageAuthorName?: string;
}

export interface SquadMessage {
  id: string;
  squadId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  body: string;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
  clientMessageId?: string;
}

export interface SquadMemberSummary {
  id: string;
  squadId: string;
  userId: string;
  role: string;
  state: string;
  joinedAt: string;
  leftAt?: string;
  displayName: string;
  username: string;
  missionLine?: string;
  isCurrentUser: boolean;
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
  provider?: IntegrationProvider;
  source?: MetricSource;
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
  sourceProvider?: IntegrationProvider;
  sourceProviders?: IntegrationProvider[];
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
  defaultAudience?: AudienceVisibility;
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
  sourcePreference: CheckInSourcePreference;
  caption: string;
  manualWorkoutName: string;
  manualDurationMinutes: string;
  manualEnergy: string;
}
