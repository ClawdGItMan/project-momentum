-- Character Model: Momentum Score, Pillar Ratings, and Achievements
-- Inspired by Stronger's character system, adapted for Outtcast's 4-pillar model.

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.momentum_tier as enum (
  'Newcomer',
  'Building',
  'Committed',
  'Driven',
  'Elite',
  'Legendary'
);

create type public.achievement_category as enum (
  'consistency',
  'fitness',
  'mindset',
  'learning',
  'recovery',
  'social'
);

-- ─── Character Profiles ─────────────────────────────────────────────────────

create table public.character_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  momentum_score integer not null default 0 check (momentum_score between 0 and 100),
  momentum_tier public.momentum_tier not null default 'Newcomer',
  total_check_ins integer not null default 0,
  longest_streak integer not null default 0,
  member_since timestamptz not null default now(),
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.character_profiles enable row level security;

create policy "Users can read own character profile"
  on public.character_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own character profile"
  on public.character_profiles for update
  using (auth.uid() = user_id);

create policy "System can insert character profiles"
  on public.character_profiles for insert
  with check (auth.uid() = user_id);

-- ─── Pillar Ratings ─────────────────────────────────────────────────────────

create table public.pillar_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  pillar text not null check (pillar in ('fitness', 'mindset', 'learning', 'recovery')),
  score integer not null default 0 check (score between 0 and 100),
  tier public.momentum_tier not null default 'Newcomer',
  consistency_rate numeric(5,4) not null default 0,
  habit_completion_rate numeric(5,4) not null default 0,
  streak_days integer not null default 0,
  check_in_rate numeric(5,4) not null default 0,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pillar)
);

alter table public.pillar_ratings enable row level security;

create policy "Users can read own pillar ratings"
  on public.pillar_ratings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own pillar ratings"
  on public.pillar_ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pillar ratings"
  on public.pillar_ratings for update
  using (auth.uid() = user_id);

-- ─── Achievement Definitions ────────────────────────────────────────────────

create table public.achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text not null,
  icon text not null default 'star',
  category public.achievement_category not null,
  threshold integer not null default 1,
  threshold_unit text not null default 'count',
  created_at timestamptz not null default now()
);

alter table public.achievement_definitions enable row level security;

create policy "Anyone can read achievement definitions"
  on public.achievement_definitions for select
  using (true);

-- Seed achievement definitions
insert into public.achievement_definitions (key, title, description, icon, category, threshold, threshold_unit) values
  ('first_checkin', 'First Step', 'Complete your first check-in.', 'flag', 'consistency', 1, 'check-ins'),
  ('week_streak', 'Seven Strong', 'Maintain a 7-day streak.', 'zap', 'consistency', 7, 'streak days'),
  ('two_week_streak', 'Locked In', 'Maintain a 14-day streak.', 'award', 'consistency', 14, 'streak days'),
  ('month_streak', 'Unstoppable', 'Maintain a 30-day streak.', 'shield', 'consistency', 30, 'streak days'),
  ('ten_checkins', 'Double Digits', 'Complete 10 check-ins.', 'check-circle', 'consistency', 10, 'check-ins'),
  ('fifty_checkins', 'Half Century', 'Complete 50 check-ins.', 'star', 'consistency', 50, 'check-ins'),
  ('hundred_checkins', 'Centurion', 'Complete 100 check-ins.', 'sunrise', 'consistency', 100, 'check-ins'),
  ('first_workout', 'Iron Starter', 'Log your first workout.', 'activity', 'fitness', 1, 'workouts'),
  ('twenty_workouts', 'Gym Regular', 'Log 20 workouts.', 'trending-up', 'fitness', 20, 'workouts'),
  ('sleep_week', 'Sleep Scholar', 'Log 7+ hours of sleep for 7 consecutive days.', 'moon', 'recovery', 7, 'nights'),
  ('first_squad', 'Squad Up', 'Join your first squad.', 'users', 'social', 1, 'squads'),
  ('did_this_too_ten', 'Solidarity', 'React with Did this too 10 times.', 'thumbs-up', 'social', 10, 'reactions'),
  ('first_reflection', 'Inner Work', 'Post your first reflection.', 'edit-3', 'mindset', 1, 'reflections'),
  ('learning_streak', 'Student Mode', 'Complete learning habits 5 days in a row.', 'book-open', 'learning', 5, 'streak days');

-- ─── User Achievements (unlocked) ──────────────────────────────────────────

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  achievement_id uuid not null references public.achievement_definitions on delete cascade,
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "Users can read own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can unlock achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ─── Momentum History (weekly snapshots) ────────────────────────────────────

create table public.momentum_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  momentum_score integer not null,
  momentum_tier public.momentum_tier not null,
  snapshot_week date not null,
  pillar_scores jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_week)
);

alter table public.momentum_history enable row level security;

create policy "Users can read own momentum history"
  on public.momentum_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own momentum history"
  on public.momentum_history for insert
  with check (auth.uid() = user_id);

-- ─── Character Overview View ────────────────────────────────────────────────

create or replace view public.character_overviews as
select
  cp.user_id,
  cp.momentum_score,
  cp.momentum_tier,
  cp.total_check_ins,
  cp.longest_streak,
  cp.member_since,
  cp.computed_at,
  coalesce(
    (select count(*) from public.user_achievements ua where ua.user_id = cp.user_id),
    0
  ) as achievement_count
from public.character_profiles cp;
