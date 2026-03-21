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
import { AppState, Linking } from "react-native";

import { calculateConsistency } from "@/src/domain/consistency";
import type {
  ConnectionRecord,
  ConsistencyResult,
  ManagedIntegrationProvider,
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
  stravaPreviewConnection,
  stravaPreviewSnapshot,
  squadsSeed,
  userSeed,
  whoopPreviewConnection,
  whoopPreviewSnapshot,
} from "@/src/data/fixtures/appSeed";
import { characterSeed } from "@/src/data/fixtures/characterSeed";
import type { CharacterProfile } from "@/src/domain/models";
import {
  bootstrapOnboarding,
  createFriendInviteByUsername,
  createHabit,
  createCheckIn,
  createSquad as persistCreateSquad,
  createSquadInviteToken as persistCreateSquadInviteToken,
  deleteAccount as deleteAccountRequest,
  disconnectRemoteProvider,
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
  startProviderOAuth,
  syncRemoteProvider,
  subscribeToSquadMessages,
  toggleHabitCompletion,
  transferSquadOwnership as persistTransferSquadOwnership,
  type SquadChatOverview,
  type SquadMessageItem,
} from "@/src/data/repositories/appRepository";
import {
  connectAppleHealth,
  getDemoMetricWindow,
  seedManualWorkoutFallback,
} from "@/src/data/repositories/healthRepository";
import { supabase, ensureSupabaseSessionRefresh } from "@/src/lib/supabase/client";
import { isHealthSnapshotFresh } from "@/src/lib/health";
import {
  createDefaultProviderConnections,
  createDefaultProviderSnapshots,
  defaultManagedProvider,
  formatProviderLabel,
  getMetricsForPostType,
  getSnapshotFlags,
  isManagedProvider,
  normalizeProviderConnection,
  pickProviderForCheckIn,
  toProviderConnectionMap,
  toProviderSnapshotMap,
} from "@/src/lib/providers";
import type {
  AccountabilityStyle,
  AudienceVisibility,
  AuthState,
  BootstrapStatus,
  CheckInDraft,
  CheckInSourcePreference,
  FocusPillar,
  Friend,
  Habit,
  HomeSegment,
  OnboardingDraft,
  ProgressPost,
  ProviderConnectionMap,
  ProviderSnapshotMap,
  Squad,
  SquadMessage,
  UserProfile,
} from "@/src/features/app/sessionTypes";

type MomentumSessionValue = {
  sessionHydrated: boolean;
  authReady: boolean;
  authState: AuthState;
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;
  onboardingComplete: boolean;
  authEmail: string;
  onboardingDraft: OnboardingDraft;
  currentUser: UserProfile;
  friends: Friend[];
  squads: Squad[];
  habits: Habit[];
  feedPosts: ProgressPost[];
  homeSegment: HomeSegment;
  providerConnections: ProviderConnectionMap;
  providerSnapshots: ProviderSnapshotMap;
  healthConnection: ConnectionRecord;
  healthSnapshot: ProviderSnapshot | null;
  healthPreviewActive: boolean;
  manualFallbackEnabled: boolean;
  healthLoading: boolean;
  checkInDraft: CheckInDraft;
  consistency: ConsistencyResult;
  character: CharacterProfile;
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
  connectProvider: (
    provider: ManagedIntegrationProvider,
    options?: { preview?: boolean },
  ) => Promise<{ connection: ConnectionRecord; snapshot: ProviderSnapshot | null }>;
  refreshProvider: (provider: ManagedIntegrationProvider) => Promise<void>;
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
  disconnectProvider: (
    provider: Exclude<ManagedIntegrationProvider, "apple-health">,
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
  transferSquadOwnership: (squadId: string, newOwnerId: string) => Promise<void>;
  handleIntegrationCallback: (provider: ManagedIntegrationProvider) => Promise<void>;
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
  demoMode: boolean;
  authUserId: string | null;
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
  demoMode: false,
  authUserId: null,
};

const MomentumSessionContext = createContext<MomentumSessionValue | null>(null);
const sessionStorageKey = "@project-momentum/frontend-v3";
const legacySessionStorageKeys = ["@project-momentum/frontend-v2"];

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
  return normalizeProviderConnection(defaultManagedProvider, connection);
}

function hasFreshSyncedHealthSnapshot(
  connection: ConnectionRecord,
  snapshot: ProviderSnapshot | null,
  options?: { preview?: boolean },
) {
  if (options?.preview) {
    return Boolean(snapshot?.metrics.length);
  }

  return Boolean(
    snapshot?.metrics.length &&
      isHealthSnapshotFresh(snapshot) &&
      (!connection.lastError || !snapshot?.id) &&
      (connection.state === "connected" || connection.state === "connected_limited"),
  );
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

function parseIntegrationCallbackUrl(url: string) {
  try {
    const parsed = new URL(url);
    const providerFromHost =
      parsed.hostname === "integrations"
        ? parsed.pathname.split("/").filter(Boolean)[0]
        : null;
    const providerFromUrl =
      providerFromHost ??
      url.match(/integrations\/([^/?#]+)\/callback/u)?.[1] ??
      null;

    if (!providerFromUrl || !isManagedProvider(providerFromUrl)) {
      return null;
    }

    return {
      provider: providerFromUrl,
      status: parsed.searchParams.get("status") ?? undefined,
      reason:
        parsed.searchParams.get("message") ??
        parsed.searchParams.get("reason") ??
        undefined,
    };
  } catch {
    return null;
  }
}

export function MomentumSessionProvider({
  children,
}: React.PropsWithChildren) {
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("signed-out");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>("idle");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
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
  const [providerConnections, setProviderConnections] =
    useState<ProviderConnectionMap>(createDefaultProviderConnections());
  const [providerSnapshots, setProviderSnapshots] =
    useState<ProviderSnapshotMap>(createDefaultProviderSnapshots());
  const [healthPreviewActive, setHealthPreviewActive] = useState(false);
  const [manualFallbackEnabled, setManualFallbackEnabled] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [checkInDraft, setCheckInDraft] = useState<CheckInDraft>(checkInDraftSeed);
  const [consistency, setConsistency] = useState<ConsistencyResult>(consistencySeed);
  const [character, setCharacter] = useState<CharacterProfile>(characterSeed);
  const [lastPublishedPostId, setLastPublishedPostId] = useState<string | null>(null);
  const [chatOverviews, setChatOverviews] = useState<SquadChatOverview[]>([]);
  const [squadMessages, setSquadMessages] = useState<Record<string, SquadMessage[]>>({});
  const [activeSquadChatId, setActiveSquadChatId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const chatSubscriptions = useRef<Record<string, { unsubscribe: () => void }>>({});
  const activeSquadChatRef = useRef<string | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  const handledIntegrationUrlsRef = useRef<Set<string>>(new Set());
  const bootstrapRequestIdRef = useRef(0);
  const onboardingCompletionInFlightRef = useRef(false);
  const onboardingBootstrapConfirmationRef = useRef(false);

  const healthConnection =
    providerConnections[defaultManagedProvider] ?? defaultConnection;
  const healthSnapshot = providerSnapshots[defaultManagedProvider] ?? null;

  const setManagedProviderConnection = (
    provider: ManagedIntegrationProvider,
    connection: ConnectionRecord,
  ) => {
    setProviderConnections((current) => ({
      ...current,
      [provider]: normalizeProviderConnection(provider, connection),
    }));
  };

  const setManagedProviderSnapshot = (
    provider: ManagedIntegrationProvider,
    snapshot: ProviderSnapshot | null,
  ) => {
    setProviderSnapshots((current) => ({
      ...current,
      [provider]: snapshot,
    }));
  };

  const persistFrontendState = async (
    overrides?: Partial<PersistedFrontendState>,
  ) => {
    const payload: PersistedFrontendState = {
      ...defaultFrontendState,
      ...overrides,
      demoMode: overrides?.demoMode ?? demoMode,
      homeSegment: overrides?.homeSegment ?? homeSegment,
      authUserId: overrides?.authUserId ?? authUserId,
    };

    await AsyncStorage.setItem(sessionStorageKey, JSON.stringify(payload)).catch(() => null);
  };

  const disconnectChatSubscriptions = () => {
    Object.values(chatSubscriptions.current).forEach((subscription) => {
      subscription.unsubscribe();
    });
    chatSubscriptions.current = {};
  };

  const syncUserProfileState = (
    user: UserProfile,
    consistencySnapshot?: Pick<ConsistencyResult, "score" | "label">,
  ) => {
    setCurrentUser(user);
    setOnboardingDraft({
      goals: user.goals,
      pillars: user.pillars,
      accountabilityStyle: user.accountabilityStyle,
      defaultAudience: user.defaultAudience ?? onboardingDraftSeed.defaultAudience,
      name: user.name,
      username: user.username,
      missionLine: user.missionLine,
      city: user.city ?? "",
      selectedSquadId: user.selectedSquadId,
    });
    setConsistency(
      buildConsistency(
        consistencySnapshot?.score,
        consistencySnapshot?.label,
        user.pillars,
      ),
    );
  };

  const resetUserScopedState = () => {
    disconnectChatSubscriptions();
    setOnboardingComplete(false);
    setOnboardingDraft(onboardingDraftSeed);
    setCurrentUser(emptyUser);
    setFriends([]);
    setSquads([]);
    setHabits([]);
    setFeedPosts([]);
    setProviderConnections(createDefaultProviderConnections());
    setProviderSnapshots(createDefaultProviderSnapshots());
    setHealthPreviewActive(false);
    setManualFallbackEnabled(false);
    setHealthLoading(false);
    setCheckInDraft(checkInDraftSeed);
    setConsistency(buildConsistency(undefined, undefined, []));
    setLastPublishedPostId(null);
    setChatOverviews([]);
    setSquadMessages({});
    setActiveSquadChatId(null);
    setChatLoading(false);
  };

  const applyBackendData = async (
    options: { mode?: "bootstrap" | "refresh" } = {},
  ) => {
    const requestUserId = authSession?.user.id;
    if (!requestUserId) {
      resetUserScopedState();
      setBootstrapStatus("idle");
      setBootstrapError(null);
      return;
    }

    const mode = options.mode ?? "bootstrap";
    const requestId = ++bootstrapRequestIdRef.current;
    const shouldApplyResponse = () =>
      bootstrapRequestIdRef.current === requestId &&
      authUserIdRef.current === requestUserId;

    if (mode === "bootstrap") {
      setBootstrapStatus("loading");
      setBootstrapError(null);
    }

    try {
      const data = await fetchAppBootstrapData(requestUserId);
      if (!shouldApplyResponse()) {
        return;
      }
      const isOnboarded = Boolean(data.currentUser);

      if (!isOnboarded && onboardingBootstrapConfirmationRef.current) {
        return;
      }

      if (isOnboarded) {
        onboardingBootstrapConfirmationRef.current = false;
      }

      setOnboardingComplete(isOnboarded);
      setFriends(data.friends);
      setSquads(data.squads);
      setHabits(data.habits);
      setFeedPosts(data.feedPosts);
      setProviderConnections(toProviderConnectionMap(data.providerConnections));
      setProviderSnapshots(toProviderSnapshotMap(data.providerSnapshots));
      setChatOverviews(data.chatOverviews);
      setBootstrapStatus(isOnboarded ? "ready" : "needs_onboarding");
      setBootstrapError(null);

      if (data.currentUser) {
        syncUserProfileState(data.currentUser, data.consistency);
      } else {
        setCurrentUser(emptyUser);
        setConsistency(buildConsistency(undefined, undefined, onboardingDraftSeed.pillars));
      }
    } catch (error) {
      if (mode === "bootstrap" && shouldApplyResponse()) {
        setBootstrapStatus("error");
        setBootstrapError(
          getErrorMessage(
            error,
            "We could not load this account yet. Retry or sign out and try again.",
          ),
        );
      }
      throw error;
    }
  };

  const handleAuthSessionChange = (session: Session | null) => {
    const nextUserId = session?.user.id ?? null;
    const userChanged = authUserIdRef.current !== nextUserId;

    bootstrapRequestIdRef.current += 1;
    onboardingCompletionInFlightRef.current = false;
    onboardingBootstrapConfirmationRef.current = false;

    if (userChanged) {
      resetUserScopedState();
      setBootstrapStatus(nextUserId ? "loading" : "idle");
      setBootstrapError(null);
      setAuthError(null);
    }

    authUserIdRef.current = nextUserId;
    setAuthUserId(nextUserId);
    setAuthSession(session);
    setAuthState(session ? "authenticated" : "signed-out");
    setAuthEmail(session?.user.email ?? "");
    if (!session) {
      setBootstrapStatus("idle");
      setBootstrapError(null);
    }
    setAuthReady(true);
  };

  const applyDemoState = () => {
    setDemoMode(true);
    setAuthState("demo");
    setAuthUserId(null);
    setAuthSession(null);
    setAuthReady(true);
    setBootstrapStatus("ready");
    setBootstrapError(null);
    setOnboardingComplete(true);
    setCurrentUser(userSeed);
    setFriends(friendsSeed);
    setSquads(squadsSeed);
    setHabits(habitsSeed);
    setFeedPosts(postsSeed);
    setProviderConnections({
      "apple-health": appleHealthPreviewConnection,
      strava: stravaPreviewConnection,
      whoop: whoopPreviewConnection,
    });
    setProviderSnapshots({
      "apple-health": appleHealthPreviewSnapshot,
      strava: stravaPreviewSnapshot,
      whoop: whoopPreviewSnapshot,
    });
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
        lastMessagePreview:
          index === 0 ? "Morning check-ins hit different when everyone shows up." : "",
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
            if (typeof parsed.demoMode === "boolean") {
              persistedDemoMode = parsed.demoMode;
              setDemoMode(parsed.demoMode);
            }
            if ("authUserId" in parsed) {
              authUserIdRef.current = parsed.authUserId ?? null;
              setAuthUserId(parsed.authUserId ?? null);
            }
          }
        }

        await Promise.all(
          legacySessionStorageKeys.map((key) => AsyncStorage.removeItem(key).catch(() => null)),
        );

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (persistedDemoMode && !session) {
          applyDemoState();
          setSessionHydrated(true);
          return;
        }

        handleAuthSessionChange(session);
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
      handleAuthSessionChange(session);
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
  }, [authUserId, demoMode, homeSegment, sessionHydrated]);

  useEffect(() => {
    if (!authReady || authState !== "authenticated" || !authSession?.user.id) return;
    if (onboardingCompletionInFlightRef.current) return;
    if (
      bootstrapStatus !== "idle" &&
      bootstrapStatus !== "loading" &&
      bootstrapStatus !== "error"
    ) {
      return;
    }

    void applyBackendData({ mode: "bootstrap" });
  }, [authReady, authSession?.user.id, authState, bootstrapStatus]);

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
    await applyBackendData({
      mode:
        bootstrapStatus === "idle" ||
        bootstrapStatus === "loading" ||
        bootstrapStatus === "error"
          ? "bootstrap"
          : "refresh",
    });
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

    if (authState === "authenticated" && bootstrapStatus === "ready") {
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

  const connectProvider = async (
    provider: ManagedIntegrationProvider,
    options?: { preview?: boolean },
  ) => {
    if (provider !== "apple-health") {
      if (authState !== "authenticated") {
        throw new Error(`${formatProviderLabel(provider)} requires a signed-in account.`);
      }

      const currentConnection = providerConnections[provider];
      setManagedProviderConnection(provider, {
        ...currentConnection,
        state: "authorizing",
        lastError: undefined,
      });

      try {
        const payload = await startProviderOAuth(provider);
        const nextConnection = {
          ...currentConnection,
          state: "authorizing",
          lastError: undefined,
        } satisfies ConnectionRecord;
        setManagedProviderConnection(provider, nextConnection);

        const connectUrl = payload.authorizationUrl;
        if (connectUrl) {
          await Linking.openURL(connectUrl);
        } else {
          throw new Error(`Unable to open ${formatProviderLabel(provider)} connect flow.`);
        }

        return {
          connection: nextConnection,
          snapshot: providerSnapshots[provider] ?? null,
        };
      } catch (error) {
        const message = getErrorMessage(
          error,
          `Unable to connect ${formatProviderLabel(provider)} right now.`,
        );
        setManagedProviderConnection(provider, {
          ...currentConnection,
          state: currentConnection.state === "connected" ? "connected" : "needs_attention",
          lastError: message,
        });
        throw error;
      }
    }

    setHealthLoading(true);

    try {
      const previousSnapshot = healthSnapshot;
      const result = await connectAppleHealth({ usePreview: options?.preview });
      let snapshot = result.snapshot;
      setManagedProviderConnection("apple-health", result.connection);
      setHealthPreviewActive(Boolean(options?.preview));
      setManualFallbackEnabled(false);

      if (options?.preview || authState !== "authenticated") {
        setManagedProviderSnapshot("apple-health", snapshot);
      }

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
            setManagedProviderSnapshot("apple-health", persistedSnapshot);
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
          setManagedProviderConnection("apple-health", nextConnection);
          setManagedProviderSnapshot("apple-health", snapshot ?? previousSnapshot);
          return {
            connection: nextConnection,
            snapshot: snapshot ?? previousSnapshot,
          };
        }
      } else if (!options?.preview) {
        setManagedProviderSnapshot("apple-health", snapshot);
      }

      return {
        connection: result.connection,
        snapshot,
      };
    } catch (error) {
      console.warn("Apple Health sync failed", error);
      setManagedProviderConnection("apple-health", {
        ...normalizePersistedConnection(healthConnection),
        state: "error",
        lastError: getErrorMessage(
          error,
          "Unable to connect Apple Health.",
        ),
      });
      throw error;
    } finally {
      setHealthLoading(false);
    }
  };

  const refreshProvider = async (provider: ManagedIntegrationProvider) => {
    if (provider === "apple-health") {
      await connectProvider("apple-health");
      return;
    }

    const currentConnection = providerConnections[provider];
    setManagedProviderConnection(provider, {
      ...currentConnection,
      state: "syncing",
      lastError: undefined,
    });

    try {
      await syncRemoteProvider(provider);
      await refreshFromBackend();
    } catch (error) {
      setManagedProviderConnection(provider, {
        ...normalizeProviderConnection(provider, currentConnection),
        state:
          currentConnection.state === "connected" ||
          currentConnection.state === "connected_limited"
            ? currentConnection.state
            : "needs_attention",
        lastError: getErrorMessage(
          error,
          `Unable to refresh ${formatProviderLabel(provider)} right now.`,
        ),
      });
      throw error;
    }
  };

  const connectHealth = async (options?: { preview?: boolean }) =>
    connectProvider("apple-health", options);

  const handleIntegrationCallback = async (provider: ManagedIntegrationProvider) => {
    if (!isManagedProvider(provider)) {
      return;
    }

    setManagedProviderConnection(provider, {
      ...providerConnections[provider],
      state: "syncing",
      lastError: undefined,
    });
    await refreshFromBackend();
  };

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (handledIntegrationUrlsRef.current.has(url)) {
        return;
      }
      const callback = parseIntegrationCallbackUrl(url);
      if (!callback || callback.provider === "apple-health") {
        return;
      }
      handledIntegrationUrlsRef.current.add(url);

      if (callback.status === "error") {
        setManagedProviderConnection(callback.provider, {
          ...providerConnections[callback.provider],
          state: "needs_attention",
          lastError:
            callback.reason ??
            `${formatProviderLabel(callback.provider)} could not finish connecting.`,
        });
        return;
      }

      if (callback.status === "disconnected") {
        setManagedProviderConnection(callback.provider, {
          ...providerConnections[callback.provider],
          state: "disconnected",
          lastError: undefined,
        });
        return;
      }

      void handleIntegrationCallback(callback.provider).catch((error) => {
        setManagedProviderConnection(callback.provider, {
          ...providerConnections[callback.provider],
          state: "needs_attention",
          lastError: getErrorMessage(
            error,
            `${formatProviderLabel(callback.provider)} needs another refresh.`,
          ),
        });
      });
    };

    void Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleUrl({ url });
        }
      })
      .catch(() => null);

    const subscription = Linking.addEventListener("url", handleUrl);

    return () => {
      subscription.remove();
    };
  }, [handleIntegrationCallback, providerConnections]);

  const enableManualFallback = () => {
    setManualFallbackEnabled(true);
    setHealthPreviewActive(false);
    setManagedProviderConnection("apple-health", {
      ...normalizePersistedConnection(healthConnection),
      state:
        healthConnection.state === "connected" || healthConnection.state === "connected_limited"
          ? healthConnection.state
          : "needs_attention",
    });
  };

  const disconnectProvider = async (
    provider: Exclude<ManagedIntegrationProvider, "apple-health">,
  ) => {
    const currentConnection = providerConnections[provider];
    setManagedProviderConnection(provider, {
      ...currentConnection,
      state: "syncing",
      lastError: undefined,
    });

    try {
      await disconnectRemoteProvider(provider);
      await refreshFromBackend();
    } catch (error) {
      setManagedProviderConnection(provider, {
        ...normalizeProviderConnection(provider, currentConnection),
        lastError: getErrorMessage(
          error,
          `Unable to disconnect ${formatProviderLabel(provider)} right now.`,
        ),
      });
      throw error;
    }
  };

  const completeOnboarding = async () => {
    if (authState === "demo") {
      setOnboardingComplete(true);
      setBootstrapStatus("ready");
      setBootstrapError(null);
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

    onboardingCompletionInFlightRef.current = true;
    setBootstrapStatus("loading");
    setBootstrapError(null);

    try {
      const completedUser = await bootstrapOnboarding({
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

      onboardingBootstrapConfirmationRef.current = true;
      setOnboardingComplete(true);
      setBootstrapStatus("ready");
      setBootstrapError(null);
      syncUserProfileState(completedUser);
      setCheckInDraft((current) => {
        const nextDraft = {
          ...current,
          squadId: current.squadId ?? selectedSquadId,
        };

        return {
          ...nextDraft,
          ...normalizeCheckInDraftSelection(nextDraft, squads),
        };
      });
      void applyBackendData({ mode: "refresh" }).catch(() => null);
    } catch (error) {
      setBootstrapStatus("error");
      setBootstrapError(
        getErrorMessage(
          error,
          "We could not finish setup yet. Retry after checking your profile details.",
        ),
      );
      throw error;
    } finally {
      onboardingCompletionInFlightRef.current = false;
    }
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

    let { provider: resolvedSourceProvider, snapshot, metrics } = pickProviderForCheckIn({
      type: checkInDraft.type,
      sourcePreference: checkInDraft.sourcePreference,
      providerConnections,
      providerSnapshots,
      appleHealthPreviewActive: healthPreviewActive,
    });

    if (
      checkInDraft.type === "workout" &&
      authState === "authenticated" &&
      checkInDraft.sourcePreference !== "manual" &&
      !manualFallbackEnabled &&
      (checkInDraft.sourcePreference === "auto" ||
        checkInDraft.sourcePreference === "apple-health") &&
      !metrics.length &&
      !hasManualWorkoutDetails
    ) {
      const connected = await connectHealth();
      if (connected.snapshot) {
        snapshot = connected.snapshot;
      }
      const nextSource = pickProviderForCheckIn({
        type: checkInDraft.type,
        sourcePreference: checkInDraft.sourcePreference,
        providerConnections: {
          ...providerConnections,
          "apple-health": normalizePersistedConnection(connected.connection),
        },
        providerSnapshots: {
          ...providerSnapshots,
          "apple-health": connected.snapshot ?? snapshot,
        },
        appleHealthPreviewActive: healthPreviewActive,
      });
      resolvedSourceProvider = nextSource.provider;
      snapshot = nextSource.snapshot;
      metrics = nextSource.metrics;
    }

    if (
      checkInDraft.type === "workout" &&
      (manualFallbackEnabled || resolvedSourceProvider === "manual" || !metrics.length)
    ) {
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
      resolvedSourceProvider = "manual";
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
          provider: resolvedSourceProvider ?? metric.provider,
          source: metric.source,
        })),
        sourceProvider:
          resolvedSourceProvider === "manual"
            ? "manual"
            : resolvedSourceProvider ?? "apple-health",
        sourceProviders: Array.from(
          new Set(
            metrics
              .map((metric) => metric.provider)
              .filter((provider): provider is NonNullable<typeof provider> => Boolean(provider)),
          ),
        ),
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

    const sourceProvider =
      usingManualWorkoutFallback || resolvedSourceProvider === "manual"
        ? "manual"
        : healthPreviewActive && resolvedSourceProvider === "apple-health"
          ? "mock"
          : resolvedSourceProvider ?? "manual";

    const createdPost = await createCheckIn({
      type: checkInDraft.type,
      audience: effectiveAudience,
      squadId: effectiveAudience === "squad" ? effectiveSquadId : undefined,
      caption: checkInDraft.caption,
      sourceProvider,
      sourceSnapshotId:
        usingManualWorkoutFallback ||
        resolvedSourceProvider === "manual" ||
        (healthPreviewActive && resolvedSourceProvider === "apple-health")
          ? undefined
          : snapshot?.id,
      metrics: metrics
        .filter((metric) => getMetricsForPostType(snapshot, checkInDraft.type).some((item) => item.key === metric.key))
        .map((metric) => ({
          key: metric.key,
          value: metric.value ?? 0,
          unit: metric.unit ?? null,
          source: metric.source ?? null,
          provider:
            usingManualWorkoutFallback || resolvedSourceProvider === "manual"
              ? "manual"
              : metric.provider,
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
      await persistFrontendState({
        demoMode: false,
        authUserId: authUserIdRef.current,
      });
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
      await persistFrontendState({
        demoMode: false,
        authUserId: authUserIdRef.current,
      });
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
      authUserIdRef.current = null;
      setDemoMode(false);
      setAuthUserId(null);
      setAuthSession(null);
      setAuthState("signed-out");
      setAuthEmail("");
      setBootstrapStatus("idle");
      setBootstrapError(null);
      resetUserScopedState();
      setHomeSegment("squads");
      setManualFallbackEnabled(false);
      setAuthError(null);
      await AsyncStorage.removeItem(sessionStorageKey).catch(() => null);
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

  const transferSquadOwnership = async (squadId: string, newOwnerId: string) => {
    if (authState === "demo") {
      setSquads((current) =>
        current.map((squad) =>
          squad.id === squadId ? { ...squad, ownerId: newOwnerId } : squad,
        ),
      );
      return;
    }

    await persistTransferSquadOwnership(squadId, newOwnerId);
    await refreshFromBackend();
  };

  const deleteAccount = async () => {
    if (authState === "demo") {
      await resetDemoSession();
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      await deleteAccountRequest();
      await supabase.auth.signOut({ scope: "local" }).catch(() => null);
      authUserIdRef.current = null;
      setDemoMode(false);
      setAuthUserId(null);
      setAuthSession(null);
      setAuthState("signed-out");
      setAuthEmail("");
      setAuthError(null);
      setBootstrapStatus("idle");
      setBootstrapError(null);
      resetUserScopedState();
      setHomeSegment("squads");
      await AsyncStorage.removeItem(sessionStorageKey).catch(() => null);
    } finally {
      setAuthLoading(false);
    }
  };

  const startDemoSession = async () => {
    authUserIdRef.current = null;
    applyDemoState();
    await persistFrontendState({
      demoMode: true,
      authUserId: null,
    });
  };

  const resetDemoSession = async () => {
    setDemoMode(false);
    setAuthUserId(null);
    authUserIdRef.current = null;
    setAuthSession(null);
    setAuthState("signed-out");
    setAuthEmail("");
    setAuthError(null);
    setBootstrapStatus("idle");
    setBootstrapError(null);
    resetUserScopedState();
    await AsyncStorage.removeItem(sessionStorageKey).catch(() => null);
  };

  const contextValue = useMemo<MomentumSessionValue>(
    () => ({
      sessionHydrated,
      authReady,
      authState,
      bootstrapStatus,
      bootstrapError,
      onboardingComplete,
      authEmail,
      onboardingDraft,
      currentUser,
      friends,
      squads,
      habits,
      feedPosts,
      homeSegment,
      providerConnections,
      providerSnapshots,
      healthConnection,
      healthSnapshot,
      healthPreviewActive,
      manualFallbackEnabled,
      healthLoading,
      checkInDraft,
      consistency,
      character,
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
      connectProvider,
      refreshProvider,
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
      disconnectProvider,
      deleteAccount,
      transferSquadOwnership,
      handleIntegrationCallback,
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
      bootstrapError,
      bootstrapStatus,
      character,
      chatLoading,
      chatOverviews,
      checkInDraft,
      completeOnboarding,
      createSquad,
      createSquadInviteToken,
      connectHealth,
      connectProvider,
      consistency,
      currentUser,
      disconnectProvider,
      deleteAccount,
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
      providerConnections,
      providerSnapshots,
      refreshProvider,
      sessionHydrated,
      sendFriendInvite,
      squadMessages,
      squads,
      transferSquadOwnership,
      handleIntegrationCallback,
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
