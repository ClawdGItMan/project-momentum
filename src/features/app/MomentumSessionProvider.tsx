import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { calculateConsistency } from "@/src/domain/consistency";
import type {
  ConnectionRecord,
  ConsistencyResult,
  ProviderSnapshot,
} from "@/src/domain/models";
import {
  appleHealthPreviewConnection,
  appleHealthPreviewSnapshot,
  checkInDraftSeed,
  consistencySeed,
  dayOnesSquadSeed,
  friendsSeed,
  habitsSeed,
  onboardingDraftSeed,
  postsSeed,
  squadsSeed,
  userSeed,
} from "@/src/data/fixtures/appSeed";
import {
  bootstrapOnboarding,
  createFriendInviteByUsername,
  createHabit,
  createCheckIn,
  createSquad as persistCreateSquad,
  createSquadInviteToken as persistCreateSquadInviteToken,
  joinDayOnesSquad as persistJoinDayOnesSquad,
  fetchAppBootstrapData,
  fetchSquadMessages,
  markSquadChatRead as persistSquadChatRead,
  acceptFriendInvite as persistAcceptFriendInvite,
  acceptSquadInvite as persistAcceptSquadInvite,
  reactToPost as persistReaction,
  recordAppleHealthSnapshot,
  sendSquadMessage as persistSquadMessage,
  setSelectedSquad as persistSelectedSquad,
  signIn,
  signOut,
  signUp,
  subscribeToSquadMessages,
  toggleHabitCompletion,
  type SquadChatOverview,
  type SquadMessageItem,
} from "@/src/data/repositories/appRepository";
import {
  connectAppleHealth,
  getDemoMetricWindow,
  seedManualWorkoutFallback,
} from "@/src/data/repositories/healthRepository";
import { supabase, ensureSupabaseSessionRefresh } from "@/src/lib/supabase/client";
import type {
  AccountabilityStyle,
  AudienceVisibility,
  AuthState,
  CheckInDraft,
  FocusPillar,
  Friend,
  Habit,
  HomeSegment,
  OnboardingDraft,
  ProgressPost,
  Squad,
  SquadMessage,
  UserProfile,
} from "@/src/features/app/sessionTypes";

type MomentumSessionValue = {
  sessionHydrated: boolean;
  authReady: boolean;
  authState: AuthState;
  onboardingComplete: boolean;
  authEmail: string;
  onboardingDraft: OnboardingDraft;
  currentUser: UserProfile;
  friends: Friend[];
  squads: Squad[];
  habits: Habit[];
  feedPosts: ProgressPost[];
  homeSegment: HomeSegment;
  healthConnection: ConnectionRecord;
  healthSnapshot: ProviderSnapshot | null;
  healthPreviewActive: boolean;
  manualFallbackEnabled: boolean;
  healthLoading: boolean;
  checkInDraft: CheckInDraft;
  consistency: ConsistencyResult;
  lastPublishedPostId: string | null;
  chatOverviews: SquadChatOverview[];
  squadMessages: Record<string, SquadMessage[]>;
  activeSquadChatId: string | null;
  chatLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  setGoals: (goals: string[]) => void;
  setPillars: (pillars: FocusPillar[]) => void;
  setAccountabilityStyle: (style: AccountabilityStyle) => void;
  setProfileBasics: (input: {
    name: string;
    username: string;
    missionLine: string;
    city: string;
  }) => void;
  setSelectedSquad: (squadId?: string) => Promise<void>;
  connectHealth: (
    options?: { preview?: boolean },
  ) => Promise<{ connection: ConnectionRecord; snapshot: ProviderSnapshot | null }>;
  enableManualFallback: () => void;
  completeOnboarding: () => Promise<void>;
  setHomeSegment: (segment: HomeSegment) => void;
  updateCheckInDraft: (patch: Partial<CheckInDraft>) => void;
  publishCheckIn: () => Promise<ProgressPost>;
  dismissPublishedCelebration: () => void;
  reactToPost: (postId: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  addHabit: (title?: string) => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  joinDayOnesSquad: () => Promise<string>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendFriendInvite: (
    username: string,
    message?: string,
  ) => Promise<{ inviteToken: string }>;
  createSquad: (input: {
    name: string;
    handle: string;
    description?: string;
    currentFocus?: string;
  }) => Promise<{ squadId: string; inviteToken: string }>;
  createSquadInviteToken: (
    squadId: string,
    inviteeId?: string,
  ) => Promise<{ inviteToken: string }>;
  acceptInvite: (input: {
    kind: "friend" | "squad";
    token: string;
  }) => Promise<void>;
  openSquadChat: (squadId: string) => Promise<void>;
  sendSquadMessage: (squadId: string, body: string) => Promise<void>;
  markSquadChatRead: (squadId: string) => Promise<void>;
  startDemoSession: () => Promise<void>;
  resetDemoSession: () => Promise<void>;
};

type PersistedFrontendState = {
  homeSegment: HomeSegment;
  onboardingDraft: OnboardingDraft;
  checkInDraft: CheckInDraft;
  manualFallbackEnabled: boolean;
  healthPreviewActive: boolean;
  demoMode: boolean;
  authEmail: string;
};

const defaultConnection: ConnectionRecord = {
  provider: "apple-health",
  state: "disconnected",
  coverage: appleHealthPreviewConnection.coverage.map((item) => ({
    ...item,
    available: false,
    reason: "provider_disconnected",
  })),
};

const emptyUser: UserProfile = {
  id: "",
  name: "",
  username: "",
  missionLine: "",
  city: "",
  pillars: [],
  goals: [],
  accountabilityStyle: "mixed",
};

const defaultFrontendState: PersistedFrontendState = {
  homeSegment: "squads",
  onboardingDraft: onboardingDraftSeed,
  checkInDraft: checkInDraftSeed,
  manualFallbackEnabled: false,
  healthPreviewActive: false,
  demoMode: false,
  authEmail: "",
};

const MomentumSessionContext = createContext<MomentumSessionValue | null>(null);
const sessionStorageKey = "@project-momentum/frontend-v2";

const habitPool = [
  "Protein with breakfast",
  "Read 15 pages",
  "Walk after lunch",
];

const createMessageId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });

const createInviteToken = () => createMessageId().replace(/-/g, "");

function getNextHabitTitle(existingHabits: Habit[], title?: string) {
  const requestedTitle = title?.trim();
  if (requestedTitle) {
    return requestedTitle;
  }

  const usedTitles = new Set(
    existingHabits.map((habit) => habit.title.trim().toLowerCase()),
  );
  const suggestedTitle = habitPool.find(
    (candidate) => !usedTitles.has(candidate.toLowerCase()),
  );

  if (suggestedTitle) {
    return suggestedTitle;
  }

  let fallbackIndex = Math.max(existingHabits.length + 1, 1);
  let fallbackTitle = `Extra consistency habit ${fallbackIndex}`;

  while (usedTitles.has(fallbackTitle.toLowerCase())) {
    fallbackIndex += 1;
    fallbackTitle = `Extra consistency habit ${fallbackIndex}`;
  }

  return fallbackTitle;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error) {
    const message = "message" in error ? (error as { message?: unknown }).message : undefined;
    if (typeof message === "string" && message.trim().length > 0) {
      const details = "details" in error ? (error as { details?: unknown }).details : undefined;
      const hint = "hint" in error ? (error as { hint?: unknown }).hint : undefined;
      const extras = [details, hint].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      );
      return extras.length ? `${message} (${extras.join(" ")})` : message;
    }
  }

  return fallback;
}

function sameChatMessage(left: SquadMessage, right: SquadMessage) {
  if (left.id === right.id) return true;
  if (left.clientMessageId && right.clientMessageId) {
    return left.clientMessageId === right.clientMessageId;
  }
  return false;
}

function normalizePersistedConnection(connection?: ConnectionRecord | null): ConnectionRecord {
  if (!connection) return defaultConnection;
  return {
    ...defaultConnection,
    ...connection,
    coverage: connection.coverage?.length ? connection.coverage : defaultConnection.coverage,
  };
}

function buildConsistency(
  score?: number,
  label?: ConsistencyResult["label"],
  selectedPillars: FocusPillar[] = [],
): ConsistencyResult {
  if (typeof score === "number" && label) {
    return {
      score,
      label,
      windowDays: 7,
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

  return calculateConsistency({
    days: [],
    selectedPillars,
  });
}

function resolveAvailableSquadId(selectedSquadId: string | undefined, availableSquads: Squad[]) {
  if (!selectedSquadId) return undefined;
  return availableSquads.some((squad) => squad.id === selectedSquadId)
    ? selectedSquadId
    : undefined;
}

function normalizeCheckInDraftSelection(
  draft: CheckInDraft,
  availableSquads: Squad[],
): Pick<CheckInDraft, "audience" | "squadId"> {
  const squadId = resolveAvailableSquadId(draft.squadId, availableSquads);
  const audience = draft.audience === "squad" && !squadId ? "friends" : draft.audience;

  return {
    audience,
    squadId: audience === "squad" ? squadId : undefined,
  };
}

function mapSquadMessages(items: SquadMessageItem[]): SquadMessage[] {
  return items.map((item) => ({
    id: item.id,
    squadId: item.squadId,
    authorId: item.authorId,
    authorName: item.authorName,
    authorUsername: item.authorUsername,
    body: item.body,
    createdAt: item.createdAt,
    clientMessageId: item.clientMessageId,
  }));
}

export function MomentumSessionProvider({
  children,
}: React.PropsWithChildren) {
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("signed-out");
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [onboardingDraft, setOnboardingDraft] =
    useState<OnboardingDraft>(onboardingDraftSeed);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(emptyUser);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [feedPosts, setFeedPosts] = useState<ProgressPost[]>([]);
  const [homeSegment, setHomeSegment] = useState<HomeSegment>("squads");
  const [healthConnection, setHealthConnection] =
    useState<ConnectionRecord>(defaultConnection);
  const [healthSnapshot, setHealthSnapshot] = useState<ProviderSnapshot | null>(null);
  const [healthPreviewActive, setHealthPreviewActive] = useState(false);
  const [manualFallbackEnabled, setManualFallbackEnabled] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [checkInDraft, setCheckInDraft] = useState<CheckInDraft>(checkInDraftSeed);
  const [consistency, setConsistency] = useState<ConsistencyResult>(consistencySeed);
  const [lastPublishedPostId, setLastPublishedPostId] = useState<string | null>(null);
  const [chatOverviews, setChatOverviews] = useState<SquadChatOverview[]>([]);
  const [squadMessages, setSquadMessages] = useState<Record<string, SquadMessage[]>>({});
  const [activeSquadChatId, setActiveSquadChatId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const chatSubscriptions = useRef<Record<string, { unsubscribe: () => void }>>({});
  const activeSquadChatRef = useRef<string | null>(null);

  const persistFrontendState = async (
    overrides?: Partial<PersistedFrontendState>,
  ) => {
    const payload: PersistedFrontendState = {
      homeSegment,
      onboardingDraft,
      checkInDraft,
      manualFallbackEnabled,
      healthPreviewActive,
      demoMode,
      authEmail,
      ...overrides,
    };

    await AsyncStorage.setItem(sessionStorageKey, JSON.stringify(payload)).catch(() => null);
  };

  const disconnectChatSubscriptions = () => {
    Object.values(chatSubscriptions.current).forEach((subscription) => {
      subscription.unsubscribe();
    });
    chatSubscriptions.current = {};
  };

  const applyBackendData = async () => {
    if (!authSession?.user.id) {
      disconnectChatSubscriptions();
      setOnboardingComplete(false);
      setCurrentUser(emptyUser);
      setFriends([]);
      setSquads([]);
      setHabits([]);
      setFeedPosts([]);
      setHealthConnection(defaultConnection);
      setHealthSnapshot(null);
      setConsistency(buildConsistency(undefined, undefined, []));
      setChatOverviews([]);
      setSquadMessages({});
      setActiveSquadChatId(null);
      return;
    }

    const data = await fetchAppBootstrapData(authSession.user.id);
    const isOnboarded = Boolean(data.currentUser);

    setOnboardingComplete(isOnboarded);
    setCurrentUser(data.currentUser ?? emptyUser);
    setFriends(data.friends);
    setSquads(data.squads);
    setHabits(data.habits);
    setFeedPosts(data.feedPosts);
    setHealthConnection(normalizePersistedConnection(data.healthConnection));
    setHealthSnapshot(data.healthSnapshot);
    setConsistency(
      data.currentUser
        ? buildConsistency(data.consistency.score, data.consistency.label, data.currentUser.pillars)
        : buildConsistency(undefined, undefined, onboardingDraft.pillars),
    );
    setChatOverviews(data.chatOverviews);

    if (data.currentUser) {
      const liveUser = data.currentUser;
      setOnboardingDraft((current) => ({
        ...current,
        name: liveUser.name,
        username: liveUser.username,
        missionLine: liveUser.missionLine,
        city: liveUser.city ?? "",
        pillars: liveUser.pillars,
        goals: liveUser.goals,
        accountabilityStyle: liveUser.accountabilityStyle,
        defaultAudience: liveUser.defaultAudience ?? current.defaultAudience,
        selectedSquadId: liveUser.selectedSquadId,
      }));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      ensureSupabaseSessionRefresh();

      try {
        const raw = await AsyncStorage.getItem(sessionStorageKey);
        let persistedDemoMode = false;
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedFrontendState>;
          if (!cancelled) {
            if (parsed.homeSegment) setHomeSegment(parsed.homeSegment);
            if (parsed.onboardingDraft) setOnboardingDraft(parsed.onboardingDraft);
            if (parsed.checkInDraft) setCheckInDraft(parsed.checkInDraft);
            if (typeof parsed.manualFallbackEnabled === "boolean") {
              setManualFallbackEnabled(parsed.manualFallbackEnabled);
            }
            if (typeof parsed.healthPreviewActive === "boolean") {
              setHealthPreviewActive(parsed.healthPreviewActive);
            }
            if (typeof parsed.demoMode === "boolean") {
              persistedDemoMode = parsed.demoMode;
              setDemoMode(parsed.demoMode);
            }
            if (parsed.authEmail) setAuthEmail(parsed.authEmail);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (persistedDemoMode) {
          setAuthState("demo");
          setAuthReady(true);
          setSessionHydrated(true);
          return;
        }

        setAuthSession(session);
        setAuthState(session ? "authenticated" : "signed-out");
        setAuthEmail(session?.user.email ?? "");
        setAuthReady(true);
      } finally {
        if (!cancelled) {
          setSessionHydrated(true);
        }
      }
    };

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (demoMode) return;
      setAuthSession(session);
      setAuthState(session ? "authenticated" : "signed-out");
      setAuthEmail(session?.user.email ?? "");
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      disconnectChatSubscriptions();
    };
  }, [demoMode]);

  useEffect(() => {
    if (!sessionHydrated) return;

    void persistFrontendState();
  }, [
    authEmail,
    checkInDraft,
    demoMode,
    healthPreviewActive,
    homeSegment,
    manualFallbackEnabled,
    onboardingDraft,
    sessionHydrated,
  ]);

  useEffect(() => {
    if (!authReady || authState !== "authenticated" || !authSession) return;

    void applyBackendData();
  }, [authReady, authSession, authState]);

  useEffect(() => {
    activeSquadChatRef.current = activeSquadChatId;
  }, [activeSquadChatId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      if (!activeSquadChatRef.current) return;
      const squadId = activeSquadChatRef.current;
      void persistSquadChatRead(squadId)
        .then(() => {
          setChatOverviews((current) =>
            current.map((overview) =>
              overview.squadId === squadId ? { ...overview, unreadCount: 0 } : overview,
            ),
          );
        })
        .catch(() => null);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const refreshFromBackend = async () => {
    if (authState !== "authenticated" || !authSession) return;
    await applyBackendData();
  };

  const setGoals = (goals: string[]) => {
    setOnboardingDraft((current) => ({ ...current, goals }));
    setCurrentUser((current) => ({ ...current, goals }));
  };

  const setPillars = (pillars: FocusPillar[]) => {
    setOnboardingDraft((current) => ({ ...current, pillars }));
    setCurrentUser((current) => ({ ...current, pillars }));
    setConsistency((current) =>
      calculateConsistency({
        days: [],
        selectedPillars: pillars,
      }) ?? current,
    );
  };

  const setAccountabilityStyle = (style: AccountabilityStyle) => {
    setOnboardingDraft((current) => ({ ...current, accountabilityStyle: style }));
    setCurrentUser((current) => ({ ...current, accountabilityStyle: style }));
  };

  const setProfileBasics = (input: {
    name: string;
    username: string;
    missionLine: string;
    city: string;
  }) => {
    setOnboardingDraft((current) => ({ ...current, ...input }));
    setCurrentUser((current) => ({
      ...current,
      name: input.name,
      username: input.username,
      missionLine: input.missionLine,
      city: input.city,
    }));
  };

  const setSelectedSquad = async (squadId?: string) => {
    setOnboardingDraft((current) => ({ ...current, selectedSquadId: squadId }));
    setCurrentUser((current) => ({ ...current, selectedSquadId: squadId }));
    setCheckInDraft((current) => ({
      ...current,
      squadId,
      audience: !squadId && current.audience === "squad" ? "friends" : current.audience,
    }));

    if (authState === "authenticated" && onboardingComplete) {
      await persistSelectedSquad(squadId);
      await refreshFromBackend();
    }
  };

  const joinDayOnesSquad = async () => {
    if (authState === "demo") {
      const existingSquad = squads.find((squad) => squad.handle === dayOnesSquadSeed.handle);
      const nextSquad = existingSquad ?? dayOnesSquadSeed;

      if (!existingSquad) {
        setSquads((current) => [dayOnesSquadSeed, ...current]);
        setChatOverviews((current) =>
          current.some((overview) => overview.squadId === dayOnesSquadSeed.id)
            ? current
            : [
                {
                  squadId: dayOnesSquadSeed.id,
                  unreadCount: 0,
                  lastMessageAt: new Date().toISOString(),
                  lastMessagePreview: "Welcome to Day ones. Keep each other moving.",
                  lastMessageAuthorName: "Day ones",
                },
                ...current,
              ],
        );
      }

      setOnboardingDraft((current) => ({
        ...current,
        selectedSquadId: nextSquad.id,
      }));
      setCurrentUser((current) => ({
        ...current,
        selectedSquadId: nextSquad.id,
      }));
      setCheckInDraft((current) => ({
        ...current,
        squadId: nextSquad.id,
      }));

      return nextSquad.id;
    }

    const { squadId } = await persistJoinDayOnesSquad();
    await refreshFromBackend();
    setOnboardingDraft((current) => ({ ...current, selectedSquadId: squadId }));
    setCurrentUser((current) => ({ ...current, selectedSquadId: squadId }));
    setCheckInDraft((current) => ({ ...current, squadId }));
    return squadId;
  };

  const connectHealth = async (options?: { preview?: boolean }) => {
    setHealthLoading(true);

    try {
      const result = await connectAppleHealth({ usePreview: options?.preview });
      let snapshot = result.snapshot;
      setHealthConnection(normalizePersistedConnection(result.connection));
      setHealthSnapshot(snapshot);
      setHealthPreviewActive(Boolean(options?.preview));
      setManualFallbackEnabled(false);

      if (
        authState === "authenticated" &&
        !options?.preview &&
        snapshot &&
        (result.connection.state === "connected" ||
          result.connection.state === "connected_limited")
      ) {
        try {
          const metricWindow = getDemoMetricWindow();
          const persistedSnapshot = await recordAppleHealthSnapshot({
            state: result.connection.state,
            windowStartAt: metricWindow.startAt,
            windowEndAt: metricWindow.endAt,
            windowBucket: metricWindow.bucket,
            metrics: snapshot.metrics.map((metric) => ({
              key: metric.key,
              value: metric.value,
              unit: metric.unit,
              source: metric.source,
              observedAt: metric.observedAt,
              confidence: metric.confidence,
            })),
            coverage: snapshot.coverage.map((item) => ({
              key: item.key,
              available: item.available,
              reason: item.reason,
            })),
          });
          if (persistedSnapshot?.id) {
            snapshot = persistedSnapshot;
            setHealthSnapshot(persistedSnapshot);
          }
          await refreshFromBackend();
        } catch (error) {
          const message = getErrorMessage(
            error,
            "Connected to Apple Health, but we could not save your latest summary yet.",
          );
          console.warn("Apple Health persistence failed", error);
          const nextConnection = {
            ...normalizePersistedConnection(result.connection),
            lastError: message,
          };
          setHealthConnection(nextConnection);
          return {
            connection: nextConnection,
            snapshot,
          };
        }
      }

      return {
        connection: result.connection,
        snapshot,
      };
    } catch (error) {
      console.warn("Apple Health sync failed", error);
      setHealthConnection((current) => ({
        ...normalizePersistedConnection(current),
        state: "error",
        lastError: getErrorMessage(
          error,
          "Unable to connect Apple Health.",
        ),
      }));
      throw error;
    } finally {
      setHealthLoading(false);
    }
  };

  const enableManualFallback = () => {
    setManualFallbackEnabled(true);
    setHealthPreviewActive(false);
    setHealthConnection((current) => ({
      ...normalizePersistedConnection(current),
      state:
        current.state === "connected" || current.state === "connected_limited"
          ? current.state
          : "needs_attention",
    }));
  };

  const completeOnboarding = async () => {
    if (authState === "demo") {
      setOnboardingComplete(true);
      return;
    }

    if (!authSession) {
      throw new Error("Sign in before finishing setup.");
    }

    const selectedSquadId = resolveAvailableSquadId(onboardingDraft.selectedSquadId, squads);

    if (selectedSquadId !== onboardingDraft.selectedSquadId) {
      setOnboardingDraft((current) => ({ ...current, selectedSquadId }));
      setCurrentUser((current) => ({ ...current, selectedSquadId }));
      setCheckInDraft((current) => ({
        ...current,
        ...normalizeCheckInDraftSelection(current, squads),
      }));
    }

    await bootstrapOnboarding({
      name: onboardingDraft.name,
      username: onboardingDraft.username,
      missionLine: onboardingDraft.missionLine,
      city: onboardingDraft.city,
      pillars: onboardingDraft.pillars,
      goals: onboardingDraft.goals,
      accountabilityStyle: onboardingDraft.accountabilityStyle,
      defaultAudience: onboardingDraft.defaultAudience,
      selectedSquadId,
    });

    setOnboardingComplete(true);
    await refreshFromBackend();
  };

  const updateCheckInDraft = (patch: Partial<CheckInDraft>) => {
    setCheckInDraft((current) => ({ ...current, ...patch }));
  };

  const publishCheckIn = async () => {
    const normalizedDraftSelection = normalizeCheckInDraftSelection(checkInDraft, squads);
    const effectiveAudience = normalizedDraftSelection.audience;
    const effectiveSquadId = normalizedDraftSelection.squadId;
    const manualWorkoutName = checkInDraft.manualWorkoutName.trim();
    const durationMinutes = Number(checkInDraft.manualDurationMinutes);
    const activeEnergy = Number(checkInDraft.manualEnergy);
    const hasManualWorkoutDetails =
      Boolean(manualWorkoutName) && durationMinutes > 0 && activeEnergy > 0;
    let usingManualWorkoutFallback = manualFallbackEnabled;

    if (
      effectiveAudience !== checkInDraft.audience ||
      effectiveSquadId !== checkInDraft.squadId
    ) {
      setCheckInDraft((current) => ({
        ...current,
        ...normalizeCheckInDraftSelection(current, squads),
      }));
    }

    let snapshot = healthSnapshot;
    let metrics = snapshot?.metrics ?? [];

    if (
      checkInDraft.type === "workout" &&
      authState === "authenticated" &&
      !manualFallbackEnabled &&
      !healthPreviewActive &&
      !metrics.length &&
      !hasManualWorkoutDetails
    ) {
      const connected = await connectHealth();
      snapshot = connected.snapshot;
      metrics = snapshot?.metrics ?? [];
    }

    if (checkInDraft.type === "workout" && (manualFallbackEnabled || !metrics.length)) {
      if (!hasManualWorkoutDetails) {
        throw new Error(
          "Manual fallback needs a workout name, duration, and active energy before you can publish.",
        );
      }

      usingManualWorkoutFallback = true;
      snapshot = await seedManualWorkoutFallback({
        workoutName: manualWorkoutName,
        durationMinutes,
        activeEnergy,
      });
      metrics = snapshot.metrics;
      setHealthSnapshot(snapshot);
    }

    if (authState === "demo") {
      const selectedSquad = squads.find((squad) => squad.id === effectiveSquadId);
      const nextConsistency = calculateConsistency({
        days: [],
        selectedPillars: currentUser.pillars,
      });
      const nextPost: ProgressPost = {
        id: `post-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username,
        squadId: effectiveAudience === "squad" ? selectedSquad?.id : undefined,
        squadName: effectiveAudience === "squad" ? selectedSquad?.name : undefined,
        type: checkInDraft.type,
        audience: effectiveAudience,
        caption: checkInDraft.caption,
        createdAt: new Date().toISOString(),
        metrics: metrics.map((metric) => ({
          key: metric.key,
          label: metric.key,
          value: typeof metric.value === "boolean" ? String(metric.value) : metric.value ?? 0,
          unit: metric.unit,
        })),
        consistencyScore: nextConsistency.score,
        consistencyLabel: nextConsistency.label,
        reactions: {
          didThisToo: 0,
          commentCount: 0,
          emojis: [],
        },
        isCurrentUser: true,
      };
      setFeedPosts((current) => [nextPost, ...current]);
      setLastPublishedPostId(nextPost.id);
      setCheckInDraft((current) => ({ ...current, caption: "" }));
      return nextPost;
    }

    const sourceProvider = usingManualWorkoutFallback
      ? "manual"
      : healthPreviewActive
        ? "mock"
        : metrics.length
          ? "apple-health"
          : "manual";

    const createdPost = await createCheckIn({
      type: checkInDraft.type,
      audience: effectiveAudience,
      squadId: effectiveAudience === "squad" ? effectiveSquadId : undefined,
      caption: checkInDraft.caption,
      sourceProvider,
      sourceSnapshotId:
        usingManualWorkoutFallback || healthPreviewActive ? undefined : snapshot?.id,
      metrics: metrics
        .filter((metric) =>
          checkInDraft.type === "workout"
            ? ["workouts", "active-energy", "steps"].includes(metric.key)
            : true,
        )
        .map((metric) => ({
          key: metric.key,
          value: metric.value ?? 0,
          unit: metric.unit ?? null,
          source: metric.source ?? null,
          provider: usingManualWorkoutFallback ? "manual" : "apple-health",
          observedAt: metric.observedAt ?? null,
          confidence: metric.confidence,
        })),
    });

    setFeedPosts((current) => [createdPost, ...current.filter((post) => post.id !== createdPost.id)]);
    setConsistency((current) => ({
      ...current,
      score: createdPost.consistencyScore,
      label: createdPost.consistencyLabel,
    }));
    setLastPublishedPostId(createdPost.id);
    setCheckInDraft((current) => ({ ...current, caption: "" }));
    await refreshFromBackend();
    return createdPost;
  };

  const dismissPublishedCelebration = () => {
    setLastPublishedPostId(null);
  };

  const reactToPost = async (postId: string) => {
    const post = feedPosts.find((item) => item.id === postId);
    if (!post || post.isCurrentUser) return;

    const reacted = Boolean(post.reactions.didThisTooByCurrentUser);

    setFeedPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? {
              ...item,
              reactions: {
                ...item.reactions,
                didThisToo: Math.max(0, item.reactions.didThisToo + (reacted ? -1 : 1)),
                didThisTooByCurrentUser: !reacted,
              },
            }
          : item,
      ),
    );

    try {
      await persistReaction(postId, reacted);
    } catch {
      await refreshFromBackend();
    }
  };

  const toggleHabit = async (habitId: string) => {
    const target = habits.find((habit) => habit.id === habitId);
    if (!target) return;

    setHabits((current) =>
      current.map((habit) =>
        habit.id === habitId
          ? { ...habit, completedToday: !habit.completedToday }
          : habit,
      ),
    );

    if (authState === "demo") {
      return;
    }

    try {
      await toggleHabitCompletion(habitId, target.completedToday);
      await refreshFromBackend();
    } catch {
      await refreshFromBackend();
    }
  };

  const addHabit = async (title?: string) => {
    const nextTitle = getNextHabitTitle(habits, title);

    if (authState === "demo") {
      setHabits((current) => {
        if (current.length >= 3) {
          return current;
        }

        return [
          ...current,
          {
            id: `demo-habit-${createMessageId()}`,
            title: nextTitle,
            cadence: "Daily",
            completedToday: false,
            completionRate: 0,
            streakDays: 0,
            friendVisible: true,
          },
        ];
      });
      return;
    }

    await createHabit(nextTitle);
    await refreshFromBackend();
  };

  const openSquadChat = async (squadId: string) => {
    setChatLoading(true);
    setActiveSquadChatId(squadId);

    if (authState === "demo") {
      setChatOverviews((current) =>
        current.map((overview) =>
          overview.squadId === squadId ? { ...overview, unreadCount: 0 } : overview,
        ),
      );
      setChatLoading(false);
      return;
    }

    try {
      const items = await fetchSquadMessages(squadId);
      setSquadMessages((current) => ({
        ...current,
        [squadId]: mapSquadMessages(items),
      }));

      if (!chatSubscriptions.current[squadId]) {
        const channel = subscribeToSquadMessages(squadId, (message) => {
          setSquadMessages((current) => {
            const room = current[squadId] ?? [];
            const existingIndex = room.findIndex((item) => sameChatMessage(item, message));
            if (existingIndex >= 0) {
              const nextRoom = [...room];
              nextRoom[existingIndex] = {
                ...message,
                pending: false,
                failed: false,
              };
              return {
                ...current,
                [squadId]: nextRoom,
              };
            }
            return {
              ...current,
              [squadId]: [...room, message],
            };
          });
          setChatOverviews((current) =>
            current.map((overview) => {
              if (overview.squadId !== squadId) return overview;
              const isActiveRoom = activeSquadChatRef.current === squadId;
              const fromCurrentUser = message.authorId === currentUser.id;
              return {
                ...overview,
                unreadCount:
                  isActiveRoom || fromCurrentUser ? 0 : (overview.unreadCount ?? 0) + 1,
                lastMessageAt: message.createdAt,
                lastMessagePreview: message.body,
                lastMessageAuthorName: message.authorName,
              };
            }),
          );
        }) as { unsubscribe: () => void };
        chatSubscriptions.current[squadId] = channel;
      }

      await persistSquadChatRead(squadId);
      setChatOverviews((current) =>
        current.map((overview) =>
          overview.squadId === squadId ? { ...overview, unreadCount: 0 } : overview,
        ),
      );
    } finally {
      setChatLoading(false);
    }
  };

  const sendSquadMessage = async (squadId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;

    if (authState === "demo") {
      const message: SquadMessage = {
        id: `demo-message-${createMessageId()}`,
        squadId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };

      setSquadMessages((current) => ({
        ...current,
        [squadId]: [...(current[squadId] ?? []), message],
      }));
      setChatOverviews((current) => {
        const existing = current.find((overview) => overview.squadId === squadId);
        if (!existing) {
          return [
            {
              squadId,
              unreadCount: 0,
              lastMessageAt: message.createdAt,
              lastMessagePreview: message.body,
              lastMessageAuthorName: message.authorName,
            },
            ...current,
          ];
        }

        return current.map((overview) =>
          overview.squadId === squadId
            ? {
                ...overview,
                unreadCount: 0,
                lastMessageAt: message.createdAt,
                lastMessagePreview: message.body,
                lastMessageAuthorName: message.authorName,
              }
            : overview,
        );
      });
      return;
    }

    const pendingMessage: SquadMessage = {
      id: `pending-${createMessageId()}`,
      squadId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorUsername: currentUser.username,
      body: trimmed,
      createdAt: new Date().toISOString(),
      pending: true,
      clientMessageId: createMessageId(),
    };

    setSquadMessages((current) => ({
      ...current,
      [squadId]: [...(current[squadId] ?? []), pendingMessage],
    }));

    try {
      const saved = await persistSquadMessage(
        squadId,
        trimmed,
        pendingMessage.clientMessageId ?? createMessageId(),
      );
      setSquadMessages((current) => ({
        ...current,
        [squadId]: (current[squadId] ?? []).reduce<SquadMessage[]>((acc, message) => {
          if (message.id === pendingMessage.id) {
            if (!acc.some((item) => sameChatMessage(item, saved))) acc.push(saved);
            return acc;
          }

          if (!sameChatMessage(message, saved)) {
            acc.push(message);
          }

          return acc;
        }, []),
      }));
      setChatOverviews((current) => {
        const existing = current.find((overview) => overview.squadId === squadId);
        if (!existing) {
          return [
            {
              squadId,
              unreadCount: 0,
              lastMessageAt: saved.createdAt,
              lastMessagePreview: saved.body,
              lastMessageAuthorName: saved.authorName,
            },
            ...current,
          ];
        }
        return current.map((overview) =>
          overview.squadId === squadId
            ? {
                ...overview,
                lastMessageAt: saved.createdAt,
                lastMessagePreview: saved.body,
                lastMessageAuthorName: saved.authorName,
              }
            : overview,
        );
      });
    } catch {
      setSquadMessages((current) => ({
        ...current,
        [squadId]: (current[squadId] ?? []).map((message) =>
          message.id === pendingMessage.id ? { ...message, pending: false, failed: true } : message,
        ),
      }));
      throw new Error("Unable to send that message right now.");
    }
  };

  const markSquadChatRead = async (squadId: string) => {
    if (authState === "demo") {
      setActiveSquadChatId((current) => (current === squadId ? null : current));
      setChatOverviews((current) =>
        current.map((overview) =>
          overview.squadId === squadId ? { ...overview, unreadCount: 0 } : overview,
        ),
      );
      return;
    }

    await persistSquadChatRead(squadId);
    setActiveSquadChatId((current) => (current === squadId ? null : current));
    setChatOverviews((current) =>
      current.map((overview) =>
        overview.squadId === squadId ? { ...overview, unreadCount: 0 } : overview,
      ),
    );
  };

  const runSignIn = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    setDemoMode(false);
    try {
      await signIn(email, password);
      setAuthEmail(email.trim());
      await persistFrontendState({ demoMode: false, authEmail: email.trim() });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const runSignUp = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    setDemoMode(false);
    try {
      const result = await signUp(email, password);
      setAuthEmail(email.trim());
      await persistFrontendState({ demoMode: false, authEmail: email.trim() });
      return {
        needsEmailConfirmation: result.requiresEmailConfirmation,
      };
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to create that account.");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const runSignOut = async () => {
    setAuthLoading(true);
    try {
      await signOut();
      disconnectChatSubscriptions();
      setDemoMode(false);
      setAuthSession(null);
      setAuthState("signed-out");
      setAuthEmail("");
      setOnboardingComplete(false);
      setCurrentUser(emptyUser);
      setFriends([]);
      setSquads([]);
      setHabits([]);
      setFeedPosts([]);
      setHomeSegment("squads");
      setOnboardingDraft(onboardingDraftSeed);
      setCheckInDraft(checkInDraftSeed);
      setHealthConnection(defaultConnection);
      setHealthSnapshot(null);
      setHealthPreviewActive(false);
      setManualFallbackEnabled(false);
      setAuthError(null);
      setChatOverviews([]);
      setSquadMessages({});
      setActiveSquadChatId(null);
      await persistFrontendState({
        homeSegment: "squads",
        onboardingDraft: onboardingDraftSeed,
        checkInDraft: checkInDraftSeed,
        manualFallbackEnabled: false,
        healthPreviewActive: false,
        demoMode: false,
        authEmail: "",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const sendFriendInvite = async (username: string, message?: string) => {
    if (authState === "demo") {
      return {
        inviteToken: createInviteToken(),
      };
    }

    const invite = await createFriendInviteByUsername(username, message);
    await refreshFromBackend();
    return {
      inviteToken: invite.inviteToken,
    };
  };

  const createSquad = async (input: {
    name: string;
    handle: string;
    description?: string;
    currentFocus?: string;
  }) => {
    if (authState === "demo") {
      const squadId = `demo-squad-${Date.now()}`;
      const inviteToken = createInviteToken();
      const squad: Squad = {
        id: squadId,
        ownerId: currentUser.id || userSeed.id,
        name: input.name.trim(),
        handle: input.handle.trim().replace(/^@/, ""),
        description: input.description?.trim() || "",
        currentFocus: input.currentFocus?.trim() || "",
        memberCount: 1,
      };

      setSquads((current) => [squad, ...current]);
      setCurrentUser((current) => ({ ...current, selectedSquadId: squadId }));
      setOnboardingDraft((current) => ({ ...current, selectedSquadId: squadId }));
      setCheckInDraft((current) => ({ ...current, squadId }));
      setChatOverviews((current) => [
        {
          squadId,
          unreadCount: 0,
        },
        ...current,
      ]);

      return {
        squadId,
        inviteToken,
      };
    }

    const squad = await persistCreateSquad(input);
    const invite = await persistCreateSquadInviteToken(squad.id);
    await refreshFromBackend();
    return {
      squadId: squad.id,
      inviteToken: invite.inviteToken,
    };
  };

  const createSquadInviteToken = async (squadId: string, inviteeId?: string) => {
    if (authState === "demo") {
      return {
        inviteToken: createInviteToken(),
      };
    }

    const invite = await persistCreateSquadInviteToken(squadId, inviteeId);
    await refreshFromBackend();
    return {
      inviteToken: invite.inviteToken,
    };
  };

  const acceptInvite = async (input: { kind: "friend" | "squad"; token: string }) => {
    if (authState === "demo") {
      const tokenSuffix =
        input.token.trim().replace(/[^a-zA-Z0-9]/g, "").slice(-4).toLowerCase() ||
        createMessageId().slice(0, 4);

      if (input.kind === "friend") {
        const friendId = `demo-friend-${tokenSuffix}`;
        const username = `friend${tokenSuffix}`;
        setFriends((current) =>
          current.some((friend) => friend.id === friendId || friend.username === username)
            ? current
            : [
                {
                  id: friendId,
                  name: `Friend ${tokenSuffix.toUpperCase()}`,
                  username,
                  streakLabel: "Fresh connection",
                },
                ...current,
              ],
        );
        return;
      }

      const squadId = `demo-squad-${tokenSuffix}`;
      const nextSquad: Squad = {
        id: squadId,
        ownerId: `demo-owner-${tokenSuffix}`,
        name: `Momentum ${tokenSuffix.toUpperCase()}`,
        handle: `momentum-${tokenSuffix}`,
        description: "Demo invite squad",
        currentFocus: "Stay consistent this week.",
        memberCount: 4,
      };

      setSquads((current) =>
        current.some((squad) => squad.id === squadId) ? current : [nextSquad, ...current],
      );
      setChatOverviews((current) =>
        current.some((overview) => overview.squadId === squadId)
          ? current
          : [
              {
                squadId,
                unreadCount: 0,
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: "Glad you're in. Use the room to keep each other moving.",
                lastMessageAuthorName: "Squad host",
              },
              ...current,
            ],
      );
      setSquadMessages((current) =>
        current[squadId]
          ? current
          : {
              ...current,
              [squadId]: [
                {
                  id: `demo-seed-message-${tokenSuffix}`,
                  squadId,
                  authorId: `demo-owner-${tokenSuffix}`,
                  authorName: "Squad host",
                  authorUsername: `host${tokenSuffix}`,
                  body: "Glad you're in. Use the room to keep each other moving.",
                  createdAt: new Date().toISOString(),
                },
              ],
            },
      );

      if (!currentUser.selectedSquadId) {
        setCurrentUser((current) => ({ ...current, selectedSquadId: squadId }));
        setOnboardingDraft((current) => ({ ...current, selectedSquadId: squadId }));
        setCheckInDraft((current) => ({ ...current, squadId }));
      }
      return;
    }

    if (input.kind === "friend") {
      await persistAcceptFriendInvite(input.token);
    } else {
      await persistAcceptSquadInvite(input.token);
    }

    await refreshFromBackend();
  };

  const startDemoSession = async () => {
    setDemoMode(true);
    setAuthState("demo");
    setOnboardingComplete(true);
    setCurrentUser(userSeed);
    setFriends(friendsSeed);
    setSquads(squadsSeed);
    setHabits(habitsSeed);
    setFeedPosts(postsSeed);
    setHealthConnection(appleHealthPreviewConnection);
    setHealthSnapshot(appleHealthPreviewSnapshot);
    setHealthPreviewActive(true);
    setManualFallbackEnabled(false);
    setHealthLoading(false);
    setHomeSegment("squads");
    setCheckInDraft(checkInDraftSeed);
    setConsistency(consistencySeed);
    setLastPublishedPostId(null);
    setChatOverviews(
      squadsSeed.map((squad, index) => ({
        squadId: squad.id,
        unreadCount: index === 0 ? 2 : 0,
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: index === 0 ? "Morning check-ins hit different when everyone shows up." : "",
        lastMessageAuthorName: index === 0 ? "Maya Chen" : undefined,
      })),
    );
    setSquadMessages({
      "squad-1": [
        {
          id: "seed-chat-1",
          squadId: "squad-1",
          authorId: "friend-1",
          authorName: "Maya Chen",
          authorUsername: "mayamoves",
          body: "Morning check-ins hit different when everyone shows up.",
          createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
        },
        {
          id: "seed-chat-2",
          squadId: "squad-1",
          authorId: "friend-2",
          authorName: "Jordan Ellis",
          authorUsername: "jordanset",
          body: "Posting mine after the lift. Keep the room honest today.",
          createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        },
      ],
    });
    await persistFrontendState({
      demoMode: true,
      healthPreviewActive: true,
      manualFallbackEnabled: false,
    });
  };

  const resetDemoSession = async () => {
    disconnectChatSubscriptions();
    setDemoMode(false);
    setAuthState("signed-out");
    setOnboardingComplete(false);
    setOnboardingDraft(onboardingDraftSeed);
    setCurrentUser(emptyUser);
    setFriends([]);
    setSquads([]);
    setHabits([]);
    setFeedPosts([]);
    setHealthConnection(defaultConnection);
    setHealthSnapshot(null);
    setHealthPreviewActive(false);
    setManualFallbackEnabled(false);
    setCheckInDraft(checkInDraftSeed);
    setConsistency(consistencySeed);
    setLastPublishedPostId(null);
    setChatOverviews([]);
    setSquadMessages({});
    setActiveSquadChatId(null);
    await AsyncStorage.removeItem(sessionStorageKey).catch(() => null);
  };

  const contextValue = useMemo<MomentumSessionValue>(
    () => ({
      sessionHydrated,
      authReady,
      authState,
      onboardingComplete,
      authEmail,
      onboardingDraft,
      currentUser,
      friends,
      squads,
      habits,
      feedPosts,
      homeSegment,
      healthConnection,
      healthSnapshot,
      healthPreviewActive,
      manualFallbackEnabled,
      healthLoading,
      checkInDraft,
      consistency,
      lastPublishedPostId,
      chatOverviews,
      squadMessages,
      activeSquadChatId,
      chatLoading,
      authLoading,
      authError,
      setGoals,
      setPillars,
      setAccountabilityStyle,
      setProfileBasics,
      setSelectedSquad,
      connectHealth,
      enableManualFallback,
      completeOnboarding,
      setHomeSegment,
      updateCheckInDraft,
      publishCheckIn,
      dismissPublishedCelebration,
      reactToPost,
      toggleHabit,
      addHabit,
      refreshFromBackend,
      joinDayOnesSquad,
      signIn: runSignIn,
      signUp: runSignUp,
      signOut: runSignOut,
      sendFriendInvite,
      createSquad,
      createSquadInviteToken,
      acceptInvite,
      openSquadChat,
      sendSquadMessage,
      markSquadChatRead,
      startDemoSession,
      resetDemoSession,
    }),
    [
      activeSquadChatId,
      acceptInvite,
      addHabit,
      authEmail,
      authError,
      authLoading,
      authReady,
      authState,
      chatLoading,
      chatOverviews,
      checkInDraft,
      completeOnboarding,
      createSquad,
      createSquadInviteToken,
      connectHealth,
      consistency,
      currentUser,
      feedPosts,
      friends,
      habits,
      healthConnection,
      healthLoading,
      healthPreviewActive,
      healthSnapshot,
      homeSegment,
      joinDayOnesSquad,
      lastPublishedPostId,
      manualFallbackEnabled,
      onboardingComplete,
      onboardingDraft,
      sessionHydrated,
      sendFriendInvite,
      squadMessages,
      squads,
    ],
  );

  return (
    <MomentumSessionContext.Provider value={contextValue}>
      {children}
    </MomentumSessionContext.Provider>
  );
}

export function useMomentumSession() {
  const context = useContext(MomentumSessionContext);

  if (!context) {
    throw new Error("useMomentumSession must be used within MomentumSessionProvider");
  }

  return context;
}
