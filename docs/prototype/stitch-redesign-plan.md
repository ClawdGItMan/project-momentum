# Stitch Redesign Plan

## Purpose

Use Google Stitch to redesign Outtcast without reopening the product thesis or replacing the current Expo / React Native architecture. Stitch should accelerate visual exploration, system definition, and screen iteration. The shipped app should still come from the repo's design tokens, reusable primitives, and feature screens.

## Current Status

- Stitch MCP is now reachable from the local Codex environment with the required `X-Goog-Api-Key` header.
- Project creation and prompt-based generation are working against the live Stitch MCP endpoint.
- The first executed redesign pass is onboarding-first, not Home-first.
- Three onboarding variant projects were generated and exported into `output/stitch/onboarding-variants/`.
- The current winner is `variant-a`, the mineral-editorial direction.
- Current MCP quirk: project-level generation and thumbnail export work, but `list_screens` is still not returning usable screen ids for the generated projects. Until that is resolved, the local artifact pack should be treated as the durable reference.

## Guardrails

- keep the v0.1 thesis intact: private social accountability for self-improvement, starting with health and fitness
- preserve the current selective audience model: `Only me`, `Friends`, and `Specific squad`
- redesign mobile-first in Stitch App Mode before thinking about web or marketing surfaces
- improve feel, hierarchy, and desirability before changing MVP scope
- treat exported HTML as a reference artifact, not production app code

## What Stitch Gives Us

Stitch is useful here because it supports the exact loop we need:

- broad-to-specific prompting for getting past the blank page
- App versus Web device modes, with guidance to translate between them instead of merely resizing
- multiple design modes for logic-heavy generation, redesign exploration, and fast sketching
- generated variants so we can explore several visual directions at once
- prototypes for scroll and interaction checks before implementation
- downloadable HTML and screenshots for downstream implementation
- theme extraction from generated HTML
- `DESIGN.md` as a portable design-system artifact that both humans and agents can use
- SDK and MCP access for future automation if we want to formalize the pipeline later

## Source Of Truth

Use this stack of truth so the redesign stays coherent:

1. Product truth: `soul.md`, `memory.md`, `docs/product/*`, `docs/prototype/*`
2. Visual-system truth: root `DESIGN.md`
3. Visual exploration: Stitch project screens, variants, prototypes, and exports
4. Shipped UI truth: `src/design/*`, `src/ui/*`, and `src/features/*`

This means Stitch is the design-generation layer, not the long-term implementation source of truth.

## Recommended Stitch Workflow

### 1. Lock the visual language first

Start each redesign cycle by refining `DESIGN.md`. This keeps generated screens consistent and prevents every screen from becoming its own style experiment.

### 2. Work in App Mode for all primary product surfaces

Generate the core app in Stitch's mobile/App mode. Outtcast is currently an iPhone-first product, and the docs are explicit that App and Web should be translated between modes, not casually resized.

### 3. Use the right design mode for the job

- `Thinking with 3 Pro`: first serious candidate for logic-heavy product screens
- `Redesign (Nano Banana Pro)`: vibe exploration from screenshots of the current app
- `2.5 Pro`: final HTML-quality candidate and A/B comparison pass
- `Fast`: only for rough exploration or a Figma-first sketching pass

### 4. Start with the full onboarding system

The first serious redesign pass should cover the real onboarding flow and the handoff into first check-in:

1. Welcome
2. Goals
3. Pillars
4. Accountability model
5. Identity
6. Connect Apple Health
7. Choose squad
8. Recap
9. First workout check-in handoff

This is the fastest way to prove whether the product feels desirable, selective, and trustworthy before broadening the redesign.

### 5. Generate screen by screen or flow by flow, not all at once

Follow Stitch's own guidance: start broad, then iterate screen by screen with one major change at a time.

Recommended order for Outtcast:

1. Full onboarding flow
2. Core proof loop: Home / Check-in / Profile
3. Trust surfaces: Squads / Account / provider states
4. Habits and secondary support screens

### 6. Use variants intentionally

Use variants at fork points, not on every edit:

- `REIMAGINE` when the layout or vibe is not yet convincing
- `EXPLORE` when the structure is close but not distinctive enough
- `REFINE` when we have a winner and want polish

For Outtcast, the first good variant pass should focus on the full onboarding flow. Once a winner exists there, run the next broad pass on Home, Check-in, and Profile.

### 7. Prototype before coding

Once a candidate screen is close, generate a prototype in Stitch and pressure-test:

- scroll rhythm
- keyboard and text-entry sizing
- dense cards and long names
- tab and segmented-control clarity
- whether the screen still feels premium once interactive states appear

### 8. Export the winning artifacts

For each approved screen, export:

- screenshot image
- HTML
- exported `DESIGN.md`

The screenshot is the visual target. The HTML is a structural and token reference. The exported `DESIGN.md` is the visual-system record.

### 9. Extract theme primitives before rebuilding screens

Do not jump straight from exported screen HTML into feature code. First map the winning design system back into the repo:

- `src/design/tokens.ts`
- `src/design/theme.ts`
- `src/design/typography.ts`

Then update reusable building blocks:

- `src/ui/primitives/Button.tsx`
- `src/ui/primitives/Card.tsx`
- `src/ui/primitives/Surface.tsx`
- `src/ui/primitives/Pill.tsx`
- `src/ui/primitives/Badge.tsx`
- `src/ui/primitives/MetricPill.tsx`
- `src/ui/primitives/SegmentedControl.tsx`
- `src/ui/primitives/TextField.tsx`

Only after the primitives match the new system should we rebuild screen-level features.

### 10. Rebuild screens through the existing app architecture

Map approved Stitch designs into the existing feature files instead of importing raw HTML:

- `src/features/feed/HomeScreen.tsx`
- `src/features/composer/CheckInScreen.tsx`
- `src/features/profile/ProfileScreen.tsx`
- `src/features/connections/ConnectionsScreen.tsx`
- `src/features/account/AccountSettingsScreen.tsx`
- onboarding screen routes in `app/(onboarding)/`

This keeps the redesign compatible with real data, navigation, Apple Health states, and Supabase-backed flows.

### 11. Verify state coverage after every redesigned screen

A Stitch-generated happy path is not enough. Every rebuilt screen still needs:

- loading
- empty
- dense
- error
- disconnected
- stale-data
- keyboard-open text-entry

## Current Winner And Implementation Order

Use this implementation sequence after the onboarding-first Stitch round:

### Phase 1: Onboarding and first action

- tokens and typography
- shared buttons, chips, text fields, progress indicators, and tailored cards
- onboarding screens
- Apple Health trust surfaces used during onboarding
- recap and first-check-in handoff

### Phase 2: Core proof loop

- Home
- Check-in composer
- Profile

### Phase 3: Trust and coordination

- Squads
- Account
- audience selector and metric detail surfaces
- Habits

This sequence keeps the redesign tied to the strongest demo path instead of spreading polish evenly across the whole app.

## Winning Direction Notes

The current winning direction is the mineral-editorial variant (`variant-a`):

- strongest fit for the chosen high-end performance + fashion-editorial thesis
- best balance of belonging, privacy, and proof-first framing
- closest to the desired `curated invitation` tone for onboarding
- strongest color and typography fit for the chosen mineral blue system

Useful ideas to borrow later:

- `variant-b`: restraint and identity elegance
- `variant-c`: stronger ritual energy for the check-in handoff

## Repo Operating Model

### What we should do in Stitch

- explore layout and hierarchy
- test visual directions
- compare variants
- generate prototypes
- extract design tokens and visual references

### What we should do in code

- own navigation and interactions
- own real state handling
- own Apple Health, Supabase, and auth behavior
- own reusable React Native primitives
- own dense, error, and edge-state coverage

## Future Automation Path

Once the visual direction is approved, we can add a small Stitch automation layer in the repo:

1. install `@google/stitch-sdk`
2. add a script that downloads approved screen HTML and images
3. add a token-extraction script that reads the embedded Tailwind config and font links
4. output a normalized artifact pack for React Native implementation

That should be a second step, not the starting point. The first win is getting a clear, system-consistent redesign direction.
