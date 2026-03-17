# Build Session Playbook

## Purpose

Use this document when starting a fresh Codex build session for the MVP. The goal is to create the best possible conditions for fast, high-quality execution without losing the product thesis.

## What The Next Fresh Session Should Do

The next session should not start by debating the product again. It should start by converting the current foundation into a build-ready implementation plan and then begin shipping the app shell.

The first build session should aim to end with:

- a screen-level backlog with acceptance criteria
- an Expo / React Native app scaffold
- a design-system foundation
- the first polished app shell or first core flow underway

## Best Starting Context

Do not dump the entire repo into the model at once. Use the large GPT-5.4 context window strategically by loading the highest-leverage docs first.

### Read first

- `AGENTS.md`
- `soul.md`
- `heartbeat.md`
- `memory.md`
- `docs/ops/mvp-foundation.md`
- `docs/product/mvp-scope.md`
- `docs/prototype/prototype-brief.md`
- `docs/prototype/expo-tech-plan.md`
- `docs/prototype/screen-map.md`
- `docs/prototype/user-flows.md`
- `docs/prototype/design-review-checklist.md`

### Read second if needed

- `docs/product/positioning.md`
- `docs/product/personas.md`
- `docs/ops/open-questions.md`
- `docs/research/social-mechanics.md`
- `docs/research/gamification.md`

### Do not lead with

- long raw research unless the task is research-shaped
- every historical note in the repo
- broad competitor docs before the build backlog exists

## How To Use The 1M GPT-5.4 Context Well

- Use the large context window for continuity, not for dumping every file blindly.
- Start with the core docs above, then let the main agent pull in additional files as implementation needs arise.
- Ask the main agent to summarize the active product and build constraints before coding.
- Keep one durable build thread if possible so the model retains architecture and UI decisions.
- Avoid repeatedly pasting the same context into multiple fresh prompts once the repo files already contain it.

## Recommended Session Structure

### Phase 1: lock the implementation brief

Ask the main agent to:

- restate the product foundation in implementation terms
- identify the first five build flows
- define the initial data model and component architecture
- turn the MVP into a screen-level backlog with acceptance criteria

### Phase 2: scaffold the app

Ask the main agent to:

- create the Expo app structure
- add routing, app shell, tabs, and base navigation
- create theme or design tokens
- create reusable UI primitives
- set up mock data, types, and adapter placeholders
- choose a development-build workflow early if Apple Health or another native dependency requires custom native code or config

### Phase 3: ship the first polished flows

Recommended order:

1. onboarding and Apple Health connection surface
2. profile and consistency surfaces
3. post or check-in composer with visibility selector
4. feed with friends and squads segmentation
5. habits and consistency updates

### Phase 4: integration realism

- Apple Health should be treated as required for v0.1
- manual entry should exist only as fallback
- Strava should remain adapter-ready unless it is clearly easy to add live
- if the chosen Apple Health path requires native modules or native config, do not optimize around Expo Go; optimize around a development build instead

### Phase 5: QA and polish

- review all major states
- test navigation and mobile layout behavior
- verify consistency treatment
- verify visual hierarchy, motion, and premium-fitness feel

## Recommended Multi-Agent Setup

Use sub-agents generously for implementation-shaped work.

### Default build workflow

1. `orchestrator`
2. `product-designer`
3. `prototype-architect`
4. `frontend-engineer`
5. `backend-integrations-engineer`
6. `qa-performance-engineer`

### Practical use

- keep the main agent as `orchestrator`
- use `product-designer` and `prototype-architect` early to turn the docs into a screen-level build plan
- use `frontend-engineer` to own UI and component implementation
- use `backend-integrations-engineer` to own Apple Health integration shape, data contracts, and adapter structure
- use `qa-performance-engineer` before calling any major flow done

### Good moments to parallelize

- while the main agent is defining the build backlog, have a design-focused sub-agent draft the design-system plan
- while UI scaffolding is underway, have an integration-focused sub-agent define Apple Health and provider adapter structure
- while a core flow is being built, have a QA sub-agent prepare the state coverage and verification checklist

## The First Session Should Not Overreach

Avoid trying to finish the entire MVP in one giant burst. The best first session is the one that creates a strong base for the next sessions.

Do not try to:

- build every screen before the design system exists
- wire multiple live integrations at once
- overdesign gamification before consistency is clear
- introduce public social mechanics
- build broad creator features before the core accountability loop feels strong

## Recommended First Build Session Prompt

Use something close to this in the fresh Codex session:

```text
Read AGENTS.md, soul.md, heartbeat.md, memory.md, docs/ops/mvp-foundation.md, docs/product/mvp-scope.md, docs/prototype/prototype-brief.md, docs/prototype/expo-tech-plan.md, docs/prototype/screen-map.md, docs/prototype/user-flows.md, and docs/prototype/design-review-checklist.md.

Then do the following using multi-agent workflows generously:

1. Restate the implementation constraints and acceptance criteria for the MVP.
2. Create a screen-level build backlog with priorities and dependencies.
3. Scaffold the Expo / React Native app with a design-system-first structure.
4. Set up routing, theme tokens, reusable primitives, mock data, and adapter placeholders.
5. Start building the highest-priority polished flow.

Important constraints:
- v0.1 is friends + squads, with squads as the main accountability surface
- workouts and habits are default friend-visible
- consistency is a first-class metric tied to check-ins and habit completion, including workouts
- Apple Health is required for v0.1, with manual entry only as fallback
- Strava is adapter-ready and only goes live if clearly low-friction
- the visual direction is premium fitness: clean, restrained, high-quality, with a few strong animations

Before coding, tell me the exact plan and agent handoffs. Then execute end-to-end and update the live docs as you go.
```

## What Success Looks Like After That Session

- the repo has actual app code
- the design system exists
- the first screens are structurally correct
- Apple Health has a clear technical path
- the team can see how the MVP will get finished rather than just imagined
