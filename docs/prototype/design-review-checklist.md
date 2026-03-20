# Design Review Checklist

## Purpose

Use this checklist before calling major UI work done. Outtcast should feel high-end, performance-led, editorial, and worth spending time in, not merely functional.

## Design System Baseline

- color, type, spacing, radius, border, shadow, and motion tokens exist in a shared source of truth
- components use semantic tokens, not one-off raw values
- typography roles are consistent across screens, especially `Cormorant Garamond` for editorial moments and `Manrope` for technical UI
- repeated interaction patterns are reusable components, not copied local styles
- tonal layering does most of the structural work; heavy divider lines are rare
- proof surfaces feel more tailored than generic social cards

## Screen Quality Bar

Every primary screen should have:

- one clear focal point
- one dominant action
- hierarchy that scans in under three seconds
- a memorable visual moment
- clean spacing rhythm and alignment
- touch targets that feel comfortable on iPhone-sized screens
- an editorial top that resolves into a clearer technical body

## State Coverage

Check all relevant states:

- loading
- empty
- populated
- dense content
- error or disconnected state
- long text and long-name behavior
- text-entry screens keep the active field reachable when the iPhone keyboard is open

## Motion And Feedback

- motion explains state changes instead of decorating them
- main actions have intentional feedback
- sheets, tabs, and transitions feel smooth, restrained, and precise
- check-in completion feels like a soft ceremony without becoming noisy

## Product-Specific Checks

- onboarding feels like a curated invitation and curated interview
- profile feels like a mission-led momentum board, not a plain bio page
- feed cards emphasize tailored proof structure over generic posting
- composer feels like a fast ritual, not a generic form
- squads feel like an inner circle studio, not a chat product
- privacy and visibility settings are understandable at a glance

## Integration UX Checks

- connected, connecting, disconnected, and mocked states are distinct
- provider data looks normalized and trustworthy
- missing provider data does not break the experience
- manual entry is always a believable fallback

## Signoff Questions

- would someone want to open this screen again tomorrow?
- does the screen make progress feel aspirational rather than performative?
- does the UI feel more premium than a rough prototype?
- if this appeared in a demo, would it increase conviction?
- does this screen feel like a private members club for people doing the work?
