create or replace function app_private.transfer_squad_ownership(
  p_squad_id uuid,
  p_new_owner_id uuid
)
returns public.squads
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_current_owner_id uuid := auth.uid();
  v_squad public.squads;
  v_current_owner_membership public.squad_memberships;
  v_new_owner_membership public.squad_memberships;
begin
  if v_current_owner_id is null then
    raise exception 'authentication required';
  end if;

  if p_new_owner_id = v_current_owner_id then
    raise exception 'new owner must be different from the current owner';
  end if;

  select *
    into v_squad
  from public.squads squads
  where squads.id = p_squad_id;

  if not found then
    raise exception 'squad not found';
  end if;

  if v_squad.owner_id <> v_current_owner_id then
    raise exception 'only the current owner can transfer ownership';
  end if;

  select *
    into v_current_owner_membership
  from public.squad_memberships memberships
  where memberships.squad_id = p_squad_id
    and memberships.user_id = v_current_owner_id
    and memberships.state = 'active';

  if not found then
    raise exception 'current owner membership not found';
  end if;

  select *
    into v_new_owner_membership
  from public.squad_memberships memberships
  where memberships.squad_id = p_squad_id
    and memberships.user_id = p_new_owner_id
    and memberships.state = 'active';

  if not found then
    raise exception 'new owner must already be an active squad member';
  end if;

  update public.squads
  set owner_id = p_new_owner_id,
      updated_at = now()
  where id = p_squad_id;

  update public.squad_memberships
  set role = 'admin',
      updated_at = now()
  where id = v_current_owner_membership.id;

  update public.squad_memberships
  set role = 'owner',
      updated_at = now()
  where id = v_new_owner_membership.id;

  select *
    into v_squad
  from public.squads squads
  where squads.id = p_squad_id;

  return v_squad;
end;
$$;

create or replace function public.transfer_squad_ownership(
  p_squad_id uuid,
  p_new_owner_id uuid
)
returns public.squads
language sql
security definer
set search_path = public, auth, app_private
as $$
  select app_private.transfer_squad_ownership(
    p_squad_id,
    p_new_owner_id
  );
$$;

revoke execute on function public.transfer_squad_ownership(uuid, uuid) from public, anon;
grant execute on function public.transfer_squad_ownership(uuid, uuid) to authenticated, service_role;
