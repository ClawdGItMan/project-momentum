# Heartbeat

## Mission Window

March 14 to March 27, 2026: run a two-week founder sprint to validate whether Project Momentum deserves full commitment, then build a strong enough mobile prototype to test conviction.

## Current Phase

Week 1: research plus first MVP build session and demo hardening. The app shell, first vertical slice, and demo operations layer are now in place, and the Xcode simulator path is now running locally through a custom iOS development build.

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

## Blockers

- app name is still a codename, which limits brand testing
- no firsthand user interview data has been logged yet
- competitor analysis is based on existing notes and needs direct app-store/user-feedback validation
- real Apple Health validation still needs a physical iPhone development build; the native bridge is wired, but not yet exercised on device
- the current repo path contains a space, so iOS build scripts need explicit quoting fixes until upstream Expo / React Native or the local path changes
- the second live provider decision after Apple Health is still unresolved; Strava remains adapter-only for now

## Next 48 Hours

- Max: complete initial competitor and gamification research
- Max and co-founder: schedule the first round of interviews, including Mary and other self-improvement-oriented friends
- Max: validate Apple Health connected versus fallback on a physical iPhone now that the local Xcode simulator path is stable
- Max: push the repo to a private remote and have the cofounder clone it into a no-space local path
- Max and co-founder: validate that a fresh clone from GitHub boots cleanly on the cofounder machine
- Max: pressure-test the dev-only demo controls and decide whether any should move or shrink before external demos
- Max: deepen the seeded Home / Profile / Habits shells with stronger motion, milestone treatment, and a denser social payoff
- Max: decide whether the next slice is deeper feed interaction or stronger profile / milestone treatment

## Risks

- building a polished prototype before proving differentiated demand
- copying familiar social mechanics without enough anti-addiction guardrails
- over-scoping gamification too early
- confusing a broad self-improvement vision with an initially winnable wedge
- letting the Apple Health bridge stall long enough that manual fallback or demo preview starts to feel like the real product

## Confidence

High on the current build direction. The repo now has a credible app shell, a repeatable demo path, a locally verified Xcode simulator launch, and passing verification on typecheck, web export, iOS prebuild, and simulator install. Conviction still depends on real device Apple Health validation and stronger user feedback.

## Last Updated

2026-03-17 13:44 EDT
