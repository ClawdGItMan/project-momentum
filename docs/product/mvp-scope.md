# MVP Scope

> **Updated March 2026** — informed by user research survey (n=26). See [survey results](../research/survey-results-march-2026.md) for full data.

## Prototype Goal

The v0.1 prototype should prove that a social self-improvement app can feel compelling with a narrow but emotionally clear feature set. It is not trying to optimize long-term retention systems yet.

## In Scope For v0.1

### 1. Onboarding questionnaire

- identify focus areas (fitness, mindset, learning — validated by survey: 81%, 46%, 65%)
- learn user goals and favorite improvement categories
- set an initial tone of momentum, accountability, and aspiration
- keep onboarding under 2 minutes (survey: users abandon long setups)

### 2. Profile setup

- create a selectively visible identity for friends and squads, not the public
- choose visible focus pillars
- surface workout activity and a first-class consistency metric derived from check-ins and habit completion, including workouts
- connect Apple Health during setup, with manual fallback only if needed and the profile model ready for Strava and additional health providers

### 3. Selective sharing and social graph

- accepted friends as the first lightweight, trust-based audience layer
- audience controls on posts: `Only me`, `Friends`, or `Specific squad`
- no public feed or public profile visibility at launch
- workouts and habits are friend-visible by default, while all other categories remain selectively shared
- per-category privacy controls (survey: 23% explicit ask, finances/weight default private)
- mutual sharing encouraged — reciprocity is the #1 condition for comfort (38%)
- friends keep the social graph simple, but squads remain the main accountability structure in v0.1

### 4. Squads (private groups)

- private groups of 3–15 people
- squads stay intimate, but are not the only sharing surface
- simple permissions only for v0.1; no admin complexity or subchannels
- larger squads may later need activity summaries or feed grouping, but that should not block v0.1

### 5. Daily check-in (<30 seconds)

- one-tap logging, no mandatory fields (survey: 27% said check-ins feel like a chore)
- auto-pull data from Apple Health by default
- support a visibility selector before posting
- share workouts, recovery, habits, reflections, or small wins
- pair structured metrics with lightweight captioning
- keep manual entry available only as fallback for unsupported or unconnected states

### 6. Social reactions

- short comments (85% — #1 meaningful reaction)
- "I did this too" as a first-class reaction (38% — unique differentiator)
- emoji reactions (46%)
- streak shoutouts (27%)

### 7. Gamification (light touch)

- levels system (52% motivating, only 8% childish — safest mechanic)
- streaks with grace periods / freeze days (never reset to zero)
- no XP at launch (28% said childish)
- no public leaderboards at launch

### 8. Health & fitness tracking

- prioritize health and fitness metrics first (81% demand)
- Apple Health as a required live integration target (62% — covers steps, sleep, workouts, HR)
- Strava as the next-highest-priority provider, with adapter-ready support from day one and live support only if it is clearly low-friction
- architecture should make it easy to add other health sources later without rewriting the product model
- mood / mindset tracking (46–58% demand — key differentiator from pure fitness apps)
- manual logging is fallback support, not the main health-tracking posture
- no assumption that more than one real provider ships in v0.1

## Explicitly Out of Scope For v0.1

- complex XP balancing (survey: XP seen as childish by 28%)
- public ELO systems
- advanced reputation algorithms
- map and local group features
- finance-related tracking (survey: 54% want it but high privacy sensitivity — Phase 2)
- career / business milestones (survey: 23–31% demand — Phase 2)
- public feeds or public profiles
- highly polished creator monetization
- broad life-management tooling
- Whoop / Garmin / MFP integrations as live production-grade connections in v0.1
- complex audience segmentation beyond friends and squads

## Success Criteria

- the prototype communicates the concept clearly within the first session
- users understand why this is different from both Strava and Instagram
- users understand how selective sharing works without confusion
- at least a few target users say they would genuinely use this with friends
- founders end the sprint with higher conviction, not just more features

## Scope Discipline Rules

- if a feature does not strengthen accountability, motivation, or social identity, it should wait
- if a feature requires heavy optimization to feel fair, it probably belongs after v0.1
- if a metric cannot be collected well yet, use manual entry as fallback, but keep Apple Health integration on the critical path
- if a feature adds visibility complexity, keep the audience model simple enough to explain in one sentence
