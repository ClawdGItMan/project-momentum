# Stitch Prompt Pack

## Working Rules

- use Stitch App Mode for all product surfaces
- use root `DESIGN.md` as the visual-system source before generating screens
- start with `Thinking with 3 Pro`
- use `Redesign` mode only when feeding current app screenshots back into Stitch for vibe exploration
- use variants at major fork points, not after every edit
- redesign the real mobile flow, not an abstract concept version
- keep the current product thesis and screen map intact

## Shared Style Block

Paste this at the top of every serious prompt:

```text
Design for Outtcast, a private social self-improvement app where people visibly improve their lives together through trusted friends and small squads. Health and fitness are the first wedge, and Apple Health grounds the product in real proof.

Visual direction:
High-end performance. Light-performance base. Soft luxury mineral contrast. Mineral blue palette. Fashion-editorial energy. Proof-first hierarchy.

Color system:
Pale mineral gray and soft off-white surfaces, deep graphite text, rich cobalt primary accent, steel-teal support accent, and one rare champagne warm accent only for milestones or premium confirmation moments.

Typography:
Use Cormorant Garamond as the signature serif for hero headlines, mission lines, and select editorial moments. Use Manrope for body copy, labels, controls, metrics, cards, and technical UI.

Composition:
Use hero panel plus modular proof architecture. Important screens should begin with an atmospheric editorial top section and resolve into a cleaner technical body. Use tailored evidence cards, not generic social cards.

Interaction:
Precision glide overall, with a little athletic snap on taps and check-in actions. Check-in publish should feel like a soft ceremony, not a loud celebration.

Imagery:
Use imagery mixed sparingly. Favor mineral wash backgrounds and abstract editorial texture, with only occasional tightly cropped performance photography. Images should add atmosphere, never dominate the page.

Controls:
Use confident performance controls, minimal line icons, and a tailored floating dock. Check-in should be a subtle centerpiece in the dock, not a loud floating action button.

Social tone:
Polished supportive. Private-members-club energy, but proof leads everything. Metrics before captions. Social cues should feel warm and restrained, never noisy.

Avoid:
Generic wellness app tropes, creator-social aesthetics, loud gamification, giant avatars, rainbow accents, Discord-like chat density, and image-led layouts.
```

## First Pass: Full Onboarding Flow

### Goal

Generate the full onboarding system first, because it is the fastest path to proving the product feel end to end.

### Prompt

```text
[PASTE SHARED STYLE BLOCK FIRST]

Create the Outtcast onboarding flow as one cohesive mobile system. Preserve the existing product meaning and sequence, but upgrade the design dramatically.

The flow should cover:
1. Welcome
2. Goals
3. Pillars
4. Accountability / sharing model
5. Identity setup
6. Apple Health trust and connection
7. Squad choice
8. Recap
9. Handoff into first workout check-in

Emotional frame:
- curated invitation
- curated interview
- belonging-led, with ambition underneath

Product rules:
- keep selective sharing and trusted-circle language intact
- make Apple Health feel trustworthy, calm, and real
- make the squad step feel like joining an inner circle, not a chat app
- make the recap and first-check-in handoff feel motivating and premium
- keep proof more important than decoration

Do not turn this into a generic onboarding wizard, creator-social setup, or soft-wellness questionnaire.
```

### Variant Prompt

```text
Generate 3 variants of the full onboarding flow. Keep the same flow and product meaning, but vary the visual interpretation of the editorial hero treatment, progress indicators, field treatments, and the first-check-in handoff.
```

## Refinement Pass: Winner Direction

### Goal

Push the strongest onboarding direction into something implementation-worthy.

### Prompt

```text
Keep the current onboarding structure, but refine it into a more coherent premium system.

Push for:
- stronger curated-invitation energy on Welcome
- more elegant chips, fields, and progress indicators
- calmer Apple Health trust surfaces
- a more selective and desirable squad-choice moment
- a recap that feels earned
- a first-check-in handoff that feels like a fast ritual

Make the design more specific, more tailored, and more product-ownable without changing the flow.
```

## Core App Prompt

### Goal

Redesign the main proof loop after onboarding direction is approved.

### Prompt

```text
[PASTE SHARED STYLE BLOCK FIRST]

Design the core Outtcast app screens as one product family:
- Home
- Check-in
- Profile
- Squads
- Habits

Screen personalities:
Home: private members club, led by your momentum, with tailored evidence cards.
Check-in: fast ritual, progressive reveal, soft ceremony at publish.
Profile: momentum board, mission-led hero, structured proof board underneath.
Squads: inner circle studio, selected squad identity, studio roster plus room preview.
Habits: disciplined proof, premium and structured, not checklist software.

Preserve the current product scope. Improve feel, hierarchy, desirability, and trust.
```

## Trust Surfaces Prompt

### Goal

Bring invite, account, and provider-control surfaces into the same design family.

### Prompt

```text
[PASTE SHARED STYLE BLOCK FIRST]

Design the private network and trust-management surfaces for Outtcast:
- friend invites
- squad invites
- account settings
- Apple Health status
- staged Strava / WHOOP states
- ownership transfer
- sign out
- delete-account flow

These screens should feel like a private control surface and invite concierge, not a generic settings app or referral flow.

Make connected, disconnected, limited, stale, and blocked states feel honest, calm, and polished.
```

## Current Working Winner

The current best onboarding direction is the mineral-editorial variant exported to `output/stitch/onboarding-variants/variant-a.*`. Use that as the first implementation reference unless a later pass clearly improves on it.
