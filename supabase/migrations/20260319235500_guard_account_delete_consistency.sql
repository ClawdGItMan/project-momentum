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
  if not exists (
    select 1
    from auth.users
    where users.id = p_user_id
  ) then
    return;
  end if;

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
  if not exists (
    select 1
    from auth.users
    where users.id = p_user_id
  ) then
    return null;
  end if;

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
  if not exists (
    select 1
    from auth.users
    where users.id = p_user_id
  ) then
    return;
  end if;

  for v_day in
    select generate_series(current_date - 6, current_date, interval '1 day')::date
  loop
    perform app_private.refresh_consistency_day_fact(p_user_id, v_day);
  end loop;

  perform app_private.recompute_consistency_rollup(p_user_id, 7);
end;
$$;

alter table public.check_ins
  drop constraint if exists check_ins_squad_id_fkey;

alter table public.check_ins
  add constraint check_ins_squad_id_fkey
  foreign key (squad_id) references public.squads (id) on delete cascade;
