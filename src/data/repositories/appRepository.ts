import type { Session } from "@supabase/supabase-js";

import { calculateConsistency } from "@/src/domain/consistency";
import type { ConnectionRecord, ConsistencyResult, ProviderSnapshot } from "@/src/domain/models";
import type {
  AccountabilityStyle,
  AudienceVisibility,
  CheckInDraft,
  FocusPillar,
  Friend,
  Habit,
  ProgressPost,
  Squad,
  UserProfile,
} from "@/src/features/app/sessionTypes";
import { supabase } from "@/src/lib/supabase/client";

type ProfileOverviewRow = {
  user_id: string;
  display_name: string | null;
  username: string;
  mission_line: string | null;
  city: string | null;
  pillars: FocusPillar[] | null;
  goals: string[] | null;
  accountability_style: AccountabilityStyle;
  default_audience: AudienceVisibility;
  selected_squad_id: string | null;
  consistency_score: number | null;
  consistency_label: ConsistencyResult["label"] | null;
};

type FeedItemRow = {
  id: string;
  author_id: string;
  author_name: string | null;
  author_username: string;
  squad_id: string | null;
  squad_name: string | null;
  type: ProgressPost["type"];
  audience: AudienceVisibility;
  caption: string;
  consistency_score: number | null;
  consistency_label: ProgressPost["consistencyLabel"] | null;
  created_at: string;
  metrics:
    | Array<{
        key?: string;
        label: string;
        value: string | number | boolean | null;
        unit?: string | null;
      }>
    | null;
  did_this_too_count: number | null;
  did_this_too_by_current_user: boolean | null;
  comment_count: number | null;
  emojis: string[] | null;
};

type HabitOverviewRow = {
  id: string;
  title: string;
  cadence: string;
  completed_today: boolean;
  completion_rate: number | null;
  streak_days: number | null;
  friend_visible: boolean;
};

type SquadOverviewRow = {
  id: string;
  owner_id: string;
  name: string;
  handle: string;
  description: string;
  current_focus: string;
  member_count: number | null;
};

type ProviderConnectionRow = {
  provider: ConnectionRecord["provider"];
  state: ConnectionRecord["state"];
  connected_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  coverage: ConnectionRecord["coverage"] | null;
};

type ProviderSnapshotMetricRow = {
  key: string;
  value: string | number | boolean | null;
  unit?: string | null;
  source?: string | null;
  observedAt?: string | null;
  confidence?: "high" | "medium" | "low" | null;
};

type ProviderSnapshotCoverageRow = {
  key: string;
  available: boolean;
  reason?: string | null;
};

type ProviderSnapshotRow = {
  id: string;
  provider: ProviderSnapshot["provider"];
  captured_at: string;
  metrics: ProviderSnapshotMetricRow[] | null;
  coverage: ProviderSnapshotCoverageRow[] | null;
};

type SquadChatOverviewRow = {
  squad_id: string;
  unread_count: number | null;
  last_message_created_at: string | null;
  last_message_body: string | null;
  last_message_author_name: string | null;
};

type SquadMessageRow = {
  id: string;
  squad_id: string;
  author_id: string;
  client_message_id: string | null;
  body: string;
  created_at: string;
  author_name: string | null;
  author_username: string;
};

type AppBootstrapData = {
  currentUser: UserProfile | null;
  friends: Friend[];
  squads: Squad[];
  habits: Habit[];
  feedPosts: ProgressPost[];
  healthConnection: ConnectionRecord | null;
  healthSnapshot: ProviderSnapshot | null;
  consistency: ConsistencyResult;
  chatOverviews: SquadChatOverview[];
};

type SignUpResult = {
  session: Session | null;
  requiresEmailConfirmation: boolean;
};

type FriendInviteRow = {
  id: string;
  invite_token: string;
};

type SquadInviteRow = {
  id: string;
  invite_token: string;
};

type CheckInMetricInput = {
  key: string;
  value: number | string | boolean | null;
  unit?: string | null;
  source?: string | null;
  provider?: string | null;
  observedAt?: string;
  confidence?: string | null;
};

export type SquadChatOverview = {
  squadId: string;
  unreadCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageAuthorName?: string;
};

export type SquadMessageItem = {
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
};

function buildDefaultConsistency(selectedPillars: FocusPillar[]): ConsistencyResult {
  return calculateConsistency({
    days: [],
    selectedPillars,
  });
}

function parseMetricValue(value: string | number | boolean | null) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return value;
  }

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && /^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return numeric;
  }

  return value;
}

function toPostMetricValue(value: string | number | boolean | null) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value == null) {
    return "";
  }

  return value;
}

function mapProfile(row: ProfileOverviewRow): UserProfile {
  return {
    id: row.user_id,
    name: row.display_name ?? row.username,
    username: row.username,
    missionLine: row.mission_line ?? "",
    city: row.city ?? "",
    pillars: row.pillars ?? [],
    goals: row.goals ?? [],
    accountabilityStyle: row.accountability_style,
    defaultAudience: row.default_audience,
    selectedSquadId: row.selected_squad_id ?? undefined,
  };
}

function mapHabit(row: HabitOverviewRow): Habit {
  return {
    id: row.id,
    title: row.title,
    cadence: row.cadence,
    completedToday: row.completed_today,
    completionRate: row.completion_rate ?? 0,
    streakDays: row.streak_days ?? 0,
    friendVisible: row.friend_visible,
  };
}

function mapSquad(row: SquadOverviewRow): Squad {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    handle: row.handle,
    description: row.description,
    currentFocus: row.current_focus,
    memberCount: row.member_count ?? 0,
  };
}

function mapPost(row: FeedItemRow): ProgressPost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name ?? row.author_username,
    authorUsername: row.author_username,
    squadId: row.squad_id ?? undefined,
    squadName: row.squad_name ?? undefined,
    type: row.type,
    audience: row.audience,
    caption: row.caption,
    createdAt: row.created_at,
    metrics: (row.metrics ?? []).map((metric) => ({
      key: metric.key as ProgressPost["metrics"][number]["key"],
      label: metric.label,
      value: toPostMetricValue(parseMetricValue(metric.value ?? "")),
      unit: metric.unit ?? undefined,
    })),
    consistencyScore: row.consistency_score ?? 0,
    consistencyLabel: row.consistency_label ?? "Starting",
    reactions: {
      didThisToo: row.did_this_too_count ?? 0,
      didThisTooByCurrentUser: Boolean(row.did_this_too_by_current_user),
      commentCount: row.comment_count ?? 0,
      emojis: row.emojis ?? [],
    },
  };
}

function mapConnection(row?: ProviderConnectionRow | null): ConnectionRecord | null {
  if (!row) return null;

  return {
    provider: row.provider,
    state: row.state,
    connectedAt: row.connected_at ?? undefined,
    lastSyncAt: row.last_sync_at ?? undefined,
    lastError: row.last_error ?? undefined,
    coverage: row.coverage ?? [],
  };
}

function mapSnapshot(row?: ProviderSnapshotRow | null): ProviderSnapshot | null {
  if (!row) return null;

  return {
    id: row.id,
    provider: row.provider,
    capturedAt: row.captured_at,
    metrics: (row.metrics ?? []).map((metric) => ({
      key: metric.key as ProviderSnapshot["metrics"][number]["key"],
      value: parseMetricValue(metric.value),
      unit: metric.unit ?? undefined,
      source: (metric.source as ProviderSnapshot["metrics"][number]["source"]) ?? "derived",
      provider: row.provider,
      observedAt: metric.observedAt ?? row.captured_at,
      window: {
        startAt: row.captured_at,
        endAt: row.captured_at,
        bucket: "today",
      },
      confidence: metric.confidence ?? "high",
    })),
    coverage: (row.coverage ?? []).map((item) => ({
      key: item.key as ProviderSnapshot["coverage"][number]["key"],
      available: item.available,
      reason:
        (item.reason as ProviderSnapshot["coverage"][number]["reason"]) ?? undefined,
    })),
  };
}

function mapSquadMessage(row: SquadMessageRow): SquadMessageItem {
  return {
    id: row.id,
    squadId: row.squad_id,
    authorId: row.author_id,
    authorName: row.author_name ?? row.author_username,
    authorUsername: row.author_username,
    body: row.body,
    createdAt: row.created_at,
    clientMessageId: row.client_message_id ?? undefined,
  };
}

async function requireAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user?.id) {
    throw new Error("Authentication required.");
  }

  return user.id;
}

export async function signIn(email: string, password: string) {
  const { error, data } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const { error, data } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) throw error;

  return {
    session: data.session,
    requiresEmailConfirmation: !data.session,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function bootstrapOnboarding(payload: {
  name: string;
  username: string;
  missionLine: string;
  city: string;
  pillars: FocusPillar[];
  goals: string[];
  accountabilityStyle: AccountabilityStyle;
  defaultAudience: AudienceVisibility;
  selectedSquadId?: string;
}) {
  const { error } = await supabase.rpc("complete_onboarding", {
    p_display_name: payload.name,
    p_username: payload.username,
    p_mission_line: payload.missionLine,
    p_city: payload.city || null,
    p_pillars: payload.pillars,
    p_goals: payload.goals,
    p_accountability_style: payload.accountabilityStyle,
    p_default_audience: payload.defaultAudience,
    p_selected_squad_id: payload.selectedSquadId ?? null,
  });

  if (error) throw error;
}

export async function fetchAppBootstrapData(userId: string): Promise<AppBootstrapData> {
  const [
    profileResult,
    membershipsResult,
    habitsResult,
    feedResult,
    connectionResult,
    snapshotResult,
    chatResult,
    friendshipsResult,
  ] = await Promise.all([
    supabase
      .from("profile_overviews")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<ProfileOverviewRow>(),
    supabase
      .from("squad_memberships")
      .select("squad_id")
      .eq("user_id", userId)
      .eq("state", "active"),
    supabase
      .from("habit_overviews")
      .select("*")
      .eq("owner_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("feed_items").select("*").order("created_at", { ascending: false }).limit(40),
    supabase
      .from("provider_connections_public")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "apple-health")
      .maybeSingle<ProviderConnectionRow>(),
    supabase
      .from("provider_snapshots_public")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "apple-health")
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle<ProviderSnapshotRow>(),
    supabase
      .from("squad_chat_overviews")
      .select("*")
      .order("last_message_created_at", { ascending: false }),
    supabase.from("friendships").select("user_low_id, user_high_id"),
  ]);

  const fatalError =
    profileResult.error ??
    membershipsResult.error ??
    habitsResult.error ??
    feedResult.error ??
    connectionResult.error ??
    snapshotResult.error ??
    chatResult.error ??
    friendshipsResult.error;

  if (fatalError) {
    throw fatalError;
  }

  const membershipIds = (membershipsResult.data ?? []).map((item) => item.squad_id);
  const squadsResult = membershipIds.length
    ? await supabase.from("squad_overviews").select("*").in("id", membershipIds)
    : { data: [], error: null };

  if (squadsResult.error) {
    throw squadsResult.error;
  }

  const friendIds = (friendshipsResult.data ?? [])
    .map((row) => (row.user_low_id === userId ? row.user_high_id : row.user_low_id))
    .filter(Boolean);

  const friendProfilesResult = friendIds.length
    ? await supabase.from("profile_overviews").select("*").in("user_id", friendIds)
    : { data: [], error: null };

  if (friendProfilesResult.error) {
    throw friendProfilesResult.error;
  }

  const profile = profileResult.data;
  const currentUser = profile ? mapProfile(profile) : null;
  const consistency = profile
    ? ({
        score: profile.consistency_score ?? 0,
        label: profile.consistency_label ?? "Starting",
        windowDays: 7,
        breakdown: {
          checkInRate: 0,
          habitCompletionRate: 0,
          workoutRate: 0,
          checkInContribution: 0,
          habitContribution: 0,
          workoutContribution: 0,
        },
      } satisfies ConsistencyResult)
    : buildDefaultConsistency([]);

  return {
    currentUser,
    friends: (friendProfilesResult.data ?? []).map((row) => ({
      id: row.user_id,
      name: row.display_name ?? row.username,
      username: row.username,
      streakLabel: `${row.consistency_score ?? 0} consistency`,
    })),
    squads: (squadsResult.data ?? []).map((row) => mapSquad(row as SquadOverviewRow)),
    habits: (habitsResult.data ?? []).map((row) => mapHabit(row as HabitOverviewRow)),
    feedPosts: (feedResult.data ?? []).map((row) => mapPost(row as FeedItemRow)),
    healthConnection: mapConnection(connectionResult.data ?? null),
    healthSnapshot: mapSnapshot(snapshotResult.data ?? null),
    consistency,
    chatOverviews: (chatResult.data ?? []).map((row) => ({
      squadId: (row as SquadChatOverviewRow).squad_id,
      unreadCount: (row as SquadChatOverviewRow).unread_count ?? 0,
      lastMessageAt: (row as SquadChatOverviewRow).last_message_created_at ?? undefined,
      lastMessagePreview: (row as SquadChatOverviewRow).last_message_body ?? undefined,
      lastMessageAuthorName: (row as SquadChatOverviewRow).last_message_author_name ?? undefined,
    })),
  };
}

export async function createHabit(title: string) {
  const ownerId = await requireAuthenticatedUserId();
  const { error, data } = await supabase
    .from("habits")
    .insert({
      owner_id: ownerId,
      title: title.trim(),
      cadence: "Daily",
      visibility_scope: "friends",
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function toggleHabitCompletion(habitId: string, completed: boolean) {
  const ownerId = await requireAuthenticatedUserId();
  const completedForDate = new Date().toISOString().slice(0, 10);

  if (completed) {
    const { error } = await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("owner_id", ownerId)
      .eq("completed_for_date", completedForDate);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("habit_completions").insert({
    habit_id: habitId,
    owner_id: ownerId,
    completed_for_date: completedForDate,
  });

  if (error) throw error;
}

export async function setSelectedSquad(selectedSquadId?: string) {
  const { error } = await supabase.rpc("set_selected_squad", {
    p_squad_id: selectedSquadId ?? null,
  });

  if (error) throw error;
}

export async function createFriendInviteByUsername(username: string, message?: string) {
  const { data, error } = await supabase.rpc("create_friend_invite_by_username", {
    p_username: username.trim().replace(/^@/, ""),
    p_message: message?.trim() || null,
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as FriendInviteRow;
  return {
    id: row.id,
    inviteToken: row.invite_token,
  };
}

export async function createSquad(payload: {
  name: string;
  handle: string;
  description?: string;
  currentFocus?: string;
}) {
  const { data, error } = await supabase.rpc("create_squad", {
    p_name: payload.name.trim(),
    p_handle: payload.handle.trim().replace(/^@/, ""),
    p_description: payload.description?.trim() || "",
    p_current_focus: payload.currentFocus?.trim() || "",
  });

  if (error) throw error;

  const row = data as {
    id: string;
    owner_id: string;
    name: string;
    handle: string;
    description: string;
    current_focus: string;
  };

  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    handle: row.handle,
    description: row.description,
    currentFocus: row.current_focus,
    memberCount: 1,
  } satisfies Squad;
}

export async function createSquadInviteToken(squadId: string, inviteeId?: string) {
  const inviterId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from("squad_invites")
    .insert({
      squad_id: squadId,
      inviter_id: inviterId,
      invitee_id: inviteeId ?? null,
    })
    .select("id, invite_token")
    .single<SquadInviteRow>();

  if (error) throw error;

  return {
    id: data.id,
    inviteToken: data.invite_token,
  };
}

export async function acceptFriendInvite(token: string) {
  const { error } = await supabase.rpc("accept_friend_invite", {
    p_invite_token: token.trim(),
  });

  if (error) throw error;
}

export async function acceptSquadInvite(token: string) {
  const { error } = await supabase.rpc("accept_squad_invite", {
    p_invite_token: token.trim(),
  });

  if (error) throw error;
}

export async function reactToPost(postId: string, reacted: boolean) {
  const authorId = await requireAuthenticatedUserId();

  if (reacted) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("check_in_id", postId)
      .eq("author_id", authorId)
      .eq("reaction_kind", "did_this_too");

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("post_reactions").insert({
    check_in_id: postId,
    author_id: authorId,
    reaction_kind: "did_this_too",
  });

  if (error) throw error;
}

export async function recordAppleHealthSnapshot(payload: {
  state: string;
  windowStartAt: string;
  windowEndAt: string;
  windowBucket: string;
  metrics: Array<{
    key: string;
    value: number | string | boolean | null;
    unit?: string;
    source?: string;
    observedAt?: string;
    confidence?: string;
  }>;
  coverage: Array<{
    key: string;
    available: boolean;
    reason?: string;
  }>;
}) {
  const { data, error } = await supabase.rpc("record_apple_health_snapshot", {
    p_state: payload.state,
    p_window_start_at: payload.windowStartAt,
    p_window_end_at: payload.windowEndAt,
    p_window_bucket: payload.windowBucket,
    p_metrics: payload.metrics,
    p_coverage: payload.coverage,
  });

  if (error) throw error;

  return mapSnapshot((Array.isArray(data) ? data[0] : data) as ProviderSnapshotRow);
}

export async function createCheckIn(payload: {
  type: CheckInDraft["type"];
  audience: AudienceVisibility;
  squadId?: string;
  caption: string;
  sourceProvider: string;
  sourceSnapshotId?: string;
  metrics: CheckInMetricInput[];
}) {
  const { data, error } = await supabase.rpc("create_check_in", {
    p_type: payload.type,
    p_audience: payload.audience,
    p_squad_id: payload.squadId ?? null,
    p_caption: payload.caption,
    p_source_provider: payload.sourceProvider,
    p_source_snapshot_id: payload.sourceSnapshotId ?? null,
    p_metrics: payload.metrics,
  });

  if (error) throw error;

  return mapPost((Array.isArray(data) ? data[0] : data) as FeedItemRow);
}

export async function fetchSquadMessages(squadId: string): Promise<SquadMessageItem[]> {
  const { data, error } = await supabase
    .from("squad_message_items")
    .select("*")
    .eq("squad_id", squadId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((row) => mapSquadMessage(row as SquadMessageRow));
}

async function fetchSquadMessageById(messageId: string) {
  const { data, error } = await supabase
    .from("squad_message_items")
    .select("*")
    .eq("id", messageId)
    .single<SquadMessageRow>();

  if (error) throw error;
  return mapSquadMessage(data);
}

export async function sendSquadMessage(
  squadId: string,
  body: string,
  clientMessageId: string,
) {
  const { data, error } = await supabase.rpc("send_squad_message", {
    p_squad_id: squadId,
    p_body: body,
    p_client_message_id: clientMessageId,
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as { id: string };
  return fetchSquadMessageById(row.id);
}

export async function markSquadChatRead(squadId: string) {
  const { error } = await supabase.rpc("mark_squad_chat_read", {
    p_squad_id: squadId,
    p_read_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export function subscribeToSquadMessages(
  squadId: string,
  onInsert: (message: SquadMessageItem) => void,
) {
  return supabase
    .channel(`squad-messages:${squadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "squad_messages",
        filter: `squad_id=eq.${squadId}`,
      },
      async (payload: { new?: { id?: string } }) => {
        const messageId = payload.new?.id;
        if (!messageId) return;

        const message = await fetchSquadMessageById(messageId).catch(() => null);
        if (message) {
          onInsert(message);
        }
      },
    )
    .subscribe();
}
