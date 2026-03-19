create or replace function public.complete_onboarding(
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
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.complete_onboarding(
    p_display_name,
    p_username,
    p_mission_line,
    p_city,
    p_pillars,
    p_goals,
    p_accountability_style,
    p_default_audience,
    p_selected_squad_id
  );
$$;

create or replace function public.create_friend_invite_by_username(
  p_username text,
  p_message text default null
)
returns public.friend_invites
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.create_friend_invite_by_username(
    p_username,
    p_message
  );
$$;

create or replace function public.set_selected_squad(
  p_squad_id uuid default null
)
returns public.profile_overviews
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.set_selected_squad(p_squad_id);
$$;

create or replace function public.record_apple_health_snapshot(
  p_state public.connection_state,
  p_window_start_at timestamptz,
  p_window_end_at timestamptz,
  p_window_bucket public.metric_window_bucket,
  p_metrics jsonb default '[]'::jsonb,
  p_coverage jsonb default '[]'::jsonb,
  p_metadata jsonb default '{}'::jsonb,
  p_last_error text default null
)
returns public.provider_snapshots_public
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.record_apple_health_snapshot(
    p_state,
    p_window_start_at,
    p_window_end_at,
    p_window_bucket,
    p_metrics,
    p_coverage,
    p_metadata,
    p_last_error
  );
$$;

create or replace function public.create_check_in(
  p_type public.post_type,
  p_audience public.visibility_scope,
  p_caption text default '',
  p_squad_id uuid default null,
  p_source_provider text default null,
  p_source_snapshot_id uuid default null,
  p_metrics jsonb default '[]'::jsonb
)
returns public.feed_items
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.create_check_in(
    p_type,
    p_audience,
    p_caption,
    p_squad_id,
    p_source_provider,
    p_source_snapshot_id,
    p_metrics
  );
$$;

create or replace function public.create_squad(
  p_name text,
  p_handle text,
  p_description text default '',
  p_current_focus text default ''
)
returns public.squads
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.create_squad(
    p_name,
    p_handle,
    p_description,
    p_current_focus
  );
$$;

create or replace function public.accept_friend_invite(
  p_invite_token text
)
returns public.friendships
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.accept_friend_invite(p_invite_token);
$$;

create or replace function public.accept_squad_invite(
  p_invite_token text
)
returns public.squad_memberships
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.accept_squad_invite(p_invite_token);
$$;

create or replace function public.send_squad_message(
  p_squad_id uuid,
  p_body text,
  p_client_message_id uuid
)
returns public.squad_messages
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.send_squad_message(
    p_squad_id,
    p_body,
    p_client_message_id
  );
$$;

create or replace function public.mark_squad_chat_read(
  p_squad_id uuid,
  p_read_at timestamptz default now()
)
returns public.squad_memberships
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.mark_squad_chat_read(
    p_squad_id,
    p_read_at
  );
$$;

alter table public.consistency_rollups
  add column if not exists updated_at timestamptz not null default now();

revoke execute on function public.complete_onboarding(
  text,
  text,
  text,
  text,
  text[],
  text[],
  public.accountability_style,
  public.visibility_scope,
  uuid
) from public, anon;
grant execute on function public.complete_onboarding(
  text,
  text,
  text,
  text,
  text[],
  text[],
  public.accountability_style,
  public.visibility_scope,
  uuid
) to authenticated, service_role;

revoke execute on function public.create_friend_invite_by_username(text, text) from public, anon;
grant execute on function public.create_friend_invite_by_username(text, text) to authenticated, service_role;

revoke execute on function public.set_selected_squad(uuid) from public, anon;
grant execute on function public.set_selected_squad(uuid) to authenticated, service_role;

revoke execute on function public.record_apple_health_snapshot(
  public.connection_state,
  timestamptz,
  timestamptz,
  public.metric_window_bucket,
  jsonb,
  jsonb,
  jsonb,
  text
) from public, anon;
grant execute on function public.record_apple_health_snapshot(
  public.connection_state,
  timestamptz,
  timestamptz,
  public.metric_window_bucket,
  jsonb,
  jsonb,
  jsonb,
  text
) to authenticated, service_role;

revoke execute on function public.create_check_in(
  public.post_type,
  public.visibility_scope,
  text,
  uuid,
  text,
  uuid,
  jsonb
) from public, anon;
grant execute on function public.create_check_in(
  public.post_type,
  public.visibility_scope,
  text,
  uuid,
  text,
  uuid,
  jsonb
) to authenticated, service_role;

revoke execute on function public.create_squad(
  text,
  text,
  text,
  text
) from public, anon;
grant execute on function public.create_squad(
  text,
  text,
  text,
  text
) to authenticated, service_role;

revoke execute on function public.accept_friend_invite(text) from public, anon;
grant execute on function public.accept_friend_invite(text) to authenticated, service_role;

revoke execute on function public.accept_squad_invite(text) from public, anon;
grant execute on function public.accept_squad_invite(text) to authenticated, service_role;

revoke execute on function public.send_squad_message(uuid, text, uuid) from public, anon;
grant execute on function public.send_squad_message(uuid, text, uuid) to authenticated, service_role;

revoke execute on function public.mark_squad_chat_read(uuid, timestamptz) from public, anon;
grant execute on function public.mark_squad_chat_read(uuid, timestamptz) to authenticated, service_role;
