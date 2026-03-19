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
- Max: profile, habits, and squads shells backed by seeded local state
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
- Max: onboarding no longer fakes squad membership with seeded squads; founder-alpha invite/create flows now live in the Squads tab with raw shareable tokens for cross-device testing
- Max: the top-level Squads tab now treats owned squads as the invite surface, so founders can create their own squad, invite existing friends directly, jump into chat, and still fall back to one open squad token when needed
- Max: recap onboarding now clears stale seeded squad selections before bootstrap, so skipping the squad step no longer blocks entry into the first workout check-in
- Max: client-facing Supabase RPCs now have `public` wrapper functions that delegate to `app_private`, and the hosted founder-alpha database has already been patched so onboarding/bootstrap calls resolve correctly from the mobile app
- Max: auth signup now handles confirmation-required accounts cleanly, and onboarding recap now surfaces bootstrap errors like username conflicts instead of failing silently
- Max: the shared `touch_updated_at()` trigger is now defensive enough for the consistency recompute path, and a direct SQL verification confirmed onboarding bootstrap can finish again after the remote patch
- Max: hosted Supabase now has a dedicated `app_private.can_view_squad_membership(...)` helper plus rebuilt `squads`, `squad_memberships`, and `squad_invites` visibility policies, so the old `42P17` infinite-recursion path on `squad_memberships` is removed without widening squad access
- Max: direct hosted verification now covers the Apple Health save-plus-refresh shape too: an authenticated test user can save an `apple-health` snapshot, then read provider state, squad memberships, and squad chat overviews cleanly in the same refresh cycle
- Max: squad chat now uses UUID client message ids so optimistic sends satisfy the Phase 1 idempotent RPC contract
- Max: Apple Health device debugging found a likely `react-native-health` bridge issue on the new RN architecture, so the app now falls back to `NativeModules.AppleHealthKit`, preserves native authorization errors, and shows real device-side diagnostics instead of generic simulator copy
- Max: Apple Health sync now keeps local HealthKit success distinct from backend snapshot-save failures, and the onboarding screen shows the actual backend error instead of generic retry copy
- Max: the shared Xcode project now declares the HealthKit system capability so the target capability state is less likely to drift from the entitlement file on device builds
- Max: shared iPhone text-entry screens now auto-adjust scroll insets for the keyboard so auth and onboarding fields stay reachable during account creation
- Max: visible app copy now uses Outtcast product language, with demo/sample controls moved behind hidden dev-only access instead of normal UI
- Max: onboarding now offers a shared `Day ones` starter squad that users can join during setup instead of landing on an empty squad choice
- Max: full bug-catcher audit tightened the session layer so sign-out clears persisted drafts, demo-visible actions stay local instead of calling authenticated Supabase paths, squad chat no longer hammers the backend in demo mode, and private `Only me` posts stay out of the Friends lane
- Max: workout check-ins now treat completed manual fallback details as publishable proof instead of forcing one more Apple Health sync first, and failed publishes now show the real error text instead of the generic “needs more detail” message
- Max: the renamed `Squads` tab now keeps the legacy `/connections` route hidden from the tab bar, and habit creation now avoids duplicate default titles while surfacing real add errors instead of silently failing

## Blockers

- no firsthand user interview data has been logged yet
- competitor analysis is based on existing notes and needs direct app-store/user-feedback validation
- real Apple Health validation still needs a physical iPhone development build; the native bridge is wired, but not yet exercised on device
- the current repo path contains a space, so iOS build scripts need explicit quoting fixes until upstream Expo / React Native or the local path changes
- the second live provider decision after Apple Health is still unresolved; Strava remains adapter-only for now
- Docker is not installed in this environment, so the local Supabase stack and migration have not yet been exercised end-to-end against a running database
- Supabase pooler TLS verification fails from this local machine unless the backend uses a local-only `sslmode=no-verify` connection string
- real Apple Health validation still needs a physical iPhone run against the hosted backend to confirm upload and same-day snapshot reuse end to end
- Apple Health on-device validation now depends on rebuilding the development app with the new bridge/capability fixes and retesting with a signing team that actually supports HealthKit
- the hosted Supabase migration ledger is still using legacy date-prefix versions, so `supabase db push` is blocked until the migration history is repaired
- multi-device chat behavior, invite acceptance across two real devices, and RLS enforcement still need manual two-account validation
- the real auth/bootstrap route still needs a more explicit loading and failure UX so returning users cannot flash into onboarding or get stranded on a blank transition if bootstrap data fails
- the current backend privacy contract still needs a deliberate pass to confirm `Friends` visibility is truly mutual-friends-only instead of being widened by squad membership rules
- because the hosted migration ledger is still out of sync, the latest RLS fix had to be applied directly to Supabase instead of via `supabase db push`

## Next 48 Hours

- Max: complete initial competitor and gamification research
- Max and co-founder: schedule the first round of interviews, including Mary and other self-improvement-oriented friends
- Max: validate Apple Health connected versus fallback on a physical iPhone now that the local Xcode simulator path is stable
- Max: push the repo to a private remote and have the cofounder clone it into a no-space local path
- Max and co-founder: validate that a fresh clone from GitHub boots cleanly on the cofounder machine
- Max: manually review the Outtcast copy sweep and hidden debug access on device before sharing the app more broadly
- Max: validate the `Day ones` join flow on hosted Supabase so new users can enter a real squad during onboarding
- Max: deepen the seeded Home / Profile / Habits shells with stronger motion, milestone treatment, and a denser social payoff
- Max: decide whether the next slice is deeper feed interaction or stronger profile / milestone treatment
- Max: run the new Supabase schema on a Docker-enabled machine and fix any SQL/runtime gaps
- Max: validate two-account founder-alpha flows: signup, onboarding, friend invite acceptance, squad invite acceptance, persisted feed updates, and live squad chat
- Max and co-founder: validate the owned-squad friend-invite flow plus the open-token fallback end to end so squad expansion feels usable before deeper invite inbox work
- Max: validate Apple Health connected, connected-limited, and manual-fallback publish paths on a physical iPhone against Supabase
- Max: rebuild the iPhone dev build after the Apple Health bridge fix, then verify whether the app now reaches the Health permission sheet and surfaces native errors honestly if signing/permissions still block it
- Max: repair the hosted Supabase migration history so future schema pushes do not require direct SQL patching from the Build Owner machine
- Max: validate the full on-device founder path again after the Apple Health retry: connect Health, finish onboarding, publish the first check-in, and confirm the summary persists into feed/profile state
- Max: hard-reload the iPhone dev build after the new `squad_memberships` RLS fix and verify that Apple Health connect now reaches the post-sync refresh instead of failing with `42P17`
- Max: tighten squad chat unread behavior, optimistic send reconciliation, and dense-room UX after live testing
- Max: pressure-test the signed-in bootstrap path so returning users see a clear loading or recovery state instead of stack flicker
- Max: validate that `Only me`, `Friends`, and squad visibility match the real Supabase read policies before broader founder-alpha sharing
- Max: decide whether to keep the current hosted local-dev pooler SSL workaround or move to a stricter verified connection path before team-wide backend adoption
- Max and co-founder: validate the first GitHub issue -> AI PR -> review -> merge loop against the new founder-friendly workflow
- Max: create and pin the Founder Dashboard issue, then start the daily founder brief automation

## Risks

- building a polished prototype before proving differentiated demand
- copying familiar social mechanics without enough anti-addiction guardrails
- over-scoping gamification too early
- confusing a broad self-improvement vision with an initially winnable wedge
- letting the Apple Health bridge stall long enough that manual fallback or sample health states start to feel like the real product

## Confidence

High on the product and app direction, high on backend foundation direction, and medium-high on founder-alpha runtime readiness. The repo now has real mobile auth, direct Supabase-backed onboarding/profile/feed/provider state, persisted check-ins, generated invite tokens for friend/squad expansion, live squad chat, and a much stabler demo/runtime layer after the bug-catcher audit. The main remaining gap is still live-device and multi-user proof: Apple Health on a real iPhone, invite acceptance across two accounts, bootstrap/loading behavior on real auth sessions, and RLS/chat behavior under actual founder-alpha usage.

## Last Updated

2026-03-19 15:46 EDT
