do $$
begin
  alter type public.metric_key add value if not exists 'distance';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.metric_key add value if not exists 'elapsed-duration';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.metric_key add value if not exists 'strain';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.metric_key add value if not exists 'recovery-score';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.metric_key add value if not exists 'sleep-performance';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.metric_key add value if not exists 'heart-rate-variability';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.provider_oauth_states (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  state_fingerprint text not null,
  redirect_uri text not null,
  requested_scopes text[] not null default '{}'::text[],
  expires_at timestamptz not null default now() + interval '15 minutes',
  consumed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_oauth_states_provider check (
    provider in ('strava', 'whoop')
  )
);

alter table public.provider_snapshots
  add column if not exists sync_run_id uuid references public.provider_sync_runs (id) on delete set null;

alter table public.provider_webhook_events
  add column if not exists event_hash text;

alter table public.provider_webhook_events
  add column if not exists sync_run_id uuid references public.provider_sync_runs (id) on delete set null;

create unique index if not exists provider_oauth_states_provider_fingerprint_idx
  on public.provider_oauth_states (provider, state_fingerprint);

create index if not exists provider_oauth_states_user_idx
  on public.provider_oauth_states (user_id, provider, created_at desc);

create index if not exists provider_oauth_states_expiry_idx
  on public.provider_oauth_states (expires_at)
  where consumed_at is null;

create unique index if not exists provider_snapshots_source_reference_unique_idx
  on public.provider_snapshots (user_id, provider, source_reference)
  where source_reference is not null;

create unique index if not exists provider_webhook_events_event_hash_idx
  on public.provider_webhook_events (provider, event_hash)
  where external_event_id is null and event_hash is not null;

create index if not exists provider_webhook_events_status_idx
  on public.provider_webhook_events (provider, status, received_at desc);

alter table public.provider_oauth_states enable row level security;

create policy "provider oauth states are service managed"
  on public.provider_oauth_states
  for select
  using (false);

create trigger provider_oauth_states_updated_at
before update on public.provider_oauth_states
for each row execute function app_private.touch_updated_at();
