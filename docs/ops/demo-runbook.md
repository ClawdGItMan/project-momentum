# Demo Runbook

## Goal

Show the first believable Project Momentum loop:

1. onboarding
2. Apple Health connection posture
3. skippable squad selection
4. first workout check-in
5. seeded Home payoff

## Best Demo Path Right Now

### On a Mac with full Xcode installed

1. Install dependencies:
   - `npm install`
2. Confirm the active developer directory points at full Xcode, not command line tools:
   - `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -version`
3. Refresh the native project if config changed:
   - `npm run prebuild -- --platform ios --no-install`
4. Install pods if needed:
   - `npx pod-install ios`
5. Open the workspace:
   - `npm run ios:xcode`
6. In Xcode:
   - choose a simulator or physical iPhone
   - set a valid signing team if prompted
   - run the `ProjectMomentum` scheme
7. For the fastest verified local path, you can also stay in Terminal:
   - `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npx expo run:ios -d "iPhone 17 Pro" --no-install`
8. Keep Metro running after install; the dev client opens `exp+project-momentum://...` automatically on the booted simulator.
9. If using a physical iPhone, prefer the real Apple Health button first.
10. If the device does not have useful Health samples yet, use manual fallback so the demo still completes cleanly.

### On a machine without Xcode

1. Start the browser demo:
   - `npm run web`
2. Walk onboarding in the browser.
3. On the Apple Health step:
   - use `Preview with seeded metrics` for the happiest path
   - or use `Use manual fallback` to show the fallback posture
4. Complete the first workout check-in and land on Home.
5. Use the `Connections` tab dev-only demo controls if you need to reset or re-stage Health states while iterating.

### With EAS

Use this only on a machine with Expo/EAS credentials configured.

1. Install the CLI if needed:
   - `npm install -g eas-cli`
2. Log in:
   - `eas login`
3. Build a development client for a simulator:
   - `eas build --platform ios --profile ios-simulator`
4. Build an internal device client:
   - `eas build --platform ios --profile development`

## Demo Notes

- The session now persists onboarding and in-app demo progress across reloads.
- Raw Apple Health snapshots are not persisted; published proof and core demo state are.
- `Connections` includes dev-only controls for preview metrics, live Apple Health attempt, manual fallback, and reset.
- `Home`, `Habits`, and `Check-In` are now scroll-safe for denser states and smaller screens.
- The HealthKit request is narrowed to the live-first MVP bundle: workouts, steps, sleep, and active energy.
- The local simulator path has now been verified on `iPhone 17 Pro` with Xcode 26.3 and the Expo development client.

## Known Constraints

- `expo-dev-client` remains in the project for development builds, but the network inspector default is now disabled in `ios/Podfile.properties.json`.
- The generic `momentum://` scheme still exists and should not be used for future sensitive auth or invite callbacks.
- Because the repo path contains a space, keep the shell-quoting fixes in `ios/Podfile` and `ios/ProjectMomentum.xcodeproj/project.pbxproj` intact until the path changes or upstream fixes land.
