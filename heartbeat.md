# Heartbeat

## Mission Window

March 14 to March 27, 2026: run a two-week founder sprint to validate whether Project Momentum deserves full commitment, then build a strong enough mobile prototype to test conviction.

## Current Phase

Week 1 moving into Phase 1 founder-alpha integration: the app now has real Supabase auth gating, direct Supabase onboarding/bootstrap, live private social reads, persisted check-ins, Apple Health snapshot upload plumbing, exact-username friend invites with shareable tokens, owned-squad creation plus friend-targeted or open squad invite tokens, and a real-time squad chat path backed by Supabase Realtime and RLS-aware views/RPCs.

## This Week

- Max: pressure-test the thesis that self-improvement can become socially aspirational
- Max: study competitors, especially Lock In, plus adjacent products like Strava and Whoop
- Max and co-founder: run user interviews with fitness-focused friends and creators
- Max: sharpen the v0.1 scope and prototype flows
- Max: scaffold the Expo / React Native app, establish the design system, and turn the first polished flow into a reliable demo

## In Flight

- Max: founder operating system setup and seeded markdown docs
- Max: initial product positioning and MVP framing
- Max: concise external description and vision language for lightweight sharing
- Max and co-founder: interview planning for early adopters and creators
- Max: Expo Router app shell with onboarding and authenticated tab groups
- Max: semantic tokens, reusable primitives, and premium-fitness visual foundation
- Max: onboarding -> Apple Health -> squad suggestion -> first workout check-in -> seeded Home vertical slice
- Max: adapter-first Apple Health / manual / Strava architecture, `react-native-health` bridge wiring, and iOS prebuild with HealthKit entitlements
- Max: profile, habits, and connections shells backed by seeded local state
- Max: non-sensitive session persistence, dev-only demo controls, and web/Xcode/EAS demo runbook coverage
- Max: narrowed HealthKit read scope, removed unused Health write messaging, and disabled the Expo dev-client network inspector default in iOS pod properties
- Max: local Xcode simulator launch verified on `iPhone 17 Pro`, with native shell-script fixes added for a repo path that contains spaces
- Max: repo handoff cleanup so a cofounder can clone the real iOS project instead of regenerating native state from scratch
- Max: private GitHub collaboration repo is now live at `ClawdGItMan/project-momentum`
- Max: backend architecture plan for real accounts, private squads, persisted feed data, and staged provider integrations
- Max: Phase 0 backend scaffold with Supabase migration, account bootstrap path, RLS, and backend runtime shell
- Max: hosted Supabase project `madwefunqkqppamlgzno` linked and Phase 0 migration applied
- Max: backend local env filled against hosted Supabase, with `/health`, `/ready`, and worker startup verified
- Max: founder collaboration is being simplified into an AI-first GitHub issue -> pull request -> merge workflow with one Build Owner
- Max: Phase 1 founder-alpha migration pushed with squad chat schema, chat views, and Phase 1 RPCs for invites, squad selection, Apple Health snapshots, and persisted check-ins
- Max: mobile app now uses Supabase auth plus direct RPC/view access for onboarding, profile/feed/habit/provider bootstrap, real chat rooms, and persisted check-ins
- Max: onboarding no longer fakes squad membership with seeded squads; founder-alpha invite/create flows now live in Connections with raw shareable tokens for cross-device testing
- Max: Connections now treats owned squads as the invite surface, so founders can create their own squad, invite existing friends directly, and still fall back to one open squad token when needed
- Max: recap onboarding now clears stale seeded squad selections before bootstrap, so skipping the squad step no longer blocks entry into the first workout check-in
- Max: auth signup now handles confirmation-required accounts cleanly, and onboarding recap now surfaces bootstrap errors like username conflicts instead of failing silently
- Max: squad chat now uses UUID client message ids so optimistic sends satisfy the Phase 1 idempotent RPC contract
- Max: Apple Health device debugging found a likely `react-native-health` bridge issue on the new RN architecture, so the app now falls back to `NativeModules.AppleHealthKit`, preserves native authorization errors, and shows real device-side diagnostics instead of generic simulator copy
- Max: the shared Xcode project now declares the HealthKit system capability so the target capability state is less likely to drift from the entitlement file on device builds
- Max: shared iPhone text-entry screens now auto-adjust scroll insets for the keyboard so auth and onboarding fields stay reachable during account creation

## Blockers

- app name is still a codename, which limits brand testing
- no firsthand user interview data has been logged yet
- competitor analysis is based on existing notes and needs direct app-store/user-feedback validation
- real Apple Health validation still needs a physical iPhone development build; the native bridge is wired, but not yet exercised on device
- the current repo path contains a space, so iOS build scripts need explicit quoting fixes until upstream Expo / React Native or the local path changes
- the second live provider decision after Apple Health is still unresolved; Strava remains adapter-only for now
- Docker is not installed in this environment, so the local Supabase stack and migration have not yet been exercised end-to-end against a running database
- Supabase pooler TLS verification fails from this local machine unless the backend uses a local-only `sslmode=no-verify` connection string
- real Apple Health validation still needs a physical iPhone run against the hosted backend to confirm upload and same-day snapshot reuse end to end
- Apple Health on-device validation now depends on rebuilding the development app with the new bridge/capability fixes and retesting with a signing team that actually supports HealthKit
- multi-device chat behavior, invite acceptance across two real devices, and RLS enforcement still need manual two-account validation

## Next 48 Hours

- Max: complete initial competitor and gamification research
- Max and co-founder: schedule the first round of interviews, including Mary and other self-improvement-oriented friends
- Max: validate Apple Health connected versus fallback on a physical iPhone now that the local Xcode simulator path is stable
- Max: push the repo to a private remote and have the cofounder clone it into a no-space local path
- Max and co-founder: validate that a fresh clone from GitHub boots cleanly on the cofounder machine
- Max: pressure-test the dev-only demo controls and decide whether any should move or shrink before external demos
- Max: deepen the seeded Home / Profile / Habits shells with stronger motion, milestone treatment, and a denser social payoff
- Max: decide whether the next slice is deeper feed interaction or stronger profile / milestone treatment
- Max: run the new Supabase schema on a Docker-enabled machine and fix any SQL/runtime gaps
- Max: validate two-account founder-alpha flows: signup, onboarding, friend invite acceptance, squad invite acceptance, persisted feed updates, and live squad chat
- Max and co-founder: validate the owned-squad friend-invite flow plus the open-token fallback end to end so squad expansion feels usable before deeper invite inbox work
- Max: validate Apple Health connected, connected-limited, and manual-fallback publish paths on a physical iPhone against Supabase
- Max: rebuild the iPhone dev build after the Apple Health bridge fix, then verify whether the app now reaches the Health permission sheet and surfaces native errors honestly if signing/permissions still block it
- Max: tighten squad chat unread behavior, optimistic send reconciliation, and dense-room UX after live testing
- Max: decide whether to keep the current hosted local-dev pooler SSL workaround or move to a stricter verified connection path before team-wide backend adoption
- Max and co-founder: validate the first GitHub issue -> AI PR -> review -> merge loop against the new founder-friendly workflow
- Max: create and pin the Founder Dashboard issue, then start the daily founder brief automation

## Risks

- building a polished prototype before proving differentiated demand
- copying familiar social mechanics without enough anti-addiction guardrails
- over-scoping gamification too early
- confusing a broad self-improvement vision with an initially winnable wedge
- letting the Apple Health bridge stall long enough that manual fallback or demo preview starts to feel like the real product

## Confidence

High on the product and app direction, high on backend foundation direction, and medium-high on founder-alpha runtime readiness. The repo now has real mobile auth, direct Supabase-backed onboarding/profile/feed/provider state, persisted check-ins, generated invite tokens for friend/squad expansion, live squad chat, and a much simpler founder collaboration model that should reduce process friction without weakening the build. The main remaining gap is live-device and multi-user proof: Apple Health on a real iPhone, invite acceptance across two accounts, and RLS/chat behavior under actual founder-alpha usage.

## Last Updated

2026-03-18 18:06 EDT
