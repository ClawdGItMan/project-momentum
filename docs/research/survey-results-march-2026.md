# User Research Survey Results — March 2026

## Survey Overview

- **Sample:** 26 respondents (friends, family, extended network)
- **Demographics:** 96% aged 18–34, 73% exercise 3+ days/week, 58% male / 38% female / 4% non-binary
- **Method:** Google Form, 24 questions (multi-select, Likert, free-text)
- **Full report:** [Google Docs](https://docs.google.com/document/d/1wXlW4K7TC2fg_cS2dKJkjtjw3RXf-VGO--bKHcD3gkg/edit)
- **Executive brief:** [Google Docs](https://docs.google.com/document/d/1CzaHNL3FUzPq5H152xXXb4uu2WnSC551vB_pLQ-RNQc/edit)

---

## Headline Numbers

| Metric | Value |
|--------|-------|
| Would definitely/probably use the app | **62%** |
| Want fitness tracking | **81%** |
| Want close-friends-only sharing | **85%** |
| Don't share progress anywhere today | **62%** |
| Open to daily check-in | **73%** |
| Already track something daily/weekly | **73%** |

---

## MVP Design Principles (Derived from Data)

These principles should guide every build decision. They are consistent with `docs/product/mvp-scope.md`.

1. **Squad-first, not public-first.** All sharing defaults to private groups of 3–8. No public feed at launch. (85% close-friends-only)
2. **Fitness is the door, lifestyle is the house.** Lead with fitness (81%) but include mood/mindset (46–58%) from day one. Users describe the app as "lifestyle," not "fitness."
3. **Frictionless > feature-rich.** Daily check-in must be <30 seconds. One-tap logging. Auto-pull from Apple Health. No mandatory fields. (27% said check-ins feel like a chore; 23% said quick logging drives daily opens)
4. **Reciprocity is the social engine.** The #1 condition for sharing comfort is knowing others share too (38%). Design squad mechanics that encourage mutual posting, not one-way broadcasting.
5. **Grace over punishment.** Streaks should never reset to zero. Use consistency %, freeze days, or visual indicators that show overall trajectory. Broken streaks cause people to quit entirely.
6. **Sensitive data defaults to private.** Finances, weight, mental health details — always default off and require explicit opt-in per squad.
7. **Onboarding must be fast.** Multiple respondents mentioned abandoning apps with long setup flows. Keep it under 2 minutes.

---

## Feature Demand (Ranked)

| Feature | Demand | MVP Phase |
|---------|--------|-----------|
| Health & fitness tracking | 81% | P0 — Launch |
| Apple Health integration | 62% | P0 — Launch |
| Squads (private groups, 3–8 people) | 85% want close friends | P0 — Launch |
| Daily check-in (<30 sec) | 73% open | P0 — Launch |
| Comments + "I did this too" reactions | 85% + 38% | P0 — Launch |
| Mood / mindset tracking | 46–58% | P0 — Launch |
| Levels system | 52% motivating | P0 — Launch |
| Streaks with grace periods | 40% motivating | P0 — Launch |
| Per-category privacy controls | 23% explicit | P0 — Launch |
| Strava integration | 42% | P1 — Post-Launch |
| Learning & education tracking | 65% | P1 — Post-Launch |
| Financial goal tracking | 54% (high privacy concern) | P2 — Future |
| Career / business milestones | 23–31% | P2 — Future |
| Opt-in squad leaderboards | 48% motivating | P2 — Future |

---

## Profile Metrics Users Want

| Metric | Demand |
|--------|--------|
| Workout streaks | 77% |
| Habit completion rate | 62% |
| Mood / mindset | 58% |
| Sleep score | 50% |
| Career milestones | 46% |
| Steps | 46% |
| Travel goals | 35% |
| Recovery metrics | 31% |
| Financial goals hit | 31% |

---

## Social Dynamics — Key Findings

### Sharing behavior today
- 62% don't share progress anywhere
- 23% share in group chats
- 15% share on Instagram

### Who should see progress
- Close friends: 85%
- Family: 62%
- Workout buddies: 50%
- Everyone: 15%
- Nobody: 12%

### What makes sharing feel safe (coded from free text)
1. **Reciprocity** — "if others share too" (38%)
2. **Small trusted audience** — default to private groups (31%)
3. **Authenticity** — "not performative" (27%)
4. **Granular privacy controls** — choose what to show per-category (23%)
5. **Shared goals** — people on a similar journey (23%)
6. **Positive reinforcement** — encouragement over competition (19%)

### What makes sharing feel cringe
- Performative / highlight-reel vibes
- Bragging / gloating
- Sharing to an audience that doesn't care
- Being the only one sharing (no reciprocity)

---

## Gamification Preferences

| Feature | Motivating | Neutral | Childish | Verdict |
|---------|-----------|---------|----------|---------|
| Levels | 52% | 40% | 8% | **Safe — launch with this** |
| Leaderboards | 48% | 36% | 16% | Opt-in within squads |
| Points | 48% | 36% | 16% | Defer |
| Streaks | 40% | 44% | 16% | Yes, with grace periods |
| Badges | 40% | 48% | 12% | Neutral — defer |
| XP | 24% | 48% | 28% | **Avoid at launch** |

**Critical note:** One respondent explicitly described quitting apps after breaking streaks. Never reset to zero — use consistency % or freeze days.

---

## Integrations (Ranked)

| Integration | Demand |
|-------------|--------|
| Apple Health | 62% |
| Strava | 42% |
| Whoop | 27% |
| MyFitnessPal | 23% |
| Garmin | 19% |
| Sleep apps | 15% |
| Fitbit | 12% |

---

## Meaningful Reactions (Ranked)

| Reaction Type | Demand |
|---------------|--------|
| Short comments | 85% |
| Emoji reactions | 46% |
| "I did this too" | 38% |
| Streak shoutouts | 27% |
| Just knowing they saw it | 19% |

---

## What Would Drive Daily Opens (Coded Themes)

1. Friends actively using it (35%)
2. Quick, frictionless logging (23%)
3. Data insights — sleep, recovery scores (19%)
4. Streaks / consistency tracking (15%)
5. Morning goal reminders (12%)
6. Real community interaction (12%)

---

## Privacy Sensitivities

These categories need **default-private** with explicit opt-in:
- Financial data (most cited)
- Weight / body metrics
- Mental health details
- Relationship status

---

## Competitive Insights

- 65% have never tried or quickly abandoned accountability apps
- Apps mentioned: Whoop, Insight Timer, MyFitnessPal, Garmin, Lose It
- **No respondent named a direct competitor** to Outtcast's positioning
- Top reasons for abandonment: solo experience (no accountability), boring UX, broken streaks causing discouragement

---

## Risks & Mitigations

| Risk | Signal | Mitigation |
|------|--------|------------|
| Cold start | 35% said friends using it is #1 daily driver | Launch with pre-formed squads |
| Check-in fatigue | 27% said it sounds like a chore | Auto-pull from Apple Health, one-tap, no mandatory fields |
| Streak toxicity | Respondent quit after broken streak | Grace periods, freeze days, consistency % |
| Performative drift | 27% flagged cringe culture | No public feed, show effort not results, small groups |
| Limited network | Some users lack friends who care | Future: matched squads by focus area |
| Privacy sensitivity | Finance/weight cited as never-share | Default sensitive categories to private |

---

## Mission Alignment

**Current mission:** "Outtcast is a community for people who are serious about growth. Our mission is to make the pursuit of self-improvement something people are proud to do publicly — and to inspire more people to start."

**Data tension:** 85% want close-friends-only sharing. "Publicly" implies broadcast — the data says users want selective intimacy.

**Proposed revision:** "Outtcast is a community for people who are serious about growth. Our mission is to make self-improvement something people pursue together — with the people who actually care — and to inspire more people to start."

---

## How Users Naturally Describe the App

These are verbatim descriptions from respondents when asked how they'd pitch it to friends:
- "A way to hold each other accountable and see updates on each other"
- "A social media for self-improvement people, creatives, and founders"
- "A lifestyle tracker and social media platform"
- "A personal progression app to motivate one another to be better in all aspects of life"
- "A more lifestyle-oriented app that's more accessible to people not just focused on fitness"

**Pattern:** Nobody said "fitness app." Users naturally describe it as accountability + social + lifestyle.

---

## UX Implications for Build

These are direct build-level takeaways derived from the data, aligned with `docs/product/mvp-scope.md`:

### Onboarding
- Under 2 minutes. One respondent said: "most apps stress me out with getting set up like it takes 15 min just to onboard"
- Ask for focus areas (fitness, mindset, learning) — not exhaustive life categories
- Prompt Apple Health connection immediately (62% want it)
- Invite to or create a Squad as part of onboarding flow

### Daily check-in
- Must feel like <30 seconds of effort
- Auto-populate data from Apple Health where possible (steps, sleep, workout)
- One-tap options for mood/mindset (no long-form journaling required)
- Optional caption — never mandatory
- Show what your squad posted today as context before you check in (drives reciprocity)

### Squad mechanics
- Default group size: 3–8 people
- Each member controls which categories are visible to the squad
- Surface "X people checked in today" to encourage reciprocity
- "I did this too" should be as easy as a single tap — position it alongside comments and emoji

### Profile
- Squad-visible only (not public) at launch
- Default visible: workout streaks (77%), habit completion (62%), mood (58%)
- Default hidden: financial goals, weight, mental health details
- Show consistency % rather than consecutive-day streaks

### Notifications
- Morning reminder of goals for the day (12% asked for this)
- "Your squad is active" nudges when friends post
- Streak freeze warnings rather than post-break shame
- Avoid over-notification — multiple respondents cited daily reminders as annoying

### What NOT to build
- No public feed or discover tab at launch
- No follower counts or public profile views
- No XP system
- No public leaderboards
- No finance tracking until per-squad privacy controls are mature
- No Whoop/Garmin/MFP integrations until post-launch (Apple Health covers the core data)
