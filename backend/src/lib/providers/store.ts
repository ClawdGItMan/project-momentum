import type { SupabaseClient } from "@supabase/supabase-js";

import type { BackendEnv } from "../../config/env";
import { openProviderToken, sealProviderToken } from "../security";
import type {
  ManagedProvider,
  NormalizedSnapshotInput,
  ProviderConnectionRow,
  ProviderOAuthStateRow,
  ProviderSyncRunRow,
  ProviderWebhookEventRow,
  StoredProviderToken,
  UpsertConnectionInput,
} from "./types";

function maybeSingleNotFound(code?: string | null): boolean {
  return code === "PGRST116";
}

function parseStoredToken(raw: string | null): StoredProviderToken | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as StoredProviderToken;
  if (!parsed || typeof parsed !== "object" || !("encrypted" in parsed)) {
    throw new Error("Stored provider token is malformed.");
  }
  return parsed;
}

function serializeStoredToken(record: StoredProviderToken | null | undefined): string | null {
  if (record == null) return null;
  return JSON.stringify(record);
}

export function createStoredProviderToken(input: {
  env: BackendEnv;
  provider: ManagedProvider;
  kind: "access" | "refresh";
  value: string;
  userId: string;
}): StoredProviderToken {
  return sealProviderToken({
    provider: input.provider,
    kind: input.kind,
    value: input.value,
    key: input.env.tokenEncryptionKey,
    aad: `${input.provider}:${input.userId}:${input.kind}`,
  });
}

export function openStoredProviderToken(input: {
  env: BackendEnv;
  provider: ManagedProvider;
  kind: "access" | "refresh";
  raw: string | null;
  userId: string;
}): string | null {
  const record = parseStoredToken(input.raw);
  if (!record) return null;

  return openProviderToken(
    record,
    input.env.tokenEncryptionKey,
    `${input.provider}:${input.userId}:${input.kind}`,
  );
}

export async function getProviderConnection(
  supabaseAdmin: SupabaseClient,
  userId: string,
  provider: ManagedProvider,
): Promise<ProviderConnectionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("provider_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    if (maybeSingleNotFound(error.code)) {
      return null;
    }
    throw new Error(`Failed to load ${provider} connection: ${error.message}`);
  }

  return (data as ProviderConnectionRow | null) ?? null;
}

export async function upsertProviderConnection(
  supabaseAdmin: SupabaseClient,
  input: UpsertConnectionInput,
): Promise<ProviderConnectionRow> {
  const existing = await getProviderConnection(supabaseAdmin, input.userId, input.provider);

  const payload = {
    user_id: input.userId,
    provider: input.provider,
    state: input.state,
    connected_at:
      input.connectedAt !== undefined
        ? input.connectedAt
        : existing?.connected_at ?? null,
    last_sync_at:
      input.lastSyncAt !== undefined
        ? input.lastSyncAt
        : existing?.last_sync_at ?? null,
    last_error:
      input.lastError !== undefined
        ? input.lastError
        : existing?.last_error ?? null,
    provider_account_id:
      input.providerAccountId !== undefined
        ? input.providerAccountId
        : existing?.provider_account_id ?? null,
    provider_username:
      input.providerUsername !== undefined
        ? input.providerUsername
        : existing?.provider_username ?? null,
    scopes: input.scopes !== undefined ? input.scopes ?? [] : existing?.scopes ?? [],
    coverage:
      input.coverage !== undefined
        ? input.coverage ?? []
        : existing?.coverage ?? [],
    sync_cursor:
      input.syncCursor !== undefined
        ? input.syncCursor
        : existing?.sync_cursor ?? null,
    encrypted_access_token:
      input.accessToken !== undefined
        ? serializeStoredToken(input.accessToken)
        : existing?.encrypted_access_token ?? null,
    encrypted_refresh_token:
      input.refreshToken !== undefined
        ? serializeStoredToken(input.refreshToken)
        : existing?.encrypted_refresh_token ?? null,
    token_expires_at:
      input.tokenExpiresAt !== undefined
        ? input.tokenExpiresAt
        : existing?.token_expires_at ?? null,
    metadata: {
      ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
      ...(input.metadata ?? {}),
    },
  };

  const { data, error } = await supabaseAdmin
    .from("provider_connections")
    .upsert(payload, {
      onConflict: "user_id,provider",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert ${input.provider} connection: ${error?.message ?? "unknown error"}`);
  }

  return data as ProviderConnectionRow;
}

export async function disconnectProviderConnection(
  supabaseAdmin: SupabaseClient,
  input: {
    userId: string;
    provider: ManagedProvider;
    lastError?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<ProviderConnectionRow> {
  return upsertProviderConnection(supabaseAdmin, {
    userId: input.userId,
    provider: input.provider,
    state: "disconnected",
    connectedAt: null,
    lastError: input.lastError ?? null,
    lastSyncAt: null,
    scopes: [],
    coverage: [],
    syncCursor: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
    providerAccountId: null,
    providerUsername: null,
    metadata: input.metadata ?? {},
  });
}

export async function createProviderOAuthState(
  supabaseAdmin: SupabaseClient,
  input: {
    provider: ManagedProvider;
    userId: string;
    stateFingerprint: string;
    redirectUri: string;
    requestedScopes: string[];
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabaseAdmin.from("provider_oauth_states").insert({
    provider: input.provider,
    user_id: input.userId,
    state_fingerprint: input.stateFingerprint,
    redirect_uri: input.redirectUri,
    requested_scopes: input.requestedScopes,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Failed to persist ${input.provider} OAuth state: ${error.message}`);
  }
}

export async function consumeProviderOAuthState(
  supabaseAdmin: SupabaseClient,
  input: {
    provider: ManagedProvider;
    stateFingerprint: string;
  },
): Promise<ProviderOAuthStateRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("provider_oauth_states")
    .select("*")
    .eq("provider", input.provider)
    .eq("state_fingerprint", input.stateFingerprint)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (maybeSingleNotFound(error.code)) {
      return null;
    }
    throw new Error(`Failed to load ${input.provider} OAuth state: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const { error: consumeError } = await supabaseAdmin
    .from("provider_oauth_states")
    .update({
      consumed_at: now,
    })
    .eq("id", data.id)
    .is("consumed_at", null);

  if (consumeError) {
    throw new Error(`Failed to consume ${input.provider} OAuth state: ${consumeError.message}`);
  }

  return data as ProviderOAuthStateRow;
}

export async function createProviderSyncRun(
  supabaseAdmin: SupabaseClient,
  input: {
    userId: string;
    provider: ManagedProvider;
    metadata?: Record<string, unknown>;
  },
): Promise<ProviderSyncRunRow> {
  const { data, error } = await supabaseAdmin
    .from("provider_sync_runs")
    .insert({
      user_id: input.userId,
      provider: input.provider,
      status: "queued",
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create ${input.provider} sync run: ${error?.message ?? "unknown error"}`);
  }

  return data as ProviderSyncRunRow;
}

export async function markProviderSyncRunStatus(
  supabaseAdmin: SupabaseClient,
  input: {
    syncRunId: string;
    status: "running" | "succeeded" | "failed" | "skipped";
    itemCount?: number;
    errorMessage?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const updates: Record<string, unknown> = {
    status: input.status,
    error_message: input.errorMessage ?? null,
  };

  if (input.status === "running") {
    updates.started_at = new Date().toISOString();
  }

  if (input.status !== "running") {
    updates.finished_at = new Date().toISOString();
  }

  if (input.itemCount !== undefined) {
    updates.item_count = input.itemCount;
  }

  if (input.metadata) {
    const { data, error } = await supabaseAdmin
      .from("provider_sync_runs")
      .select("metadata")
      .eq("id", input.syncRunId)
      .single();

    if (error) {
      throw new Error(`Failed to load sync run metadata: ${error.message}`);
    }

    updates.metadata = {
      ...(((data?.metadata as Record<string, unknown> | null) ?? {})),
      ...input.metadata,
    };
  }

  const { error } = await supabaseAdmin
    .from("provider_sync_runs")
    .update(updates)
    .eq("id", input.syncRunId);

  if (error) {
    throw new Error(`Failed to update sync run ${input.syncRunId}: ${error.message}`);
  }
}

export async function getProviderWebhookEvent(
  supabaseAdmin: SupabaseClient,
  webhookEventId: string,
): Promise<ProviderWebhookEventRow | null> {
  const { data, error } = await supabaseAdmin
    .from("provider_webhook_events")
    .select("*")
    .eq("id", webhookEventId)
    .maybeSingle();

  if (error) {
    if (maybeSingleNotFound(error.code)) {
      return null;
    }
    throw new Error(`Failed to load webhook event: ${error.message}`);
  }

  return (data as ProviderWebhookEventRow | null) ?? null;
}

export async function insertOrLoadProviderWebhookEvent(
  supabaseAdmin: SupabaseClient,
  input: {
    provider: ManagedProvider;
    externalEventId?: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    signatureVerified: boolean;
    eventHash?: string | null;
  },
): Promise<ProviderWebhookEventRow> {
  if (input.externalEventId) {
    const { data, error } = await supabaseAdmin
      .from("provider_webhook_events")
      .select("*")
      .eq("provider", input.provider)
      .eq("external_event_id", input.externalEventId)
      .maybeSingle();

    if (error && !maybeSingleNotFound(error.code)) {
      throw new Error(`Failed to inspect existing webhook event: ${error.message}`);
    }

    if (data) {
      return data as ProviderWebhookEventRow;
    }
  }

  if (!input.externalEventId && input.eventHash) {
    const { data, error } = await supabaseAdmin
      .from("provider_webhook_events")
      .select("*")
      .eq("provider", input.provider)
      .eq("event_hash", input.eventHash)
      .maybeSingle();

    if (error && !maybeSingleNotFound(error.code)) {
      throw new Error(`Failed to inspect hashed webhook event: ${error.message}`);
    }

    if (data) {
      return data as ProviderWebhookEventRow;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("provider_webhook_events")
    .insert({
      provider: input.provider,
      external_event_id: input.externalEventId ?? null,
      event_type: input.eventType,
      payload: input.payload,
      signature_verified: input.signatureVerified,
      status: "received",
      event_hash: input.eventHash ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert ${input.provider} webhook event: ${error?.message ?? "unknown error"}`);
  }

  return data as ProviderWebhookEventRow;
}

export async function markProviderWebhookEventStatus(
  supabaseAdmin: SupabaseClient,
  input: {
    webhookEventId: string;
    status: "received" | "queued" | "processed" | "failed" | "rejected";
    errorMessage?: string | null;
    syncRunId?: string | null;
  },
): Promise<void> {
  const updates: Record<string, unknown> = {
    status: input.status,
    error_message: input.errorMessage ?? null,
  };

  if (input.status === "processed" || input.status === "failed" || input.status === "rejected") {
    updates.processed_at = new Date().toISOString();
  }

  if (input.syncRunId !== undefined) {
    updates.sync_run_id = input.syncRunId;
  }

  const { error } = await supabaseAdmin
    .from("provider_webhook_events")
    .update(updates)
    .eq("id", input.webhookEventId);

  if (error) {
    throw new Error(`Failed to update webhook event ${input.webhookEventId}: ${error.message}`);
  }
}

export async function deleteProviderSnapshotBySourceReference(
  supabaseAdmin: SupabaseClient,
  input: {
    userId: string;
    provider: ManagedProvider;
    sourceReference: string;
  },
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("provider_snapshots")
    .delete()
    .eq("user_id", input.userId)
    .eq("provider", input.provider)
    .eq("source_reference", input.sourceReference)
    .select("id");

  if (error) {
    throw new Error(`Failed to delete ${input.provider} snapshot ${input.sourceReference}: ${error.message}`);
  }

  return data?.length ?? 0;
}

export async function upsertProviderSnapshot(
  supabaseAdmin: SupabaseClient,
  input: NormalizedSnapshotInput,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("provider_snapshots")
    .upsert(
      {
        user_id: input.userId,
        provider: input.provider,
        provider_connection_id: input.providerConnectionId,
        sync_run_id: input.syncRunId ?? null,
        captured_at: input.capturedAt ?? new Date().toISOString(),
        window_start_at: input.windowStartAt,
        window_end_at: input.windowEndAt,
        window_bucket: input.windowBucket ?? "custom",
        source_reference: input.sourceReference,
        metadata: input.metadata ?? {},
      },
      {
        onConflict: "user_id,provider,source_reference",
      },
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`Failed to upsert ${input.provider} snapshot ${input.sourceReference}: ${error?.message ?? "unknown error"}`);
  }

  const snapshotId = data.id as string;

  const { error: deleteMetricsError } = await supabaseAdmin
    .from("provider_snapshot_metrics")
    .delete()
    .eq("snapshot_id", snapshotId);

  if (deleteMetricsError) {
    throw new Error(`Failed to replace ${input.provider} snapshot metrics: ${deleteMetricsError.message}`);
  }

  if (input.metrics.length > 0) {
    const { error: insertMetricsError } = await supabaseAdmin
      .from("provider_snapshot_metrics")
      .insert(
        input.metrics.map((metric, index) => ({
          snapshot_id: snapshotId,
          metric_key: metric.key,
          value_numeric: typeof metric.value === "number" ? metric.value : null,
          value_text: typeof metric.value === "string" ? metric.value : null,
          value_boolean: typeof metric.value === "boolean" ? metric.value : null,
          unit: metric.unit ?? null,
          source: metric.source ?? "live",
          observed_at: metric.observedAt ?? input.capturedAt ?? new Date().toISOString(),
          confidence: metric.confidence ?? "high",
          sort_order: metric.sortOrder ?? index,
        })),
      );

    if (insertMetricsError) {
      throw new Error(`Failed to insert ${input.provider} snapshot metrics: ${insertMetricsError.message}`);
    }
  }

  const { error: deleteCoverageError } = await supabaseAdmin
    .from("provider_snapshot_coverage")
    .delete()
    .eq("snapshot_id", snapshotId);

  if (deleteCoverageError) {
    throw new Error(`Failed to replace ${input.provider} snapshot coverage: ${deleteCoverageError.message}`);
  }

  if ((input.coverage ?? []).length > 0) {
    const { error: insertCoverageError } = await supabaseAdmin
      .from("provider_snapshot_coverage")
      .insert(
        (input.coverage ?? []).map((coverage) => ({
          snapshot_id: snapshotId,
          metric_key: coverage.key,
          available: coverage.available,
          reason: coverage.available ? null : coverage.reason ?? "no_samples",
        })),
      );

    if (insertCoverageError) {
      throw new Error(`Failed to insert ${input.provider} snapshot coverage: ${insertCoverageError.message}`);
    }
  }

  return snapshotId;
}
