create extension if not exists pgcrypto;

create schema if not exists app_private;

do $$
begin
  create type public.account_status as enum ('pending', 'active', 'suspended', 'deleted');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.accountability_style as enum ('friends', 'squad-first', 'mixed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.visibility_scope as enum ('only-me', 'friends', 'squad');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_type as enum ('workout', 'habit-win', 'recovery', 'reflection');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.squad_role as enum ('owner', 'admin', 'member');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_state as enum ('active', 'left', 'removed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.invite_status as enum ('pending', 'accepted', 'declined', 'canceled', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.reaction_kind as enum ('did_this_too', 'emoji');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.consistency_label as enum ('Starting', 'Building', 'Steady', 'Locked In', 'Dialed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.connection_state as enum (
    'unavailable',
    'disconnected',
    'authorizing',
    'connected',
    'connected_limited',
    'needs_attention',
    'syncing',
    'error',
    'mocked'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.metric_source as enum ('live', 'manual', 'mock', 'derived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.metric_key as enum (
    'workouts',
    'steps',
    'sleep-duration',
    'active-energy',
    'resting-heart-rate',
    'mindfulness-minutes'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.metric_window_bucket as enum ('today', 'yesterday', '7d', '30d', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.coverage_reason as enum (
    'not_requested',
    'not_supported',
    'no_samples',
    'permission_unknown',
    'permission_missing',
    'provider_disconnected',
    'provider_unavailable',
    'platform_unsupported'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, auth, app_private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.auth_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  auth_provider text,
  status public.account_status not null default 'active',
  onboarding_completed boolean not null default false,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  username text,
  mission_line text,
  city text,
  pillars text[] not null default '{}'::text[],
  goals text[] not null default '{}'::text[],
  accountability_style public.accountability_style not null default 'mixed',
  default_audience public.visibility_scope not null default 'friends',
  selected_squad_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null
    or (
      char_length(username) between 3 and 30
      and username ~ '^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$'
    )
  )
);

create table if not exists public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  invite_token text not null default replace(gen_random_uuid()::text, '-', ''),
  message text,
  status public.invite_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_invites_not_self check (inviter_id <> invitee_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_low_id uuid not null references auth.users (id) on delete cascade,
  user_high_id uuid not null references auth.users (id) on delete cascade,
  created_from_invite_id uuid references public.friend_invites (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint friendships_not_self check (user_low_id <> user_high_id)
);

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  handle text not null,
  description text not null default '',
  current_focus text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint squads_handle_format check (
    char_length(handle) between 3 and 30
    and handle ~ '^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$'
  )
);

create table if not exists public.squad_memberships (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.squad_role not null default 'member',
  state public.membership_state not null default 'active',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.squad_invites (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid references auth.users (id) on delete cascade,
  invite_token text not null default replace(gen_random_uuid()::text, '-', ''),
  status public.invite_status not null default 'pending',
  responded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  cadence text not null,
  visibility_scope public.visibility_scope not null default 'friends',
  streak_days integer not null default 0,
  completion_rate numeric(5,2) not null default 0,
  is_active boolean not null default true,
  last_completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_title_length check (char_length(title) between 1 and 120),
  constraint habits_visibility_scope check (visibility_scope in ('only-me', 'friends'))
);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  completed_for_date date not null,
  completed_at timestamptz not null default now(),
  completion_source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_completions_source check (completion_source in ('manual', 'synced', 'seed', 'imported'))
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  type public.post_type not null,
  audience public.visibility_scope not null default 'friends',
  squad_id uuid references public.squads (id) on delete set null,
  caption text not null default '',
  consistency_score smallint not null default 0,
  consistency_label public.consistency_label not null default 'Starting',
  source_provider text,
  source_snapshot_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  constraint check_ins_caption_length check (char_length(caption) <= 280),
  constraint check_ins_squad_audience check (
    (audience <> 'squad' and squad_id is null)
    or (audience = 'squad' and squad_id is not null)
  ),
  constraint check_ins_source_provider check (
    source_provider is null
    or source_provider in ('apple-health', 'strava', 'whoop', 'manual', 'mock')
  )
);

create table if not exists public.check_in_metrics (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  metric_key public.metric_key not null,
  value_numeric numeric,
  value_text text,
  value_boolean boolean,
  unit text,
  source public.metric_source not null default 'derived',
  provider text not null check (provider in ('apple-health', 'strava', 'whoop', 'manual', 'mock')),
  observed_at timestamptz not null default now(),
  confidence text not null default 'high',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_metrics_single_value check (num_nonnulls(value_numeric, value_text, value_boolean) = 1),
  constraint check_in_metrics_confidence check (confidence in ('high', 'medium', 'low'))
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_body_length check (char_length(body) between 1 and 500)
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  reaction_kind public.reaction_kind not null,
  reaction_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_reactions_kind_value check (
    (reaction_kind = 'did_this_too' and reaction_value is null)
    or (reaction_kind = 'emoji' and reaction_value is not null and char_length(reaction_value) <= 16)
  )
);

create table if not exists public.consistency_day_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fact_date date not null,
  checked_in boolean not null default false,
  scheduled_habits integer not null default 0,
  completed_habits integer not null default 0,
  workout_completed boolean not null default false,
  source text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consistency_day_facts_counts_nonnegative check (
    scheduled_habits >= 0 and completed_habits >= 0
  )
);

create table if not exists public.consistency_rollups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  window_days integer not null default 7,
  score smallint not null default 0,
  label public.consistency_label not null default 'Starting',
  check_in_rate numeric(5,4) not null default 0,
  habit_completion_rate numeric(5,4) not null default 0,
  workout_rate numeric(5,4) not null default 0,
  check_in_contribution numeric(5,4) not null default 0,
  habit_contribution numeric(5,4) not null default 0,
  workout_contribution numeric(5,4) not null default 0,
  window_start date not null,
  window_end date not null,
  computed_at timestamptz not null default now()
);

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  state public.connection_state not null default 'disconnected',
  connected_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  provider_account_id text,
  provider_username text,
  scopes text[] not null default '{}'::text[],
  coverage jsonb not null default '[]'::jsonb,
  sync_cursor text,
  encrypted_refresh_token text,
  encrypted_access_token text,
  token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_connections_provider check (
    provider in ('apple-health', 'strava', 'whoop', 'manual', 'mock')
  )
);

create table if not exists public.provider_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  provider_connection_id uuid references public.provider_connections (id) on delete set null,
  captured_at timestamptz not null default now(),
  window_start_at timestamptz not null,
  window_end_at timestamptz not null,
  window_bucket public.metric_window_bucket not null default 'today',
  source_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_snapshots_provider check (
    provider in ('apple-health', 'strava', 'whoop', 'manual', 'mock')
  )
);

create table if not exists public.provider_snapshot_metrics (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.provider_snapshots (id) on delete cascade,
  metric_key public.metric_key not null,
  value_numeric numeric,
  value_text text,
  value_boolean boolean,
  unit text,
  source public.metric_source not null default 'live',
  observed_at timestamptz not null default now(),
  confidence text not null default 'high',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_snapshot_metrics_single_value check (num_nonnulls(value_numeric, value_text, value_boolean) = 1),
  constraint provider_snapshot_metrics_confidence check (confidence in ('high', 'medium', 'low'))
);

create table if not exists public.provider_snapshot_coverage (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.provider_snapshots (id) on delete cascade,
  metric_key public.metric_key not null,
  available boolean not null default false,
  reason public.coverage_reason,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_snapshot_coverage_reason check (
    available = true or reason is not null
  )
);

create table if not exists public.provider_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  item_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_sync_runs_provider check (
    provider in ('apple-health', 'strava', 'whoop', 'manual', 'mock')
  ),
  constraint provider_sync_runs_status check (
    status in ('queued', 'running', 'succeeded', 'failed', 'skipped')
  )
);

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text,
  event_type text not null,
  payload jsonb not null,
  signature_verified boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_webhook_events_provider check (
    provider in ('apple-health', 'strava', 'whoop', 'manual', 'mock')
  ),
  constraint provider_webhook_events_status check (
    status in ('received', 'queued', 'processed', 'failed', 'rejected')
  )
);

create unique index if not exists auth_accounts_email_idx on public.auth_accounts (lower(email));
create unique index if not exists profiles_username_idx on public.profiles (lower(username)) where username is not null;
create unique index if not exists squads_handle_idx on public.squads (lower(handle));
create unique index if not exists friendships_pair_idx on public.friendships (user_low_id, user_high_id);
create unique index if not exists squad_memberships_unique_idx on public.squad_memberships (squad_id, user_id);
create unique index if not exists friend_invites_pending_pair_idx
  on public.friend_invites (least(inviter_id, invitee_id), greatest(inviter_id, invitee_id))
  where status = 'pending';
create unique index if not exists friend_invites_token_idx on public.friend_invites (invite_token);
create unique index if not exists squad_invites_token_idx on public.squad_invites (invite_token);
create unique index if not exists habits_owner_title_idx on public.habits (owner_id, lower(title));
create unique index if not exists habit_completions_unique_idx on public.habit_completions (habit_id, completed_for_date);
create unique index if not exists check_in_metrics_unique_idx on public.check_in_metrics (check_in_id, metric_key, sort_order);
create unique index if not exists provider_connections_unique_idx on public.provider_connections (user_id, provider);
create unique index if not exists provider_snapshots_unique_idx on public.provider_snapshots (user_id, provider, captured_at, window_bucket);
create unique index if not exists provider_snapshot_metrics_unique_idx on public.provider_snapshot_metrics (snapshot_id, metric_key, sort_order);
create unique index if not exists provider_snapshot_coverage_unique_idx on public.provider_snapshot_coverage (snapshot_id, metric_key);
create unique index if not exists consistency_day_facts_unique_idx on public.consistency_day_facts (user_id, fact_date);
create unique index if not exists consistency_rollups_unique_idx on public.consistency_rollups (user_id, window_days);
create unique index if not exists post_reactions_did_this_too_unique_idx
  on public.post_reactions (check_in_id, author_id)
  where reaction_kind = 'did_this_too';
create unique index if not exists post_reactions_emoji_unique_idx
  on public.post_reactions (check_in_id, author_id, reaction_value)
  where reaction_kind = 'emoji';

alter table public.profiles
  add constraint profiles_selected_squad_fk
  foreign key (selected_squad_id) references public.squads (id) on delete set null;

alter table public.check_ins
  add constraint check_ins_source_snapshot_fk
  foreign key (source_snapshot_id) references public.provider_snapshots (id) on delete set null;

create index if not exists profiles_selected_squad_idx on public.profiles (selected_squad_id);
create index if not exists friend_invites_inviter_idx on public.friend_invites (inviter_id, created_at desc);
create index if not exists friend_invites_invitee_idx on public.friend_invites (invitee_id, created_at desc);
create index if not exists friendships_user_low_idx on public.friendships (user_low_id);
create index if not exists friendships_user_high_idx on public.friendships (user_high_id);
create index if not exists squads_owner_idx on public.squads (owner_id, created_at desc);
create index if not exists squad_memberships_user_idx on public.squad_memberships (user_id, state);
create index if not exists squad_memberships_squad_idx on public.squad_memberships (squad_id, state);
create index if not exists squad_invites_squad_idx on public.squad_invites (squad_id, created_at desc);
create index if not exists squad_invites_invitee_idx on public.squad_invites (invitee_id, created_at desc);
create index if not exists habits_owner_idx on public.habits (owner_id, is_active);
create index if not exists habit_completions_owner_date_idx on public.habit_completions (owner_id, completed_for_date desc);
create index if not exists check_ins_author_created_idx on public.check_ins (author_id, created_at desc);
create index if not exists check_ins_squad_created_idx on public.check_ins (squad_id, created_at desc);
create index if not exists check_ins_audience_created_idx on public.check_ins (audience, created_at desc);
create index if not exists comments_check_in_created_idx on public.comments (check_in_id, created_at desc);
create index if not exists post_reactions_check_in_idx on public.post_reactions (check_in_id, created_at desc);
create index if not exists consistency_day_facts_user_date_idx on public.consistency_day_facts (user_id, fact_date desc);
create index if not exists consistency_rollups_user_idx on public.consistency_rollups (user_id, window_days);
create index if not exists provider_connections_user_idx on public.provider_connections (user_id, provider);
create index if not exists provider_snapshots_user_idx on public.provider_snapshots (user_id, provider, captured_at desc);
create index if not exists provider_sync_runs_user_idx on public.provider_sync_runs (user_id, provider, created_at desc);
create index if not exists provider_webhook_events_provider_idx on public.provider_webhook_events (provider, received_at desc);
create unique index if not exists provider_webhook_events_dedupe_idx
  on public.provider_webhook_events (provider, external_event_id)
  where external_event_id is not null;

create or replace function app_private.normalize_username(input text)
returns text
language sql
immutable
set search_path = public, auth, app_private
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)',
        '',
        'g'
      ),
      '-{2,}',
      '-',
      'g'
    ),
    ''
  );
$$;

create or replace function app_private.is_friend(p_user_id uuid, p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_private
as $$
  select exists (
    select 1
    from public.friendships friendships
    where (
      friendships.user_low_id = least(p_user_id, p_other_user_id)
      and friendships.user_high_id = greatest(p_user_id, p_other_user_id)
    )
  );
$$;

create or replace function app_private.is_same_squad_member(p_user_id uuid, p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_private
as $$
  select exists (
    select 1
    from public.squad_memberships mine
    join public.squad_memberships theirs
      on theirs.squad_id = mine.squad_id
    where mine.user_id = p_user_id
      and theirs.user_id = p_other_user_id
      and mine.state = 'active'
      and theirs.state = 'active'
  );
$$;

create or replace function app_private.can_view_profile(p_target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, app_private
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if auth.uid() = p_target_user_id then
    return true;
  end if;

  return app_private.is_friend(auth.uid(), p_target_user_id)
    or app_private.is_same_squad_member(auth.uid(), p_target_user_id);
end;
$$;

create or replace function app_private.can_view_habit(p_habit_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, app_private
as $$
declare
  v_owner_id uuid;
  v_visibility public.visibility_scope;
begin
  select habits.owner_id, habits.visibility_scope
    into v_owner_id, v_visibility
  from public.habits habits
  where habits.id = p_habit_id;

  if not found or auth.uid() is null then
    return false;
  end if;

  if auth.uid() = v_owner_id then
    return true;
  end if;

  if v_visibility = 'friends' then
    return app_private.is_friend(auth.uid(), v_owner_id)
      or app_private.is_same_squad_member(auth.uid(), v_owner_id);
  end if;

  return false;
end;
$$;

create or replace function app_private.can_view_check_in(p_check_in_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, app_private
as $$
declare
  v_author_id uuid;
  v_audience public.visibility_scope;
  v_squad_id uuid;
begin
  select check_ins.author_id, check_ins.audience, check_ins.squad_id
    into v_author_id, v_audience, v_squad_id
  from public.check_ins check_ins
  where check_ins.id = p_check_in_id;

  if not found or auth.uid() is null then
    return false;
  end if;

  if auth.uid() = v_author_id then
    return true;
  end if;

  if v_audience = 'friends' then
    return app_private.is_friend(auth.uid(), v_author_id)
      or app_private.is_same_squad_member(auth.uid(), v_author_id);
  end if;

  if v_audience = 'squad' and v_squad_id is not null then
    return exists (
      select 1
      from public.squad_memberships memberships
      where memberships.squad_id = v_squad_id
        and memberships.user_id = auth.uid()
        and memberships.state = 'active'
    );
  end if;

  return false;
end;
$$;

create or replace function app_private.refresh_consistency_day_fact(
  p_user_id uuid,
  p_fact_date date
)
returns void
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_scheduled_habits integer;
  v_completed_habits integer;
  v_checked_in boolean;
  v_workout_completed boolean;
begin
  select count(*)
    into v_scheduled_habits
  from public.habits habits
  where habits.owner_id = p_user_id
    and habits.is_active = true;

  select exists (
    select 1
    from public.check_ins check_ins
    where check_ins.author_id = p_user_id
      and check_ins.created_at::date = p_fact_date
  ) into v_checked_in;

  select exists (
    select 1
    from public.check_ins check_ins
    where check_ins.author_id = p_user_id
      and check_ins.created_at::date = p_fact_date
      and check_ins.type = 'workout'
  ) into v_workout_completed;

  select count(*)
    into v_completed_habits
  from public.habit_completions completions
  where completions.owner_id = p_user_id
    and completions.completed_for_date = p_fact_date;

  insert into public.consistency_day_facts (
    user_id,
    fact_date,
    checked_in,
    scheduled_habits,
    completed_habits,
    workout_completed,
    source
  )
  values (
    p_user_id,
    p_fact_date,
    coalesce(v_checked_in, false),
    coalesce(v_scheduled_habits, 0),
    coalesce(v_completed_habits, 0),
    coalesce(v_workout_completed, false),
    'system'
  )
  on conflict (user_id, fact_date)
  do update set
    checked_in = excluded.checked_in,
    scheduled_habits = excluded.scheduled_habits,
    completed_habits = excluded.completed_habits,
    workout_completed = excluded.workout_completed,
    source = excluded.source,
    updated_at = now();
end;
$$;

create or replace function app_private.recompute_consistency_rollup(
  p_user_id uuid,
  p_window_days integer default 7
)
returns public.consistency_rollups
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_window_end date := current_date;
  v_window_start date := current_date - (p_window_days - 1);
  v_days integer;
  v_check_in_rate numeric := 0;
  v_habit_completion_rate numeric := 0;
  v_workout_rate numeric := 0;
  v_check_in_contribution numeric := 0;
  v_habit_contribution numeric := 0;
  v_workout_contribution numeric := 0;
  v_score integer := 0;
  v_label public.consistency_label := 'Starting';
  v_selected_pillars text[] := '{}'::text[];
  v_has_fitness boolean := false;
  v_total_check_ins integer := 0;
  v_total_workouts integer := 0;
  v_total_scheduled_habits integer := 0;
  v_total_completed_habits integer := 0;
  v_existing public.consistency_rollups;
begin
  select coalesce(profiles.pillars, '{}'::text[])
    into v_selected_pillars
  from public.profiles profiles
  where profiles.user_id = p_user_id;

  v_has_fitness := exists (
    select 1
    from unnest(coalesce(v_selected_pillars, '{}'::text[])) as pillar
    where lower(trim(pillar)) = 'fitness'
  );

  select
    count(*)::integer,
    count(*) filter (where day.checked_in)::integer,
    count(*) filter (where day.workout_completed)::integer,
    coalesce(sum(day.scheduled_habits), 0)::integer,
    coalesce(sum(day.completed_habits), 0)::integer
  into
    v_days,
    v_total_check_ins,
    v_total_workouts,
    v_total_scheduled_habits,
    v_total_completed_habits
  from public.consistency_day_facts day
  where day.user_id = p_user_id
    and day.fact_date between v_window_start and v_window_end;

  if v_days > 0 then
    v_check_in_rate := v_total_check_ins::numeric / v_days::numeric;
    v_workout_rate := v_total_workouts::numeric / v_days::numeric;
  end if;

  if v_total_scheduled_habits > 0 then
    v_habit_completion_rate := v_total_completed_habits::numeric / v_total_scheduled_habits::numeric;
  end if;

  if v_has_fitness then
    v_check_in_contribution := v_check_in_rate * 0.4;
    v_habit_contribution := v_habit_completion_rate * 0.4;
    v_workout_contribution := v_workout_rate * 0.2;
  else
    v_check_in_contribution := v_check_in_rate * 0.4;
    v_habit_contribution := v_habit_completion_rate * 0.6;
    v_workout_contribution := 0;
  end if;

  v_score := round((v_check_in_contribution + v_habit_contribution + v_workout_contribution) * 100);
  v_score := greatest(0, least(100, v_score));

  v_label :=
    case
      when v_score <= 24 then 'Starting'
      when v_score <= 49 then 'Building'
      when v_score <= 74 then 'Steady'
      when v_score <= 89 then 'Locked In'
      else 'Dialed'
    end;

  insert into public.consistency_rollups (
    user_id,
    window_days,
    score,
    label,
    check_in_rate,
    habit_completion_rate,
    workout_rate,
    check_in_contribution,
    habit_contribution,
    workout_contribution,
    window_start,
    window_end,
    computed_at
  )
  values (
    p_user_id,
    p_window_days,
    v_score,
    v_label,
    coalesce(v_check_in_rate, 0),
    coalesce(v_habit_completion_rate, 0),
    coalesce(v_workout_rate, 0),
    coalesce(v_check_in_contribution, 0),
    coalesce(v_habit_contribution, 0),
    coalesce(v_workout_contribution, 0),
    v_window_start,
    v_window_end,
    now()
  )
  on conflict (user_id, window_days)
  do update set
    score = excluded.score,
    label = excluded.label,
    check_in_rate = excluded.check_in_rate,
    habit_completion_rate = excluded.habit_completion_rate,
    workout_rate = excluded.workout_rate,
    check_in_contribution = excluded.check_in_contribution,
    habit_contribution = excluded.habit_contribution,
    workout_contribution = excluded.workout_contribution,
    window_start = excluded.window_start,
    window_end = excluded.window_end,
    computed_at = excluded.computed_at
  returning * into v_existing;

  return v_existing;
end;
$$;

create or replace function app_private.refresh_consistency_window(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_day date;
begin
  for v_day in
    select generate_series(current_date - 6, current_date, interval '1 day')::date
  loop
    perform app_private.refresh_consistency_day_fact(p_user_id, v_day);
  end loop;

  perform app_private.recompute_consistency_rollup(p_user_id, 7);
end;
$$;

create or replace function app_private.sync_auth_account_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_display_name text;
begin
  v_display_name := nullif(
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Momentum Member'
    ),
    ''
  );

  insert into public.auth_accounts (
    user_id,
    email,
    auth_provider,
    status,
    onboarding_completed,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    'active',
    false,
    new.last_sign_in_at,
    now(),
    now()
  )
  on conflict (user_id)
  do update set
    email = excluded.email,
    auth_provider = excluded.auth_provider,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();

  insert into public.profiles (
    user_id,
    display_name,
    username,
    mission_line,
    city,
    pillars,
    goals,
    accountability_style,
    default_audience,
    selected_squad_id,
    created_at,
    updated_at
  )
  values (
    new.id,
    v_display_name,
    null,
    null,
    null,
    '{}'::text[],
    '{}'::text[],
    'mixed',
    'friends',
    null,
    now(),
    now()
  )
  on conflict (user_id)
  do nothing;

  return new;
end;
$$;

create or replace function app_private.complete_onboarding(
  p_display_name text,
  p_username text,
  p_mission_line text,
  p_city text default null,
  p_pillars text[] default '{}'::text[],
  p_goals text[] default '{}'::text[],
  p_accountability_style public.accountability_style default 'mixed',
  p_default_audience public.visibility_scope default 'friends',
  p_selected_squad_id uuid default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_username text;
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  v_username := app_private.normalize_username(p_username);

  if v_username is null or char_length(v_username) < 3 then
    raise exception 'username must contain at least 3 valid characters';
  end if;

  if exists (
    select 1
    from public.profiles profiles
    where lower(profiles.username) = lower(v_username)
      and profiles.user_id <> v_user_id
  ) then
    raise exception 'username is already taken';
  end if;

  if p_selected_squad_id is not null and not exists (
    select 1
    from public.squad_memberships memberships
    where memberships.squad_id = p_selected_squad_id
      and memberships.user_id = v_user_id
      and memberships.state = 'active'
  ) then
    raise exception 'selected squad must already include the current user';
  end if;

  insert into public.auth_accounts (
    user_id,
    email,
    auth_provider,
    status,
    onboarding_completed,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    v_user_id,
    coalesce(auth.users.email, ''),
    coalesce(auth.users.raw_app_meta_data ->> 'provider', 'email'),
    'active',
    true,
    auth.users.last_sign_in_at,
    now(),
    now()
  from auth.users
  where auth.users.id = v_user_id
  on conflict (user_id)
  do update set
    email = excluded.email,
    auth_provider = excluded.auth_provider,
    status = 'active',
    onboarding_completed = true,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();

  insert into public.profiles (
    user_id,
    display_name,
    username,
    mission_line,
    city,
    pillars,
    goals,
    accountability_style,
    default_audience,
    selected_squad_id,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    nullif(trim(p_display_name), ''),
    v_username,
    nullif(trim(p_mission_line), ''),
    nullif(trim(p_city), ''),
    coalesce(p_pillars, '{}'::text[]),
    coalesce(p_goals, '{}'::text[]),
    coalesce(p_accountability_style, 'mixed'),
    coalesce(p_default_audience, 'friends'),
    p_selected_squad_id,
    now(),
    now()
  )
  on conflict (user_id)
  do update set
    display_name = excluded.display_name,
    username = excluded.username,
    mission_line = excluded.mission_line,
    city = excluded.city,
    pillars = excluded.pillars,
    goals = excluded.goals,
    accountability_style = excluded.accountability_style,
    default_audience = excluded.default_audience,
    selected_squad_id = excluded.selected_squad_id,
    updated_at = now()
  returning * into v_profile;

  perform app_private.recompute_consistency_rollup(v_user_id, 7);

  return v_profile;
end;
$$;

create or replace function app_private.create_squad(
  p_name text,
  p_handle text,
  p_description text default '',
  p_current_focus text default ''
)
returns public.squads
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_handle text;
  v_squad public.squads;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  v_handle := app_private.normalize_username(p_handle);

  if v_handle is null or char_length(v_handle) < 3 then
    raise exception 'handle must contain at least 3 valid characters';
  end if;

  if exists (
    select 1
    from public.squads squads
    where lower(squads.handle) = lower(v_handle)
  ) then
    raise exception 'squad handle is already taken';
  end if;

  insert into public.squads (
    owner_id,
    name,
    handle,
    description,
    current_focus,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    nullif(trim(p_name), ''),
    v_handle,
    coalesce(nullif(trim(p_description), ''), ''),
    coalesce(nullif(trim(p_current_focus), ''), ''),
    now(),
    now()
  )
  returning * into v_squad;

  insert into public.squad_memberships (
    squad_id,
    user_id,
    role,
    state,
    joined_at,
    created_at,
    updated_at
  )
  values (
    v_squad.id,
    v_user_id,
    'owner',
    'active',
    now(),
    now(),
    now()
  );

  update public.profiles
  set selected_squad_id = v_squad.id,
      updated_at = now()
  where profiles.user_id = v_user_id
    and profiles.selected_squad_id is distinct from v_squad.id;

  return v_squad;
end;
$$;

create or replace function app_private.accept_friend_invite(p_invite_token text)
returns public.friendships
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.friend_invites;
  v_low_id uuid;
  v_high_id uuid;
  v_friendship public.friendships;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
    into v_invite
  from public.friend_invites friend_invites
  where friend_invites.invite_token = p_invite_token
    and friend_invites.status = 'pending'
    and friend_invites.invitee_id = v_user_id;

  if not found then
    raise exception 'friend invite not found';
  end if;

  v_low_id := least(v_invite.inviter_id, v_invite.invitee_id);
  v_high_id := greatest(v_invite.inviter_id, v_invite.invitee_id);

  insert into public.friendships (
    user_low_id,
    user_high_id,
    created_from_invite_id,
    created_at
  )
  values (
    v_low_id,
    v_high_id,
    v_invite.id,
    now()
  )
  on conflict (user_low_id, user_high_id)
  do update set created_from_invite_id = excluded.created_from_invite_id
  returning * into v_friendship;

  update public.friend_invites
  set status = 'accepted',
      responded_at = now(),
      updated_at = now()
  where id = v_invite.id;

  return v_friendship;
end;
$$;

create or replace function app_private.accept_squad_invite(p_invite_token text)
returns public.squad_memberships
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.squad_invites;
  v_membership public.squad_memberships;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
    into v_invite
  from public.squad_invites squad_invites
  where squad_invites.invite_token = p_invite_token
    and squad_invites.status = 'pending'
    and (squad_invites.invitee_id is null or squad_invites.invitee_id = v_user_id);

  if not found then
    raise exception 'squad invite not found';
  end if;

  insert into public.squad_memberships (
    squad_id,
    user_id,
    role,
    state,
    joined_at,
    created_at,
    updated_at
  )
  values (
    v_invite.squad_id,
    v_user_id,
    'member',
    'active',
    now(),
    now(),
    now()
  )
  on conflict (squad_id, user_id)
  do update set
    state = 'active',
    left_at = null,
    role = case when squad_memberships.role = 'owner' then squad_memberships.role else excluded.role end,
    updated_at = now()
  returning * into v_membership;

  update public.squad_invites
  set status = 'accepted',
      responded_at = now(),
      updated_at = now()
  where id = v_invite.id;

  update public.profiles
  set selected_squad_id = coalesce(selected_squad_id, v_invite.squad_id),
      updated_at = now()
  where profiles.user_id = v_user_id;

  return v_membership;
end;
$$;

create or replace function app_private.refresh_consistency_after_habit_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
begin
  if tg_op = 'DELETE' then
    perform app_private.refresh_consistency_window(old.owner_id);
    return old;
  end if;

  perform app_private.refresh_consistency_window(new.owner_id);
  return new;
end;
$$;

create or replace function app_private.refresh_consistency_after_completion_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
begin
  if tg_op = 'DELETE' then
    perform app_private.refresh_consistency_window(old.owner_id);
    return old;
  end if;

  perform app_private.refresh_consistency_window(new.owner_id);
  return new;
end;
$$;

create or replace function app_private.refresh_consistency_after_check_in_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
begin
  if tg_op = 'DELETE' then
    perform app_private.refresh_consistency_window(old.author_id);
    return old;
  end if;

  perform app_private.refresh_consistency_window(new.author_id);
  return new;
end;
$$;

create or replace function app_private.refresh_consistency_after_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
begin
  if tg_op = 'DELETE' then
    perform app_private.recompute_consistency_rollup(old.user_id, 7);
    return old;
  end if;

  perform app_private.recompute_consistency_rollup(new.user_id, 7);
  return new;
end;
$$;

alter table public.auth_accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.friend_invites enable row level security;
alter table public.friendships enable row level security;
alter table public.squads enable row level security;
alter table public.squad_memberships enable row level security;
alter table public.squad_invites enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.check_ins enable row level security;
alter table public.check_in_metrics enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.consistency_day_facts enable row level security;
alter table public.consistency_rollups enable row level security;
alter table public.provider_connections enable row level security;
alter table public.provider_snapshots enable row level security;
alter table public.provider_snapshot_metrics enable row level security;
alter table public.provider_snapshot_coverage enable row level security;
alter table public.provider_sync_runs enable row level security;
alter table public.provider_webhook_events enable row level security;

create trigger auth_accounts_updated_at
before update on public.auth_accounts
for each row execute function app_private.touch_updated_at();

create trigger profiles_updated_at
before update on public.profiles
for each row execute function app_private.touch_updated_at();

create trigger friend_invites_updated_at
before update on public.friend_invites
for each row execute function app_private.touch_updated_at();

create trigger squads_updated_at
before update on public.squads
for each row execute function app_private.touch_updated_at();

create trigger squad_memberships_updated_at
before update on public.squad_memberships
for each row execute function app_private.touch_updated_at();

create trigger squad_invites_updated_at
before update on public.squad_invites
for each row execute function app_private.touch_updated_at();

create trigger habits_updated_at
before update on public.habits
for each row execute function app_private.touch_updated_at();

create trigger habit_completions_updated_at
before update on public.habit_completions
for each row execute function app_private.touch_updated_at();

create trigger check_ins_updated_at
before update on public.check_ins
for each row execute function app_private.touch_updated_at();

create trigger check_in_metrics_updated_at
before update on public.check_in_metrics
for each row execute function app_private.touch_updated_at();

create trigger comments_updated_at
before update on public.comments
for each row execute function app_private.touch_updated_at();

create trigger post_reactions_updated_at
before update on public.post_reactions
for each row execute function app_private.touch_updated_at();

create trigger consistency_day_facts_updated_at
before update on public.consistency_day_facts
for each row execute function app_private.touch_updated_at();

create trigger consistency_rollups_updated_at
before update on public.consistency_rollups
for each row execute function app_private.touch_updated_at();

create trigger provider_connections_updated_at
before update on public.provider_connections
for each row execute function app_private.touch_updated_at();

create trigger provider_snapshots_updated_at
before update on public.provider_snapshots
for each row execute function app_private.touch_updated_at();

create trigger provider_snapshot_metrics_updated_at
before update on public.provider_snapshot_metrics
for each row execute function app_private.touch_updated_at();

create trigger provider_snapshot_coverage_updated_at
before update on public.provider_snapshot_coverage
for each row execute function app_private.touch_updated_at();

create trigger provider_sync_runs_updated_at
before update on public.provider_sync_runs
for each row execute function app_private.touch_updated_at();

create trigger provider_webhook_events_updated_at
before update on public.provider_webhook_events
for each row execute function app_private.touch_updated_at();

create trigger auth_users_sync_trigger
after insert or update on auth.users
for each row execute function app_private.sync_auth_account_from_auth_user();

create trigger profiles_consistency_refresh_trigger
after insert or update of pillars on public.profiles
for each row execute function app_private.refresh_consistency_after_profile_change();

create trigger habits_consistency_refresh_trigger
after insert or update or delete on public.habits
for each row execute function app_private.refresh_consistency_after_habit_change();

create trigger habit_completions_consistency_refresh_trigger
after insert or update or delete on public.habit_completions
for each row execute function app_private.refresh_consistency_after_completion_change();

create trigger check_ins_consistency_refresh_trigger
after insert or update or delete on public.check_ins
for each row execute function app_private.refresh_consistency_after_check_in_change();

create policy "accounts are self-managed"
  on public.auth_accounts
  for select
  using (auth.uid() = user_id);

create policy "profiles are visible to self, friends, and squad peers"
  on public.profiles
  for select
  using (app_private.can_view_profile(user_id));

create policy "profiles are self-managed"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "friend invites are visible to participants"
  on public.friend_invites
  for select
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "friend invites are created by the inviter"
  on public.friend_invites
  for insert
  with check (auth.uid() = inviter_id);

create policy "friend invites are updated by participants"
  on public.friend_invites
  for update
  using (auth.uid() = inviter_id or auth.uid() = invitee_id)
  with check (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "friend invites are deleted by participants"
  on public.friend_invites
  for delete
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "friendships are visible to participants"
  on public.friendships
  for select
  using (auth.uid() = user_low_id or auth.uid() = user_high_id);

create policy "squads are visible to members"
  on public.squads
  for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1
      from public.squad_memberships memberships
      where memberships.squad_id = squads.id
        and memberships.user_id = auth.uid()
        and memberships.state = 'active'
    )
  );

create policy "squads are created by the owner"
  on public.squads
  for insert
  with check (auth.uid() = owner_id);

create policy "squads are updated by the owner"
  on public.squads
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "squads are deleted by the owner"
  on public.squads
  for delete
  using (auth.uid() = owner_id);

create policy "squad memberships are visible to squad members"
  on public.squad_memberships
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.squad_memberships viewer_memberships
      where viewer_memberships.squad_id = squad_memberships.squad_id
        and viewer_memberships.user_id = auth.uid()
      and viewer_memberships.state = 'active'
    )
  );

create policy "squad memberships can be removed by the member or squad owner"
  on public.squad_memberships
  for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.squads squads
      where squads.id = squad_memberships.squad_id
        and squads.owner_id = auth.uid()
    )
  );

create policy "squad invites are visible to participants and squad members"
  on public.squad_invites
  for select
  using (
    auth.uid() = inviter_id
    or auth.uid() = invitee_id
    or exists (
      select 1
      from public.squad_memberships memberships
      where memberships.squad_id = squad_invites.squad_id
        and memberships.user_id = auth.uid()
        and memberships.state = 'active'
    )
  );

create policy "squad invites are created by members"
  on public.squad_invites
  for insert
  with check (
    auth.uid() = inviter_id
    and exists (
      select 1
      from public.squad_memberships memberships
      where memberships.squad_id = squad_id
        and memberships.user_id = auth.uid()
        and memberships.state = 'active'
        and memberships.role in ('owner', 'admin')
    )
  );

create policy "squad invites are updated by participants"
  on public.squad_invites
  for update
  using (auth.uid() = inviter_id or auth.uid() = invitee_id)
  with check (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "squad invites are deleted by participants or squad owner"
  on public.squad_invites
  for delete
  using (
    auth.uid() = inviter_id
    or auth.uid() = invitee_id
    or exists (
      select 1
      from public.squads squads
      where squads.id = squad_invites.squad_id
        and squads.owner_id = auth.uid()
    )
  );

create policy "habits are visible to the owner and permitted peers"
  on public.habits
  for select
  using (
    auth.uid() = owner_id
    or (
      visibility_scope = 'friends'
      and (
        app_private.is_friend(auth.uid(), owner_id)
        or app_private.is_same_squad_member(auth.uid(), owner_id)
      )
    )
  );

create policy "habits are created by the owner"
  on public.habits
  for insert
  with check (auth.uid() = owner_id);

create policy "habits are updated by the owner"
  on public.habits
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "habits are deleted by the owner"
  on public.habits
  for delete
  using (auth.uid() = owner_id);

create policy "habit completions are visible to the owner and permitted peers"
  on public.habit_completions
  for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1
      from public.habits habits
      where habits.id = habit_completions.habit_id
        and (
          habits.owner_id = auth.uid()
          or (
            habits.visibility_scope = 'friends'
            and (
              app_private.is_friend(auth.uid(), habits.owner_id)
              or app_private.is_same_squad_member(auth.uid(), habits.owner_id)
            )
          )
        )
    )
  );

create policy "habit completions are created by the owner"
  on public.habit_completions
  for insert
  with check (auth.uid() = owner_id);

create policy "habit completions are updated by the owner"
  on public.habit_completions
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "habit completions are deleted by the owner"
  on public.habit_completions
  for delete
  using (auth.uid() = owner_id);

create policy "check-ins are visible based on audience"
  on public.check_ins
  for select
  using (app_private.can_view_check_in(id));

create policy "check-ins are created by the author"
  on public.check_ins
  for insert
  with check (
    auth.uid() = author_id
    and (
      audience <> 'squad'
      or exists (
        select 1
        from public.squad_memberships memberships
        where memberships.squad_id = check_ins.squad_id
          and memberships.user_id = auth.uid()
          and memberships.state = 'active'
      )
    )
  );

create policy "check-ins are updated by the author"
  on public.check_ins
  for update
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (
      audience <> 'squad'
      or exists (
        select 1
        from public.squad_memberships memberships
        where memberships.squad_id = check_ins.squad_id
          and memberships.user_id = auth.uid()
          and memberships.state = 'active'
      )
    )
  );

create policy "check-ins are deleted by the author"
  on public.check_ins
  for delete
  using (auth.uid() = author_id);

create policy "check-in metrics follow check-in visibility"
  on public.check_in_metrics
  for select
  using (
    exists (
      select 1
      from public.check_ins check_ins
      where check_ins.id = check_in_metrics.check_in_id
        and app_private.can_view_check_in(check_ins.id)
    )
  );

create policy "check-in metrics are created with visible check-ins"
  on public.check_in_metrics
  for insert
  with check (
    exists (
      select 1
      from public.check_ins check_ins
      where check_ins.id = check_in_metrics.check_in_id
        and auth.uid() = check_ins.author_id
    )
  );

create policy "check-in metrics are deleted by the check-in author"
  on public.check_in_metrics
  for delete
  using (
    exists (
      select 1
      from public.check_ins check_ins
      where check_ins.id = check_in_metrics.check_in_id
        and check_ins.author_id = auth.uid()
    )
  );

create policy "comments follow check-in visibility"
  on public.comments
  for select
  using (
    exists (
      select 1
      from public.check_ins check_ins
      where check_ins.id = comments.check_in_id
        and app_private.can_view_check_in(check_ins.id)
    )
  );

create policy "comments are created by the author"
  on public.comments
  for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.check_ins check_ins
      where check_ins.id = comments.check_in_id
        and app_private.can_view_check_in(check_ins.id)
    )
  );

create policy "comments are updated by the author"
  on public.comments
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "comments are deleted by the author"
  on public.comments
  for delete
  using (auth.uid() = author_id);

create policy "reactions follow check-in visibility"
  on public.post_reactions
  for select
  using (
    exists (
      select 1
      from public.check_ins check_ins
      where check_ins.id = post_reactions.check_in_id
        and app_private.can_view_check_in(check_ins.id)
    )
  );

create policy "reactions are created by the author"
  on public.post_reactions
  for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.check_ins check_ins
      where check_ins.id = post_reactions.check_in_id
        and app_private.can_view_check_in(check_ins.id)
    )
  );

create policy "reactions are updated by the author"
  on public.post_reactions
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "reactions are deleted by the author"
  on public.post_reactions
  for delete
  using (auth.uid() = author_id);

create policy "consistency day facts are visible to the owner"
  on public.consistency_day_facts
  for select
  using (auth.uid() = user_id);

create policy "consistency rollups are visible to self, friends, and squad peers"
  on public.consistency_rollups
  for select
  using (
    auth.uid() = user_id
    or app_private.can_view_profile(user_id)
  );

create policy "provider connections are owner only"
  on public.provider_connections
  for select
  using (auth.uid() = user_id);

create policy "provider snapshots are visible to the owner"
  on public.provider_snapshots
  for select
  using (auth.uid() = user_id);

create policy "provider snapshot metrics are visible to the owner"
  on public.provider_snapshot_metrics
  for select
  using (
    exists (
      select 1
      from public.provider_snapshots snapshots
      where snapshots.id = provider_snapshot_metrics.snapshot_id
        and snapshots.user_id = auth.uid()
    )
  );

create policy "provider snapshot coverage is visible to the owner"
  on public.provider_snapshot_coverage
  for select
  using (
    exists (
      select 1
      from public.provider_snapshots snapshots
      where snapshots.id = provider_snapshot_coverage.snapshot_id
        and snapshots.user_id = auth.uid()
    )
  );

create policy "provider sync runs are owner only"
  on public.provider_sync_runs
  for select
  using (auth.uid() = user_id);

create policy "provider webhook events are service managed"
  on public.provider_webhook_events
  for select
  using (false);

create view public.profile_overviews
with (security_invoker = true)
as
select
  profiles.user_id,
  profiles.display_name,
  profiles.username,
  profiles.mission_line,
  profiles.city,
  profiles.pillars,
  profiles.goals,
  profiles.accountability_style,
  profiles.default_audience,
  profiles.selected_squad_id,
  profiles.created_at,
  profiles.updated_at,
  coalesce(rollups.score, 0) as consistency_score,
  coalesce(rollups.label, 'Starting'::public.consistency_label) as consistency_label,
  coalesce(rollups.window_days, 7) as consistency_window_days,
  rollups.computed_at as consistency_computed_at
from public.profiles profiles
left join public.consistency_rollups rollups
  on rollups.user_id = profiles.user_id
 and rollups.window_days = 7;

create view public.squad_overviews
with (security_invoker = true)
as
select
  squads.id,
  squads.owner_id,
  squads.name,
  squads.handle,
  squads.description,
  squads.current_focus,
  squads.created_at,
  squads.updated_at,
  coalesce(count(memberships.id) filter (where memberships.state = 'active'), 0)::integer as member_count
from public.squads squads
left join public.squad_memberships memberships
  on memberships.squad_id = squads.id
group by
  squads.id,
  squads.owner_id,
  squads.name,
  squads.handle,
  squads.description,
  squads.current_focus,
  squads.created_at,
  squads.updated_at;

create view public.habit_overviews
with (security_invoker = true)
as
select
  habits.id,
  habits.owner_id,
  habits.title,
  habits.cadence,
  habits.visibility_scope,
  habits.streak_days,
  habits.completion_rate,
  habits.is_active,
  habits.last_completed_at,
  habits.created_at,
  habits.updated_at,
  exists (
    select 1
    from public.habit_completions completions
    where completions.habit_id = habits.id
      and completions.completed_for_date = current_date
  ) as completed_today,
  (habits.visibility_scope = 'friends') as friend_visible
from public.habits habits;

create view public.feed_items
with (security_invoker = true)
as
select
  check_ins.id,
  check_ins.author_id,
  profiles.display_name as author_name,
  profiles.username as author_username,
  check_ins.squad_id,
  squads.name as squad_name,
  check_ins.type,
  check_ins.audience,
  check_ins.caption,
  check_ins.consistency_score,
  check_ins.consistency_label,
  check_ins.source_provider,
  check_ins.created_at,
  check_ins.updated_at,
  check_ins.published_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'key', metrics.metric_key,
          'label', initcap(replace(metrics.metric_key::text, '-', ' ')),
          'value', coalesce(
            metrics.value_text,
            metrics.value_numeric::text,
            metrics.value_boolean::text
          ),
          'unit', metrics.unit
        )
        order by metrics.sort_order, metrics.metric_key
      )
      from public.check_in_metrics metrics
      where metrics.check_in_id = check_ins.id
    ),
    '[]'::jsonb
  ) as metrics,
  coalesce(
    (
      select count(*)
      from public.post_reactions reactions
      where reactions.check_in_id = check_ins.id
        and reactions.reaction_kind = 'did_this_too'
    ),
    0
  )::integer as did_this_too_count,
  exists (
    select 1
    from public.post_reactions reactions
    where reactions.check_in_id = check_ins.id
      and reactions.author_id = auth.uid()
      and reactions.reaction_kind = 'did_this_too'
  ) as did_this_too_by_current_user,
  coalesce(
    (
      select count(*)
      from public.comments comments
      where comments.check_in_id = check_ins.id
    ),
    0
  )::integer as comment_count,
  coalesce(
    (
      select array_agg(distinct reactions.reaction_value order by reactions.reaction_value)
      from public.post_reactions reactions
      where reactions.check_in_id = check_ins.id
        and reactions.reaction_kind = 'emoji'
        and reactions.reaction_value is not null
    ),
    '{}'::text[]
  ) as emojis
from public.check_ins check_ins
join public.profiles profiles
  on profiles.user_id = check_ins.author_id
left join public.squads squads
  on squads.id = check_ins.squad_id;

create view public.provider_connections_public
with (security_invoker = true)
as
select
  provider_connections.id,
  provider_connections.user_id,
  provider_connections.provider,
  provider_connections.state,
  provider_connections.connected_at,
  provider_connections.last_sync_at,
  provider_connections.last_error,
  provider_connections.provider_account_id,
  provider_connections.provider_username,
  provider_connections.scopes,
  provider_connections.coverage,
  provider_connections.sync_cursor,
  provider_connections.metadata,
  provider_connections.created_at,
  provider_connections.updated_at
from public.provider_connections provider_connections;

create view public.provider_snapshots_public
with (security_invoker = true)
as
select
  snapshots.id,
  snapshots.user_id,
  snapshots.provider,
  snapshots.provider_connection_id,
  snapshots.captured_at,
  snapshots.window_start_at,
  snapshots.window_end_at,
  snapshots.window_bucket,
  snapshots.source_reference,
  snapshots.metadata,
  snapshots.created_at,
  snapshots.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'key', metrics.metric_key,
          'value', coalesce(
            metrics.value_text,
            metrics.value_numeric::text,
            metrics.value_boolean::text
          ),
          'unit', metrics.unit,
          'source', metrics.source,
          'observedAt', metrics.observed_at,
          'confidence', metrics.confidence
        )
        order by metrics.sort_order, metrics.metric_key
      )
      from public.provider_snapshot_metrics metrics
      where metrics.snapshot_id = snapshots.id
    ),
    '[]'::jsonb
  ) as metrics,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'key', coverage.metric_key,
          'available', coverage.available,
          'reason', coverage.reason
        )
        order by coverage.metric_key
      )
      from public.provider_snapshot_coverage coverage
      where coverage.snapshot_id = snapshots.id
    ),
    '[]'::jsonb
  ) as coverage
from public.provider_snapshots snapshots;

grant usage on schema app_private to authenticated, service_role;
grant usage on schema public to authenticated, service_role;

grant execute on function app_private.complete_onboarding(
  text,
  text,
  text,
  text,
  text[],
  text[],
  public.accountability_style,
  public.visibility_scope,
  uuid
) to authenticated;

grant execute on function app_private.create_squad(
  text,
  text,
  text,
  text
) to authenticated;

grant execute on function app_private.accept_friend_invite(text) to authenticated;
grant execute on function app_private.accept_squad_invite(text) to authenticated;

grant execute on function app_private.recompute_consistency_rollup(uuid, integer) to authenticated, service_role;
grant execute on function app_private.refresh_consistency_window(uuid) to authenticated, service_role;

grant select on public.auth_accounts to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.friend_invites to authenticated;
grant select on public.friendships to authenticated;
grant select, insert, update, delete on public.squads to authenticated;
grant select, insert, update, delete on public.squad_memberships to authenticated;
grant select, insert, update, delete on public.squad_invites to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, update, delete on public.habit_completions to authenticated;
grant select, insert, update, delete on public.check_ins to authenticated;
grant select, insert, update, delete on public.check_in_metrics to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.post_reactions to authenticated;
grant select on public.consistency_day_facts to authenticated;
grant select on public.consistency_rollups to authenticated;
grant select on public.provider_snapshots to authenticated;
grant select on public.provider_snapshot_metrics to authenticated;
grant select on public.provider_snapshot_coverage to authenticated;
grant select (id, user_id, provider, state, connected_at, last_sync_at, last_error, provider_account_id, provider_username, scopes, coverage, sync_cursor, metadata, created_at, updated_at) on public.provider_connections to authenticated;
grant select on public.provider_connections_public to authenticated;
grant select on public.provider_snapshots_public to authenticated;
grant select on public.profile_overviews to authenticated;
grant select on public.squad_overviews to authenticated;
grant select on public.habit_overviews to authenticated;
grant select on public.feed_items to authenticated;
