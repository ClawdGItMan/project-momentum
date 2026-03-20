# Stitch Onboarding Variant Review

## Purpose

Record the first real Stitch MCP redesign pass so implementation can move from vague aesthetic discussion to a specific visual direction.

## Artifact Pack

Local artifact path:

- `output/stitch/onboarding-variants/`

Current files:

- `variant-a.png`
- `variant-b.png`
- `variant-c.png`
- `variant-a.design.md`
- `variant-b.design.md`
- `variant-c.design.md`
- `variant-a.project.json`
- `variant-b.project.json`
- `variant-c.project.json`
- `manifest.json`

## Stitch Projects

- `variant-a`: `projects/289691776004504741`
- `variant-b`: `projects/1935926039581444317`
- `variant-c`: `projects/8784021154905013801`

## MCP Status

- Stitch MCP project creation works.
- Prompt-driven generation works.
- Project thumbnails and exported `DESIGN.md`-style theme artifacts can be downloaded.
- Current limitation: `list_screens` is still not returning usable screen ids for the generated projects, so the project-level artifact pack is the current source of truth.

## Variant Summary

### Variant A: Mineral Editorial

Strengths:

- strongest match for the chosen mineral blue palette
- best fit for the `curated invitation` onboarding tone
- best balance of editorial serif presence and technical clarity
- strongest privacy and selective-social framing
- easiest path to translate into a premium, buildable design system

Weaknesses:

- needs slightly stronger ritual payoff in the check-in handoff
- can drift a little soft if the technical body loses enough contrast

### Variant B: Digital Atelier

Strengths:

- elegant identity treatment
- strong restraint and whitespace
- premium, calm editorial posture

Weaknesses:

- too sparse to carry the whole onboarding system alone
- slightly less performance-led than the chosen thesis

### Variant C: Sport-Luxury Precision

Strengths:

- strongest performance energy
- best ritual and activation tension
- strongest technical drive

Weaknesses:

- less aligned with the chosen belonging-led onboarding posture
- drifts more instrument-first than invitation-first

## Winner

Choose `variant-a` as the current implementation winner.

Reason:

- It is the closest overall match to the selected visual direction: high-end performance, light-performance base, mineral blue palette, fashion-editorial energy, proof-first hierarchy, and polished private-social tone.
- It gives onboarding the right emotional posture: premium, selective, and desirable without becoming cold or over-mechanical.
- It is easier to translate into reusable React Native primitives than the more specialized or sparse alternatives.

## Borrowed Notes

Use these ideas from the non-winning variants when rebuilding the app:

- borrow some of `variant-b`'s restraint for identity and text-entry screens
- borrow a little of `variant-c`'s activation energy for recap and first-check-in handoff

## Implementation Order

1. Translate `variant-a` into tokens, typography, buttons, chips, fields, and progress indicators.
2. Rebuild the onboarding flow in code.
3. Rebuild the recap and first-check-in handoff using the same system.
4. Move the winning direction into Home, Check-in, and Profile next.

## Current Implementation Status

- real `Cormorant Garamond + Manrope` font loading is now wired through Expo
- the mineral token set and shared primitives have been updated toward the winner direction
- onboarding no longer relies on chip-heavy utility pickers; the choice steps now use larger editorial slabs that track the Stitch tone more closely
- profile basics is now mission-led instead of form-led, with a stronger identity hero before the technical fields
- Apple Health onboarding is now collapsed into a stronger trust surface plus a secondary coverage/privacy surface instead of three stacked utility cards
- recap is now a custom single-moment handoff screen instead of a standard step shell plus a separate recap card
- the first check-in flow now follows a four-stage ritual (`Move`, `Room`, `Proof`, `Seal`) instead of a long stack of parallel utility panels
- the newest parity pass adds more visible iconography and image-like composition: ambient mineral panels on Welcome, icon-backed editorial slabs across the choice steps, monogram identity/recap stamps, health trust icon badges, and icon-enabled segmented controls inside first check-in

## Latest Verification

- `npm run typecheck`
- `npm run verify`
- `git diff --check`
- `npx expo export --platform web`
- browser check of the new check-in flow through the hidden demo session on the exported web bundle
- exported onboarding routes still redirect behind auth in browser QA, so the latest icon/image pass is currently verified through type/build/export rather than a clean signed-out walkthrough

## Remaining Gaps

- web browser QA for the pure onboarding routes is still awkward because the real route group is auth-gated; static export is clean, but the easiest live browser walkthrough still needs either a signed-in not-yet-onboarded state or a dedicated preview path
- the app still uses abstract ambient editorial panels instead of real stitched photo assets, so a later pass can decide whether true imagery is worth the extra asset and performance complexity
- Home, Profile, Squads, and Account still need the same tighter Stitch-parity pass that onboarding and first check-in just received
