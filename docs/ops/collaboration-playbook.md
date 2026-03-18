# AI And Build Owner Reference

## Purpose

This is the background workflow for AI and the Build Owner.

Founders should start with `docs/ops/cofounder-setup.md`.

## Default Roles

- Max is the Build Owner and Merge Owner.
- The cofounder is the Product Reviewer.
- AI is the Operator.

## Main Rule

All work starts as a GitHub issue.

AI should treat the GitHub issue as the source of truth for the task, then use the repo docs to understand product context before making changes.

## AI Output Standard

For each implementation task, AI should:

1. create or use a task branch
2. make the requested change
3. update `heartbeat.md`, `memory.md`, and `docs/ops/decision-log.md` when project state changed
4. open a pull request with a plain-English handoff

Each pull request should include:

- `What changed`
- `What to check`
- `What might break`
- `Screenshots or video`
- `Merge recommendation`

## Merge Safety

Only one code-changing pull request should be merge-ready at a time.

This keeps the shared build stable and keeps founder review simple.

## Native-Risk Changes

A pull request needs Build Owner validation before merge if it touches:

- Apple Health
- iPhone build behavior
- login or auth
- external integrations

For those pull requests, Max should:

1. run `npm run verify`
2. confirm the changed flow works in the simulator or on device when needed
3. merge only after the quick smoke test passes

## Secrets Rule

- Only the Build Owner machine keeps the real local build setup and `backend/.env`.
- The cofounder should not receive local API keys by default.
- Shared secrets belong in one secure password manager item or secure note owned by the founders.

## GitHub Rule

- No one works directly on `main`.
- If GitHub Pro is added later, protect `main`.
- Until then, treat pull requests plus one merge owner as the hard rule.
