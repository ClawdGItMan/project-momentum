# Expo Tech Plan

## Goal

Create a fast-moving mobile prototype that can reach a polished iPhone demo state without committing too early to heavy infrastructure.

## Recommended Stack

- Expo with React Native and TypeScript
- Expo Router for screen structure
- shared design tokens and a reusable component system with cards, chips, progress bars, stat rows, and composer surfaces
- mocked data first, with optional Supabase integration if the sprint needs lightweight auth and persistence

## Prototype Architecture

### App layers

- `app/` routes for onboarding and authenticated tabs
- `components/` for UI primitives and app-specific cards
- `features/` for feed, habits, profile, friends, squads, and posting logic
- `theme/` or `design/` for tokens, typography, motion rules, and semantic styles
- `data/` for mock fixtures, types, and integration adapters

### State approach

- local mocked data for the first visual pass
- simple client-side state for habits and post creation
- only introduce remote persistence once the UX is validated enough to justify it
- build UI states against realistic fixtures before data wiring drives the design

### Integration posture

- support a provider adapter model from day one so Apple Health, Strava, and future health sources fit the same product surface
- treat Apple Health as the required first live integration
- support Strava through adapter-backed or mocked prototype states unless its live value clearly justifies the cost
- keep manual logging available as fallback only when Apple Health data is missing or unsupported
- keep additional real integrations behind later milestones unless they materially strengthen the demo

## Data Model Concepts

- user
- friend relationship
- squad
- audience rule
- focus pillar
- habit
- consistency state
- progress post
- integration provider
- integration connection
- metric snapshot
- normalized metric snapshot
- encouragement reaction

## Technical Priorities

- smooth onboarding and tab navigation
- strong visual hierarchy for progress cards
- realistic mock data for profiles and feed states
- easy theming and copy iteration
- reusable motion and interaction feedback
- explicit support for connected, connecting, disconnected, and mocked integration states
- premium-fitness visual direction with restrained color and intentional animation
- clear consistency modeling across profile, habits, and check-ins

## Risks To Avoid

- spending too much time on backend setup before the interaction model feels strong
- chasing multiple live integrations before the product story is clear
- overengineering gamification state before the UI earns it
- letting data wiring happen before the design system and screen quality bar are established

## Recommendation

Treat the first build as a high-fidelity product prototype with selective realism, a clear adapter surface for health providers, and a frontend quality bar that is enforced early. If the concept hits, the architecture can be hardened after the sprint.
