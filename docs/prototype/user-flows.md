# User Flows

## Flow 0: Account Auth

### Goal

Let founder-alpha users create a real private account, restore sessions on relaunch, and enter onboarding only after authentication succeeds.

### Steps

1. User lands on the auth screen.
2. User signs in with email/password or creates an account.
3. If email confirmation is required, the app shows a confirmation-needed state instead of pretending setup is complete.
4. The app clears any user-scoped local state from the previous account before hydrating the new session.
5. Authenticated users continue into onboarding or the main app based on explicit bootstrap status, with loading and retry states if bootstrap fails.

### Success Outcome

The app has a real account boundary instead of a demo-only identity model.

## Flow 1: Onboarding Questionnaire

### Goal

Understand what the user wants to improve and personalize the app quickly.

### Steps

1. User lands on a bold intro screen explaining the social accountability promise.
2. User selects top improvement pillars and specific goals.
3. User chooses what they want to be known for in the app.
4. User reaches a tailored setup recommendation and a recap before the first check-in.

### Success Outcome

The user feels the app understands them and is not a generic wellness tool.

## Flow 2: Profile Setup

### Goal

Create a visible identity centered on growth, not vanity.

### Steps

1. User picks username and short mission line.
2. User chooses visible focus areas.
3. User connects Apple Health or falls back to manual setup only if needed.
4. User can join the starter squad `Day ones`, pick another live squad they already belong to, or skip.
5. User completes the backend onboarding bootstrap and previews how their profile momentum board and consistency status will look.
6. After recap, a successful onboarding completion routes straight into the first check-in while the rest of the private account state hydrates in the background.

### Success Outcome

The user has a profile that communicates what they are working on and why others should follow them.

## Flow 3: Habit Tracking

### Goal

Let users define personal habits and show consistency over time.

### Steps

1. User creates one to three habits.
2. User sets desired cadence.
3. User logs progress for the day.
4. App updates the user's consistency state based on check-ins and habit completion, including workouts.

### Success Outcome

The user sees immediate evidence that the app can reinforce follow-through.

## Flow 4: Daily Progress Posting

### Goal

Make sharing progress structured, fast, and rewarding.

### Steps

1. User taps a primary post or check-in action.
2. User selects progress type such as workout, recovery, habit win, or reflection.
3. User chooses a source preference such as Auto, Apple Health, Strava, WHOOP, or manual fallback.
4. User attaches synced metrics from the selected provider or manually enters progress if coverage is unavailable.
5. User chooses whether the post is private, friend-visible, or shared to a squad.
6. User adds a short note.
7. App persists the check-in and attached normalized metrics to Supabase.
8. User publishes the update.

### Success Outcome

Posting feels easier and more purposeful than posting on a mainstream social app.

## Flow 5: Feed And Social Interaction

### Goal

Help users see peer momentum and contribute encouragement.

### Steps

1. User opens the feed.
2. User sees structured progress updates from friends or squads.
3. User opens the selected squad card and sees the squad chat preview.
4. User taps into another profile to explore their momentum board.
5. User leaves an encouragement reaction.
6. User adds a friend via exact username, creates their own squad, or accepts a private invite token.
7. From a squad they own, the user invites an existing friend directly into that room.
8. When needed, the sender generates one open squad token from that owned squad and shares it out-of-band with the specific person they want to bring in.

### Success Outcome

The social loop feels useful and motivating, not noisy.

## Flow 6: Squad Chat

### Goal

Give each squad a lightweight real-time room for coordination and encouragement without turning the product into a generic chat app.

### Steps

1. User opens a squad from Home or Squads.
2. App loads only the join-forward message history visible to that member from Supabase and subscribes to realtime inserts.
3. User sends a short text message into the squad room.
4. Other active squad members see the new message live.
5. Unread counts clear when the room is opened and marked read.
6. Optimistic sends reconcile cleanly because the client uses idempotent UUID message ids.

### Success Outcome

Squads feel alive and coordinated, while the feed remains the primary proof surface.

## Flow 7: Account And Apple Health Management

### Goal

Give existing users one reliable place to reconnect Apple Health, review saved sync state, sign out, transfer squad ownership, and delete the account safely.

### Steps

1. User opens Account from Profile.
2. User sees Apple Health, Strava, and WHOOP cards with current state, latest saved summary, latest sync attempt, coverage detail, and any last error.
3. User taps `Connect`, `Refresh`, `Reconnect`, or `Disconnect` from the relevant provider card without replaying onboarding.
4. If a refresh fails, the app keeps the last saved summary visible and labels it as older data rather than pretending it is fresh.
5. If the user owns a multi-member squad, the screen shows transfer actions for active members before deletion can proceed.
6. User can sign out, or reveal the permanent delete flow, type `DELETE`, and remove the account only after ownership blockers are cleared.

### Success Outcome

Existing users can recover Apple Health, switch accounts cleanly, and handle destructive account actions without breaking squad continuity or leaking stale local state.
