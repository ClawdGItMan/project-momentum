# Build Owner Checklist

Use this only if you are Max or whoever owns the real build machine.

## Your Job

- keep the working local clone
- keep the local `backend/.env`
- run the quick checks for risky pull requests
- merge approved work into `main`

## Run This Checklist Before Merging A Native-Risk Pull Request

### Read the pull request summary

Make sure the PR clearly says:

- what changed
- what to check
- what might break
- whether it touches Apple Health, iPhone build behavior, login, or integrations

### Run the repo checks

Run:

```bash
npm run verify
```

### Run the quick flow check if needed

If the PR touches Apple Health, iPhone build behavior, login, or integrations:

1. open the updated flow
2. confirm the changed path works
3. only merge when the changed path behaves correctly

### Keep secrets simple

- Keep `backend/.env` only on the build-owner machine unless another machine truly needs it.
- Do not paste secrets into GitHub issues, GitHub comments, or pull requests.

## If Something Feels Risky

Do not merge.

Ask AI for a smaller follow-up PR or a clearer explanation first.
