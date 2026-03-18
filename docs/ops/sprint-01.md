# Sprint 01

## Window

March 14 to March 20, 2026

## Sprint Objective

Turn the raw concept into a validated, prioritized, prototype-ready spec. By the end of this sprint, the founders should understand whether the opportunity feels real enough to justify week-two prototype building at full speed.

## Current Phase

Week 1 moving into founder-alpha integration: the first vertical slice is now backed by hosted Supabase auth/data, with persisted check-ins, owned-squad friend invites plus open-token fallback, and live squad chat added on top of the demo-ready shell.

## Desired Outcomes

- operating docs fully seeded and in active use
- competitor research sharpened beyond raw opinions
- first round of user interviews completed or actively scheduled
- prototype brief, flows, and tech direction stable enough to build from
- Expo app shell, design system foundation, and first polished vertical slice demo-ready
- backend foundation plan locked tightly enough to start implementation without reopening the architecture every day
- conviction level clearer than it was at the start of the week

## Workstreams

### Product framing

- refine the app’s core promise
- pressure-test v0.1 scope
- keep health and fitness as the first wedge unless research disproves it

### Research

- deep-dive Lock In and adjacent products
- identify best practices and traps in gamification
- validate user desire for social accountability around progress

### User interviews

- talk to self-improvement-oriented friends
- talk to tracker users
- talk to small creators with authentic wellness or fitness content

### Prototype planning

- define the five must-have flows
- map screens and content
- set Expo-first architecture assumptions
- define the design-system-first frontend quality bar
- upgrade the agent framework from research-heavy to build-ready

### Prototype build

- scaffold the Expo Router app at repo root
- establish tokens, primitives, and local seeded state
- ship onboarding through first workout check-in into seeded Home
- validate iOS prebuild and HealthKit entitlement wiring
- harden the slice for repeatable demos across browser and future Xcode/EAS runs
- lock the backend stack, core schema, privacy model, and integration boundaries before writing server code
- add a simple AI-first founder workflow so two non-technical founders can collaborate without getting pulled into developer setup

## Owners

- Max: docs, scope discipline, prototype plan, progress tracking
- Co-founder: creator outreach, interview support, market perspective

## Deliverables By End Of Sprint

- updated `memory.md`, `heartbeat.md`, and `decision-log.md`
- filled research docs with concrete findings
- first interview notes in `interview-log.md`
- stable prototype brief and screen map
- build-ready `AGENTS.md` and supporting role cards
- working Expo app shell with a credible first vertical slice, demo controls, and runbook
- a concrete backend phase plan covering accounts, squads, feed persistence, and staged provider integrations
- a real Phase 0 backend scaffold in repo with Supabase schema, RLS, and a backend runtime shell
- a hosted Supabase project linked to the repo with the Phase 0 schema applied and local backend health checks passing
- a founder-friendly GitHub issue, PR, and dashboard workflow that lets AI do most of the work
- a Phase 1 founder-alpha mobile path with real auth, backend-backed profile/feed/provider state, persisted check-ins, and live squad chat
- a founder-alpha Connections surface that can send exact-username friend invites, let users create their own squad, invite existing friends into owned squads, generate and display redeemable invite tokens, and accept friend or squad invite tokens without leaving the app
- clearer go/no-go view for week two

## Exit Criteria

- the product story is understandable in one sentence
- the prototype surface is intentionally limited
- at least some target users react positively to the concept
- the founders know what to build next instead of just what sounds exciting
