alter table public.squad_memberships
  add column if not exists chat_visible_from_at timestamptz,
  add column if not exists chat_last_read_at timestamptz;

update public.squad_memberships
set chat_visible_from_at = coalesce(chat_visible_from_at, now()),
    chat_last_read_at = coalesce(chat_last_read_at, now())
where chat_visible_from_at is null
   or chat_last_read_at is null;

alter table public.squad_memberships
  alter column chat_visible_from_at set default now(),
  alter column chat_visible_from_at set not null,
  alter column chat_last_read_at set default now();

do $$
begin
  alter table public.squad_memberships
    add constraint squad_memberships_chat_read_after_visible
    check (
      chat_last_read_at is null
      or chat_last_read_at >= chat_visible_from_at
    );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.squad_messages (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  client_message_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint squad_messages_body_length check (char_length(trim(body)) between 1 and 1000)
);

create index if not exists squad_messages_squad_created_idx
  on public.squad_messages (squad_id, created_at desc);

create index if not exists squad_messages_author_created_idx
  on public.squad_messages (author_id, created_at desc);

create unique index if not exists squad_messages_author_client_idx
  on public.squad_messages (author_id, client_message_id);

create or replace function app_private.is_active_squad_member(
  p_squad_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_private
as $$
  select exists (
    select 1
    from public.squad_memberships memberships
    where memberships.squad_id = p_squad_id
      and memberships.user_id = p_user_id
      and memberships.state = 'active'
  );
$$;

create or replace function app_private.can_view_squad_message(
  p_squad_id uuid,
  p_created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_private
as $$
  select exists (
    select 1
    from public.squad_memberships memberships
    where memberships.squad_id = p_squad_id
      and memberships.user_id = auth.uid()
      and memberships.state = 'active'
      and memberships.chat_visible_from_at <= p_created_at
  );
$$;

create or replace function app_private.create_friend_invite_by_username(
  p_username text,
  p_message text default null
)
returns public.friend_invites
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_username text;
  v_invitee_id uuid;
  v_invite public.friend_invites;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  v_username := app_private.normalize_username(p_username);
  if v_username is null then
    raise exception 'friend invite target unavailable';
  end if;

  select profiles.user_id
    into v_invitee_id
  from public.profiles profiles
  where lower(profiles.username) = lower(v_username);

  if v_invitee_id is null then
    raise exception 'friend invite target unavailable';
  end if;

  if v_invitee_id = v_user_id then
    raise exception 'you cannot invite yourself';
  end if;

  if app_private.is_friend(v_user_id, v_invitee_id) then
    raise exception 'you are already friends';
  end if;

  insert into public.friend_invites (
    inviter_id,
    invitee_id,
    message,
    status,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    v_invitee_id,
    nullif(trim(p_message), ''),
    'pending',
    now(),
    now()
  )
  returning * into v_invite;

  return v_invite;
exception
  when unique_violation then
    raise exception 'a pending friend invite already exists for this user';
end;
$$;

create or replace function app_private.set_selected_squad(
  p_squad_id uuid default null
)
returns public.profile_overviews
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profile_overviews;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_squad_id is not null and not app_private.is_active_squad_member(p_squad_id, v_user_id) then
    raise exception 'selected squad must already include the current user';
  end if;

  update public.profiles
  set selected_squad_id = p_squad_id,
      updated_at = now()
  where profiles.user_id = v_user_id;

  select *
    into v_profile
  from public.profile_overviews profiles
  where profiles.user_id = v_user_id;

  return v_profile;
end;
$$;

create or replace function app_private.leave_squad(
  p_squad_id uuid
)
returns public.squad_memberships
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.squad_memberships;
  v_owner_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
    into v_membership
  from public.squad_memberships memberships
  where memberships.squad_id = p_squad_id
    and memberships.user_id = v_user_id
    and memberships.state = 'active';

  if not found then
    raise exception 'active squad membership not found';
  end if;

  select squads.owner_id
    into v_owner_id
  from public.squads squads
  where squads.id = p_squad_id;

  if v_owner_id = v_user_id then
    raise exception 'the squad owner cannot leave without transferring ownership first';
  end if;

  update public.squad_memberships
  set state = 'left',
      left_at = now(),
      updated_at = now()
  where id = v_membership.id
  returning * into v_membership;

  update public.profiles
  set selected_squad_id = null,
      updated_at = now()
  where user_id = v_user_id
    and selected_squad_id = p_squad_id;

  return v_membership;
end;
$$;

create or replace function app_private.record_apple_health_snapshot(
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
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_connection_id uuid;
  v_snapshot_id uuid;
  v_connected_at timestamptz;
  v_snapshot public.provider_snapshots_public;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_window_start_at >= p_window_end_at then
    raise exception 'window start must be before window end';
  end if;

  select provider_connections.id, provider_connections.connected_at
    into v_connection_id, v_connected_at
  from public.provider_connections
  where provider_connections.user_id = v_user_id
    and provider_connections.provider = 'apple-health';

  insert into public.provider_connections (
    user_id,
    provider,
    state,
    connected_at,
    last_sync_at,
    last_error,
    coverage,
    metadata,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    'apple-health',
    p_state,
    case
      when p_state in ('connected', 'connected_limited') then coalesce(v_connected_at, now())
      else v_connected_at
    end,
    case
      when jsonb_array_length(coalesce(p_metrics, '[]'::jsonb)) > 0 then now()
      else null
    end,
    nullif(trim(p_last_error), ''),
    coalesce(p_coverage, '[]'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    now()
  )
  on conflict (user_id, provider)
  do update set
    state = excluded.state,
    connected_at = case
      when excluded.state in ('connected', 'connected_limited')
        then coalesce(public.provider_connections.connected_at, excluded.connected_at, now())
      else public.provider_connections.connected_at
    end,
    last_sync_at = coalesce(excluded.last_sync_at, public.provider_connections.last_sync_at),
    last_error = excluded.last_error,
    coverage = excluded.coverage,
    metadata = public.provider_connections.metadata || excluded.metadata,
    updated_at = now()
  returning id into v_connection_id;

  if jsonb_typeof(coalesce(p_metrics, '[]'::jsonb)) <> 'array' then
    raise exception 'metrics payload must be a json array';
  end if;

  if jsonb_typeof(coalesce(p_coverage, '[]'::jsonb)) <> 'array' then
    raise exception 'coverage payload must be a json array';
  end if;

  if jsonb_array_length(coalesce(p_metrics, '[]'::jsonb)) = 0 then
    return null;
  end if;

  insert into public.provider_snapshots (
    user_id,
    provider,
    provider_connection_id,
    captured_at,
    window_start_at,
    window_end_at,
    window_bucket,
    metadata,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    'apple-health',
    v_connection_id,
    now(),
    p_window_start_at,
    p_window_end_at,
    p_window_bucket,
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    now()
  )
  returning id into v_snapshot_id;

  insert into public.provider_snapshot_metrics (
    snapshot_id,
    metric_key,
    value_numeric,
    value_text,
    value_boolean,
    unit,
    source,
    observed_at,
    confidence,
    sort_order,
    created_at,
    updated_at
  )
  select
    v_snapshot_id,
    (item ->> 'key')::public.metric_key,
    case
      when jsonb_typeof(item -> 'value') = 'number' then (item ->> 'value')::numeric
      else null
    end,
    case
      when jsonb_typeof(item -> 'value') = 'string' then item ->> 'value'
      else null
    end,
    case
      when jsonb_typeof(item -> 'value') = 'boolean' then (item ->> 'value')::boolean
      else null
    end,
    nullif(item ->> 'unit', ''),
    coalesce((item ->> 'source')::public.metric_source, 'live'::public.metric_source),
    coalesce((item ->> 'observedAt')::timestamptz, now()),
    coalesce(item ->> 'confidence', 'high'),
    ordinality - 1,
    now(),
    now()
  from jsonb_array_elements(coalesce(p_metrics, '[]'::jsonb)) with ordinality as metrics(item, ordinality);

  insert into public.provider_snapshot_coverage (
    snapshot_id,
    metric_key,
    available,
    reason,
    created_at,
    updated_at
  )
  select
    v_snapshot_id,
    (item ->> 'key')::public.metric_key,
    coalesce((item ->> 'available')::boolean, false),
    case
      when coalesce((item ->> 'available')::boolean, false) then null
      else coalesce((item ->> 'reason')::public.coverage_reason, 'no_samples'::public.coverage_reason)
    end,
    now(),
    now()
  from jsonb_array_elements(coalesce(p_coverage, '[]'::jsonb)) as coverage(item);

  update public.provider_connections
  set last_sync_at = now(),
      coverage = coalesce(p_coverage, '[]'::jsonb),
      last_error = nullif(trim(p_last_error), ''),
      updated_at = now()
  where id = v_connection_id;

  select *
    into v_snapshot
  from public.provider_snapshots_public snapshots
  where snapshots.id = v_snapshot_id;

  return v_snapshot;
end;
$$;

create or replace function app_private.create_check_in(
  p_type public.post_type,
  p_audience public.visibility_scope,
  p_caption text default '',
  p_squad_id uuid default null,
  p_source_provider text default null,
  p_source_snapshot_id uuid default null,
  p_metrics jsonb default '[]'::jsonb
)
returns public.feed_items
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_check_in_id uuid;
  v_rollup public.consistency_rollups;
  v_check_in public.feed_items;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_audience = 'squad' and p_squad_id is null then
    raise exception 'squad audience requires a squad';
  end if;

  if p_audience <> 'squad' and p_squad_id is not null then
    raise exception 'only squad audience can attach a squad';
  end if;

  if p_squad_id is not null and not app_private.is_active_squad_member(p_squad_id, v_user_id) then
    raise exception 'squad posting requires an active squad membership';
  end if;

  if p_source_snapshot_id is not null and not exists (
    select 1
    from public.provider_snapshots snapshots
    where snapshots.id = p_source_snapshot_id
      and snapshots.user_id = v_user_id
  ) then
    raise exception 'source snapshot must belong to the current user';
  end if;

  if jsonb_typeof(coalesce(p_metrics, '[]'::jsonb)) <> 'array' then
    raise exception 'metrics payload must be a json array';
  end if;

  insert into public.check_ins (
    author_id,
    type,
    audience,
    squad_id,
    caption,
    source_provider,
    source_snapshot_id,
    consistency_score,
    consistency_label,
    created_at,
    updated_at,
    published_at
  )
  values (
    v_user_id,
    p_type,
    p_audience,
    p_squad_id,
    coalesce(p_caption, ''),
    p_source_provider,
    p_source_snapshot_id,
    0,
    'Starting',
    now(),
    now(),
    now()
  )
  returning id into v_check_in_id;

  insert into public.check_in_metrics (
    check_in_id,
    metric_key,
    value_numeric,
    value_text,
    value_boolean,
    unit,
    source,
    provider,
    observed_at,
    confidence,
    sort_order,
    created_at,
    updated_at
  )
  select
    v_check_in_id,
    (item ->> 'key')::public.metric_key,
    case
      when jsonb_typeof(item -> 'value') = 'number' then (item ->> 'value')::numeric
      else null
    end,
    case
      when jsonb_typeof(item -> 'value') = 'string' then item ->> 'value'
      else null
    end,
    case
      when jsonb_typeof(item -> 'value') = 'boolean' then (item ->> 'value')::boolean
      else null
    end,
    nullif(item ->> 'unit', ''),
    coalesce((item ->> 'source')::public.metric_source, 'derived'::public.metric_source),
    coalesce(nullif(item ->> 'provider', ''), coalesce(p_source_provider, 'manual')),
    coalesce((item ->> 'observedAt')::timestamptz, now()),
    coalesce(item ->> 'confidence', 'high'),
    ordinality - 1,
    now(),
    now()
  from jsonb_array_elements(coalesce(p_metrics, '[]'::jsonb)) with ordinality as metrics(item, ordinality);

  perform app_private.recompute_consistency_rollup(v_user_id, 7);

  select *
    into v_rollup
  from public.consistency_rollups rollups
  where rollups.user_id = v_user_id
    and rollups.window_days = 7;

  update public.check_ins
  set consistency_score = coalesce(v_rollup.score, 0),
      consistency_label = coalesce(v_rollup.label, 'Starting'),
      updated_at = now()
  where id = v_check_in_id;

  select *
    into v_check_in
  from public.feed_items items
  where items.id = v_check_in_id;

  return v_check_in;
end;
$$;

create or replace function app_private.send_squad_message(
  p_squad_id uuid,
  p_body text,
  p_client_message_id uuid
)
returns public.squad_messages
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_message_id uuid;
  v_message public.squad_messages;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_client_message_id is null then
    raise exception 'client message id is required';
  end if;

  if not app_private.is_active_squad_member(p_squad_id, v_user_id) then
    raise exception 'active squad membership required';
  end if;

  insert into public.squad_messages (
    squad_id,
    author_id,
    client_message_id,
    body,
    created_at,
    updated_at
  )
  values (
    p_squad_id,
    v_user_id,
    p_client_message_id,
    trim(coalesce(p_body, '')),
    now(),
    now()
  )
  on conflict (author_id, client_message_id)
  do update set
    body = public.squad_messages.body,
    updated_at = public.squad_messages.updated_at
  returning id into v_message_id;

  select *
    into v_message
  from public.squad_messages messages
  where messages.id = v_message_id;

  return v_message;
end;
$$;

create or replace function app_private.mark_squad_chat_read(
  p_squad_id uuid,
  p_read_at timestamptz default now()
)
returns public.squad_memberships
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.squad_memberships;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  update public.squad_memberships
  set chat_last_read_at = greatest(
        coalesce(chat_last_read_at, chat_visible_from_at),
        chat_visible_from_at,
        coalesce(p_read_at, now())
      ),
      updated_at = now()
  where squad_id = p_squad_id
    and user_id = v_user_id
    and state = 'active'
  returning * into v_membership;

  if not found then
    raise exception 'active squad membership not found';
  end if;

  return v_membership;
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
    left_at,
    chat_visible_from_at,
    chat_last_read_at,
    created_at,
    updated_at
  )
  values (
    v_invite.squad_id,
    v_user_id,
    'member',
    'active',
    now(),
    null,
    now(),
    now(),
    now(),
    now()
  )
  on conflict (squad_id, user_id)
  do update set
    state = 'active',
    left_at = null,
    role = case when squad_memberships.role = 'owner' then squad_memberships.role else excluded.role end,
    joined_at = now(),
    chat_visible_from_at = now(),
    chat_last_read_at = now(),
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

alter table public.squad_messages enable row level security;

create trigger squad_messages_updated_at
before update on public.squad_messages
for each row
execute function app_private.touch_updated_at();

create policy "squad messages are visible to active members after chat join"
  on public.squad_messages
  for select
  using (app_private.can_view_squad_message(squad_id, created_at));

create policy "squad messages are created by active members"
  on public.squad_messages
  for insert
  with check (
    auth.uid() = author_id
    and app_private.is_active_squad_member(squad_id, auth.uid())
  );

create or replace view public.squad_member_overviews
with (security_invoker = true)
as
select
  memberships.id,
  memberships.squad_id,
  memberships.user_id,
  memberships.role,
  memberships.state,
  memberships.joined_at,
  memberships.left_at,
  profiles.display_name,
  profiles.username,
  profiles.mission_line,
  (memberships.user_id = auth.uid()) as is_current_user
from public.squad_memberships memberships
join public.profiles profiles
  on profiles.user_id = memberships.user_id
where memberships.state = 'active';

create or replace view public.squad_message_items
with (security_invoker = true)
as
select
  messages.id,
  messages.squad_id,
  messages.author_id,
  messages.client_message_id,
  messages.body,
  messages.created_at,
  messages.updated_at,
  profiles.display_name as author_name,
  profiles.username as author_username,
  (messages.author_id = auth.uid()) as is_current_user
from public.squad_messages messages
join public.profiles profiles
  on profiles.user_id = messages.author_id;

create or replace view public.squad_chat_overviews
with (security_invoker = true)
as
select
  memberships.squad_id,
  squads.name as squad_name,
  squads.handle as squad_handle,
  memberships.chat_visible_from_at,
  memberships.chat_last_read_at,
  last_message.id as last_message_id,
  last_message.body as last_message_body,
  last_message.created_at as last_message_created_at,
  last_author.display_name as last_message_author_name,
  last_author.username as last_message_author_username,
  coalesce(
    (
      select count(*)::integer
      from public.squad_messages unread
      where unread.squad_id = memberships.squad_id
        and unread.author_id <> auth.uid()
        and unread.created_at >= memberships.chat_visible_from_at
        and unread.created_at > coalesce(memberships.chat_last_read_at, memberships.chat_visible_from_at)
    ),
    0
  ) as unread_count
from public.squad_memberships memberships
join public.squads squads
  on squads.id = memberships.squad_id
left join lateral (
  select messages.id, messages.author_id, messages.body, messages.created_at
  from public.squad_messages messages
  where messages.squad_id = memberships.squad_id
    and messages.created_at >= memberships.chat_visible_from_at
  order by messages.created_at desc
  limit 1
) last_message on true
left join public.profiles last_author
  on last_author.user_id = last_message.author_id
where memberships.user_id = auth.uid()
  and memberships.state = 'active';

grant execute on function app_private.create_friend_invite_by_username(text, text) to authenticated;
grant execute on function app_private.set_selected_squad(uuid) to authenticated;
grant execute on function app_private.leave_squad(uuid) to authenticated;
grant execute on function app_private.record_apple_health_snapshot(
  public.connection_state,
  timestamptz,
  timestamptz,
  public.metric_window_bucket,
  jsonb,
  jsonb,
  jsonb,
  text
) to authenticated;
grant execute on function app_private.create_check_in(
  public.post_type,
  public.visibility_scope,
  text,
  uuid,
  text,
  uuid,
  jsonb
) to authenticated;
grant execute on function app_private.send_squad_message(uuid, text, uuid) to authenticated;
grant execute on function app_private.mark_squad_chat_read(uuid, timestamptz) to authenticated;

grant select on public.squad_messages to authenticated;
grant select on public.squad_member_overviews to authenticated;
grant select on public.squad_message_items to authenticated;
grant select on public.squad_chat_overviews to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.squad_messages;
exception
  when duplicate_object then null;
end $$;
