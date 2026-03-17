# AGENTS.md

This repository is the founder operating system and build system for Project Momentum. Its purpose is to help future agents and collaborators research intelligently, make product decisions clearly, and then ship a beautiful mobile app without losing the original vision: make self-improvement feel social, desirable, and culturally cool.

## Prime Directive

Build toward a social app where people visibly improve their lives together. Protect the thesis that progress should be shared, encouraged, and celebrated without turning into manipulative social media sludge.

## Operating Principles

### 1. Ask clarifying questions before major shifts

Do not quietly change any of the following without first checking with the user:

- target audience
- core product wedge
- MVP feature set
- gamification philosophy
- social graph or visibility rules
- squad model or sharing model
- health data sources or integration priorities
- pillars included or excluded from the app
- default tech direction if it affects build speed or launch feasibility
- visual direction if it materially changes the product feel

For smaller tasks, make a reasonable assumption, proceed, and record the assumption in `memory.md`.

### 2. Build, do not just describe

When the task is implementation-shaped, default to producing working artifacts, verification, and doc updates rather than stopping at plans. The goal of this repo is not only to think clearly but to help the team ship.

### 3. Use subagents generously for substantial work

For meaningful work, default to coordinated roles instead of one undifferentiated stream. Subagents are not just for research; they are part of how the product gets built well.

Use multi-agent workflows by default when:

- a task spans product, design, and engineering
- a feature touches UI plus integrations or persistence
- the work is larger than one screen or one service boundary
- a user-facing flow needs design, implementation, and QA
- there is meaningful ambiguity in scope, UX, or architecture

For substantial feature work, the default should be `orchestrator` plus at least two specialists unless the task is truly narrow.

### 4. Frontend quality is a product requirement

Project Momentum will win or lose partly on feel. Treat visual polish, interaction quality, motion, hierarchy, and delight as core product value, not cleanup for later.

Future agents should:

- build reusable primitives before overbuilding screens
- use a coherent design system and token set
- verify empty, loading, error, and dense states
- test whether each main screen feels premium and memorable
- favor a small number of deeply polished flows over many rough ones

### 5. Stage integration realism deliberately

Design the product and architecture so Apple Health, Strava, and other health sources can fit cleanly. Do not assume every provider needs a production-grade live integration in the first sprint. Use mocked or adapter-backed states until a real connection materially improves learning.

### 6. Keep the living docs alive

After every meaningful work session, update the relevant markdown files:

- `heartbeat.md`: current status, next 48 hours, blockers, confidence
- `memory.md`: durable facts, new assumptions, open questions, latest signals
- `docs/ops/decision-log.md`: when a real decision has been made
- `docs/ops/sprint-01.md` or the active sprint doc: when weekly priorities or deliverables change
- the relevant domain doc: product, research, prototype, or ops

Do not leave important reasoning only in chat.

### 7. Prefer insight over filler

Every document should contain real project-specific content. Avoid generic startup language, vague advice, or empty templates.

### 8. Stay thesis-aligned

Project Momentum is not trying to become:

- a general social network
- a finance flex app
- a shame-driven leaderboard
- an addictive infinite-scroll clone
- a pure habit tracker with no social identity

The product should feel aspirational, constructive, and pro-growth.

## Core Role System

Use the role cards in `agents/` and make handoffs explicit.

- `orchestrator`: keeps the work aligned, sequences the next best actions, and closes the loop in the docs
- `product-researcher`: turns market inputs and competitor signals into product implications
- `user-researcher`: gets firsthand user truth and sharpens interview strategy
- `prototype-architect`: decomposes flows, screens, system boundaries, and fake-versus-real choices
- `product-designer`: shapes UX, interaction patterns, visual hierarchy, and design-system direction
- `frontend-engineer`: builds polished Expo / React Native UI, state, navigation, and motion
- `backend-integrations-engineer`: owns persistence, data models, adapter architecture, and external integrations
- `qa-performance-engineer`: verifies edge cases, regressions, responsiveness, and quality before work is called done
- `growth-strategist`: pressure-tests invites, creator dynamics, and early network effects

## Required Workflow

For any substantial task:

1. Read `soul.md`, `heartbeat.md`, and `memory.md`.
2. Read the most relevant scoped docs in `docs/`.
3. Identify whether the task changes direction or simply deepens the current plan.
4. Ask clarifying questions if the task introduces a meaningful directional change.
5. Choose the right subagent roles and make the handoff logic explicit.
6. Define what the task must prove or deliver before editing.
7. Decide what should be mocked, persisted, or integrated live.
8. Complete the work, including key user-visible states.
9. Verify functionality, UX quality, and regressions.
10. Update the live docs before stopping.

## Default Multi-Agent Workflows

### New feature build

1. `orchestrator` frames the task, constraints, and acceptance criteria.
2. `product-designer` defines UX intent, state variations, and visual direction.
3. `prototype-architect` slices the feature into flows, screens, and implementation boundaries.
4. `frontend-engineer` builds the UI and client logic.
5. `backend-integrations-engineer` wires persistence or integrations if needed.
6. `qa-performance-engineer` verifies states, regressions, and responsiveness.
7. `orchestrator` records assumptions and updates docs.

### Integration-heavy feature

1. `orchestrator`
2. `prototype-architect`
3. `backend-integrations-engineer`
4. `frontend-engineer`
5. `qa-performance-engineer`

### Research-informed product change

1. `orchestrator`
2. `product-researcher` or `user-researcher`
3. `product-designer`
4. `prototype-architect`
5. implementation roles as needed

### UI polish pass

1. `orchestrator`
2. `product-designer`
3. `frontend-engineer`
4. `qa-performance-engineer`

## Major Shift Definition

A task counts as a major shift if it changes:

- who the app is for
- what the first prototype must prove
- what counts as MVP
- how users are ranked, rewarded, or socially surfaced
- whether sharing is friend-based, squad-based, public, or hybrid
- which health or habit data sources matter most
- whether live integrations are required versus mocked
- whether the product is mobile-first versus something else
- the visual direction in a way that changes the brand feel
- the go/no-go criteria for the two-week sprint

## Documentation Contracts

Honor these schemas:

- `heartbeat.md`: `Mission Window`, `Current Phase`, `This Week`, `In Flight`, `Blockers`, `Next 48 Hours`, `Risks`, `Confidence`, `Last Updated`
- `memory.md`: `Durable Facts`, `Current Decisions`, `Working Assumptions`, `Open Questions`, `People and Ownership`, `Research Signals`, `Prototype Status`, `Glossary`
- `docs/ops/decision-log.md`: `Date`, `Decision`, `Reason`, `Owner`, `Revisit Trigger`
- agent role cards: `Mission`, `Use When`, `Inputs`, `Outputs`, `Handoff Rules`, `Required Doc Updates`
- research notes and interview entries: end with `Signal`, `Implication`, `Next Step`

When UI quality rules change, also update:

- `docs/prototype/design-review-checklist.md`
- the relevant prototype doc if the screen map, flow, or quality bar changes

## Build Quality Bar

Good work in this repo should:

- reduce ambiguity
- make the next build step easier
- preserve why decisions were made
- strengthen conviction or expose weak spots quickly
- keep the product emotionally compelling, not merely functional
- protect the private, selective, trust-based social model
- make the UI feel intentional, modern, and worth spending time in

For implementation work, future agents should explicitly check:

- acceptance criteria are clear before editing
- design tokens and reusable primitives are used consistently
- loading, empty, dense, and error states exist
- navigation and tap targets feel good on target mobile sizes
- motion and feedback improve clarity instead of adding noise
- integration posture is staged realistically

## Done Means

Work is only done when:

- the requested artifact exists
- the relevant operating docs are updated
- assumptions are visible
- next steps are clear
- key states were verified
- major UI work has passed a visual quality review
- the repo still tells a coherent story from `README.md` alone
