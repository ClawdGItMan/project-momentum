create or replace function app_private.join_onboarding_squad(
  p_name text default 'Day ones',
  p_handle text default 'day-ones',
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
  v_role public.squad_role := 'member';
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  v_handle := app_private.normalize_username(p_handle);

  if v_handle is null or char_length(v_handle) < 3 then
    raise exception 'handle must contain at least 3 valid characters';
  end if;

  select *
    into v_squad
  from public.squads squads
  where lower(squads.handle) = lower(v_handle)
  limit 1;

  if not found then
    begin
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
        coalesce(nullif(trim(p_name), ''), 'Day ones'),
        v_handle,
        coalesce(nullif(trim(p_description), ''), ''),
        coalesce(nullif(trim(p_current_focus), ''), ''),
        now(),
        now()
      )
      returning * into v_squad;

      v_role := 'owner';
    exception
      when unique_violation then
        select *
          into v_squad
        from public.squads squads
        where lower(squads.handle) = lower(v_handle)
        limit 1;
    end;
  elsif v_squad.owner_id = v_user_id then
    v_role := 'owner';
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
    v_squad.id,
    v_user_id,
    v_role,
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
    updated_at = now();

  update public.profiles
  set selected_squad_id = v_squad.id,
      updated_at = now()
  where profiles.user_id = v_user_id
    and profiles.selected_squad_id is distinct from v_squad.id;

  return v_squad;
end;
$$;

create or replace function public.join_onboarding_squad(
  p_name text default 'Day ones',
  p_handle text default 'day-ones',
  p_description text default '',
  p_current_focus text default ''
)
returns public.squads
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.join_onboarding_squad(
    p_name,
    p_handle,
    p_description,
    p_current_focus
  );
$$;

revoke execute on function public.join_onboarding_squad(text, text, text, text) from public, anon;
grant execute on function public.join_onboarding_squad(text, text, text, text) to authenticated, service_role;
