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
11. For local phone testing, prefer `EXPO_PUBLIC_BACKEND_URL=auto` in `.env` so the dev build follows the current Metro host instead of a stale LAN IP.

### Untethered founder build on a paired iPhone

1. Use the Release configuration so the app bundles JavaScript instead of depending on Metro:
   - `DEVELOPER_DIR=/Users/me/Downloads/Xcode.app/Contents/Developer EXPO_PUBLIC_BACKEND_URL=disabled npx expo run:ios -d "iPhone" --configuration Release --no-bundler`
2. If iOS says the developer is not trusted after a clean reinstall, trust the developer app once in `Settings -> General -> VPN & Device Management`, then return to the home screen.
3. Launch the installed app directly from the iPhone home screen after the install finishes.
4. Expect the core Supabase-backed app to work away from the Mac.
5. Expect Strava / WHOOP connect-refresh-disconnect plus delete-account to stay unavailable until `EXPO_PUBLIC_BACKEND_URL` points at a hosted backend instead of the local laptop service.

### On a machine without Xcode

1. Start the browser demo:
   - `npm run web`
2. Walk onboarding in the browser.
3. On the Apple Health step:
   - use `Preview with seeded metrics` for the happiest path
   - or use `Use manual fallback` to show the fallback posture
4. Complete the first workout check-in and land on Home.
5. Use the `Squads` tab health controls if you need to refresh Apple Health or switch into manual fallback while iterating.

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
5. Build an untethered internal founder build:
   - `npx eas-cli@latest build --platform ios --profile preview`

## Demo Notes

- The session now persists onboarding and in-app demo progress across reloads.
- Raw Apple Health snapshots are not persisted; published proof and core demo state are.
- `Squads` includes the main in-app Apple Health refresh and manual fallback controls, while the hidden dev tools still cover preview metrics, reset, and session restaging.
- `Home`, `Habits`, and `Check-In` are now scroll-safe for denser states and smaller screens.
- The HealthKit request is narrowed to the live-first MVP bundle: workouts, steps, sleep, and active energy.
- The local simulator path has now been verified on `iPhone 17 Pro` with Xcode 26.3 and the Expo development client.
- The `preview` EAS profile now forces `EXPO_PUBLIC_BACKEND_URL=disabled` so untethered installs do not try `localhost` on the phone when the privileged backend is not publicly hosted yet.
- The Release iPhone path now depends on the `ios/Podfile` EXConstants shell-phase shim so Expo still embeds `EXConstants.bundle/app.config` even though the repo path contains a space.

## Known Constraints

- `expo-dev-client` remains in the project for development builds, but the network inspector default is now disabled in `ios/Podfile.properties.json`.
- The generic `momentum://` scheme still exists and should not be used for future sensitive auth or invite callbacks.
- Because the repo path contains a space, keep the shell-quoting fixes in `ios/Podfile` and `ios/ProjectMomentum.xcodeproj/project.pbxproj` intact until the path changes or upstream fixes land.
- Untethered founder builds currently rely on hosted Supabase only. Privileged backend routes still need a publicly reachable API before delete-account and remote-provider management work away from the Mac.
