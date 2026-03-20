alter type public.metric_key add value if not exists 'distance';
alter type public.metric_key add value if not exists 'duration';
alter type public.metric_key add value if not exists 'recovery-score';
alter type public.metric_key add value if not exists 'strain-score';

create table if not exists public.provider_oauth_states (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  state text not null,
  redirect_uri text not null,
  requested_scopes text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_oauth_states_provider_check
    check (provider in ('strava', 'whoop'))
);

create table if not exists public.provider_connection_credentials (
  provider_connection_id uuid primary key
    references public.provider_connections (id) on delete cascade,
  access_token_fingerprint text,
  refresh_token_fingerprint text,
  access_token_envelope jsonb,
  refresh_token_envelope jsonb,
  access_token_key_id text,
  refresh_token_key_id text,
  access_token_expires_at timestamptz,
  rotated_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_connections
  add column if not exists disconnected_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists last_webhook_at timestamptz,
  add column if not exists last_reconcile_at timestamptz,
  add column if not exists provider_account_metadata jsonb not null default '{}'::jsonb;

alter table public.provider_sync_runs
  add column if not exists provider_connection_id uuid references public.provider_connections (id) on delete set null,
  add column if not exists webhook_event_id uuid references public.provider_webhook_events (id) on delete set null,
  add column if not exists trigger_source text not null default 'manual',
  add column if not exists cursor_before text,
  add column if not exists cursor_after text;

do $$
begin
  alter table public.provider_sync_runs
    add constraint provider_sync_runs_trigger_source_check
    check (trigger_source in ('oauth_callback', 'manual', 'webhook', 'reconcile'));
exception
  when duplicate_object then null;
end $$;

alter table public.provider_webhook_events
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists provider_connection_id uuid references public.provider_connections (id) on delete set null,
  add column if not exists dedupe_key text,
  add column if not exists trace_id text,
  add column if not exists event_occurred_at timestamptz;

create unique index if not exists provider_oauth_states_state_idx
  on public.provider_oauth_states (state);

create index if not exists provider_oauth_states_user_provider_idx
  on public.provider_oauth_states (user_id, provider, created_at desc);

create unique index if not exists provider_connections_external_account_unique_idx
  on public.provider_connections (provider, provider_account_id)
  where provider_account_id is not null
    and revoked_at is null
    and disconnected_at is null;

create unique index if not exists provider_snapshots_source_reference_unique_idx
  on public.provider_snapshots (user_id, provider, source_reference)
  where source_reference is not null;

create unique index if not exists provider_webhook_events_dedupe_key_idx
  on public.provider_webhook_events (provider, dedupe_key)
  where dedupe_key is not null;

create index if not exists provider_webhook_events_connection_idx
  on public.provider_webhook_events (provider_connection_id, received_at desc);

create index if not exists provider_sync_runs_connection_idx
  on public.provider_sync_runs (provider_connection_id, created_at desc);

create index if not exists provider_credentials_revoked_idx
  on public.provider_connection_credentials (revoked_at);

alter table public.provider_oauth_states enable row level security;
alter table public.provider_connection_credentials enable row level security;

create trigger provider_oauth_states_updated_at
before update on public.provider_oauth_states
for each row execute function app_private.touch_updated_at();

create trigger provider_connection_credentials_updated_at
before update on public.provider_connection_credentials
for each row execute function app_private.touch_updated_at();
