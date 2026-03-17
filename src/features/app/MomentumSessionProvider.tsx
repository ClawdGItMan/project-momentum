import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

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
  friendsSeed,
  habitsSeed,
  onboardingDraftSeed,
  postsSeed,
  squadsSeed,
  userSeed,
} from "@/src/data/fixtures/appSeed";
import {
  connectAppleHealth,
  seedManualWorkoutFallback,
} from "@/src/data/repositories/healthRepository";
import type {
  AccountabilityStyle,
  AudienceVisibility,
  CheckInDraft,
  FocusPillar,
  Friend,
  Habit,
  HomeSegment,
  OnboardingDraft,
  PostType,
  ProgressPost,
  Squad,
  UserProfile,
} from "@/src/features/app/sessionTypes";

type MomentumSessionValue = {
  sessionHydrated: boolean;
  onboardingComplete: boolean;
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
  setGoals: (goals: string[]) => void;
  setPillars: (pillars: FocusPillar[]) => void;
  setAccountabilityStyle: (style: AccountabilityStyle) => void;
  setProfileBasics: (input: {
    name: string;
    username: string;
    missionLine: string;
    city: string;
  }) => void;
  setSelectedSquad: (squadId?: string) => void;
  connectHealth: (options?: { preview?: boolean }) => Promise<void>;
  enableManualFallback: () => void;
  completeOnboarding: () => void;
  setHomeSegment: (segment: HomeSegment) => void;
  updateCheckInDraft: (patch: Partial<CheckInDraft>) => void;
  publishCheckIn: () => Promise<ProgressPost>;
  dismissPublishedCelebration: () => void;
  reactToPost: (postId: string) => void;
  toggleHabit: (habitId: string) => void;
  addHabit: (title?: string) => void;
  startDemoSession: () => Promise<void>;
  resetDemoSession: () => Promise<void>;
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

const MomentumSessionContext = createContext<MomentumSessionValue | null>(null);
const sessionStorageKey = "@project-momentum/session-v1";

const habitPool = [
  "Protein with breakfast",
  "Read 15 pages",
  "Walk after lunch",
];

type PersistedSessionState = {
  onboardingComplete: boolean;
  onboardingDraft: OnboardingDraft;
  currentUser: UserProfile;
  habits: Habit[];
  feedPosts: ProgressPost[];
  homeSegment: HomeSegment;
  healthConnection: ConnectionRecord;
  manualFallbackEnabled: boolean;
  hasCheckedInToday: boolean;
  consistency: ConsistencyResult;
};

const normalizePersistedConnection = (
  connection?: ConnectionRecord,
): ConnectionRecord => {
  if (!connection) {
    return defaultConnection;
  }

  if (connection.state === "authorizing" || connection.state === "syncing") {
    return defaultConnection;
  }

  return {
    ...defaultConnection,
    ...connection,
    coverage: connection.coverage?.length ? connection.coverage : defaultConnection.coverage,
  };
};

export function MomentumSessionProvider({
  children,
}: React.PropsWithChildren) {
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingDraft, setOnboardingDraft] =
    useState<OnboardingDraft>(onboardingDraftSeed);
  const [currentUser, setCurrentUser] = useState<UserProfile>(userSeed);
  const [friends] = useState<Friend[]>(friendsSeed);
  const [squads] = useState<Squad[]>(squadsSeed);
  const [habits, setHabits] = useState<Habit[]>(habitsSeed);
  const [feedPosts, setFeedPosts] = useState<ProgressPost[]>(postsSeed);
  const [healthConnection, setHealthConnection] =
    useState<ConnectionRecord>(defaultConnection);
  const [healthSnapshot, setHealthSnapshot] = useState<ProviderSnapshot | null>(null);
  const [healthPreviewActive, setHealthPreviewActive] = useState(false);
  const [manualFallbackEnabled, setManualFallbackEnabled] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [homeSegment, setHomeSegment] = useState<HomeSegment>("squads");
  const [checkInDraft, setCheckInDraft] = useState<CheckInDraft>(checkInDraftSeed);
  const [consistency, setConsistency] = useState<ConsistencyResult>(consistencySeed);
  const [lastPublishedPostId, setLastPublishedPostId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(sessionStorageKey);
        if (!raw) return;

        const parsed = JSON.parse(raw) as Partial<PersistedSessionState>;
        if (cancelled) return;

        if (typeof parsed.onboardingComplete === "boolean") {
          setOnboardingComplete(parsed.onboardingComplete);
        }
        if (parsed.onboardingDraft) {
          setOnboardingDraft(parsed.onboardingDraft);
        }
        if (parsed.currentUser) {
          setCurrentUser(parsed.currentUser);
        }
        if (parsed.habits) {
          setHabits(parsed.habits);
        }
        if (parsed.feedPosts) {
          setFeedPosts(parsed.feedPosts);
        }
        if (parsed.homeSegment) {
          setHomeSegment(parsed.homeSegment);
        }
        if (parsed.healthConnection) {
          setHealthConnection(normalizePersistedConnection(parsed.healthConnection));
        }
        if (typeof parsed.manualFallbackEnabled === "boolean") {
          setManualFallbackEnabled(parsed.manualFallbackEnabled);
        }
        if (typeof parsed.hasCheckedInToday === "boolean") {
          setHasCheckedInToday(parsed.hasCheckedInToday);
        }
        if (parsed.consistency) {
          setConsistency(parsed.consistency);
        }
      } catch {
        await AsyncStorage.removeItem(sessionStorageKey).catch(() => null);
      } finally {
        if (!cancelled) {
          setSessionHydrated(true);
        }
      }
    };

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionHydrated) return;

    const payload: PersistedSessionState = {
      onboardingComplete,
      onboardingDraft,
      currentUser,
      habits,
      feedPosts,
      homeSegment,
      healthConnection,
      manualFallbackEnabled,
      hasCheckedInToday,
      consistency,
    };

    AsyncStorage.setItem(sessionStorageKey, JSON.stringify(payload)).catch(() => null);
  }, [
    consistency,
    currentUser,
    feedPosts,
    habits,
    hasCheckedInToday,
    healthConnection,
    homeSegment,
    manualFallbackEnabled,
    onboardingComplete,
    onboardingDraft,
    sessionHydrated,
  ]);

  const recomputeConsistency = (
    nextHabits: Habit[],
    didCheckInToday: boolean,
    workoutCompleted: boolean,
  ) => {
    const completedHabits = nextHabits.filter((habit) => habit.completedToday).length;
    const result = calculateConsistency({
      days: [
        { date: "2026-03-10", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
        { date: "2026-03-11", checkedIn: true, scheduledHabits: 2, completedHabits: 1, workoutCompleted: false },
        { date: "2026-03-12", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
        { date: "2026-03-13", checkedIn: true, scheduledHabits: 2, completedHabits: 1, workoutCompleted: true },
        { date: "2026-03-14", checkedIn: false, scheduledHabits: 2, completedHabits: 0, workoutCompleted: false },
        { date: "2026-03-15", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
        {
          date: "2026-03-16",
          checkedIn: didCheckInToday,
          scheduledHabits: nextHabits.length,
          completedHabits,
          workoutCompleted,
        },
      ],
      selectedPillars: onboardingDraft.pillars,
    });

    setConsistency(result);
    return result;
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
        days: [
          { date: "2026-03-10", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
          { date: "2026-03-11", checkedIn: true, scheduledHabits: 2, completedHabits: 1, workoutCompleted: false },
          { date: "2026-03-12", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
          { date: "2026-03-13", checkedIn: true, scheduledHabits: 2, completedHabits: 1, workoutCompleted: true },
          { date: "2026-03-14", checkedIn: false, scheduledHabits: 2, completedHabits: 0, workoutCompleted: false },
          { date: "2026-03-15", checkedIn: true, scheduledHabits: 2, completedHabits: 2, workoutCompleted: true },
          {
            date: "2026-03-16",
            checkedIn: hasCheckedInToday,
            scheduledHabits: habits.length,
            completedHabits: habits.filter((habit) => habit.completedToday).length,
            workoutCompleted:
              hasCheckedInToday && Boolean(healthSnapshot?.metrics.length),
          },
        ],
        selectedPillars: pillars,
      }) ?? current
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

  const setSelectedSquad = (squadId?: string) => {
    setOnboardingDraft((current) => ({ ...current, selectedSquadId: squadId }));
    setCurrentUser((current) => ({ ...current, selectedSquadId: squadId }));
    setCheckInDraft((current) => ({
      ...current,
      squadId,
      audience:
        !squadId && current.audience === "squad" ? "friends" : current.audience,
    }));
  };

  const connectHealth = async (options?: { preview?: boolean }) => {
    setHealthLoading(true);
    try {
      const result = await connectAppleHealth({ usePreview: options?.preview });
      setHealthConnection(result.connection);
      setHealthSnapshot(result.snapshot);
      setHealthPreviewActive(Boolean(options?.preview));
      setManualFallbackEnabled(false);
    } catch (error) {
      setHealthPreviewActive(false);
      setHealthConnection((current) => ({
        ...current,
        state: "error",
        lastError:
          error instanceof Error ? error.message : "Unable to connect Apple Health.",
      }));
    } finally {
      setHealthLoading(false);
    }
  };

  const enableManualFallback = () => {
    setManualFallbackEnabled(true);
    setHealthPreviewActive(false);
    setHealthConnection((current) => ({
      ...current,
      state:
        current.state === "connected" || current.state === "connected_limited"
          ? current.state
          : "needs_attention",
    }));
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
  };

  const updateCheckInDraft = (patch: Partial<CheckInDraft>) => {
    setCheckInDraft((current) => ({ ...current, ...patch }));
  };

  const publishCheckIn = async () => {
    let metrics = healthSnapshot?.metrics ?? [];

    if (!metrics.length || manualFallbackEnabled) {
      const manualWorkoutName = checkInDraft.manualWorkoutName.trim();
      const durationMinutes = Number(checkInDraft.manualDurationMinutes);
      const activeEnergy = Number(checkInDraft.manualEnergy);

      if (
        checkInDraft.type === "workout" &&
        (!manualWorkoutName || durationMinutes <= 0 || activeEnergy <= 0)
      ) {
        throw new Error(
          "Manual fallback needs a workout name, duration, and active energy before you can publish.",
        );
      }

      const manualSnapshot = await seedManualWorkoutFallback({
        workoutName: manualWorkoutName || "Workout",
        durationMinutes,
        activeEnergy,
      });
      metrics = manualSnapshot.metrics;
      setHealthSnapshot((current) => current ?? manualSnapshot);
    }

    const selectedSquad = squads.find((squad) => squad.id === checkInDraft.squadId);
    const normalizedAudience =
      checkInDraft.audience === "squad" && !selectedSquad
        ? "friends"
        : checkInDraft.audience;
    const nextConsistency = recomputeConsistency(habits, true, checkInDraft.type === "workout");
    const nextPost: ProgressPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorUsername: currentUser.username,
      squadId: normalizedAudience === "squad" ? selectedSquad?.id : undefined,
      squadName: normalizedAudience === "squad" ? selectedSquad?.name : undefined,
      type: checkInDraft.type,
      audience: normalizedAudience,
      caption: checkInDraft.caption,
      createdAt: new Date().toISOString(),
      metrics: metrics
        .filter((metric) =>
          checkInDraft.type === "workout"
            ? ["workouts", "active-energy", "steps"].includes(metric.key)
            : true,
        )
        .map((metric) => ({
          key: metric.key,
          label:
            metric.key === "workouts"
              ? "Workout"
              : metric.key === "active-energy"
                ? "Energy"
                : metric.key === "sleep-duration"
                  ? "Sleep"
                  : metric.key === "steps"
                    ? "Steps"
                    : metric.key,
          value:
            metric.key === "workouts" && typeof metric.value === "number"
              ? `${metric.value} ${metric.value === 1 ? "session" : "sessions"}`
              : typeof metric.value === "boolean"
                ? metric.value
                  ? "Yes"
                  : "No"
                : (metric.value ?? 0),
          unit: metric.key === "workouts" ? undefined : metric.unit,
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
    setHomeSegment(nextPost.audience === "squad" ? "squads" : "friends");
    setHasCheckedInToday(true);
    setLastPublishedPostId(nextPost.id);
    setCheckInDraft((current) => ({
      ...current,
      caption: "",
    }));

    return nextPost;
  };

  const dismissPublishedCelebration = () => {
    setLastPublishedPostId(null);
  };

  const reactToPost = (postId: string) => {
    setFeedPosts((current) =>
      current.map((post) => {
        if (post.id !== postId || post.isCurrentUser) {
          return post;
        }

        const reacted = Boolean(post.reactions.didThisTooByCurrentUser);
        return {
          ...post,
          reactions: {
            ...post.reactions,
            didThisToo: Math.max(0, post.reactions.didThisToo + (reacted ? -1 : 1)),
            didThisTooByCurrentUser: !reacted,
          },
        };
      }),
    );
  };

  const toggleHabit = (habitId: string) => {
    setHabits((current) => {
      const nextHabits = current.map((habit) =>
        habit.id === habitId
          ? { ...habit, completedToday: !habit.completedToday }
          : habit,
      );

      recomputeConsistency(
        nextHabits,
        hasCheckedInToday,
        hasCheckedInToday && Boolean(healthSnapshot?.metrics.length),
      );
      return nextHabits;
    });
  };

  const addHabit = (title?: string) => {
    setHabits((current) => {
      if (current.length >= 3) return current;
      const nextTitle =
        title?.trim() || habitPool[current.length] || "Extra consistency habit";
      const nextHabits = [
        ...current,
        {
          id: `habit-${current.length + 1}`,
          title: nextTitle,
          cadence: "Daily",
          completedToday: false,
          completionRate: 0.5,
          streakDays: 0,
          friendVisible: true,
        },
      ];
      recomputeConsistency(
        nextHabits,
        hasCheckedInToday,
        hasCheckedInToday && Boolean(healthSnapshot?.metrics.length),
      );
      return nextHabits;
    });
  };

  const startDemoSession = async () => {
    setOnboardingComplete(true);
    setOnboardingDraft(onboardingDraftSeed);
    setCurrentUser(userSeed);
    setHabits(habitsSeed);
    setFeedPosts(postsSeed);
    setHealthConnection(appleHealthPreviewConnection);
    setHealthSnapshot(appleHealthPreviewSnapshot);
    setHealthPreviewActive(true);
    setManualFallbackEnabled(false);
    setHealthLoading(false);
    setHasCheckedInToday(false);
    setHomeSegment("squads");
    setCheckInDraft(checkInDraftSeed);
    setConsistency(consistencySeed);
    setLastPublishedPostId(null);
    await AsyncStorage.setItem(
      sessionStorageKey,
      JSON.stringify({
        onboardingComplete: true,
        onboardingDraft: onboardingDraftSeed,
        currentUser: userSeed,
        habits: habitsSeed,
        feedPosts: postsSeed,
        homeSegment: "squads",
        healthConnection: appleHealthPreviewConnection,
        manualFallbackEnabled: false,
        hasCheckedInToday: false,
        consistency: consistencySeed,
      } satisfies PersistedSessionState),
    ).catch(() => null);
  };

  const resetDemoSession = async () => {
    await AsyncStorage.removeItem(sessionStorageKey).catch(() => null);
    setOnboardingComplete(false);
    setOnboardingDraft(onboardingDraftSeed);
    setCurrentUser(userSeed);
    setHabits(habitsSeed);
    setFeedPosts(postsSeed);
    setHealthConnection(defaultConnection);
    setHealthSnapshot(null);
    setHealthPreviewActive(false);
    setManualFallbackEnabled(false);
    setHealthLoading(false);
    setHasCheckedInToday(false);
    setHomeSegment("squads");
    setCheckInDraft(checkInDraftSeed);
    setConsistency(consistencySeed);
    setLastPublishedPostId(null);
  };

  return (
    <MomentumSessionContext.Provider
      value={{
        sessionHydrated,
        onboardingComplete,
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
        startDemoSession,
        resetDemoSession,
      }}
    >
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
