# Screen Map

## Primary Navigation

- Home / Feed
- Post / Check-In
- Habits
- Profile
- Connections

## Auth Screens

- Sign in
- Create account
- Email confirmation-required state
- Signed-out route gate before onboarding or app tabs

## Onboarding Screens

1. Welcome / thesis
2. Goal selection
3. Focus pillars
4. Share preference and accountability prompt
5. Profile basics
6. Apple Health connection with manual fallback
7. Squad choice with live memberships only, skippable if none yet
8. Onboarding recap

## Core Authenticated Screens

### Home / Feed

- daily progress cards
- filter or segmentation for friends and squads
- encouragement actions
- quick view of recent momentum
- selected squad chat preview and entry point

### Post / Check-In Composer

- choose post type
- attach metrics or manual progress
- choose visibility: only me, friends, or squad
- add caption or reflection
- publish preview

### Habits

- list of habits
- daily completion state
- consistency summary

### Profile

- user mission line
- focus pillars
- consistency status
- recent posts
- visible momentum stats
- badge or milestone area
- selected audience and privacy cues

### Connections

- friends
- squads and squad invites
- exact-username friend invite
- create-your-own-squad flow
- owned-squad invite surface for existing friends
- generated friend and squad invite tokens as fallback handoff
- squad creation
- invite token acceptance
- provider connection and refresh controls
- squad chat entry points from squad rows

### Squad Chat

- one real-time room per squad
- text-only messages
- unread counts and last-message preview
- join-forward history rule
- entry from selected squad on Home and from squad rows in Connections

## Supporting Screens

- metric detail modal
- consistency detail modal
- onboarding recap
- notification or encouragement inbox concept
- integration detail screen
- privacy and audience selector sheet
- squad chat screen

## Screen Priority

Build priority should be:

1. onboarding
2. auth and onboarding persistence
3. post flow
4. feed
5. connections plus squad chat
6. habits
7. profile
