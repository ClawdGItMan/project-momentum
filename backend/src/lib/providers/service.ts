import { randomUUID } from "node:crypto";

import type { PgBoss } from "pg-boss";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { BackendEnv } from "../../config/env";
import { queueJobNames } from "../queue";
import { openProviderToken, sealProviderToken } from "../security";
import type { ProviderName } from "../security";

type RemoteProvider = "strava" | "whoop";

type ConnectionState =
  | "disconnected"
  | "authorizing"
  | "connected"
  | "connected_limited"
  | "needs_attention"
  | "syncing"
  | "error";

type CoverageReason =
  | "not_requested"
  | "not_supported"
  | "no_samples"
  | "permission_unknown"
  | "permission_missing"
  | "provider_disconnected"
  | "provider_unavailable"
  | "platform_unsupported";

type MetricKey =
  | "workouts"
  | "steps"
  | "sleep-duration"
  | "active-energy"
  | "resting-heart-rate"
  | "mindfulness-minutes"
  | "distance"
  | "duration"
  | "recovery-score"
  | "strain-score";

type MetricSource = "live" | "manual" | "mock" | "derived";

type MetricWindowBucket = "today" | "yesterday" | "7d" | "30d" | "custom";

type ProviderSyncTrigger = "oauth_callback" | "manual" | "webhook" | "reconcile";

type ProviderSyncJobPayload = {
  provider: RemoteProvider;
  userId: string;
  providerConnectionId?: string;
  triggerSource: ProviderSyncTrigger;
  webhookEventId?: string;
  eventType?: string;
  objectId?: string;
  objectType?: string;
};

type WebhookProcessJobPayload = {
  provider: RemoteProvider;
  webhookEventId: string;
};

type ProviderConnectionRow = {
  id: string;
  user_id: string;
  provider: RemoteProvider;
  state: ConnectionState;
  connected_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  provider_account_id: string | null;
  provider_username: string | null;
  scopes: string[] | null;
  coverage: Array<{ key: MetricKey; available: boolean; reason?: CoverageReason }> | null;
  sync_cursor: string | null;
  metadata: Record<string, unknown> | null;
  provider_account_metadata: Record<string, unknown> | null;
  last_webhook_at: string | null;
  last_reconcile_at: string | null;
  disconnected_at: string | null;
  revoked_at: string | null;
};

type ProviderCredentialRow = {
  provider_connection_id: string;
  access_token_envelope: ReturnType<typeof sealProviderToken>["encrypted"] | null;
  refresh_token_envelope: ReturnType<typeof sealProviderToken>["encrypted"] | null;
  access_token_key_id: string | null;
  refresh_token_key_id: string | null;
  access_token_expires_at: string | null;
  revoked_at: string | null;
};

type ProviderSyncRunRow = {
  id: string;
};

type ProviderWebhookEventRow = {
  id: string;
  provider: RemoteProvider;
  event_type: string;
  external_event_id: string | null;
  trace_id: string | null;
  payload: Record<string, unknown>;
  provider_connection_id: string | null;
};

type NormalizedMetric = {
  key: MetricKey;
  value: number | string | boolean | null;
  unit?: string;
  source?: MetricSource;
  observedAt?: string;
  confidence?: "high" | "medium" | "low";
};

type NormalizedCoverage = {
  key: MetricKey;
  available: boolean;
  reason?: CoverageReason;
};

type NormalizedSnapshotInput = {
  provider: RemoteProvider;
  providerConnectionId: string;
  userId: string;
  capturedAt: string;
  windowStartAt: string;
  windowEndAt: string;
  windowBucket: MetricWindowBucket;
  sourceReference?: string;
  metadata?: Record<string, unknown>;
  metrics: NormalizedMetric[];
  coverage: NormalizedCoverage[];
};

type SyncProviderOptions = {
  provider: RemoteProvider;
  userId: string;
  triggerSource: ProviderSyncTrigger;
  providerConnectionId?: string;
  webhookEventId?: string;
  eventType?: string;
  objectId?: string;
  objectType?: string;
};

type SyncProviderResult = {
  provider: RemoteProvider;
  connection: ProviderConnectionRow;
  latestSnapshotId?: string;
  itemCount: number;
  status: "connected" | "connected_limited" | "needs_attention";
  coverage: NormalizedCoverage[];
  syncCursor?: string;
};

type OAuthStateRow = {
  id: string;
  provider: RemoteProvider;
  user_id: string;
  state: string;
  redirect_uri: string;
  requested_scopes: string[] | null;
  expires_at: string;
  consumed_at: string | null;
  metadata: Record<string, unknown> | null;
};

type TokenPayload = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
};

const stravaBaseUrl = "https://www.strava.com";
const stravaApiBaseUrl = "https://www.strava.com/api/v3";
const whoopApiBaseUrl = "https://api.prod.whoop.com";

const remoteProviders: RemoteProvider[] = ["strava", "whoop"];
const allMetricKeys: MetricKey[] = [
  "workouts",
  "steps",
  "sleep-duration",
  "active-energy",
  "resting-heart-rate",
  "mindfulness-minutes",
  "distance",
  "duration",
  "recovery-score",
  "strain-score",
];

function ensureBackendPublicUrl(env: BackendEnv) {
  if (!env.backendPublicUrl) {
    throw new Error("BACKEND_PUBLIC_URL must be configured for provider OAuth callbacks.");
  }

  return env.backendPublicUrl;
}

function getRedirectUri(env: BackendEnv, provider: RemoteProvider) {
  return `${ensureBackendPublicUrl(env)}/integrations/${provider}/callback`;
}

function getAppDeepLink(provider: RemoteProvider, params?: Record<string, string | undefined>) {
  const url = new URL(`momentum://integrations/${provider}/callback`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function getProviderScopes(provider: RemoteProvider) {
  if (provider === "strava") {
    return ["read", "activity:read_all"];
  }

  return ["offline", "read:profile", "read:workout", "read:sleep", "read:recovery"];
}

function getProviderClient(env: BackendEnv, provider: RemoteProvider) {
  return provider === "strava" ? env.strava : env.whoop;
}

function isProviderConfigured(env: BackendEnv, provider: RemoteProvider) {
  const config = getProviderClient(env, provider);
  return Boolean(config.clientId && config.clientSecret);
}

function serializeUnknownError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

function toIsoOrNull(value: string | number | Date | undefined | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toMetricWindowBucket(kind: "daily-summary" | "event-summary"): MetricWindowBucket {
  return kind === "daily-summary" ? "today" : "custom";
}

function createCoverage(
  key: MetricKey,
  available: boolean,
  reason?: CoverageReason,
): NormalizedCoverage {
  return {
    key,
    available,
    ...(available || !reason ? {} : { reason }),
  };
}

function createDisconnectedCoverage(keys: MetricKey[]) {
  return keys.map((key) => createCoverage(key, false, "provider_disconnected"));
}

function createUnavailableCoverage(keys: MetricKey[]) {
  return keys.map((key) => createCoverage(key, false, "provider_unavailable"));
}

function normalizeStravaCoverage(hasActivities: boolean, hasEnergy: boolean): NormalizedCoverage[] {
  return [
    createCoverage("workouts", hasActivities, hasActivities ? undefined : "no_samples"),
    createCoverage("distance", hasActivities, hasActivities ? undefined : "no_samples"),
    createCoverage("duration", hasActivities, hasActivities ? undefined : "no_samples"),
    createCoverage("active-energy", hasEnergy, hasActivities ? "no_samples" : "no_samples"),
    createCoverage("steps", false, "not_supported"),
    createCoverage("sleep-duration", false, "not_supported"),
    createCoverage("resting-heart-rate", false, "not_supported"),
    createCoverage("mindfulness-minutes", false, "not_supported"),
    createCoverage("recovery-score", false, "not_supported"),
    createCoverage("strain-score", false, "not_supported"),
  ];
}

function normalizeWhoopCoverage(input: {
  hasWorkout: boolean;
  hasSleep: boolean;
  hasRecovery: boolean;
  hasStrain: boolean;
}) {
  return [
    createCoverage("workouts", input.hasWorkout, input.hasWorkout ? undefined : "no_samples"),
    createCoverage("duration", input.hasWorkout, input.hasWorkout ? undefined : "no_samples"),
    createCoverage("strain-score", input.hasStrain, input.hasWorkout ? "no_samples" : "no_samples"),
    createCoverage("sleep-duration", input.hasSleep, input.hasSleep ? undefined : "no_samples"),
    createCoverage(
      "recovery-score",
      input.hasRecovery,
      input.hasRecovery ? undefined : "no_samples",
    ),
    createCoverage(
      "resting-heart-rate",
      input.hasRecovery,
      input.hasRecovery ? undefined : "no_samples",
    ),
    createCoverage("distance", input.hasWorkout, input.hasWorkout ? undefined : "no_samples"),
    createCoverage("active-energy", false, "not_supported"),
    createCoverage("steps", false, "not_supported"),
    createCoverage("mindfulness-minutes", false, "not_supported"),
  ];
}

async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();
  const json = text ? (JSON.parse(text) as T | { message?: string; errors?: unknown }) : null;

  if (!response.ok) {
    const providerMessage =
      json && typeof json === "object" && "message" in json && typeof json.message === "string"
        ? json.message
        : fallbackMessage;
    throw new Error(providerMessage);
  }

  return json as T;
}

function createFormUrlEncodedBody(input: Record<string, string>) {
  const body = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    body.set(key, value);
  });
  return body;
}

async function createOauthState(input: {
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  userId: string;
  redirectUri: string;
  requestedScopes: string[];
  metadata?: Record<string, unknown>;
}) {
  const state = randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await input.supabaseAdmin.from("provider_oauth_states").insert({
    provider: input.provider,
    user_id: input.userId,
    state,
    redirect_uri: input.redirectUri,
    requested_scopes: input.requestedScopes,
    metadata: input.metadata ?? {},
    expires_at: expiresAt,
  });

  if (error) {
    throw error;
  }

  return state;
}

export async function consumeOauthState(input: {
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  state: string;
}) {
  const { data, error } = await input.supabaseAdmin
    .from("provider_oauth_states")
    .select("*")
    .eq("provider", input.provider)
    .eq("state", input.state)
    .maybeSingle<OAuthStateRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("The provider callback state was not recognized.");
  }

  if (data.consumed_at) {
    throw new Error("This provider callback has already been used.");
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error("The provider callback expired before it completed.");
  }

  const { error: updateError } = await input.supabaseAdmin
    .from("provider_oauth_states")
    .update({
      consumed_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) {
    throw updateError;
  }

  return data;
}

export async function buildProviderConnectUrl(input: {
  env: BackendEnv;
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  userId: string;
}) {
  if (!isProviderConfigured(input.env, input.provider)) {
    throw new Error(`${input.provider} is not configured on the backend yet.`);
  }

  const redirectUri = getRedirectUri(input.env, input.provider);
  const state = await createOauthState({
    supabaseAdmin: input.supabaseAdmin,
    provider: input.provider,
    userId: input.userId,
    redirectUri,
    requestedScopes: getProviderScopes(input.provider),
  });

  const client = getProviderClient(input.env, input.provider);

  if (!client.clientId) {
    throw new Error(`${input.provider} client ID is missing.`);
  }

  const url = new URL(
    input.provider === "strava"
      ? `${stravaBaseUrl}/oauth/mobile/authorize`
      : `${whoopApiBaseUrl}/oauth/oauth2/auth`,
  );
  url.searchParams.set("client_id", client.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", getProviderScopes(input.provider).join(","));
  url.searchParams.set("state", state);
  if (input.provider === "strava") {
    url.searchParams.set("approval_prompt", "auto");
  }

  return {
    provider: input.provider,
    authorizationUrl: url.toString(),
    redirectUri,
  };
}

async function exchangeProviderCode(input: {
  env: BackendEnv;
  provider: RemoteProvider;
  code: string;
  redirectUri: string;
}): Promise<TokenPayload> {
  const client = getProviderClient(input.env, input.provider);

  if (!client.clientId || !client.clientSecret) {
    throw new Error(`${input.provider} is not configured on the backend.`);
  }

  if (input.provider === "strava") {
    const tokenResponse = await fetchJson<{
      access_token: string;
      refresh_token: string;
      expires_at?: number;
      scope?: string;
    }>(
      `${stravaApiBaseUrl}/oauth/token`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: createFormUrlEncodedBody({
          client_id: client.clientId,
          client_secret: client.clientSecret,
          code: input.code,
          grant_type: "authorization_code",
        }),
      },
      "Strava could not finish the token exchange.",
    );

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: toIsoOrNull(tokenResponse.expires_at) ?? undefined,
      scope: tokenResponse.scope,
    };
  }

  const tokenResponse = await fetchJson<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  }>(
    `${whoopApiBaseUrl}/oauth/oauth2/token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: createFormUrlEncodedBody({
        client_id: client.clientId,
        client_secret: client.clientSecret,
        code: input.code,
        grant_type: "authorization_code",
        redirect_uri: input.redirectUri,
      }),
    },
    "WHOOP could not finish the token exchange.",
  );

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt:
      typeof tokenResponse.expires_in === "number"
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
    scope: tokenResponse.scope,
  };
}

async function refreshProviderAccessToken(input: {
  env: BackendEnv;
  provider: RemoteProvider;
  refreshToken: string;
}): Promise<TokenPayload> {
  const client = getProviderClient(input.env, input.provider);

  if (!client.clientId || !client.clientSecret) {
    throw new Error(`${input.provider} is not configured on the backend.`);
  }

  if (input.provider === "strava") {
    const tokenResponse = await fetchJson<{
      access_token: string;
      refresh_token: string;
      expires_at?: number;
      scope?: string;
    }>(
      `${stravaApiBaseUrl}/oauth/token`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: createFormUrlEncodedBody({
          client_id: client.clientId,
          client_secret: client.clientSecret,
          grant_type: "refresh_token",
          refresh_token: input.refreshToken,
        }),
      },
      "Strava could not refresh the access token.",
    );

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: toIsoOrNull(tokenResponse.expires_at) ?? undefined,
      scope: tokenResponse.scope,
    };
  }

  const tokenResponse = await fetchJson<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  }>(
    `${whoopApiBaseUrl}/oauth/oauth2/token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: createFormUrlEncodedBody({
        client_id: client.clientId,
        client_secret: client.clientSecret,
        grant_type: "refresh_token",
        refresh_token: input.refreshToken,
      }),
    },
    "WHOOP could not refresh the access token.",
  );

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? input.refreshToken,
    expiresAt:
      typeof tokenResponse.expires_in === "number"
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : undefined,
    scope: tokenResponse.scope,
  };
}

async function fetchProviderIdentity(input: {
  provider: RemoteProvider;
  accessToken: string;
}) {
  if (input.provider === "strava") {
    const athlete = await fetchJson<{
      id: number;
      username?: string | null;
      firstname?: string | null;
      lastname?: string | null;
    }>(
      `${stravaApiBaseUrl}/athlete`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
        },
      },
      "Unable to read the connected Strava athlete profile.",
    );

    const providerUsername =
      athlete.username ??
      [athlete.firstname, athlete.lastname].filter(Boolean).join(" ").trim() ??
      null;

    return {
      providerAccountId: String(athlete.id),
      providerUsername: providerUsername || null,
      providerAccountMetadata: {
        athleteId: athlete.id,
      },
    };
  }

  const profile = await fetchJson<{
    user_id: number;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  }>(
    `${whoopApiBaseUrl}/developer/v2/user/profile/basic`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    },
    "Unable to read the connected WHOOP profile.",
  );

  const providerUsername =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.email ||
    null;

  return {
    providerAccountId: String(profile.user_id),
    providerUsername,
    providerAccountMetadata: {
      email: profile.email ?? null,
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
    },
  };
}

async function upsertProviderConnection(input: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  provider: RemoteProvider;
  state: ConnectionState;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
  providerAccountId?: string | null;
  providerUsername?: string | null;
  scopes?: string[];
  coverage?: NormalizedCoverage[];
  syncCursor?: string | null;
  metadata?: Record<string, unknown>;
  providerAccountMetadata?: Record<string, unknown>;
  disconnectedAt?: string | null;
  revokedAt?: string | null;
  lastWebhookAt?: string | null;
  lastReconcileAt?: string | null;
}) {
  const row = {
    user_id: input.userId,
    provider: input.provider,
    state: input.state,
    connected_at: input.connectedAt ?? null,
    last_sync_at: input.lastSyncAt ?? null,
    last_error: input.lastError ?? null,
    provider_account_id: input.providerAccountId ?? null,
    provider_username: input.providerUsername ?? null,
    scopes: input.scopes ?? [],
    coverage: input.coverage ?? [],
    sync_cursor: input.syncCursor ?? null,
    metadata: input.metadata ?? {},
    provider_account_metadata: input.providerAccountMetadata ?? {},
    disconnected_at: input.disconnectedAt ?? null,
    revoked_at: input.revokedAt ?? null,
    last_webhook_at: input.lastWebhookAt ?? null,
    last_reconcile_at: input.lastReconcileAt ?? null,
  };

  const { data, error } = await input.supabaseAdmin
    .from("provider_connections")
    .upsert(row, {
      onConflict: "user_id,provider",
    })
    .select("*")
    .single<ProviderConnectionRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function storeProviderCredentials(input: {
  env: BackendEnv;
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  providerConnectionId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  revoke?: boolean;
}) {
  const accessRecord = sealProviderToken({
    provider: input.provider,
    kind: "access",
    value: input.accessToken,
    key: input.env.tokenEncryptionKey,
  });
  const refreshRecord = input.refreshToken
    ? sealProviderToken({
        provider: input.provider,
        kind: "refresh",
        value: input.refreshToken,
        key: input.env.tokenEncryptionKey,
      })
    : null;

  const { error } = await input.supabaseAdmin
    .from("provider_connection_credentials")
    .upsert(
      {
        provider_connection_id: input.providerConnectionId,
        access_token_fingerprint: accessRecord.fingerprint,
        refresh_token_fingerprint: refreshRecord?.fingerprint ?? null,
        access_token_envelope: accessRecord.encrypted,
        refresh_token_envelope: refreshRecord?.encrypted ?? null,
        access_token_key_id: accessRecord.keyId,
        refresh_token_key_id: refreshRecord?.keyId ?? null,
        access_token_expires_at: input.expiresAt ?? null,
        revoked_at: input.revoke ? new Date().toISOString() : null,
        rotated_at: new Date().toISOString(),
      },
      {
        onConflict: "provider_connection_id",
      },
    );

  if (error) {
    throw error;
  }
}

async function loadProviderConnection(input: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  provider: RemoteProvider;
}) {
  const { data, error } = await input.supabaseAdmin
    .from("provider_connections")
    .select("*")
    .eq("user_id", input.userId)
    .eq("provider", input.provider)
    .maybeSingle<ProviderConnectionRow>();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function loadProviderCredentials(input: {
  supabaseAdmin: SupabaseClient;
  providerConnectionId: string;
}) {
  const { data, error } = await input.supabaseAdmin
    .from("provider_connection_credentials")
    .select("*")
    .eq("provider_connection_id", input.providerConnectionId)
    .maybeSingle<ProviderCredentialRow>();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function ensureAccessToken(input: {
  env: BackendEnv;
  supabaseAdmin: SupabaseClient;
  connection: ProviderConnectionRow;
}) {
  const credentials = await loadProviderCredentials({
    supabaseAdmin: input.supabaseAdmin,
    providerConnectionId: input.connection.id,
  });

  if (!credentials?.access_token_envelope) {
    throw new Error(`No live ${input.connection.provider} credentials are stored for this account.`);
  }

  const accessToken = openProviderToken(
    {
      provider: input.connection.provider,
      kind: "access",
      keyId: credentials.access_token_key_id ?? input.env.tokenEncryptionKey.keyId,
      fingerprint: "",
      encrypted: credentials.access_token_envelope,
      createdAt: new Date().toISOString(),
    },
    input.env.tokenEncryptionKey,
  );

  const expiresAt = credentials.access_token_expires_at
    ? new Date(credentials.access_token_expires_at).getTime()
    : null;
  const shouldRefresh = expiresAt != null && expiresAt <= Date.now() + 60 * 1000;

  if (!shouldRefresh) {
    return {
      accessToken,
      connection: input.connection,
    };
  }

  if (!credentials.refresh_token_envelope) {
    throw new Error(`${input.connection.provider} needs a reconnect because no refresh token exists.`);
  }

  const refreshToken = openProviderToken(
    {
      provider: input.connection.provider,
      kind: "refresh",
      keyId: credentials.refresh_token_key_id ?? input.env.tokenEncryptionKey.keyId,
      fingerprint: "",
      encrypted: credentials.refresh_token_envelope,
      createdAt: new Date().toISOString(),
    },
    input.env.tokenEncryptionKey,
  );

  const refreshed = await refreshProviderAccessToken({
    env: input.env,
    provider: input.connection.provider,
    refreshToken,
  });

  await storeProviderCredentials({
    env: input.env,
    supabaseAdmin: input.supabaseAdmin,
    provider: input.connection.provider,
    providerConnectionId: input.connection.id,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? refreshToken,
    expiresAt: refreshed.expiresAt,
  });

  return {
    accessToken: refreshed.accessToken,
    connection: await upsertProviderConnection({
      supabaseAdmin: input.supabaseAdmin,
      userId: input.connection.user_id,
      provider: input.connection.provider,
      state: input.connection.state === "disconnected" ? "connected" : input.connection.state,
      connectedAt: input.connection.connected_at,
      lastSyncAt: input.connection.last_sync_at,
      lastError: input.connection.last_error,
      providerAccountId: input.connection.provider_account_id,
      providerUsername: input.connection.provider_username,
      scopes: input.connection.scopes ?? [],
      coverage: input.connection.coverage ?? [],
      syncCursor: input.connection.sync_cursor,
      metadata: input.connection.metadata ?? {},
      providerAccountMetadata: input.connection.provider_account_metadata ?? {},
      disconnectedAt: null,
      revokedAt: null,
      lastWebhookAt: input.connection.last_webhook_at,
      lastReconcileAt: input.connection.last_reconcile_at,
    }),
  };
}

async function startSyncRun(input: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  provider: RemoteProvider;
  providerConnectionId?: string;
  webhookEventId?: string;
  triggerSource: ProviderSyncTrigger;
  metadata?: Record<string, unknown>;
  cursorBefore?: string | null;
}): Promise<string> {
  const { data, error } = await input.supabaseAdmin
    .from("provider_sync_runs")
    .insert({
      user_id: input.userId,
      provider: input.provider,
      provider_connection_id: input.providerConnectionId ?? null,
      webhook_event_id: input.webhookEventId ?? null,
      trigger_source: input.triggerSource,
      status: "running",
      started_at: new Date().toISOString(),
      metadata: input.metadata ?? {},
      cursor_before: input.cursorBefore ?? null,
    })
    .select("id")
    .single<ProviderSyncRunRow>();

  if (error) {
    throw error;
  }

  return data.id;
}

async function finishSyncRun(input: {
  supabaseAdmin: SupabaseClient;
  runId: string;
  status: "succeeded" | "failed" | "skipped";
  itemCount?: number;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  cursorAfter?: string | null;
}) {
  const { error } = await input.supabaseAdmin
    .from("provider_sync_runs")
    .update({
      status: input.status,
      item_count: input.itemCount ?? 0,
      error_message: input.errorMessage ?? null,
      finished_at: new Date().toISOString(),
      metadata: input.metadata ?? {},
      cursor_after: input.cursorAfter ?? null,
    })
    .eq("id", input.runId);

  if (error) {
    throw error;
  }
}

async function persistSnapshot(input: {
  supabaseAdmin: SupabaseClient;
  snapshot: NormalizedSnapshotInput;
}) {
  const existingSnapshot = input.snapshot.sourceReference
    ? await input.supabaseAdmin
        .from("provider_snapshots")
        .select("id")
        .eq("user_id", input.snapshot.userId)
        .eq("provider", input.snapshot.provider)
        .eq("source_reference", input.snapshot.sourceReference)
        .maybeSingle<{ id: string }>()
    : { data: null, error: null };

  if (existingSnapshot.error) {
    throw existingSnapshot.error;
  }

  let snapshotId = existingSnapshot.data?.id ?? null;

  if (snapshotId) {
    const { error: updateError } = await input.supabaseAdmin
      .from("provider_snapshots")
      .update({
        provider_connection_id: input.snapshot.providerConnectionId,
        captured_at: input.snapshot.capturedAt,
        window_start_at: input.snapshot.windowStartAt,
        window_end_at: input.snapshot.windowEndAt,
        window_bucket: input.snapshot.windowBucket,
        metadata: input.snapshot.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", snapshotId);

    if (updateError) {
      throw updateError;
    }

    await input.supabaseAdmin
      .from("provider_snapshot_metrics")
      .delete()
      .eq("snapshot_id", snapshotId);
    await input.supabaseAdmin
      .from("provider_snapshot_coverage")
      .delete()
      .eq("snapshot_id", snapshotId);
  } else {
    const { data, error } = await input.supabaseAdmin
      .from("provider_snapshots")
      .insert({
        user_id: input.snapshot.userId,
        provider: input.snapshot.provider,
        provider_connection_id: input.snapshot.providerConnectionId,
        captured_at: input.snapshot.capturedAt,
        window_start_at: input.snapshot.windowStartAt,
        window_end_at: input.snapshot.windowEndAt,
        window_bucket: input.snapshot.windowBucket,
        source_reference: input.snapshot.sourceReference ?? null,
        metadata: input.snapshot.metadata ?? {},
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw error;
    }

    snapshotId = data.id;
  }

  if (!snapshotId) {
    throw new Error("Unable to persist provider snapshot.");
  }

  if (input.snapshot.metrics.length > 0) {
    const metricRows = input.snapshot.metrics.map((metric, index) => ({
      snapshot_id: snapshotId,
      metric_key: metric.key,
      value_numeric: typeof metric.value === "number" ? metric.value : null,
      value_text: typeof metric.value === "string" ? metric.value : null,
      value_boolean: typeof metric.value === "boolean" ? metric.value : null,
      unit: metric.unit ?? null,
      source: metric.source ?? "live",
      observed_at: metric.observedAt ?? input.snapshot.capturedAt,
      confidence: metric.confidence ?? "high",
      sort_order: index,
    }));

    const { error } = await input.supabaseAdmin
      .from("provider_snapshot_metrics")
      .insert(metricRows);

    if (error) {
      throw error;
    }
  }

  if (input.snapshot.coverage.length > 0) {
    const coverageRows = input.snapshot.coverage.map((metric) => ({
      snapshot_id: snapshotId,
      metric_key: metric.key,
      available: metric.available,
      reason: metric.available ? null : metric.reason ?? "no_samples",
    }));

    const { error } = await input.supabaseAdmin
      .from("provider_snapshot_coverage")
      .insert(coverageRows);

    if (error) {
      throw error;
    }
  }

  return snapshotId;
}

function getActivityEnergyKcal(kilojoules?: number | null) {
  if (typeof kilojoules !== "number" || Number.isNaN(kilojoules)) {
    return null;
  }

  return Math.round(kilojoules * 0.239006);
}

async function fetchStravaActivities(input: {
  accessToken: string;
  after?: number;
  activityId?: string;
}) {
  if (input.activityId) {
    const activity = await fetchJson<Record<string, unknown>>(
      `${stravaApiBaseUrl}/activities/${input.activityId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
        },
      },
      "Unable to load the requested Strava activity.",
    );

    return [activity];
  }

  const url = new URL(`${stravaApiBaseUrl}/athlete/activities`);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "12");
  if (input.after) {
    url.searchParams.set("after", String(input.after));
  } else {
    url.searchParams.set(
      "after",
      String(Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000)),
    );
  }

  return fetchJson<Array<Record<string, unknown>>>(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    },
    "Unable to load recent Strava activities.",
  );
}

function mapStravaSnapshot(input: {
  activity: Record<string, unknown>;
  providerConnectionId: string;
  userId: string;
}): NormalizedSnapshotInput | null {
  const id = input.activity.id;
  const start = toIsoOrNull(input.activity.start_date as string | undefined);
  const movingTimeSeconds =
    typeof input.activity.moving_time === "number" ? input.activity.moving_time : null;
  const elapsedTimeSeconds =
    typeof input.activity.elapsed_time === "number" ? input.activity.elapsed_time : null;
  const durationSeconds = movingTimeSeconds ?? elapsedTimeSeconds;

  if (!id || !start || !durationSeconds) {
    return null;
  }

  const capturedAt = start;
  const endDate = new Date(new Date(start).getTime() + durationSeconds * 1000).toISOString();
  const distanceMeters =
    typeof input.activity.distance === "number" ? input.activity.distance : null;
  const activeEnergy = getActivityEnergyKcal(
    typeof input.activity.kilojoules === "number" ? input.activity.kilojoules : null,
  );

  return {
    provider: "strava",
    providerConnectionId: input.providerConnectionId,
    userId: input.userId,
    capturedAt,
    windowStartAt: start,
    windowEndAt: endDate,
    windowBucket: toMetricWindowBucket("event-summary"),
    sourceReference: `strava-activity:${id}`,
    metadata: {
      kind: "event-summary",
      eventType: "workout",
      externalId: String(id),
      dedupeKey: `strava-activity:${id}`,
      title: typeof input.activity.name === "string" ? input.activity.name : "Strava workout",
      sport: input.activity.sport_type ?? input.activity.type ?? null,
      provider: "strava",
    },
    metrics: [
      {
        key: "workouts",
        value: 1,
        unit: "count",
        observedAt: start,
      },
      {
        key: "duration",
        value: Math.round(durationSeconds / 60),
        unit: "min",
        observedAt: endDate,
      },
      ...(distanceMeters != null
        ? [
            {
              key: "distance" as const,
              value: Math.round(distanceMeters),
              unit: "m",
              observedAt: endDate,
            },
          ]
        : []),
      ...(activeEnergy != null
        ? [
            {
              key: "active-energy" as const,
              value: activeEnergy,
              unit: "kcal",
              observedAt: endDate,
            },
          ]
        : []),
    ],
    coverage: normalizeStravaCoverage(true, activeEnergy != null),
  };
}

async function syncStrava(input: {
  supabaseAdmin: SupabaseClient;
  connection: ProviderConnectionRow;
  accessToken: string;
  objectId?: string;
}) {
  const after =
    input.connection.sync_cursor &&
    !Number.isNaN(Date.parse(input.connection.sync_cursor))
      ? Math.floor(new Date(input.connection.sync_cursor).getTime() / 1000) - 12 * 60 * 60
      : undefined;

  const activities = await fetchStravaActivities({
    accessToken: input.accessToken,
    after,
    activityId: input.objectId,
  });

  const snapshots = activities
    .map((activity) =>
      mapStravaSnapshot({
        activity,
        providerConnectionId: input.connection.id,
        userId: input.connection.user_id,
      }),
    )
    .filter((item): item is NormalizedSnapshotInput => Boolean(item));

  let latestSnapshotId: string | undefined;
  for (const snapshot of snapshots) {
    latestSnapshotId = await persistSnapshot({
      supabaseAdmin: input.supabaseAdmin,
      snapshot,
    });
  }

  const hasActivities = snapshots.length > 0;
  const hasEnergy = snapshots.some((snapshot) =>
    snapshot.metrics.some((metric) => metric.key === "active-energy"),
  );

  return {
    latestSnapshotId,
    itemCount: snapshots.length,
    coverage: normalizeStravaCoverage(hasActivities, hasEnergy),
    status: (hasActivities ? "connected" : "connected_limited") as
      | "connected"
      | "connected_limited",
    syncCursor: new Date().toISOString(),
  };
}

async function fetchWhoopCollection<T extends Record<string, unknown>>(input: {
  accessToken: string;
  path: string;
  limit?: number;
  start?: string;
}) {
  const url = new URL(`${whoopApiBaseUrl}${input.path}`);
  url.searchParams.set("limit", String(input.limit ?? 10));
  if (input.start) {
    url.searchParams.set("start", input.start);
  }

  return fetchJson<{ records?: T[] }>(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    },
    "Unable to load recent WHOOP data.",
  );
}

function mapWhoopWorkoutSnapshot(input: {
  workout: Record<string, unknown>;
  providerConnectionId: string;
  userId: string;
}): NormalizedSnapshotInput | null {
  const id = input.workout.id;
  const start = toIsoOrNull(input.workout.start as string | undefined);
  const end = toIsoOrNull(input.workout.end as string | undefined);

  if (!id || !start || !end) {
    return null;
  }

  const durationMinutes = Math.max(
    1,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
  const score =
    typeof input.workout.score === "object" && input.workout.score
      ? (input.workout.score as Record<string, unknown>)
      : {};
  const strain =
    typeof score.strain === "number"
      ? Number(score.strain.toFixed(1))
      : typeof score.kilojoule === "number"
        ? Number(score.kilojoule.toFixed(1))
        : null;
  const distance =
    typeof input.workout.distance_meter === "number"
      ? input.workout.distance_meter
      : null;

  return {
    provider: "whoop",
    providerConnectionId: input.providerConnectionId,
    userId: input.userId,
    capturedAt: end,
    windowStartAt: start,
    windowEndAt: end,
    windowBucket: toMetricWindowBucket("event-summary"),
    sourceReference: `whoop-workout:${id}`,
    metadata: {
      kind: "event-summary",
      eventType: "workout",
      externalId: String(id),
      dedupeKey: `whoop-workout:${id}`,
      title:
        typeof input.workout.sport_name === "string"
          ? input.workout.sport_name
          : "WHOOP workout",
      provider: "whoop",
    },
    metrics: [
      {
        key: "workouts",
        value: 1,
        unit: "count",
        observedAt: start,
      },
      {
        key: "duration",
        value: durationMinutes,
        unit: "min",
        observedAt: end,
      },
      ...(strain != null
        ? [
            {
              key: "strain-score" as const,
              value: strain,
              unit: "score",
              observedAt: end,
            },
          ]
        : []),
      ...(distance != null
        ? [
            {
              key: "distance" as const,
              value: Math.round(distance),
              unit: "m",
              observedAt: end,
            },
          ]
        : []),
    ],
    coverage: normalizeWhoopCoverage({
      hasWorkout: true,
      hasSleep: false,
      hasRecovery: false,
      hasStrain: strain != null,
    }),
  };
}

function mapWhoopSleepSnapshot(input: {
  sleep: Record<string, unknown>;
  providerConnectionId: string;
  userId: string;
}): NormalizedSnapshotInput | null {
  const id = input.sleep.id;
  const start = toIsoOrNull(input.sleep.start as string | undefined);
  const end = toIsoOrNull(input.sleep.end as string | undefined);
  if (!id || !start || !end) {
    return null;
  }

  const score =
    typeof input.sleep.score === "object" && input.sleep.score
      ? (input.sleep.score as Record<string, unknown>)
      : {};
  const stageSummary =
    typeof score.stage_summary === "object" && score.stage_summary
      ? (score.stage_summary as Record<string, unknown>)
      : {};
  const inBedMillis =
    typeof stageSummary.total_in_bed_time_milli === "number"
      ? stageSummary.total_in_bed_time_milli
      : null;
  const sleepHours = inBedMillis ? Number((inBedMillis / 3600000).toFixed(1)) : null;

  if (sleepHours == null) {
    return null;
  }

  return {
    provider: "whoop",
    providerConnectionId: input.providerConnectionId,
    userId: input.userId,
    capturedAt: end,
    windowStartAt: start,
    windowEndAt: end,
    windowBucket: toMetricWindowBucket("event-summary"),
    sourceReference: `whoop-sleep:${id}`,
    metadata: {
      kind: "event-summary",
      eventType: "sleep",
      externalId: String(id),
      dedupeKey: `whoop-sleep:${id}`,
      title: "WHOOP sleep",
      provider: "whoop",
    },
    metrics: [
      {
        key: "sleep-duration",
        value: sleepHours,
        unit: "hours",
        observedAt: end,
      },
    ],
    coverage: normalizeWhoopCoverage({
      hasWorkout: false,
      hasSleep: true,
      hasRecovery: false,
      hasStrain: false,
    }),
  };
}

function mapWhoopRecoverySnapshot(input: {
  recovery: Record<string, unknown>;
  providerConnectionId: string;
  userId: string;
}): NormalizedSnapshotInput | null {
  const score =
    typeof input.recovery.score === "object" && input.recovery.score
      ? (input.recovery.score as Record<string, unknown>)
      : {};
  const sleepId =
    typeof input.recovery.sleep_id === "string"
      ? input.recovery.sleep_id
      : typeof input.recovery.cycle_id === "number"
        ? `cycle:${input.recovery.cycle_id}`
        : null;

  if (!sleepId) {
    return null;
  }

  const observedAt =
    toIsoOrNull(input.recovery.updated_at as string | undefined) ??
    new Date().toISOString();
  const recoveryScore =
    typeof score.recovery_score === "number" ? score.recovery_score : null;
  const restingHeartRate =
    typeof score.resting_heart_rate === "number" ? score.resting_heart_rate : null;

  if (recoveryScore == null && restingHeartRate == null) {
    return null;
  }

  return {
    provider: "whoop",
    providerConnectionId: input.providerConnectionId,
    userId: input.userId,
    capturedAt: observedAt,
    windowStartAt: observedAt,
    windowEndAt: observedAt,
    windowBucket: toMetricWindowBucket("event-summary"),
    sourceReference: `whoop-recovery:${sleepId}`,
    metadata: {
      kind: "event-summary",
      eventType: "recovery",
      externalId: sleepId,
      dedupeKey: `whoop-recovery:${sleepId}`,
      title: "WHOOP recovery",
      provider: "whoop",
    },
    metrics: [
      ...(recoveryScore != null
        ? [
            {
              key: "recovery-score" as const,
              value: recoveryScore,
              unit: "score",
              observedAt,
            },
          ]
        : []),
      ...(restingHeartRate != null
        ? [
            {
              key: "resting-heart-rate" as const,
              value: restingHeartRate,
              unit: "bpm",
              observedAt,
            },
          ]
        : []),
    ],
    coverage: normalizeWhoopCoverage({
      hasWorkout: false,
      hasSleep: false,
      hasRecovery: true,
      hasStrain: false,
    }),
  };
}

function buildWhoopDailySummary(input: {
  connection: ProviderConnectionRow;
  sleepSnapshot: NormalizedSnapshotInput | null;
  recoverySnapshot: NormalizedSnapshotInput | null;
  workoutSnapshot: NormalizedSnapshotInput | null;
}): NormalizedSnapshotInput | null {
  const parts = [
    input.sleepSnapshot,
    input.recoverySnapshot,
    input.workoutSnapshot,
  ].filter((value): value is NormalizedSnapshotInput => Boolean(value));

  if (parts.length === 0) {
    return null;
  }

  const capturedAt = parts
    .map((part) => part.capturedAt)
    .sort((left, right) => (left < right ? 1 : -1))[0];
  const windowStartAt = parts
    .map((part) => part.windowStartAt)
    .sort((left, right) => (left < right ? -1 : 1))[0];
  const windowEndAt = parts
    .map((part) => part.windowEndAt)
    .sort((left, right) => (left < right ? 1 : -1))[0];
  const dateKey = capturedAt.slice(0, 10);
  const hasWorkout = Boolean(input.workoutSnapshot);
  const hasSleep = Boolean(input.sleepSnapshot);
  const hasRecovery = Boolean(input.recoverySnapshot);
  const hasStrain = Boolean(
    input.workoutSnapshot?.metrics.some((metric) => metric.key === "strain-score"),
  );

  return {
    provider: "whoop",
    providerConnectionId: input.connection.id,
    userId: input.connection.user_id,
    capturedAt,
    windowStartAt,
    windowEndAt,
    windowBucket: toMetricWindowBucket("daily-summary"),
    sourceReference: `whoop-daily:${dateKey}`,
    metadata: {
      kind: "daily-summary",
      externalId: dateKey,
      dedupeKey: `whoop-daily:${dateKey}`,
      provider: "whoop",
    },
    metrics: parts.flatMap((snapshot) => snapshot.metrics),
    coverage: normalizeWhoopCoverage({
      hasWorkout,
      hasSleep,
      hasRecovery,
      hasStrain,
    }),
  };
}

async function syncWhoop(input: {
  supabaseAdmin: SupabaseClient;
  connection: ProviderConnectionRow;
  accessToken: string;
  eventType?: string;
  objectId?: string;
}) {
  const start = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [workoutsResult, sleepsResult, recoveriesResult] = await Promise.all([
    fetchWhoopCollection<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: "/developer/v2/workout",
      limit: input.objectId && input.eventType?.startsWith("workout.") ? 1 : 8,
      start,
    }),
    fetchWhoopCollection<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: "/developer/v2/activity/sleep".replace("/activity", ""),
      limit: input.objectId && input.eventType?.startsWith("sleep.") ? 1 : 4,
      start,
    }).catch(() =>
      fetchWhoopCollection<Record<string, unknown>>({
        accessToken: input.accessToken,
        path: "/developer/v2/sleep",
        limit: input.objectId && input.eventType?.startsWith("sleep.") ? 1 : 4,
        start,
      }),
    ),
    fetchWhoopCollection<Record<string, unknown>>({
      accessToken: input.accessToken,
      path: "/developer/v2/recovery",
      limit: input.objectId && input.eventType?.startsWith("recovery.") ? 1 : 4,
      start,
    }),
  ]);

  const workouts = workoutsResult.records ?? [];
  const sleeps = sleepsResult.records ?? [];
  const recoveries = recoveriesResult.records ?? [];

  const workoutSnapshots = workouts
    .map((workout) =>
      mapWhoopWorkoutSnapshot({
        workout,
        providerConnectionId: input.connection.id,
        userId: input.connection.user_id,
      }),
    )
    .filter((item): item is NormalizedSnapshotInput => Boolean(item));
  const sleepSnapshots = sleeps
    .map((sleep) =>
      mapWhoopSleepSnapshot({
        sleep,
        providerConnectionId: input.connection.id,
        userId: input.connection.user_id,
      }),
    )
    .filter((item): item is NormalizedSnapshotInput => Boolean(item));
  const recoverySnapshots = recoveries
    .map((recovery) =>
      mapWhoopRecoverySnapshot({
        recovery,
        providerConnectionId: input.connection.id,
        userId: input.connection.user_id,
      }),
    )
    .filter((item): item is NormalizedSnapshotInput => Boolean(item));

  let latestSnapshotId: string | undefined;
  const allSnapshots = [...workoutSnapshots, ...sleepSnapshots, ...recoverySnapshots];
  for (const snapshot of allSnapshots) {
    latestSnapshotId = await persistSnapshot({
      supabaseAdmin: input.supabaseAdmin,
      snapshot,
    });
  }

  const dailySummary = buildWhoopDailySummary({
    connection: input.connection,
    workoutSnapshot: workoutSnapshots[0] ?? null,
    sleepSnapshot: sleepSnapshots[0] ?? null,
    recoverySnapshot: recoverySnapshots[0] ?? null,
  });

  if (dailySummary) {
    latestSnapshotId = await persistSnapshot({
      supabaseAdmin: input.supabaseAdmin,
      snapshot: dailySummary,
    });
  }

  const coverage = normalizeWhoopCoverage({
    hasWorkout: workoutSnapshots.length > 0,
    hasSleep: sleepSnapshots.length > 0,
    hasRecovery: recoverySnapshots.length > 0,
    hasStrain: workoutSnapshots.some((snapshot) =>
      snapshot.metrics.some((metric) => metric.key === "strain-score"),
    ),
  });
  const itemCount = allSnapshots.length + (dailySummary ? 1 : 0);
  const hasAnyUsefulData = coverage.some((metric) => metric.available);

  return {
    latestSnapshotId,
    itemCount,
    coverage,
    status: (hasAnyUsefulData ? "connected" : "connected_limited") as
      | "connected"
      | "connected_limited",
    syncCursor: new Date().toISOString(),
  };
}

export async function completeProviderCallback(input: {
  env: BackendEnv;
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  state: string;
  code: string;
}) {
  const oauthState = await consumeOauthState({
    supabaseAdmin: input.supabaseAdmin,
    provider: input.provider,
    state: input.state,
  });
  const tokenPayload = await exchangeProviderCode({
    env: input.env,
    provider: input.provider,
    code: input.code,
    redirectUri: oauthState.redirect_uri,
  });
  const identity = await fetchProviderIdentity({
    provider: input.provider,
    accessToken: tokenPayload.accessToken,
  });

  const connection = await upsertProviderConnection({
    supabaseAdmin: input.supabaseAdmin,
    userId: oauthState.user_id,
    provider: input.provider,
    state: "syncing",
    connectedAt: new Date().toISOString(),
    lastError: null,
    providerAccountId: identity.providerAccountId,
    providerUsername: identity.providerUsername,
    scopes: (tokenPayload.scope ?? "")
      .split(/[,\s]+/u)
      .filter(Boolean),
    coverage: createUnavailableCoverage(
      input.provider === "strava"
        ? ["workouts", "distance", "duration", "active-energy"]
        : ["workouts", "duration", "sleep-duration", "recovery-score", "resting-heart-rate", "strain-score", "distance"],
    ),
    metadata: {
      oauthCompletedAt: new Date().toISOString(),
    },
    providerAccountMetadata: identity.providerAccountMetadata,
    disconnectedAt: null,
    revokedAt: null,
  });

  await storeProviderCredentials({
    env: input.env,
    supabaseAdmin: input.supabaseAdmin,
    provider: input.provider,
    providerConnectionId: connection.id,
    accessToken: tokenPayload.accessToken,
    refreshToken: tokenPayload.refreshToken,
    expiresAt: tokenPayload.expiresAt,
  });

  const result = await syncProviderConnection({
    env: input.env,
    supabaseAdmin: input.supabaseAdmin,
    provider: input.provider,
    userId: oauthState.user_id,
    triggerSource: "oauth_callback",
    providerConnectionId: connection.id,
  });

  return {
    appRedirectUrl: getAppDeepLink(input.provider, {
      status: "connected",
      provider: input.provider,
      sync: result.status,
    }),
  };
}

export async function syncProviderConnection(input: {
  env: BackendEnv;
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  userId: string;
  triggerSource: ProviderSyncTrigger;
  providerConnectionId?: string;
  webhookEventId?: string;
  eventType?: string;
  objectId?: string;
  objectType?: string;
}): Promise<SyncProviderResult> {
  const existingConnection =
    (input.providerConnectionId
      ? await input.supabaseAdmin
          .from("provider_connections")
          .select("*")
          .eq("id", input.providerConnectionId)
          .maybeSingle<ProviderConnectionRow>()
      : { data: await loadProviderConnection({
          supabaseAdmin: input.supabaseAdmin,
          userId: input.userId,
          provider: input.provider,
        }), error: null }) as {
      data: ProviderConnectionRow | null;
      error: { message?: string } | null;
    };

  if (existingConnection.error) {
    throw existingConnection.error;
  }

  const connection = existingConnection.data;
  if (!connection) {
    throw new Error(`${input.provider} is not connected for this account yet.`);
  }

  const runId = await startSyncRun({
    supabaseAdmin: input.supabaseAdmin,
    userId: input.userId,
    provider: input.provider,
    providerConnectionId: connection.id,
    webhookEventId: input.webhookEventId,
    triggerSource: input.triggerSource,
    metadata: {
      eventType: input.eventType ?? null,
      objectId: input.objectId ?? null,
      objectType: input.objectType ?? null,
    },
    cursorBefore: connection.sync_cursor,
  });

  try {
    const { accessToken } = await ensureAccessToken({
      env: input.env,
      supabaseAdmin: input.supabaseAdmin,
      connection,
    });

    const syncResult =
      input.provider === "strava"
        ? await syncStrava({
            supabaseAdmin: input.supabaseAdmin,
            connection,
            accessToken,
            objectId:
              input.objectType === "activity" || !input.objectType ? input.objectId : undefined,
          })
        : await syncWhoop({
            supabaseAdmin: input.supabaseAdmin,
            connection,
            accessToken,
            eventType: input.eventType,
            objectId: input.objectId,
          });

    const nextConnection = await upsertProviderConnection({
      supabaseAdmin: input.supabaseAdmin,
      userId: input.userId,
      provider: input.provider,
      state: syncResult.status,
      connectedAt: connection.connected_at ?? new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      lastError: null,
      providerAccountId: connection.provider_account_id,
      providerUsername: connection.provider_username,
      scopes: connection.scopes ?? [],
      coverage: syncResult.coverage,
      syncCursor: syncResult.syncCursor ?? connection.sync_cursor,
      metadata: {
        ...(connection.metadata ?? {}),
        latestSnapshotId: syncResult.latestSnapshotId ?? null,
      },
      providerAccountMetadata: connection.provider_account_metadata ?? {},
      disconnectedAt: null,
      revokedAt: null,
      lastWebhookAt:
        input.triggerSource === "webhook"
          ? new Date().toISOString()
          : connection.last_webhook_at,
      lastReconcileAt:
        input.triggerSource === "reconcile"
          ? new Date().toISOString()
          : connection.last_reconcile_at,
    });

    await finishSyncRun({
      supabaseAdmin: input.supabaseAdmin,
      runId,
      status: "succeeded",
      itemCount: syncResult.itemCount,
      metadata: {
        latestSnapshotId: syncResult.latestSnapshotId ?? null,
      },
      cursorAfter: syncResult.syncCursor ?? null,
    });

    return {
      provider: input.provider,
      connection: nextConnection,
      latestSnapshotId: syncResult.latestSnapshotId,
      itemCount: syncResult.itemCount,
      status: syncResult.status,
      coverage: syncResult.coverage,
      syncCursor: syncResult.syncCursor,
    };
  } catch (error) {
    const message = serializeUnknownError(
      error,
      `Unable to sync ${input.provider} right now.`,
    );

    await upsertProviderConnection({
      supabaseAdmin: input.supabaseAdmin,
      userId: input.userId,
      provider: input.provider,
      state: "error",
      connectedAt: connection.connected_at,
      lastSyncAt: connection.last_sync_at,
      lastError: message,
      providerAccountId: connection.provider_account_id,
      providerUsername: connection.provider_username,
      scopes: connection.scopes ?? [],
      coverage: connection.coverage ?? createUnavailableCoverage(allMetricKeys),
      syncCursor: connection.sync_cursor,
      metadata: connection.metadata ?? {},
      providerAccountMetadata: connection.provider_account_metadata ?? {},
      disconnectedAt: connection.disconnected_at,
      revokedAt: connection.revoked_at,
      lastWebhookAt: connection.last_webhook_at,
      lastReconcileAt: connection.last_reconcile_at,
    });

    await finishSyncRun({
      supabaseAdmin: input.supabaseAdmin,
      runId,
      status: "failed",
      itemCount: 0,
      errorMessage: message,
    });

    throw error;
  }
}

export async function disconnectProviderConnection(input: {
  env: BackendEnv;
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  userId: string;
}) {
  const connection = await loadProviderConnection({
    supabaseAdmin: input.supabaseAdmin,
    userId: input.userId,
    provider: input.provider,
  });

  if (!connection) {
    return {
      disconnected: true,
      provider: input.provider,
    };
  }

  try {
    const { accessToken } = await ensureAccessToken({
      env: input.env,
      supabaseAdmin: input.supabaseAdmin,
      connection,
    });

    if (input.provider === "strava") {
      const body = createFormUrlEncodedBody({
        access_token: accessToken,
      });
      await fetch(`${stravaBaseUrl}/oauth/deauthorize`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      }).catch(() => null);
    } else {
      await fetch(`${whoopApiBaseUrl}/developer/v2/user/access`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => null);
    }
  } catch {
    // We still clear local credentials even if the upstream revoke call fails.
  }

  const now = new Date().toISOString();
  await upsertProviderConnection({
    supabaseAdmin: input.supabaseAdmin,
    userId: input.userId,
    provider: input.provider,
    state: "disconnected",
    connectedAt: connection.connected_at,
    lastSyncAt: connection.last_sync_at,
    lastError: null,
    providerAccountId: connection.provider_account_id,
    providerUsername: connection.provider_username,
    scopes: connection.scopes ?? [],
    coverage: createDisconnectedCoverage(allMetricKeys),
    syncCursor: null,
    metadata: connection.metadata ?? {},
    providerAccountMetadata: connection.provider_account_metadata ?? {},
    disconnectedAt: now,
    revokedAt: now,
    lastWebhookAt: connection.last_webhook_at,
    lastReconcileAt: connection.last_reconcile_at,
  });

  const { error } = await input.supabaseAdmin
    .from("provider_connection_credentials")
    .upsert(
      {
        provider_connection_id: connection.id,
        access_token_envelope: null,
        refresh_token_envelope: null,
        access_token_key_id: null,
        refresh_token_key_id: null,
        access_token_fingerprint: null,
        refresh_token_fingerprint: null,
        access_token_expires_at: null,
        revoked_at: now,
      },
      {
        onConflict: "provider_connection_id",
      },
    );

  if (error) {
    throw error;
  }

  return {
    disconnected: true,
    provider: input.provider,
  };
}

function resolveWebhookDedupeKey(input: {
  provider: RemoteProvider;
  payload: Record<string, unknown>;
}) {
  if (input.provider === "strava") {
    const objectId = input.payload.object_id;
    const objectType = input.payload.object_type;
    const aspectType = input.payload.aspect_type;
    const eventTime = input.payload.event_time;
    return [objectType, objectId, aspectType, eventTime].filter(Boolean).join(":");
  }

  return (
    (typeof input.payload.trace_id === "string" && input.payload.trace_id) ||
    (typeof input.payload.id === "string" && input.payload.id) ||
    null
  );
}

export async function persistWebhookEvent(input: {
  supabaseAdmin: SupabaseClient;
  provider: RemoteProvider;
  payload: Record<string, unknown>;
  signatureVerified: boolean;
}) {
  const externalEventId =
    typeof input.payload.id === "string" || typeof input.payload.id === "number"
      ? String(input.payload.id)
      : typeof input.payload.object_id === "number"
        ? String(input.payload.object_id)
        : null;
  const dedupeKey = resolveWebhookDedupeKey({
    provider: input.provider,
    payload: input.payload,
  });

  const { data, error } = await input.supabaseAdmin
    .from("provider_webhook_events")
    .upsert(
      {
        provider: input.provider,
        external_event_id: externalEventId,
        dedupe_key: dedupeKey,
        trace_id:
          typeof input.payload.trace_id === "string" ? input.payload.trace_id : null,
        event_type:
          typeof input.payload.type === "string"
            ? input.payload.type
            : typeof input.payload.aspect_type === "string"
              ? input.payload.aspect_type
              : "updated",
        payload: input.payload,
        signature_verified: input.signatureVerified,
        status: "queued",
        event_occurred_at:
          typeof input.payload.event_time === "number"
            ? new Date(input.payload.event_time * 1000).toISOString()
            : new Date().toISOString(),
      },
      {
        onConflict: dedupeKey ? "provider,dedupe_key" : undefined,
      },
    )
    .select("*")
    .single<ProviderWebhookEventRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function queueWebhookProcessing(queue: PgBoss, payload: WebhookProcessJobPayload) {
  await queue.send(queueJobNames.webhookProcess, payload);
}

export async function queueProviderSync(queue: PgBoss, payload: ProviderSyncJobPayload) {
  await queue.send(queueJobNames.providerSync, payload);
}

export async function processQueuedWebhook(input: {
  env: BackendEnv;
  supabaseAdmin: SupabaseClient;
  webhookEventId: string;
}) {
  const { data, error } = await input.supabaseAdmin
    .from("provider_webhook_events")
    .select("*")
    .eq("id", input.webhookEventId)
    .single<ProviderWebhookEventRow>();

  if (error) {
    throw error;
  }

  const payload = data.payload ?? {};

  if (data.provider === "strava") {
    const ownerId =
      typeof payload.owner_id === "number" ? String(payload.owner_id) : null;

    if (!ownerId) {
      await input.supabaseAdmin
        .from("provider_webhook_events")
        .update({
          status: "failed",
          error_message: "Strava webhook owner_id was missing.",
          processed_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      return;
    }

    const { data: connection, error: connectionError } = await input.supabaseAdmin
      .from("provider_connections")
      .select("*")
      .eq("provider", "strava")
      .eq("provider_account_id", ownerId)
      .maybeSingle<ProviderConnectionRow>();

    if (connectionError) {
      throw connectionError;
    }

    if (!connection) {
      await input.supabaseAdmin
        .from("provider_webhook_events")
        .update({
          status: "rejected",
          error_message: "No connected Strava account matched this webhook owner.",
          processed_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      return;
    }

    await input.supabaseAdmin
      .from("provider_webhook_events")
      .update({
        user_id: connection.user_id,
        provider_connection_id: connection.id,
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    await syncProviderConnection({
      env: input.env,
      supabaseAdmin: input.supabaseAdmin,
      provider: "strava",
      userId: connection.user_id,
      providerConnectionId: connection.id,
      triggerSource: "webhook",
      webhookEventId: data.id,
      eventType:
        typeof payload.aspect_type === "string" ? payload.aspect_type : data.event_type,
      objectId:
        typeof payload.object_id === "number" ? String(payload.object_id) : undefined,
      objectType:
        typeof payload.object_type === "string" ? payload.object_type : undefined,
    });
    return;
  }

  const { data: connection, error: connectionError } = await input.supabaseAdmin
    .from("provider_connections")
    .select("*")
    .eq("provider", "whoop")
    .eq(
      "provider_account_id",
      typeof payload.user_id === "number" ? String(payload.user_id) : "",
    )
    .maybeSingle<ProviderConnectionRow>();

  if (connectionError) {
    throw connectionError;
  }

  if (!connection) {
    await input.supabaseAdmin
      .from("provider_webhook_events")
      .update({
        status: "rejected",
        error_message: "No connected WHOOP account matched this webhook user.",
        processed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return;
  }

  await input.supabaseAdmin
    .from("provider_webhook_events")
    .update({
      user_id: connection.user_id,
      provider_connection_id: connection.id,
      status: "processed",
      processed_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  await syncProviderConnection({
    env: input.env,
    supabaseAdmin: input.supabaseAdmin,
    provider: "whoop",
    userId: connection.user_id,
    providerConnectionId: connection.id,
    triggerSource: "webhook",
    webhookEventId: data.id,
    eventType:
      typeof payload.type === "string" ? payload.type : data.event_type,
    objectId:
      typeof payload.id === "string" || typeof payload.id === "number"
        ? String(payload.id)
        : undefined,
  });
}

export function isRemoteProvider(value: string): value is RemoteProvider {
  return remoteProviders.includes(value as RemoteProvider);
}
