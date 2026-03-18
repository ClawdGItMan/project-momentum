# Backend Build Plan

## Goal

Turn the current seeded Expo prototype into a real private social product with:

- authenticated accounts
- private friends and squads
- persisted habits, check-ins, reactions, and consistency
- Apple Health uploads from device
- server-managed Strava and WHOOP integrations
- a personalized but still understandable feed

## Current Status

- Phase 0 is now scaffolded in-repo.
- `supabase/` contains the first foundation migration, RLS, helper RPCs, and read models.
- `backend/` now contains the TypeScript Hono API and worker skeleton plus backend security helpers.
- Backend typecheck and build are passing locally.
- Full local Supabase runtime validation is still pending on a Docker-enabled machine.

## Build Stance

- Keep Apple Health device-first. The iPhone app reads HealthKit locally and uploads only user-approved normalized summaries or post payloads.
- Put Strava and WHOOP behind a server trust boundary. OAuth, refresh tokens, sync cursors, rate limiting, and webhooks belong on the backend.
- Use one TypeScript backend system, not microservices.
- Optimize for shipping the private social core first. Fancy ranking, notifications, and broad provider coverage come after the trust model is real.

## Recommended Stack

### Data and auth

- Supabase Auth for accounts and sessions
- Supabase Postgres for relational data
- Supabase Row Level Security for privacy enforcement
- Supabase Realtime only where it meaningfully improves squads or feed freshness

### Privileged backend

- A single TypeScript API and worker service using Hono
- Deploy it as one service that handles:
  - OAuth callbacks
  - webhook ingestion
  - background sync jobs
  - provider token refresh
  - privileged feed fanout or notification jobs

### Jobs

- Use Postgres-backed jobs with `pg-boss`
- Keep jobs in the same database to avoid introducing another queue service mid-sprint

## Service Boundaries

### Mobile app

- sign in and session bootstrap
- direct user-scoped reads and writes through Supabase where RLS is enough
- Apple Health permission prompts, raw HealthKit reads, local normalization, and manual fallback
- upload explicit check-in summaries and approved metric aggregates

### API and worker

- create provider connect URLs
- receive OAuth callbacks
- store encrypted provider refresh tokens
- process Strava and WHOOP webhooks
- run backfill and incremental sync jobs
- normalize remote provider payloads into app-facing snapshots
- run feed fanout and consistency recompute jobs when needed

### Database

- source of truth for accounts, profiles, friendships, squads, habits, posts, reactions, consistency facts, and provider connections
- privacy enforcement through RLS
- durable job queue tables

## Canonical Domains

- `auth_accounts`
- `profiles`
- `friendships`
- `friend_invites`
- `squads`
- `squad_memberships`
- `squad_invites`
- `habits`
- `habit_completions`
- `check_ins`
- `check_in_metrics`
- `post_reactions`
- `comments`
- `consistency_day_facts`
- `consistency_rollups`
- `provider_connections`
- `provider_snapshots`
- `provider_sync_runs`
- `provider_webhook_events`
- `notification_events`

## Privacy Rules

- No public profiles
- No public feed
- Every read is constrained to:
  - self
  - accepted friends
  - squads where the viewer is an active member
- Workouts and habits default to `friends`, but users can narrow visibility
- Apple Health raw samples stay on device by default
- Provider tokens never live in client storage

## Feed Strategy

The first real backend should not build a black-box ranking system. It should build a clear rules-based feed that feels personal without being manipulative.

### Lane model

- `squads`: posts from squads the user belongs to, ranked by active squad first, then recency, then relationship and momentum signals
- `friends`: friend-visible posts outside squad context, ranked by recency plus lightweight relationship signals

### Initial ranking inputs

- lane relevance
- audience match
- recency
- squad proximity
- recent interaction strength
- consistency or streak signal as a tie-breaker, not the primary ranker

## Phase Plan

## Phase 0: Foundation and trust model

### Window

Next 48 to 72 hours

### Outcome

The app has real accounts, a real social graph, real squads, and server-enforced privacy.

### Deliverables

- Supabase project created
- local and hosted environments configured
- auth flow chosen and documented
- database schema for profiles, friendships, squads, memberships, habits, check-ins, reactions, and provider records
- RLS policies for self, friends, and squad visibility
- Hono API and worker service scaffolded
- `pg-boss` queue wired
- account bootstrap and username uniqueness path defined

### Exit criteria

- a user can create an account and persist a profile
- the server can prove whether two people are friends
- the server can prove whether a user belongs to a squad
- posts are no longer trusted just because the client says they are visible

## Phase 1: Private social core

### Window

Next 3 to 4 days after Phase 0

### Outcome

The seeded local app state is replaced by real backend data for the product core.

### Deliverables

- friend request and accept flow
- squad create, invite, join, leave, and active squad selection
- persisted habits and daily completions
- persisted check-ins and attached normalized metrics
- reactions and comment count foundation
- feed queries for `squads` and `friends`
- consistency day facts and rollups recomputed on writes

### Exit criteria

- a real user can sign in on two devices and see the same profile, squads, habits, and posts
- feed contents respect audience rules server-side
- consistency is recomputed from durable facts, not only local state

## Phase 2: Integrations that matter

### Window

Next 3 to 5 days after Phase 1

### Outcome

Apple Health is real on device, and the backend is ready for server-managed providers.

### Deliverables

- mobile upload endpoint for Apple Health normalized summaries and check-in payloads
- provider connection records and sync status UI driven from backend
- Strava OAuth connect, callback, token storage, refresh, webhook validation, and activity normalization
- WHOOP schema and provider contract added, but only turn live if sprint capacity remains and friction is acceptable
- provider sync run logging and retryable failure handling

### Exit criteria

- Apple Health-backed check-ins can persist real summary data
- Strava can connect, sync at least one recent activity shape, and surface connection health
- backend secrets never touch the client

## Phase 3: Personalization and operations

### Window

Immediately after integration stability

### Outcome

The backend is operationally credible and the feed starts feeling alive.

### Deliverables

- feed fanout or materialized read model if needed
- push notification event pipeline
- basic admin logging and rate limiting
- account deletion and provider disconnect cleanup
- export and audit paths for sensitive user data
- invite growth loops and squad join analytics

### Exit criteria

- the feed feels responsive under real usage
- the team can inspect failures
- privacy cleanup works when a user disconnects or deletes an account

## Phase 4: Post-sprint expansion

### Candidates

- Sign in with Apple
- better comments and richer reactions
- more advanced feed ranking
- notification preferences
- moderation tooling
- expanded provider coverage
- deeper WHOOP support if it proves worth the overhead

## First API Surface

- `POST /auth/bootstrap`
- `GET /me`
- `PATCH /me`
- `POST /friends/requests`
- `POST /friends/requests/:id/accept`
- `GET /friends`
- `POST /squads`
- `POST /squads/:id/invites`
- `POST /squads/invites/:token/accept`
- `GET /squads`
- `POST /habits`
- `POST /habits/:id/today/toggle`
- `POST /check-ins`
- `GET /feed?slice=squads`
- `GET /feed?slice=friends`
- `POST /reactions/did-this-too`
- `POST /integrations/apple-health/upload`
- `POST /integrations/strava/connect`
- `GET /integrations/strava/callback`
- `POST /webhooks/strava`
- `POST /integrations/whoop/connect`
- `GET /integrations/whoop/callback`
- `POST /webhooks/whoop`

## Security Requirements

- store provider refresh tokens encrypted at rest
- keep access tokens short-lived
- serialize refresh flows to avoid refresh-token invalidation races
- verify webhook signatures against the raw request body
- never log provider secrets or raw health payloads
- store only the minimum health data required for the product experience
- keep Apple Health read-only in v0.1

## Non-Goals For The Current Sprint

- public discovery
- creator monetization
- machine-learning feed ranking
- microservice decomposition
- storing full raw HealthKit history on the server
- broad provider support beyond Apple Health plus Strava readiness

## Recommended Execution Order

1. Stand up Supabase and the schema.
2. Implement RLS and prove privacy with seed users.
3. Replace `me`, friends, squads, habits, and check-ins with real reads and writes.
4. Add the Hono API and worker for privileged integration flows.
5. Land Apple Health upload plus Strava OAuth.
6. Add WHOOP only after the first three layers are stable.
