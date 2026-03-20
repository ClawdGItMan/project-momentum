# Screen Map

## Primary Navigation

- Home / Feed
- Post / Check-In
- Habits
- Profile
- Squads

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
7. Squad choice with a featured `Day ones` starter squad plus any live memberships, still skippable
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
- choose source: auto, Apple Health, Strava, WHOOP, or manual fallback
- attach synced metrics or manual progress
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
- account settings entry point

### Account / Settings

- Apple Health, Strava, and WHOOP connection cards
- latest saved summary and latest sync state per provider
- coverage summary, retry path, and disconnect for remote providers
- sign out
- delete account flow with typed confirmation
- owned-squad transfer controls before deletion

### Squads

- squads and squad invites
- selected squad state
- squad chat entry points from squad rows
- exact-username friend invite
- create-your-own-squad flow
- owned-squad invite surface for existing friends
- generated friend and squad invite tokens as fallback handoff
- invite token acceptance
- friends list as supporting private-graph setup

### Squad Chat

- one real-time room per squad
- text-only messages
- unread counts and last-message preview
- join-forward history rule
- entry from selected squad on Home and from squad rows in Squads

## Supporting Screens

- metric detail modal
- consistency detail modal
- onboarding recap
- notification or encouragement inbox concept
- integration detail screen
- privacy and audience selector sheet
- squad chat screen
- account settings screen

## Screen Priority

Build priority should be:

1. onboarding
2. auth and onboarding persistence
3. post flow
4. feed
5. squads plus squad chat
6. account and Apple Health management
7. habits
8. profile
