create or replace function app_private.can_view_squad_membership(
  p_squad_id uuid,
  p_membership_user_id uuid,
  p_viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_private
as $$
  select p_viewer_id is not null
    and (
      p_viewer_id = p_membership_user_id
      or exists (
        select 1
        from public.squad_memberships memberships
        where memberships.squad_id = p_squad_id
          and memberships.user_id = p_viewer_id
          and memberships.state = 'active'
      )
    );
$$;

drop policy if exists "squads are visible to members" on public.squads;

create policy "squads are visible to members"
  on public.squads
  for select
  using (
    ((select auth.uid()) = owner_id)
    or (select app_private.is_active_squad_member(squads.id, (select auth.uid())))
  );

drop policy if exists "squad memberships are visible to squad members" on public.squad_memberships;

create policy "squad memberships are visible to squad members"
  on public.squad_memberships
  for select
  using (
    (select app_private.can_view_squad_membership(
      squad_memberships.squad_id,
      squad_memberships.user_id,
      (select auth.uid())
    ))
  );

drop policy if exists "squad invites are visible to participants and squad members" on public.squad_invites;

create policy "squad invites are visible to participants and squad members"
  on public.squad_invites
  for select
  using (
    ((select auth.uid()) = inviter_id)
    or ((select auth.uid()) = invitee_id)
    or (select app_private.is_active_squad_member(squad_invites.squad_id, (select auth.uid())))
  );
