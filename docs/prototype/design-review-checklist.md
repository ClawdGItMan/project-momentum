# Design Review Checklist

## Purpose

Use this checklist before calling major UI work done. Project Momentum should feel disciplined, modern, interactive, and worth spending time in, not merely functional.

## Design System Baseline

- color, type, spacing, radius, border, shadow, and motion tokens exist in a shared source of truth
- components use semantic tokens, not one-off raw values
- typography roles are consistent across screens
- repeated interaction patterns are reusable components, not copied local styles

## Screen Quality Bar

Every primary screen should have:

- one clear focal point
- one dominant action
- hierarchy that scans in under three seconds
- a memorable visual moment
- clean spacing rhythm and alignment
- touch targets that feel comfortable on iPhone-sized screens

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
- sheets, tabs, and transitions feel smooth and restrained
- check-in completion feels rewarding without becoming noisy

## Product-Specific Checks

- onboarding feels branded and emotionally clear
- profile feels like a momentum board, not a plain bio page
- feed cards emphasize progress structure over generic posting
- composer feels fast, guided, and low-friction
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
