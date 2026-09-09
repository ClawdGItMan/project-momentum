# Heartbeat

## Mission Window

March 14 to March 27, 2026: run a two-week founder sprint to validate whether Project Momentum deserves full commitment, then build a strong enough mobile prototype to test conviction.

## Current Phase

Week 1 moving into Phase 2 provider expansion and Stitch-driven UI hardening: the founder-alpha app now has explicit bootstrap-status routing, cross-account state reset, a dedicated account/settings hub, real Supabase auth plus private social reads, persisted check-ins, live squad chat, backend-backed delete-account plus ownership-transfer actions, and a new multi-provider runtime for Apple Health, Strava, and WHOOP with account-hub controls, OAuth callback handling, provider sync routes, disconnect paths, and source-aware composer/provenance UI.

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
- Max: a Stitch redesign workflow now exists in repo with a root `DESIGN.md`, a screen prompt pack, and an implementation map back into `src/design`, `src/ui`, and `src/features`
- Max: Stitch MCP auth is now working locally, with three onboarding-first redesign variants exported into `output/stitch/onboarding-variants/` and `variant-a` selected as the current winner
- Max: the winning mineral-editorial direction is now partially translated into code through real font loading, updated tokens, refreshed primitives, a redesigned onboarding shell, and a stronger recap -> first check-in handoff
- Max: the current hardening pass fixed the splash-screen font deadlock path, switched shared screen primitives to `react-native-safe-area-context`, made `Button` accept functional styles safely, and pulled badge/error states closer to the mineral theme
- Max: the closer Stitch-parity pass now rebuilds onboarding choices as editorial slabs, makes profile setup mission-led, collapses Apple Health onboarding into fewer stronger surfaces, and turns first check-in into a four-stage ritual instead of a long utility stack
- Max: reusable composite helpers now exist for ambient mineral editorial panels and thin-line icon badges, so later screen passes can pull in more icons and image-like slabs without duplicating styling
- Max: the latest parity pass adds more visible icons, ambient image-like panels, monogram identity stamps, and icon-led check-in controls so the onboarding flow reads more like the exported Stitch winner and less like text-heavy setup UI
- Max: onboarding -> Apple Health -> squad suggestion -> first workout check-in -> seeded Home vertical slice
- Max: second-pass onboarding tightening so the screens track the exported Stitch composition more closely instead of reading like a generic utility wizard
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
- Max: the new hidden `/account` route now gives existing users one private settings hub for Apple Health state, reconnect/refresh, sign-out, delete account, and ownership transfer instead of replaying onboarding
- Max: backend account deletion now uses a service-role DELETE `/me` path that blocks owners with other active squad members and allows deletion after ownership transfer or when no owned squads remain
- Max: a public `transfer_squad_ownership` RPC now moves squad ownership safely by requiring the current owner plus an active target member, then promoting/demoting membership roles atomically
- Max: auth-user changes now clear user-scoped frontend state immediately, so a brand-new signup can no longer inherit stale onboarding, squad, or Apple Health state from the previous account
- Max: route gating now waits on an explicit bootstrap status with real loading and retry states instead of flashing the wrong stack or dropping authenticated users into blank transitions
- Max: onboarding completion now treats a successful onboarding write as immediately app-ready, pauses auto-bootstrap during the write, and hydrates the rest of account state in the background so recap -> first check-in cannot bounce back into setup from a stale or partial bootstrap read
- Max: the account hub now owns Apple Health reconnect/refresh, ownership-transfer actions, and typed-confirmation delete account instead of hiding health recovery inside the Squads surface
- Max: physical-iPhone account deletion now resolves the backend URL at request time, documents the required Mac LAN host, and has a live backend listener verified on both `127.0.0.1:8787` and `172.18.234.54:8787`
- Max: failed Apple Health refreshes now keep old summaries explicitly historical across Account, Profile, composer, and metric-detail surfaces instead of presenting stale saved values as current live stats
- Max: onboarding readiness now keys off `auth_accounts.onboarding_completed` instead of the mere existence of a blank synced profile row, so fresh accounts should route into setup again
- Max: Apple Health summaries now read day-based steps and active energy, use a longer sleep lookback with merged sleep-session logic, preserve real snapshot windows from Supabase, and keep fresh local reads visible even if backend save retries are still needed
- Max: account deletion now survives the real founder-alpha “Apple Health snapshots + persisted check-ins” shape because the shared consistency refresh functions no-op once `auth.users` has already disappeared during cascade delete
- Max: deleting a solo squad now also safely removes any squad-only posts with it, because `check_ins.squad_id` now cascades with the squad instead of conflicting with the `audience = 'squad'` invariant
- Max: Phase 2 provider runtime is now wired in code with Strava and WHOOP OAuth/connect routes, callback redirects into `momentum://integrations/:provider/callback`, server-side sync/disconnect endpoints, webhook persistence hooks, and queue worker registration
- Max: the mobile session layer now understands provider maps instead of an Apple-Health-only state model, including remote-provider deep-link callback handling, refresh/disconnect actions, and provider-aware check-in source selection
- Max: the Account hub is now the provider control center for Apple Health, Strava, and WHOOP, with live state badges, latest saved summary, latest sync, disconnect for remote providers, and honest historical/local-summary labeling
- Max: the check-in composer now exposes source selection across `Auto`, Apple Health, Strava, WHOOP, and `Manual`, while post previews/feed cards/profile surfaces now preserve lightweight provider provenance instead of flattening everything into generic metrics
- Max: the hosted Supabase project was missing `20260319090000_join_onboarding_squad.sql`, so the onboarding `Join Day ones` CTA failed until the public RPC was applied directly to remote and a PostgREST schema reload was triggered
- Max: a temporary authenticated smoke test against hosted Supabase now confirms `public.join_onboarding_squad(...)` resolves and returns a squad row again
- Max: local device-debug config now supports `EXPO_PUBLIC_BACKEND_URL=auto`, so the dev build can follow Metro's current host automatically instead of relying on a stale LAN IP for backend-backed founder-alpha actions
- Max: the local backend is reverified on both `http://localhost:8787/health` and the current Mac LAN host, with Metro successfully serving the real iOS bundle to the paired device
- Max: physical iPhone installs now work again from the downloaded Xcode 26.4 toolchain after running `xcodebuild -prepareDeviceSupport` for the paired `iPhone 16 Pro Max`, and Metro has already served the real iOS bundle to the device
- Max: the iOS Podfile now patches the bundled `fmt` pod to `gnu++17` with the consteval-heavy paths disabled, which clears the new Xcode 26.4 native compile failure that surfaced right after device support was repaired
- Max: the app now also installs as a standalone Release build on the paired iPhone with `EXPO_PUBLIC_BACKEND_URL=disabled`, so the core Supabase-backed founder flow no longer depends on Metro or a live cable connection after install
- Max: the iOS Podfile now also shims Expo's EXConstants build phase with a no-space `PROJECT_DIR` plus explicit `PROJECT_ROOT`, so Release device builds embed `EXConstants.bundle/app.config` again and no longer die in `expo-linking` at startup under the current spaced repo path

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
- the current backend privacy contract still needs a deliberate pass to confirm `Friends` visibility is truly mutual-friends-only instead of being widened by squad membership rules
- because the hosted migration ledger is still out of sync, the latest RLS fix had to be applied directly to Supabase instead of via `supabase db push`
- the hosted migration ledger still needs cleanup so future schema pushes can flow through the checked-in migration history instead of direct SQL patches
- the hosted migration ledger still does not record `20260319090000_join_onboarding_squad.sql`, even though the function now exists remotely, so migration cleanup still matters before broader schema work
- the new reliability pass still needs live two-account validation on device: fresh signup into onboarding, existing-user Apple Health refresh from Account, ownership transfer, and delete-account recovery
- physical-iPhone delete-account validation still depends on Metro reloading the new env-backed backend URL and on `npm run backend:dev` staying up on the Mac during the test
- Apple Health still needs live physical-iPhone proof after the new day-window and sleep-session fixes, because the bridge now reads different APIs and windows than the previous implementation
- the iPhone still needs one live retest of delete-account after the new consistency-delete guard lands, even though hosted Supabase now reproduces and clears the exact previously failing account shape
- the active global `xcode-select` path on this Mac still points at `/Applications/Xcode.app` (`Xcode 26.3`), so physical-device builds currently rely on `DEVELOPER_DIR=/Users/me/Downloads/Xcode.app/Contents/Developer` until the newer Xcode is moved into place and selected system-wide
- untethered founder builds still do not have a publicly reachable privileged backend, so delete-account plus Strava / WHOOP connect-refresh-disconnect remain unavailable away from the Mac unless `EXPO_PUBLIC_BACKEND_URL` points at a hosted API
- the current untethered iPhone install is still development-signed, so after a clean reinstall the device needs one manual trust approval before SpringBoard will open the icon outside the debugger
- Strava and WHOOP still need real provider credentials, webhook registration, and live-device OAuth validation before Phase 2 can be called production-credible instead of code-complete
- the current backend now has two generations of provider helper files in `backend/src/lib/providers/`; the new `service.ts` path is the active runtime, but the older sync/store modules should be reconciled before a broader team handoff
- multi-provider dedupe and freshness behavior is implemented at the normalized snapshot layer, but still needs a real Apple Health + Strava overlap test and a WHOOP recovery-post test on actual accounts

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
- Max: validate the new signed-in bootstrap path across two real accounts so new users always land in onboarding and returning users stay in the main app without stale state leaks
- Max: validate existing-user Apple Health refresh from Account on a real iPhone, including honest old-summary labeling when a refresh fails
- Max: validate ownership transfer plus typed-confirmation account deletion across a multi-member squad and a solo-owned squad
- Max: restart Metro with the new `EXPO_PUBLIC_BACKEND_URL`, keep the backend dev server alive on the Mac LAN IP, and confirm delete-account succeeds from a physical iPhone instead of failing with a network request error
- Max: move the working Xcode 26.4 app from `~/Downloads` into `/Applications` and switch `xcode-select` over system-wide so the physical-iPhone path no longer depends on a per-command `DEVELOPER_DIR` override
- Max: trust the developer profile on the paired iPhone after the clean reinstall, then open the installed Release app from the home screen and verify the untethered core path works after force-quitting Metro
- Max: decide whether the next untethered step is hosting the privileged backend or logging into Expo for EAS internal-distribution builds that can be reinstalled without a cable
- Max: verify that the new day-based Apple Health summary now matches the Health app more closely for today’s steps, active energy, and the latest main sleep session
- Max: retry delete-account from the physical iPhone against an existing account that already has saved Apple Health snapshots and check-ins, then confirm local sign-out/reset completes cleanly
- Max: validate that `Only me`, `Friends`, and squad visibility match the real Supabase read policies before broader founder-alpha sharing
- Max: decide whether to keep the current hosted local-dev pooler SSL workaround or move to a stricter verified connection path before team-wide backend adoption
- Max and co-founder: validate the first GitHub issue -> AI PR -> review -> merge loop against the new founder-friendly workflow
- Max: create and pin the Founder Dashboard issue, then start the daily founder brief automation
- Max: map the winning Stitch onboarding direction into Expo tokens, typography, buttons, chips, text fields, and progress indicators
- Max: finish the remaining onboarding surface polish so every step, Apple Health state, and squad choice screen feels coherent in the new mineral-editorial system
- Max: deepen the first check-in screen beyond the new hero treatment so the full composer feels like a fast ritual, not a utility form
- Max: do a real device visual QA pass on the new icon-forward onboarding and check-in surfaces, especially slab density, ambient panel contrast, and touch comfort
- Max: move the same design system into Home, Check-in, and Profile after the onboarding-first implementation pass is stable
- Max: add real Strava credentials plus webhook verify token to the backend env, complete a live connect on device, and verify recent activity backfill into Account and Check-in
- Max: add real WHOOP credentials plus webhook secret/verify config, complete a live device connect, and verify recovery plus workout summaries into Account and Check-in
- Max: run a real overlap test where the same workout exists in Apple Health and Strava, then verify the composer defaults to Apple Health while still allowing a distinct Strava event when appropriate

## Risks

- building a polished prototype before proving differentiated demand
- copying familiar social mechanics without enough anti-addiction guardrails
- over-scoping gamification too early
- confusing a broad self-improvement vision with an initially winnable wedge
- letting the Apple Health bridge stall long enough that manual fallback or sample health states start to feel like the real product

## Confidence

High on the product and app direction, high on backend foundation direction, and medium on true Phase 2 readiness. The repo now has real mobile auth, explicit bootstrap-status gating, cross-account session reset, direct Supabase-backed onboarding/profile/feed/provider state, persisted check-ins, live squad chat, a verified delete-account / ownership-transfer slice, and a credible multi-provider architecture in code: Strava/WHOOP backend connect-callback-sync-disconnect routes, provider webhook persistence hooks, provider-aware account management, and source-aware composer/feed/profile surfaces. The onboarding hardening pass now also removes the splash deadlock risk, aligns shared shell primitives with safe-area-context, keeps the mineral editorial theme alive in more utility components, and pushes the onboarding/check-in structure materially closer to the chosen Stitch direction. The main remaining gap is no longer app architecture; it is live provider validation plus the same tighter Stitch parity pass across Home, Profile, Squads, and Account. Phase 2 still needs real Strava and WHOOP credentials, webhook registration, a real Apple Health + Strava overlap test, a live WHOOP recovery posting pass, and cleanup of the older backend provider helper generation before a broader handoff.

## Last Updated

2026-03-23 10:46 EDT
