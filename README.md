# Project Momentum Founder OS

Project Momentum is the temporary codename for a social self-improvement app designed to make progress visible, social, and culturally aspirational. This workspace now contains both the founder operating system and the first Expo / React Native MVP scaffold for a two-founder, iPhone-first sprint.

## Current Sprint Objective

Over the next two weeks, the goal is to answer one question with conviction: should this become a real company and product? The immediate targets are:

- validate demand with focused research and interviews
- sharpen the product thesis and MVP
- build and verify the first polished prototype slice fast enough to demo proudly
- keep a durable record of decisions, assumptions, and progress

## How To Navigate

Start here if you are new to the workspace:

1. Read [soul.md](soul.md) for the mission and brand north star.
2. Read [heartbeat.md](heartbeat.md) for the live status.
3. Read [memory.md](memory.md) for durable context and decisions.
4. Read [docs/ops/sprint-01.md](docs/ops/sprint-01.md) for the current sprint plan.
5. Read [docs/ops/mvp-foundation.md](docs/ops/mvp-foundation.md) for the current build foundation.
6. For app work, inspect `app/`, `src/`, and `ios/` after reading the docs.
7. Open the relevant product, research, or prototype docs based on the task.

## App Scaffold

The repo now includes a real Expo Router app shell:

- `app/`: onboarding routes, authenticated tabs, and modal routes
- `src/design`: semantic tokens, typography, motion, and theme
- `src/ui/primitives`: shared React Native building blocks
- `src/features`: onboarding, feed, composer, profile, habits, and connections
- `src/domain` and `src/data`: consistency logic, provider adapters, fixtures, and repositories
- `ios/`: generated iOS native project from `expo prebuild` with HealthKit entitlement wiring

Run the app with:

- `npm install`
- `npm run typecheck`
- `npm start`
- `npm run ios`
- `npm run ios:xcode`

For a practical demo handoff, use [docs/ops/demo-runbook.md](docs/ops/demo-runbook.md).

For a practical cofounder handoff and collaboration setup, use [docs/ops/cofounder-setup.md](docs/ops/cofounder-setup.md).

## Workspace Map

### Root docs

- [AGENTS.md](AGENTS.md): operating instructions for any agent working in this repo
- [heartbeat.md](heartbeat.md): live execution dashboard
- [soul.md](soul.md): mission, tone, and product north star
- [memory.md](memory.md): durable facts, decisions, assumptions, and open questions

### Product

- [docs/product/vision.md](docs/product/vision.md): end-state product vision and principles
- [docs/product/mvp-scope.md](docs/product/mvp-scope.md): v0.1 scope and non-goals
- [docs/product/personas.md](docs/product/personas.md): target users and early adopters
- [docs/product/positioning.md](docs/product/positioning.md): category framing and messaging
- [docs/product/shareable-description.md](docs/product/shareable-description.md): concise external description and vision blurb

### Research

- [docs/research/competitors.md](docs/research/competitors.md): current alternatives and market signals
- [docs/research/gamification.md](docs/research/gamification.md): reward systems and behavior design
- [docs/research/social-mechanics.md](docs/research/social-mechanics.md): feed, connection, and engagement principles
- [docs/research/interview-plan.md](docs/research/interview-plan.md): who to interview and what to ask
- [docs/research/interview-log.md](docs/research/interview-log.md): ongoing interview notes and takeaways

### Prototype

- [docs/prototype/prototype-brief.md](docs/prototype/prototype-brief.md): what the first prototype must prove
- [docs/prototype/user-flows.md](docs/prototype/user-flows.md): critical user journeys
- [docs/prototype/screen-map.md](docs/prototype/screen-map.md): app structure and screen inventory
- [docs/prototype/expo-tech-plan.md](docs/prototype/expo-tech-plan.md): recommended prototype architecture
- [docs/prototype/content-and-copy.md](docs/prototype/content-and-copy.md): onboarding and in-app voice
- [docs/prototype/design-review-checklist.md](docs/prototype/design-review-checklist.md): UI quality bar for screens and flows

### Operations

- [docs/ops/decision-log.md](docs/ops/decision-log.md): why key choices were made
- [docs/ops/open-questions.md](docs/ops/open-questions.md): unresolved product and build questions
- [docs/ops/sprint-01.md](docs/ops/sprint-01.md): week-one research and validation plan
- [docs/ops/mvp-foundation.md](docs/ops/mvp-foundation.md): current build foundation and guardrails
- [docs/ops/build-session-playbook.md](docs/ops/build-session-playbook.md): how to start a fresh Codex build session well
- [docs/ops/demo-runbook.md](docs/ops/demo-runbook.md): exact steps to demo in web, Xcode, or EAS contexts

### Agent roles

- [agents/orchestrator.md](agents/orchestrator.md)
- [agents/product-researcher.md](agents/product-researcher.md)
- [agents/user-researcher.md](agents/user-researcher.md)
- [agents/prototype-architect.md](agents/prototype-architect.md)
- [agents/product-designer.md](agents/product-designer.md)
- [agents/frontend-engineer.md](agents/frontend-engineer.md)
- [agents/backend-integrations-engineer.md](agents/backend-integrations-engineer.md)
- [agents/qa-performance-engineer.md](agents/qa-performance-engineer.md)
- [agents/growth-strategist.md](agents/growth-strategist.md)

## Default Operating Sequence

Use this order unless there is a strong reason not to:

1. Research the problem, market, and user behavior.
2. Convert findings into explicit product decisions.
3. Update the durable docs before moving into execution.
4. Design the prototype around the latest decisions.
5. Ship code, verify the main states, and record what changed in `heartbeat.md`, `memory.md`, and the decision log.

## Working Rules

- Ask clarifying questions before changing product direction, target user, MVP scope, or core mechanics.
- Make reasonable assumptions for low-risk progress, but log them in [memory.md](memory.md).
- Prefer multiagent workflows for substantial work so research, design, engineering, and prototype planning stay connected.
- Keep every meaningful work session reflected in the live docs.

## Current Focus

The workspace is intentionally biased toward:

- health and fitness as the first wedge into self-improvement
- social accountability over isolated self-tracking
- creator-friendly distribution as a secondary growth lever
- a lean, high-conviction two-week validate-and-build cycle
- one deeply polished vertical slice over many half-finished screens
