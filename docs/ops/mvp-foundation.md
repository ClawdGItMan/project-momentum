# MVP Foundation

## Purpose

This document turns the current research, product thesis, and prototype planning into one build foundation for Project Momentum. It is the working reference for how the app should be built before the team commits to MVP implementation.

## Product Thesis To Protect

- self-improvement should feel social, visible, and aspirational
- the first wedge is health and fitness, not a broad life dashboard
- selective accountability matters more than public performance
- progress should be rewarded relative to personal baseline, not elite comparison
- the app should increase action, not scrolling

## What We Are Actually Building First

Project Momentum v0.1 is a selective-share, iPhone-first social accountability app built around friends and squads. A user joins, sets a growth identity, connects health signals, checks in quickly, chooses who should see the update, and sees trusted people doing the same. The product should feel closer to a trusted progress network than a public content platform. Friends make the social graph simple, but squads remain the core accountability surface.

## Prototype Outcome

The first prototype should prove five things:

1. Users understand the concept in one session.
2. Selective progress sharing feels safer and more motivating than public posting.
3. Daily check-ins feel fast enough to repeat.
4. Profiles communicate momentum, not vanity.
5. The app feels differentiated from Strava, Whoop, and generic social apps while still looking premium enough to demo proudly.

## Recommended Feature Spine

### P0: must exist for the first strong prototype

- onboarding that identifies goals, focus pillars, and accountability preferences
- profile setup with mission line, visible pillars, workout activity, and a first-class consistency signal
- friend connections plus audience controls for `Only me`, `Friends`, or `Specific squad`
- squads of 3 to 15 people with selective sharing by default
- daily check-in flow that supports workouts, habits, recovery, and reflection
- feed of structured progress posts from friends and squad members
- reactions centered on comments and "I did this too"
- light levels and forgiving streaks
- Apple Health as a required live integration for v0.1, with Strava conditional and other providers kept adapter-ready

### P1: include only if the prototype already feels strong

- expanded Apple Health coverage for additional auto-filled metrics
- friend invite flow plus lightweight squad invite flow
- notifications or encouragement inbox
- richer milestone surfaces on profile

### Not now

- public feeds
- public leaderboards
- complex XP economies
- creator monetization
- finance or career tracking
- deep ranking systems
- multiple third-party integrations beyond what helps the demo

## Core User Loop

1. Join because the app promises a better place to grow with friends.
2. Set identity around what you are improving.
3. Complete a fast daily check-in.
4. Choose who should see the update.
5. Receive encouragement or reciprocity.
6. Return because people you care about are also showing up.

If a feature does not strengthen this loop, it should probably wait.

## Product Rules For Build Decisions

- default to private, friend-visible, or squad-visible sharing instead of public-by-default
- keep friends simple and lightweight while making squads the primary accountability container
- make workouts and habits the default friend-visible categories
- make posting structured enough to feel meaningful, but never burdensome
- show effort, consistency, and trajectory before showing status
- use manual entry as a fallback, not the primary health experience
- design every main screen around action and encouragement, not consumption time
- make the UI feel polished enough that the product seems desirable, not just useful
- anchor the visual direction in premium fitness: clean, high-quality, restrained color, and a few strong animations

## Technical Build Stance

### Phase 1: high-fidelity prototype

- Expo + React Native + TypeScript
- Expo Router for onboarding and authenticated tab flows
- shared design tokens, reusable primitives, and a documented frontend quality bar
- mocked fixtures for users, posts, habits, metrics, and squads
- local client state first
- emphasis on visual hierarchy, motion, copy, and demo polish

### Phase 2: selective realism

- optional Supabase for lightweight auth and persistence
- Apple Health as the default live integration target for v0.1
- Strava and other providers supported through a clean adapter surface before they are fully live
- analytics on onboarding completion, check-in completion, and social actions

### Architecture shape

- `app/` for route structure
- `components/` for reusable UI primitives and cards
- `features/` for onboarding, feed, check-ins, habits, profile, friends, and squads
- `data/` for fixtures, types, adapters, and fake services
- a provider adapter model for `integration-provider`, `connection-status`, `metric-source`, and normalized metric snapshots

## Agent Operating Setup

The canonical role system now lives in `AGENTS.md` and `agents/`. The core build loop should combine orchestration, product design, prototype architecture, frontend implementation, integration work, QA, and growth pressure-testing when the task touches the user experience.

## Default Handoff Sequence

1. `orchestrator` frames the question and identifies whether it is directional or executional.
2. `product-researcher` or `user-researcher` sharpens the demand side when needed.
3. `product-designer` and `prototype-architect` shape the UX and build slices.
4. `frontend-engineer` and `backend-integrations-engineer` implement the experience.
5. `qa-performance-engineer` validates quality and regressions.
6. `growth-strategist` pressure-tests whether the experience is invite-worthy.
7. `orchestrator` updates live docs and re-prioritizes the next action.

## Context I Need Before Building

Before any meaningful product or implementation task, I should inherit:

- `soul.md`
- `heartbeat.md`
- `memory.md`
- active sprint doc
- the most relevant product, research, or prototype docs

This keeps the build aligned with the thesis instead of drifting toward generic wellness software.

## Decisions To Lock Before MVP Build

These are the highest-leverage unresolved calls because they affect the first-run experience:

1. Whether Strava should stay adapter-backed in v0.1 or become the second live integration.
2. How consistency should be calculated and visualized in the product.
3. Whether the first invitation story is close friends, creator-led groups, or a hybrid.

## Recommended Immediate Path

1. Keep the current direction: health-first, selective-by-default, friend-plus-squad, iPhone-first.
2. Build the prototype with mocked data and an adapter-ready integration surface before adding backend weight.
3. Treat Apple Health as a hard requirement for v0.1, with manual entry only as fallback and Strava added only if it is clearly low-friction.
4. Make the daily check-in, visibility selector, and trusted feed the center of the experience.
5. Use week-two build time on the five critical flows and frontend quality bar, not on infrastructure sprawl.

## Foundation Test

The foundation is strong enough to move into MVP planning only if the team can still say all of the following:

- this is for people who already want to improve, not everyone
- this is a selective social accountability product, not a public social feed
- this is health-first now, broader lifestyle later
- this is a motivating action loop, not an attention trap
- this prototype exists to test conviction, not to prove every system
