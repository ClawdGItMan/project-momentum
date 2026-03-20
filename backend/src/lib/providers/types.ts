import type { Logger } from "pino";
import type { PgBoss } from "pg-boss";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { BackendEnv } from "../../config/env";
import type { ProviderName, ProviderTokenVaultRecord } from "../security";

export type ManagedProvider = "strava" | "whoop";

export interface ProviderQueueRuntime {
  env: BackendEnv;
  logger: Logger;
  queue: PgBoss;
  supabaseAdmin: SupabaseClient;
}

export interface ProviderConnectionRow {
  id: string;
  user_id: string;
  provider: ManagedProvider;
  state: string;
  connected_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  provider_account_id: string | null;
  provider_username: string | null;
  scopes: string[] | null;
  coverage: unknown;
  sync_cursor: string | null;
  encrypted_refresh_token: string | null;
  encrypted_access_token: string | null;
  token_expires_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderSyncRunRow {
  id: string;
  user_id: string;
  provider: ManagedProvider;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  item_count: number;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderWebhookEventRow {
  id: string;
  provider: ManagedProvider;
  external_event_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  signature_verified: boolean;
  received_at: string;
  processed_at: string | null;
  status: string;
  error_message: string | null;
  event_hash: string | null;
  sync_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderOAuthStateRow {
  id: string;
  provider: ManagedProvider;
  user_id: string;
  state_fingerprint: string;
  redirect_uri: string;
  requested_scopes: string[] | null;
  expires_at: string;
  consumed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface NormalizedMetricInput {
  key: string;
  value: number | string | boolean;
  unit?: string | null;
  observedAt?: string | null;
  source?: "live" | "manual" | "mock" | "derived";
  confidence?: "high" | "medium" | "low";
  sortOrder?: number;
}

export interface CoverageInput {
  key: string;
  available: boolean;
  reason?: string | null;
}

export interface NormalizedSnapshotInput {
  userId: string;
  provider: ManagedProvider;
  providerConnectionId: string;
  syncRunId?: string | null;
  capturedAt?: string;
  windowStartAt: string;
  windowEndAt: string;
  windowBucket?: "today" | "yesterday" | "7d" | "30d" | "custom";
  sourceReference: string;
  metadata?: Record<string, unknown>;
  metrics: NormalizedMetricInput[];
  coverage?: CoverageInput[];
}

export interface ProviderSyncJobPayload {
  provider: ManagedProvider;
  userId: string;
  syncRunId: string;
  mode: "manual" | "webhook";
  reason?: string;
  externalId?: string | null;
  sourceReference?: string | null;
  eventType?: string | null;
}

export interface ProviderWebhookJobPayload {
  provider: ManagedProvider;
  webhookEventId: string;
}

export interface ConnectedProviderAccount {
  providerAccountId: string;
  providerUsername: string | null;
  scopes: string[];
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  metadata?: Record<string, unknown>;
}

export type StoredProviderToken = ProviderTokenVaultRecord;

export interface UpsertConnectionInput {
  userId: string;
  provider: ManagedProvider;
  state: string;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
  providerAccountId?: string | null;
  providerUsername?: string | null;
  scopes?: string[] | null;
  coverage?: unknown;
  syncCursor?: string | null;
  accessToken?: StoredProviderToken | null;
  refreshToken?: StoredProviderToken | null;
  tokenExpiresAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProviderApiError extends Error {
  status?: number;
  code?: string;
}

export function isManagedProvider(value: string): value is ManagedProvider {
  return value === "strava" || value === "whoop";
}

export function asProviderName(provider: ManagedProvider): ProviderName {
  return provider;
}
