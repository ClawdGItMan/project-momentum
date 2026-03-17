# Cofounder Setup

## Best Collaboration Setup

The best path is:

1. Put this project in a private GitHub repo.
2. Commit the app source, docs, and the `ios/` native project files.
3. Do not commit `ios/Pods/`, `ios/build/`, or local tool folders.
4. Have each person clone into a path without spaces, for example:
   - `~/Projects/project-momentum`
5. Use feature branches and small PRs instead of both people editing the same branch.

## Why This Setup

- Apple Health and the Expo development-build workflow depend on native iOS files, so the `ios/` project should be shared.
- The current repo path contains a space, which required local shell-script fixes in Xcode build phases.
- Cloning into a no-space path will reduce native build friction for the next person.

## What To Commit

Commit:

- docs
- `app/`
- `src/`
- `assets/`
- `plugins/`
- `package.json`
- `package-lock.json`
- `app.json`
- `ios/Podfile`
- `ios/Podfile.lock`
- `ios/Podfile.properties.json`
- `ios/ProjectMomentum/`
- `ios/ProjectMomentum.xcodeproj/`

Do not commit:

- `node_modules/`
- `.expo/`
- `ios/Pods/`
- `ios/build/`
- `ios/.xcode.env.local`
- `.claude/`
- `.playwright-cli/`
- `.tmp/`

## Cofounder Onboarding

1. Install Xcode.
2. Install Node and npm.
3. Install CocoaPods if needed.
4. Clone the repo into a no-space path.
5. Run:

```bash
cd ~/Projects/project-momentum
npm install
pod install --project-directory=ios
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npx expo run:ios -d "iPhone 17 Pro" --no-install
```

## How To Share Demos Versus Code

- For code collaboration: use the private GitHub repo.
- For quick product demos: use the simulator path or send an internal iOS build later through EAS/TestFlight.
- For real Apple Health validation: use a physical iPhone, not the simulator.

## Recommended Working Agreement

1. One person owns product/UX slices and docs in a branch.
2. One person owns app implementation or integration slices in a branch.
3. Merge to `main` only after the flow runs in simulator.
4. Keep `heartbeat.md`, `memory.md`, and `docs/ops/decision-log.md` updated whenever a real decision or build milestone happens.
