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
- The app now persists non-sensitive demo session state across reloads, while leaving raw Apple Health snapshots out of persistence.
- Dev-only demo controls now exist so the team can reset the walkthrough and re-stage Health states without changing product direction.
- A dedicated demo runbook now lives in `docs/ops/demo-runbook.md`, and `eas.json` now provides development/internal iOS build profiles.
- The HealthKit request is now narrowed to the MVP read-only bundle: workouts, steps, sleep, and active energy.
- `ios/Podfile.properties.json` now enables `ios.buildReactNativeFromSource` because the current repo path with spaces broke React Native prebuilt artifact validation during CocoaPods install.
- The iOS workspace now includes explicit path-quoting fixes for Expo Constants and the React Native bundle script so Xcode simulator builds work from the current repo path.
- The local Xcode toolchain is now present and verified; the app installs and opens in the `iPhone 17 Pro` simulator through the Expo development client flow.
- The repo handoff path now assumes the real `ios/` project files should be shared in git, while `ios/Pods/`, `ios/build/`, and local Codex/Playwright folders remain ignored.
- A dedicated cofounder onboarding note now lives in `docs/ops/cofounder-setup.md`.
- The private GitHub collaboration remote is now `https://github.com/ClawdGItMan/project-momentum`.

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
- `npm` is the local package-manager fallback for this repo because `pnpm` was not available in the current environment.
- This specific environment now has full Xcode installed, so verification can include simulator launch in addition to web export, Expo web runtime, and iOS prebuild.
- For future collaborators, cloning into a path without spaces is the preferred local setup even though the current repo now contains compatibility patches for the spaced path.
- GitHub is now the working collaboration source of truth for the two-founder build loop.

## Open Questions

- What final brand name best captures the product without sounding cheesy or niche?
- How strong does the real on-device Apple Health connection feel compared with the current preview bridge?
- Should Strava stay adapter-backed in v0.1 or become the second live integration after Apple Health?
- How explicit should “leveling up” be in the first user experience?
- Which next slice will increase conviction fastest after the current vertical slice: deeper feed interaction, stronger profile storytelling, or milestone treatment?
- Should the repo stay in a path with spaces long-term, or should it move to a no-space path once the immediate demo cycle ends?

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
- Current phase detail: the first slice is now demo-hardened with persistence, dev-only staging controls, and a runbook
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
