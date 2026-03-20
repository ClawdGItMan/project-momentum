import type { BackendEnv } from "../../config/env";
import type {
  ConnectedProviderAccount,
  CoverageInput,
  ManagedProvider,
  NormalizedSnapshotInput,
  ProviderConnectionRow,
} from "./types";
import { readJsonResponse, throwUpstreamError } from "./http";

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE_URL = "https://api.prod.whoop.com/developer/v2";

const WHOOP_SCOPES = [
  "offline",
  "read:profile",
  "read:recovery",
  "read:sleep",
  "read:workout",
  "read:cycles",
] as const;

interface WhoopTokenResponse {
  access_token: string;
  refresh_token?: string | null;
  expires_in?: number | null;
  scope?: string | null;
  token_type?: string | null;
}

interface WhoopProfile {
  user_id: number;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface WhoopCollection<T> {
  records: T[];
  next_token?: string | null;
}

interface WhoopWorkout {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  sport_name?: string | null;
  sport_id?: number | null;
  score_state?: string | null;
  score?: {
    strain?: number | null;
    kilojoule?: number | null;
    percent_recorded?: number | null;
    distance_meter?: number | null;
  } | null;
}

interface WhoopSleep {
  id: string;
  cycle_id?: number | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  nap?: boolean | null;
  score_state?: string | null;
  score?: {
    sleep_performance_percentage?: number | null;
    sleep_efficiency_percentage?: number | null;
  } | null;
}

interface WhoopRecovery {
  cycle_id?: number | null;
  sleep_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state?: string | null;
  score?: {
    recovery_score?: number | null;
    resting_heart_rate?: number | null;
    hrv_rmssd_milli?: number | null;
  } | null;
}

export function isWhoopConfigured(env: BackendEnv): boolean {
  return Boolean(env.whoop.clientId && env.whoop.clientSecret);
}

export function getWhoopAuthorizationUrl(input: {
  env: BackendEnv;
  state: string;
  redirectUri: string;
}): string {
  const clientId = input.env.whoop.clientId;
  if (!clientId) {
    throw new Error("WHOOP_CLIENT_ID is not configured.");
  }

  const search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: input.redirectUri,
    scope: WHOOP_SCOPES.join(" "),
    state: input.state,
  });

  return `${WHOOP_AUTH_URL}?${search.toString()}`;
}

async function exchangeWhoopToken(input: {
  env: BackendEnv;
  body: URLSearchParams;
}): Promise<WhoopTokenResponse> {
  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: input.body.toString(),
  });

  if (!response.ok) {
    await throwUpstreamError("whoop", "token exchange", response);
  }

  const payload = await readJsonResponse<WhoopTokenResponse>(response);
  if (!payload?.access_token) {
    throw new Error("WHOOP token exchange did not return an access token.");
  }

  return payload;
}

async function fetchWhoopJson<T>(
  accessToken: string,
  path: string,
  search?: URLSearchParams,
): Promise<T> {
  const url = `${WHOOP_API_BASE_URL}${path}${search ? `?${search.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    await throwUpstreamError("whoop", path, response);
  }

  const payload = await readJsonResponse<T>(response);
  if (!payload) {
    throw new Error(`WHOOP ${path} returned an empty response.`);
  }

  return payload;
}

async function fetchWhoopProfile(accessToken: string): Promise<WhoopProfile> {
  return fetchWhoopJson<WhoopProfile>(accessToken, "/user/profile/basic");
}

export async function exchangeWhoopAuthorizationCode(input: {
  env: BackendEnv;
  code: string;
  redirectUri: string;
}): Promise<ConnectedProviderAccount> {
  const clientId = input.env.whoop.clientId;
  const clientSecret = input.env.whoop.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("WHOOP credentials are not configured.");
  }

  const token = await exchangeWhoopToken({
    env: input.env,
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      code: input.code,
    }),
  });

  const profile = await fetchWhoopProfile(token.access_token);

  return {
    providerAccountId: String(profile.user_id),
    providerUsername:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
      profile.email ||
      null,
    scopes: token.scope?.split(/\s+/u).filter(Boolean) ?? [...WHOOP_SCOPES],
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    tokenExpiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null,
    metadata: {
      email: profile.email ?? null,
      whoopUserId: profile.user_id,
    },
  };
}

export async function refreshWhoopAccessToken(input: {
  env: BackendEnv;
  refreshToken: string;
}): Promise<ConnectedProviderAccount> {
  const clientId = input.env.whoop.clientId;
  const clientSecret = input.env.whoop.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("WHOOP credentials are not configured.");
  }

  const token = await exchangeWhoopToken({
    env: input.env,
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: input.refreshToken,
    }),
  });

  const profile = await fetchWhoopProfile(token.access_token);

  return {
    providerAccountId: String(profile.user_id),
    providerUsername:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
      profile.email ||
      null,
    scopes: token.scope?.split(/\s+/u).filter(Boolean) ?? [...WHOOP_SCOPES],
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    tokenExpiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null,
    metadata: {
      email: profile.email ?? null,
      whoopUserId: profile.user_id,
    },
  };
}

export async function revokeWhoopAccess(accessToken: string): Promise<void> {
  const response = await fetch(`${WHOOP_API_BASE_URL}/user/access`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 401) {
    await throwUpstreamError("whoop", "revoke access", response);
  }
}

async function listWhoopCollection<T>(input: {
  accessToken: string;
  path: string;
  start?: string;
  end?: string;
}): Promise<T[]> {
  const records: T[] = [];
  let nextToken: string | null | undefined;
  let pageCount = 0;

  do {
    const search = new URLSearchParams({
      limit: "25",
    });

    if (input.start) {
      search.set("start", input.start);
    }

    if (input.end) {
      search.set("end", input.end);
    }

    if (nextToken) {
      search.set("nextToken", nextToken);
    }

    const response = await fetchWhoopJson<WhoopCollection<T>>(
      input.accessToken,
      input.path,
      search,
    );

    records.push(...response.records);
    nextToken = response.next_token;
    pageCount += 1;
  } while (nextToken && pageCount < 10);

  return records;
}

export async function listWhoopWorkouts(input: {
  accessToken: string;
  start?: string;
  end?: string;
}): Promise<WhoopWorkout[]> {
  return listWhoopCollection<WhoopWorkout>({
    accessToken: input.accessToken,
    path: "/activity/workout",
    start: input.start,
    end: input.end,
  });
}

export async function listWhoopSleeps(input: {
  accessToken: string;
  start?: string;
  end?: string;
}): Promise<WhoopSleep[]> {
  return listWhoopCollection<WhoopSleep>({
    accessToken: input.accessToken,
    path: "/activity/sleep",
    start: input.start,
    end: input.end,
  });
}

export async function listWhoopRecoveries(input: {
  accessToken: string;
  start?: string;
  end?: string;
}): Promise<WhoopRecovery[]> {
  return listWhoopCollection<WhoopRecovery>({
    accessToken: input.accessToken,
    path: "/recovery",
    start: input.start,
    end: input.end,
  });
}

export async function fetchWhoopWorkoutById(
  accessToken: string,
  workoutId: string,
): Promise<WhoopWorkout> {
  return fetchWhoopJson<WhoopWorkout>(accessToken, `/activity/workout/${workoutId}`);
}

export async function fetchWhoopSleepById(
  accessToken: string,
  sleepId: string,
): Promise<WhoopSleep> {
  return fetchWhoopJson<WhoopSleep>(accessToken, `/activity/sleep/${sleepId}`);
}

function addMilliseconds(startAt: string, milliseconds: number): string {
  return new Date(new Date(startAt).getTime() + milliseconds).toISOString();
}

export function normalizeWhoopWorkoutToSnapshot(input: {
  workout: WhoopWorkout;
  connection: ProviderConnectionRow;
  syncRunId?: string | null;
}): NormalizedSnapshotInput {
  return {
    userId: input.connection.user_id,
    provider: "whoop",
    providerConnectionId: input.connection.id,
    syncRunId: input.syncRunId ?? null,
    capturedAt: input.workout.updated_at,
    windowStartAt: input.workout.start,
    windowEndAt: input.workout.end,
    windowBucket: "custom",
    sourceReference: `workout:${input.workout.id}`,
    metadata: {
      sportName: input.workout.sport_name ?? null,
      sportId: input.workout.sport_id ?? null,
      scoreState: input.workout.score_state ?? null,
    },
    metrics: [
      {
        key: "workouts",
        value: 1,
        unit: "count",
        observedAt: input.workout.start,
      },
      ...(typeof input.workout.score?.strain === "number"
        ? [
            {
              key: "strain",
              value: input.workout.score.strain,
              observedAt: input.workout.end,
            },
          ]
        : []),
      ...(typeof input.workout.score?.kilojoule === "number"
        ? [
            {
              key: "active-energy",
              value: input.workout.score.kilojoule,
              unit: "kJ",
              observedAt: input.workout.end,
            },
          ]
        : []),
      ...(typeof input.workout.score?.distance_meter === "number"
        ? [
            {
              key: "distance",
              value: input.workout.score.distance_meter,
              unit: "m",
              observedAt: input.workout.end,
            },
          ]
        : []),
      {
        key: "elapsed-duration",
        value:
          (new Date(input.workout.end).getTime() -
            new Date(input.workout.start).getTime()) /
          1000,
        unit: "s",
        observedAt: input.workout.end,
      },
    ],
    coverage: [
      { key: "workouts", available: true },
      {
        key: "strain",
        available: typeof input.workout.score?.strain === "number",
        reason: typeof input.workout.score?.strain === "number" ? null : "no_samples",
      },
      {
        key: "active-energy",
        available: typeof input.workout.score?.kilojoule === "number",
        reason:
          typeof input.workout.score?.kilojoule === "number" ? null : "no_samples",
      },
      {
        key: "distance",
        available: typeof input.workout.score?.distance_meter === "number",
        reason:
          typeof input.workout.score?.distance_meter === "number" ? null : "no_samples",
      },
      { key: "elapsed-duration", available: true },
    ],
  };
}

export function normalizeWhoopSleepToSnapshot(input: {
  sleep: WhoopSleep;
  connection: ProviderConnectionRow;
  syncRunId?: string | null;
}): NormalizedSnapshotInput {
  const durationMs =
    new Date(input.sleep.end).getTime() - new Date(input.sleep.start).getTime();

  return {
    userId: input.connection.user_id,
    provider: "whoop",
    providerConnectionId: input.connection.id,
    syncRunId: input.syncRunId ?? null,
    capturedAt: input.sleep.updated_at,
    windowStartAt: input.sleep.start,
    windowEndAt: input.sleep.end,
    windowBucket: "custom",
    sourceReference: `sleep:${input.sleep.id}`,
    metadata: {
      cycleId: input.sleep.cycle_id ?? null,
      nap: input.sleep.nap ?? false,
      scoreState: input.sleep.score_state ?? null,
    },
    metrics: [
      {
        key: "sleep-duration",
        value: durationMs / 1000,
        unit: "s",
        observedAt: input.sleep.end,
      },
      ...(typeof input.sleep.score?.sleep_performance_percentage === "number"
        ? [
            {
              key: "sleep-performance",
              value: input.sleep.score.sleep_performance_percentage,
              unit: "percent",
              observedAt: input.sleep.end,
            },
          ]
        : []),
    ],
    coverage: [
      { key: "sleep-duration", available: true },
      {
        key: "sleep-performance",
        available:
          typeof input.sleep.score?.sleep_performance_percentage === "number",
        reason:
          typeof input.sleep.score?.sleep_performance_percentage === "number"
            ? null
            : "no_samples",
      },
    ],
  };
}

export function normalizeWhoopRecoveryToSnapshot(input: {
  recovery: WhoopRecovery;
  connection: ProviderConnectionRow;
  syncRunId?: string | null;
  relatedSleep?: WhoopSleep | null;
}): NormalizedSnapshotInput {
  const startAt = input.relatedSleep?.start ?? input.recovery.created_at;
  const endAt =
    input.relatedSleep?.end ??
    addMilliseconds(startAt, 1000);

  return {
    userId: input.connection.user_id,
    provider: "whoop",
    providerConnectionId: input.connection.id,
    syncRunId: input.syncRunId ?? null,
    capturedAt: input.recovery.updated_at,
    windowStartAt: startAt,
    windowEndAt: endAt,
    windowBucket: "custom",
    sourceReference: `recovery:${input.recovery.sleep_id}`,
    metadata: {
      cycleId: input.recovery.cycle_id ?? null,
      sleepId: input.recovery.sleep_id,
      scoreState: input.recovery.score_state ?? null,
    },
    metrics: [
      ...(typeof input.recovery.score?.recovery_score === "number"
        ? [
            {
              key: "recovery-score",
              value: input.recovery.score.recovery_score,
              unit: "percent",
              observedAt: endAt,
            },
          ]
        : []),
      ...(typeof input.recovery.score?.resting_heart_rate === "number"
        ? [
            {
              key: "resting-heart-rate",
              value: input.recovery.score.resting_heart_rate,
              unit: "bpm",
              observedAt: endAt,
            },
          ]
        : []),
      ...(typeof input.recovery.score?.hrv_rmssd_milli === "number"
        ? [
            {
              key: "heart-rate-variability",
              value: input.recovery.score.hrv_rmssd_milli,
              unit: "ms",
              observedAt: endAt,
            },
          ]
        : []),
    ],
    coverage: [
      {
        key: "recovery-score",
        available: typeof input.recovery.score?.recovery_score === "number",
        reason:
          typeof input.recovery.score?.recovery_score === "number" ? null : "no_samples",
      },
      {
        key: "resting-heart-rate",
        available: typeof input.recovery.score?.resting_heart_rate === "number",
        reason:
          typeof input.recovery.score?.resting_heart_rate === "number"
            ? null
            : "no_samples",
      },
      {
        key: "heart-rate-variability",
        available: typeof input.recovery.score?.hrv_rmssd_milli === "number",
        reason:
          typeof input.recovery.score?.hrv_rmssd_milli === "number"
            ? null
            : "no_samples",
      },
    ],
  };
}

export function summarizeWhoopCoverage(input: {
  workouts: WhoopWorkout[];
  sleeps: WhoopSleep[];
  recoveries: WhoopRecovery[];
}): CoverageInput[] {
  return [
    {
      key: "workouts",
      available: input.workouts.length > 0,
      reason: input.workouts.length > 0 ? null : "no_samples",
    },
    {
      key: "sleep-duration",
      available: input.sleeps.length > 0,
      reason: input.sleeps.length > 0 ? null : "no_samples",
    },
    {
      key: "sleep-performance",
      available: input.sleeps.some(
        (sleep) => typeof sleep.score?.sleep_performance_percentage === "number",
      ),
      reason: input.sleeps.some(
        (sleep) => typeof sleep.score?.sleep_performance_percentage === "number",
      )
        ? null
        : "no_samples",
    },
    {
      key: "recovery-score",
      available: input.recoveries.some(
        (recovery) => typeof recovery.score?.recovery_score === "number",
      ),
      reason: input.recoveries.some(
        (recovery) => typeof recovery.score?.recovery_score === "number",
      )
        ? null
        : "no_samples",
    },
    {
      key: "resting-heart-rate",
      available: input.recoveries.some(
        (recovery) => typeof recovery.score?.resting_heart_rate === "number",
      ),
      reason: input.recoveries.some(
        (recovery) => typeof recovery.score?.resting_heart_rate === "number",
      )
        ? null
        : "no_samples",
    },
    {
      key: "heart-rate-variability",
      available: input.recoveries.some(
        (recovery) => typeof recovery.score?.hrv_rmssd_milli === "number",
      ),
      reason: input.recoveries.some(
        (recovery) => typeof recovery.score?.hrv_rmssd_milli === "number",
      )
        ? null
        : "no_samples",
    },
    {
      key: "strain",
      available: input.workouts.some(
        (workout) => typeof workout.score?.strain === "number",
      ),
      reason: input.workouts.some(
        (workout) => typeof workout.score?.strain === "number",
      )
        ? null
        : "no_samples",
    },
  ];
}

export function getWhoopManualSyncStart(connection: ProviderConnectionRow): string {
  const baseline = connection.last_sync_at
    ? new Date(connection.last_sync_at)
    : new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  const fourteenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  return (baseline < fourteenDaysAgo ? fourteenDaysAgo : baseline).toISOString();
}

export function normalizeWhoopSourceReference(
  kind: "workout" | "sleep" | "recovery",
  id: string,
): string {
  return `${kind}:${id}`;
}

export const WHOOP_PROVIDER: ManagedProvider = "whoop";
