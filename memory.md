# Memory

## Durable Facts

- Working codename: Project Momentum
- Workspace purpose: founder operating system for research, product definition, prototype planning, and progress tracking
- Team shape: two-founder sprint over roughly two weeks
- Primary product thesis: make self-improvement social and culturally aspirational
- Initial wedge: health and fitness
- Long-term pillars under consideration: health/fitness, work/professional growth, spiritual or mindfulness practices
- Deliberately excluded from v1 positioning: finance
- Prototype target: iPhone-first experience with Expo / React Native as the default direction
- Current state: Expo Router app scaffold now exists at repo root with `app/`, `src/`, generated `ios/`, seeded MVP state, and a locally verified Xcode simulator launch
- Friend sharing and squads are both part of the current product direction for v0.1
- Founder-alpha squad expansion now centers on creating your own squad and inviting existing friends from the squad surface, with open tokens kept as fallback

## Current Decisions

- The first pass is docs-first and prototype-spec-first, not code-first.
- Social accountability is the primary differentiator; integrations and gamification support that core.
- Users should be rewarded relative to their own baseline rather than universal benchmarks.
- Creator distribution is a secondary wedge, not the primary MVP story.
- Living docs should be updated after every meaningful work session.
- Canonical agent instructions live in `AGENTS.md`.
- External-facing shareable messaging now lives in `docs/product/shareable-description.md`.
- The current build stance is selective-by-default, friend-plus-squad, and mocked-data-first until the prototype earns heavier infrastructure.
- The main build foundation artifact now lives in `docs/ops/mvp-foundation.md`.
- The sharing model is now friend-plus-squad for v0.1, with selective visibility replacing squads-only thinking.
- Friend invites and mutual acceptance are the v0.1 social graph model.
- Squad size target for v0.1 planning is now 3 to 15 people.
- The repo now uses a stronger build-first multi-agent framework with explicit design, frontend, backend/integrations, and QA roles.
- Frontend quality and design-system discipline are now explicit product requirements, not optional polish.
- Squads remain the primary accountability structure even though friend sharing exists.
- The product should aim for a premium-fitness visual direction.
- Workouts and habits are the default friend-visible categories.
- Consistency is a first-class metric derived from completing check-ins and staying on top of habits, including workouts.
- Apple Health is a required v0.1 integration, with manual entry as fallback only.
- A fresh-session MVP build playbook now exists in `docs/ops/build-session-playbook.md`.
- The active implementation uses an Expo custom iOS development-build posture instead of Expo Go.
- The first shipped vertical slice is onboarding -> Apple Health connection -> skippable squad step -> first workout check-in -> seeded Home.
- Home opens on `Squads` by default, while the first check-in audience defaults to `Friends` unless launched from a squad context.
- Consistency v0 is now defined as a 7-day `score + label` model with 40% check-ins, 40% habits, and 20% workouts, with the workout share redistributed to habits when fitness is not selected.
- The repo now contains a HealthKit config plugin, an iOS prebuild with HealthKit entitlements, and adapter boundaries for Apple Health, manual entry, and Strava.
- The Apple Health repository now includes a `react-native-health` bridge path plus a seeded preview path for environments where native HealthKit is not available.
- The Apple Health bridge now falls back to `NativeModules.AppleHealthKit`, normalizes native authorization errors into readable strings, and treats real iPhone debugging as the source of truth instead of hiding behind simulator-era copy.
- The app now persists non-sensitive demo session state across reloads, while leaving raw Apple Health snapshots out of persistence.
- Dev-only demo controls now exist so the team can reset the walkthrough and re-stage Health states without changing product direction.
- A dedicated demo runbook now lives in `docs/ops/demo-runbook.md`, and `eas.json` now provides development/internal iOS build profiles.
- The HealthKit request is now narrowed to the MVP read-only bundle: workouts, steps, sleep, and active energy.
- `ios/Podfile.properties.json` now enables `ios.buildReactNativeFromSource` because the current repo path with spaces broke React Native prebuilt artifact validation during CocoaPods install.
- The iOS workspace now includes explicit path-quoting fixes for Expo Constants and the React Native bundle script so Xcode simulator builds work from the current repo path.
- The local Xcode toolchain is now present and verified; the app installs and opens in the `iPhone 17 Pro` simulator through the Expo development client flow.
- The repo handoff path now assumes the real `ios/` project files should be shared in git, while `ios/Pods/`, `ios/build/`, and local Codex/Playwright folders remain ignored.
- A founder-facing collaboration guide now lives in `docs/ops/cofounder-setup.md`.
- A short Build Owner checklist now lives in `docs/ops/build-owner-checklist.md`.
- The private GitHub collaboration remote is now `https://github.com/ClawdGItMan/project-momentum`.
- A dedicated two-person collaboration playbook now lives in `docs/ops/collaboration-playbook.md`.
- The backend plan is now to use Supabase for auth, Postgres, RLS, and optional Realtime, plus a single TypeScript Hono API and worker service for OAuth, webhooks, sync jobs, and other privileged integration flows.
- Apple Health will remain device-first even after the backend exists; the server should receive normalized user-approved summaries and check-in payloads rather than becoming a raw HealthKit sample store.
- Strava and WHOOP are now planned as server-managed providers, with OAuth, encrypted token storage, refresh flows, and webhook ingestion living behind the backend trust boundary.
- The first real account flow should be Supabase email/password plus a single onboarding bootstrap path.
- The mobile app should keep `useMomentumSession()` as its stable facade while backend-backed repositories replace seeded state underneath it.
- The repo now contains a `supabase/` Phase 0 foundation migration with auth mirroring, profile bootstrap, private social tables, RLS, helper RPCs, and read models for feed/profile/squad views.
- The repo now contains a Phase 1 Supabase migration for founder-alpha account flows, Apple Health snapshot persistence, persisted check-ins, and live squad chat.
- The repo now contains a dedicated `backend/` TypeScript package with a Hono API shell, worker shell, env loading, queue wiring, and backend security helpers.
- Backend verification currently includes backend dependency install, backend typecheck, backend build, and runtime instantiation with dummy env values.
- Docker is not available in this environment, so the Supabase migration has not yet been executed against a live local database here.
- The hosted Supabase project for Project Momentum is now `madwefunqkqppamlgzno` in `us-east-2`.
- The Phase 0 Supabase migration has been pushed successfully to the hosted project.
- The local Codex environment is now configured with a Supabase MCP server entry that expects `SUPABASE_ACCESS_TOKEN` as a bearer-token env var.
- A local `backend/.env` now exists for hosted Supabase development, and the Hono API plus worker have been verified against the remote project.
- The current hosted Supabase pooler only connects cleanly from this machine with a local-only `sslmode=no-verify` connection string.
- The repo now has a shared `npm run verify` command plus GitHub-side PR/CI scaffolding for safer parallel work.
- The repo now has an opt-in `.githooks/pre-push` guard, enabled by `npm run setup:hooks`, that blocks direct pushes to `main` in each local clone and runs `npm run verify` before pushes.
- The simplified collaboration model is now AI-first and issue-first: founders work through GitHub issues and pull requests, while Max remains the default Build Owner and Merge Owner.
- The mobile app now uses Supabase auth gating plus direct RLS-aware views and RPCs for onboarding, feed/profile/habit/provider bootstrap, persisted check-ins, and squad chat.
- Founder-alpha connections now include exact-username friend invites, squad creation, and token-based friend or squad invite acceptance directly in the app.
- Founder-alpha Connections now surfaces the raw generated invite tokens for both friend and squad flows because pending-invite inboxes and deep-link polish are deferred until after alpha validation.
- Owned squads are now the primary squad-invite surface in Connections, with direct friend-targeted invite tokens for existing friends and one open-token fallback for broader handoff.
- The onboarding recap now needs to surface backend bootstrap errors explicitly because username conflicts can happen at the final onboarding commit point, not only at auth time.
- Real onboarding should not carry a seeded squad selection; stale local squad ids now get dropped before onboarding completion and before a friends-visible check-in publish.
- Squad chat optimistic sends now use UUID client ids so the mobile client matches the backend idempotency contract for realtime rooms.
- Shared `ScrollScreen` containers now auto-adjust iPhone keyboard insets so auth, onboarding, and other text-entry flows keep fields reachable while typing.
- The shared Xcode project now explicitly declares the HealthKit system capability in addition to the entitlement file so device builds are less likely to drift into a signed-without-HealthKit state.

## Working Assumptions

- Max is the primary workspace operator referenced in the original notes.
- A co-founder or close collaborator is sharing product thinking and interview outreach responsibilities.
- The first prototype should demonstrate clear flows with Apple Health treated as mandatory and manual entry used only when connection or coverage falls short.
- Health metrics sharing, habit tracking, onboarding, profiles, and daily progress posting form the minimum viable prototype surface.
- High conviction after two weeks is required to continue toward full development.
- The first believable experience should emphasize selective trusted audiences over public audience mechanics.
- Apple Health is the required first live integration target.
- Strava should be added live only if it is clearly low-friction during implementation.
- The visual direction should feel premium fitness: clean, high-quality, restrained color, and a few strong animations.
- The seeded preview bridge is acceptable during UI iteration, but the real `react-native-health` bridge should be treated as the intended path and validated on a physical iPhone development build.
- If Apple Health still reports `needs_attention` on a physical iPhone after a rebuild, the next likely blockers are Health permissions, missing HealthKit-capable signing, or limited same-day Health data, not the old simulator-only fallback path.
- `npm` is the local package-manager fallback for this repo because `pnpm` was not available in the current environment.
- This specific environment now has full Xcode installed, so verification can include simulator launch in addition to web export, Expo web runtime, and iOS prebuild.
- For future collaborators, cloning into a path without spaces is the preferred local setup even though the current repo now contains compatibility patches for the spaced path.
- GitHub is now the working collaboration source of truth for the two-founder build loop.
- The first real backend phase should optimize for private social core integrity before advanced personalization or broad provider expansion.
- The first auth path should be Supabase email/password plus a server-backed onboarding bootstrap, with Sign in with Apple deferred until after the private social core is stable.
- The direct mobile path should prefer hosted Supabase views and RPCs over a localhost-only backend dependency whenever the operation does not require privileged server secrets.
- Squad chat is part of Phase 1, but it should remain a private text-only support layer under the feed-first product thesis.
- Existing apps like Strava or WHOOP only affect Phase 1 insofar as their data already lands in Apple Health; there is no live provider-specific sync UX yet.
- The current backend local-dev path should keep secrets in `backend/.env` only; mobile env surfaces must not receive `DATABASE_URL`, service-role keys, session secrets, or provider client secrets.
- The team should treat GitHub branches and PRs as the shared workspace, with `main` reserved for reviewed, passing work.
- Private-repo branch protection is not available on the current GitHub plan, so local hooks and team working agreement are the current enforcement layer.
- By default, only the Build Owner machine should keep the full local build setup and `backend/.env`; the cofounder should not need local setup or secrets.
- The dev/demo preview path should stay available in development, but persisted founder-alpha flows should prefer real Supabase-backed auth, onboarding, check-ins, and chat first.
- Owned squads should invite existing friends first in founder alpha, with raw token sharing kept as the fallback for broader handoff until deeper invite surfaces exist.
- The iPhone keyboard overlap bug should be solved in the shared scroll container first so account creation and adjacent text-entry flows inherit the same behavior instead of relying on one-off screen fixes.

## Open Questions

- What final brand name best captures the product without sounding cheesy or niche?
- How strong does the real on-device Apple Health connection feel compared with the current preview bridge?
- Should Strava stay adapter-backed in v0.1 or become the second live integration after Apple Health?
- Does WHOOP belong in the first live backend wave after Strava, or should the schema support it while the live launch waits until after sprint validation?
- When do we want to expose Sign in with Apple relative to the first backend-connected prototype?
- What founder-alpha invite UX should survive past this phase: raw token paste, generated deep links, or both?
- Do we need a pending-invites inbox before broader alpha, or is generated-token sharing enough for the next round of two-account testing?
- How much squad chat capability should be added before it starts diluting the feed-first thesis?
- Do we want pending invite surfaces in-app next, or is token acceptance plus direct invite send enough for the first founder-alpha round?
- How explicit should “leveling up” be in the first user experience?
- Which next slice will increase conviction fastest after the current vertical slice: deeper feed interaction, stronger profile storytelling, or milestone treatment?
- Should the repo stay in a path with spaces long-term, or should it move to a no-space path once the immediate demo cycle ends?
- Do we want to standardize on the current local Supabase pooler SSL workaround for all collaborators, or should we move to another verified connection path before broader backend adoption?

## People and Ownership

- Max: founder/operator, progress tracking, weekly goals, likely product and build lead
- Co-founder/friend: ideation partner, outreach to creators, user feedback collection
- Mary: prospective interview candidate from the self-improvement target segment
- Creator cohort: small TikTok or wellness creators with roughly 500 to 1000 followers

## Research Signals

- Existing notes suggest strong frustration with current social platforms as escape tools instead of growth tools.
- Lock In appears to validate demand for self-improvement gamification, but its social layer seems weak.
- Users already pay attention to measurable improvement through Strava, Whoop, and similar products.
- Small creators may be underserved by current algorithm-heavy platforms and could become strong early advocates.
- Existing survey data strongly supports close-friends trust and selective sharing, even if the product expands beyond squads-only.

## Prototype Status

- Current phase: Week 1: research plus first MVP build session
- Current phase detail: the first slice is now demo-hardened and Phase 1-connected, with Supabase auth, persisted social data, Apple Health upload plumbing, generated invite-token flows, and live squad chat alongside the demo fallback path
- Apple Health device validation detail: the repo now surfaces native bridge and authorization errors more honestly, but the installed iPhone app must be rebuilt after these native/bridge fixes before live permission testing is meaningful.
- Current backend status: Phase 0 scaffolded in code; the source of truth is now `docs/ops/backend-build-plan.md`
- Current backend remote status: hosted Supabase project linked and schema pushed through Phase 1; local API and worker boot against it, and the mobile app now reads and writes directly against hosted Supabase for founder-alpha flows
- Founder OS setup: in progress
- Product framing: seeded
- External messaging artifact: seeded
- Research system: seeded
- Prototype flows: first vertical slice implemented in app code
- Technical direction: Expo-first prototype plan documented, app shell scaffolded, iOS prebuild regenerated, browser sanity-check captured, local Xcode simulator launch verified, and typecheck / web export / iOS prebuild passing
- MVP foundation: synthesized into a single operating reference for pre-build alignment
- Build operating model: upgraded to a stronger multi-agent framework with design and implementation roles

## Glossary

- baseline-relative progress: rewarding users against their own history instead of a universal leaderboard
- consistency: a first-class measure of whether a user is actively pursuing goals through check-ins and habit completion, including workouts
- founder OS: the operating documentation system used to run the project
- v0.1: the pre-MVP prototype intended to test conviction and user pull, not final product-market fit
- social accountability: visible progress plus encouragement, friend relationships, and shared momentum
