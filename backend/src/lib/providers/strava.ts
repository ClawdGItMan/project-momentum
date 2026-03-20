import type { BackendEnv } from "../../config/env";
import type {
  ConnectedProviderAccount,
  CoverageInput,
  ManagedProvider,
  NormalizedSnapshotInput,
  ProviderConnectionRow,
} from "./types";
import { readJsonResponse, throwUpstreamError } from "./http";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE_URL = "https://www.strava.com/api/v3";

const STRAVA_SCOPES = ["read", "activity:read_all"] as const;

interface StravaAthlete {
  id: number;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token?: string | null;
  expires_at?: number | null;
  athlete?: StravaAthlete | null;
}

interface StravaActivity {
  id: number;
  name?: string | null;
  sport_type?: string | null;
  type?: string | null;
  start_date?: string | null;
  moving_time?: number | null;
  elapsed_time?: number | null;
  distance?: number | null;
  kilojoules?: number | null;
  trainer?: boolean | null;
  commute?: boolean | null;
  private?: boolean | null;
  manual?: boolean | null;
  external_id?: string | null;
  upload_id?: number | null;
  updated_at?: string | null;
}

export function isStravaConfigured(env: BackendEnv): boolean {
  return Boolean(env.strava.clientId && env.strava.clientSecret);
}

export function getStravaAuthorizationUrl(input: {
  env: BackendEnv;
  state: string;
  redirectUri: string;
}): string {
  const clientId = input.env.strava.clientId;
  if (!clientId) {
    throw new Error("STRAVA_CLIENT_ID is not configured.");
  }

  const search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: input.redirectUri,
    approval_prompt: "auto",
    scope: STRAVA_SCOPES.join(","),
    state: input.state,
  });

  return `${STRAVA_AUTH_URL}?${search.toString()}`;
}

async function exchangeStravaToken(input: {
  env: BackendEnv;
  body: URLSearchParams;
}): Promise<StravaTokenResponse> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: input.body.toString(),
  });

  if (!response.ok) {
    await throwUpstreamError("strava", "token exchange", response);
  }

  const payload = await readJsonResponse<StravaTokenResponse>(response);
  if (!payload?.access_token) {
    throw new Error("Strava token exchange did not return an access token.");
  }

  return payload;
}

export async function exchangeStravaAuthorizationCode(input: {
  env: BackendEnv;
  code: string;
  redirectUri: string;
}): Promise<ConnectedProviderAccount> {
  const clientId = input.env.strava.clientId;
  const clientSecret = input.env.strava.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Strava credentials are not configured.");
  }

  const payload = await exchangeStravaToken({
    env: input.env,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: input.code,
      grant_type: "authorization_code",
    }),
  });

  return {
    providerAccountId: String(payload.athlete?.id ?? ""),
    providerUsername: formatStravaUsername(payload.athlete ?? null),
    scopes: [...STRAVA_SCOPES],
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    tokenExpiresAt: payload.expires_at
      ? new Date(payload.expires_at * 1000).toISOString()
      : null,
    metadata: {
      athleteId: payload.athlete?.id ?? null,
    },
  };
}

export async function refreshStravaAccessToken(input: {
  env: BackendEnv;
  refreshToken: string;
}): Promise<ConnectedProviderAccount> {
  const clientId = input.env.strava.clientId;
  const clientSecret = input.env.strava.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("Strava credentials are not configured.");
  }

  const payload = await exchangeStravaToken({
    env: input.env,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: input.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  return {
    providerAccountId: String(payload.athlete?.id ?? ""),
    providerUsername: formatStravaUsername(payload.athlete ?? null),
    scopes: [...STRAVA_SCOPES],
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    tokenExpiresAt: payload.expires_at
      ? new Date(payload.expires_at * 1000).toISOString()
      : null,
    metadata: {
      athleteId: payload.athlete?.id ?? null,
    },
  };
}

export async function revokeStravaAccess(input: {
  accessToken: string;
}): Promise<void> {
  const response = await fetch("https://www.strava.com/oauth/deauthorize", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      access_token: input.accessToken,
    }).toString(),
  });

  if (!response.ok && response.status !== 401) {
    await throwUpstreamError("strava", "deauthorize", response);
  }
}

async function fetchStravaJson<T>(
  accessToken: string,
  path: string,
  search?: URLSearchParams,
): Promise<T> {
  const url = `${STRAVA_API_BASE_URL}${path}${search ? `?${search.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    await throwUpstreamError("strava", path, response);
  }

  const payload = await readJsonResponse<T>(response);
  if (!payload) {
    throw new Error(`Strava ${path} returned an empty response.`);
  }

  return payload;
}

export async function fetchStravaActivity(
  accessToken: string,
  activityId: string,
): Promise<StravaActivity> {
  return fetchStravaJson<StravaActivity>(accessToken, `/activities/${activityId}`);
}

export async function listStravaActivities(input: {
  accessToken: string;
  after?: Date;
  perPage?: number;
}): Promise<StravaActivity[]> {
  const activities: StravaActivity[] = [];
  let page = 1;
  const perPage = Math.min(Math.max(input.perPage ?? 50, 1), 200);

  while (page <= 10) {
    const search = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });

    if (input.after) {
      search.set("after", String(Math.floor(input.after.getTime() / 1000)));
    }

    const batch = await fetchStravaJson<StravaActivity[]>(
      input.accessToken,
      "/athlete/activities",
      search,
    );

    activities.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return activities;
}

function formatStravaUsername(athlete: StravaAthlete | null): string | null {
  if (!athlete) return null;
  if (athlete.username) return athlete.username;

  const fullName = [athlete.firstname, athlete.lastname].filter(Boolean).join(" ").trim();
  return fullName || null;
}

function buildStravaCoverage(activity: StravaActivity): CoverageInput[] {
  return [
    { key: "workouts", available: true },
    { key: "distance", available: typeof activity.distance === "number" },
    {
      key: "elapsed-duration",
      available:
        typeof activity.elapsed_time === "number" ||
        typeof activity.moving_time === "number",
    },
    {
      key: "active-energy",
      available: typeof activity.kilojoules === "number",
      reason: typeof activity.kilojoules === "number" ? null : "no_samples",
    },
  ];
}

function addSeconds(startAt: string, seconds: number): string {
  return new Date(new Date(startAt).getTime() + seconds * 1000).toISOString();
}

export function normalizeStravaActivityToSnapshot(input: {
  activity: StravaActivity;
  connection: ProviderConnectionRow;
  syncRunId?: string | null;
}): NormalizedSnapshotInput {
  const startAt = input.activity.start_date ?? new Date().toISOString();
  const durationSeconds =
    input.activity.elapsed_time ??
    input.activity.moving_time ??
    0;
  const endAt = durationSeconds > 0 ? addSeconds(startAt, durationSeconds) : addSeconds(startAt, 1);

  return {
    userId: input.connection.user_id,
    provider: "strava",
    providerConnectionId: input.connection.id,
    syncRunId: input.syncRunId ?? null,
    capturedAt: input.activity.updated_at ?? new Date().toISOString(),
    windowStartAt: startAt,
    windowEndAt: endAt,
    windowBucket: "custom",
    sourceReference: `activity:${input.activity.id}`,
    metadata: {
      title: input.activity.name ?? null,
      sportType: input.activity.sport_type ?? input.activity.type ?? null,
      trainer: input.activity.trainer ?? false,
      commute: input.activity.commute ?? false,
      manual: input.activity.manual ?? false,
      private: input.activity.private ?? false,
      externalId: input.activity.external_id ?? null,
      uploadId: input.activity.upload_id ?? null,
    },
    metrics: [
      {
        key: "workouts",
        value: 1,
        unit: "count",
        observedAt: startAt,
      },
      ...(typeof input.activity.distance === "number"
        ? [
            {
              key: "distance",
              value: input.activity.distance,
              unit: "m",
              observedAt: startAt,
            },
          ]
        : []),
      ...(durationSeconds > 0
        ? [
            {
              key: "elapsed-duration",
              value: durationSeconds,
              unit: "s",
              observedAt: startAt,
            },
          ]
        : []),
      ...(typeof input.activity.kilojoules === "number"
        ? [
            {
              key: "active-energy",
              value: input.activity.kilojoules,
              unit: "kJ",
              observedAt: startAt,
            },
          ]
        : []),
    ],
    coverage: buildStravaCoverage(input.activity),
  };
}

export function summarizeStravaCoverage(activities: StravaActivity[]): CoverageInput[] {
  return [
    {
      key: "workouts",
      available: activities.length > 0,
      reason: activities.length > 0 ? null : "no_samples",
    },
    {
      key: "distance",
      available: activities.some((activity) => typeof activity.distance === "number"),
      reason: activities.some((activity) => typeof activity.distance === "number")
        ? null
        : "no_samples",
    },
    {
      key: "elapsed-duration",
      available: activities.some(
        (activity) =>
          typeof activity.elapsed_time === "number" ||
          typeof activity.moving_time === "number",
      ),
      reason: activities.some(
        (activity) =>
          typeof activity.elapsed_time === "number" ||
          typeof activity.moving_time === "number",
      )
        ? null
        : "no_samples",
    },
    {
      key: "active-energy",
      available: activities.some((activity) => typeof activity.kilojoules === "number"),
      reason: activities.some((activity) => typeof activity.kilojoules === "number")
        ? null
        : "no_samples",
    },
    {
      key: "sleep-duration",
      available: false,
      reason: "not_supported",
    },
    {
      key: "recovery-score",
      available: false,
      reason: "not_supported",
    },
  ];
}

export function getStravaManualSyncStart(connection: ProviderConnectionRow): Date {
  const baseline = connection.last_sync_at
    ? new Date(connection.last_sync_at)
    : new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  return baseline < thirtyDaysAgo ? thirtyDaysAgo : baseline;
}

export function normalizeStravaSourceReference(activityId: string | number): string {
  return `activity:${activityId}`;
}

export const STRAVA_PROVIDER: ManagedProvider = "strava";
