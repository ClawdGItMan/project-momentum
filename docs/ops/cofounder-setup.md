# Cofounder Setup

## Start Here

This project now runs on one simple rule:

- GitHub is the shared home.
- AI does most of the work.
- Max keeps the real build machine.
- The cofounder works through GitHub from any computer.

If you remember nothing else, remember this:

1. Open or comment on a GitHub issue.
2. Let AI do the work and open a pull request.
3. Review the plain-English summary in GitHub.
4. Max merges after a quick check when needed.

## Who Does What

### Max

- keeps the one real local build setup
- keeps the local `backend/.env`
- runs the occasional iPhone or Apple Health check
- merges approved pull requests into `main`

### Cofounder

- opens new issues in plain English
- comments on priorities, changes, and questions
- reviews pull requests from GitHub without needing local setup
- helps decide what AI should do next

### AI

- reads the issue and the current project docs
- makes the change in a branch
- updates the live project docs when the state really changes
- opens a pull request with a simple summary
- tells you what to review and what might need a build-owner check

## The Simple Workflow

### 1. Ask for work in GitHub

Every new task starts as a GitHub issue using the `AI Task Request` form.

That form asks only:

- `What I want`
- `Why it matters`
- `What must not change`
- `Done when`

### 2. Let AI turn it into a pull request

AI should:

- read the issue
- read the current repo context
- do the work in a branch
- update `heartbeat.md`, `memory.md`, and the decision log if needed
- open a pull request with a plain-English handoff

### 3. Review the pull request in GitHub

The pull request should tell you:

- what changed
- what to check
- what might break
- screenshots or video if useful
- whether it is ready to merge or needs Max to run a build check

### 4. Merge the safe way

Max merges to `main`.

If the pull request touches iPhone build behavior, Apple Health, login, or integrations, Max does a quick build-owner check first.

## What The Cofounder Does Not Need

By default, the cofounder does not need:

- a local clone
- Xcode
- CocoaPods
- API keys
- terminal commands
- branches

The cofounder should be able to work from GitHub on any computer.

## Shared Home

- Repo: `https://github.com/ClawdGItMan/project-momentum`
- Pinned status thread: `Founder Dashboard`
- Daily status automation: `Daily founder brief`

## If You Need More Detail

Use these only when needed:

- `docs/ops/build-owner-checklist.md`
- `docs/ops/collaboration-playbook.md`
