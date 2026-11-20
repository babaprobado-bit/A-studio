# AI Studio daily idea pipeline

## Stages (Europe/Istanbul)

- **00:00 – Generate:** Gemini Free Tier creates 3–5 distinct ideas and writes `docs/IDEA_PIPELINE/generated/YYYY-MM-DD-ideas.json` to the configured feature branch.
- **01:00 – Review:** candidates are checked for value, uniqueness, scope, testability, cost and safety, then marked `READY` or `HOLD`.
- **02:00 – Implement:** each `READY` idea is implemented separately on its own branch and opened as a **Draft PR** targeting the AI Studio feature branch. Nothing is merged.

The workflow uses three separate UTC cron events (21:00, 22:00 and 23:00) rather than keeping a runner alive for two hours. It can also be run manually with `full`, `generate`, `review` or `implement`. A manual `full` run executes all three stages sequentially without waiting for the clock.

## Required setup

1. Add a repository Actions secret named `GEMINI_API_KEY` using a Gemini AI Studio Free Tier API key. The workflow uses `gemini-3.8-flash`; normal quotas apply.
2. In Settings → Actions → General, permit read/write workflow permissions for `GITHUB_TOKEN`. The workflow scopes permissions to contents and pull requests only.
3. Optional Actions variable: `IDEA_PIPELINE_BASE_BRANCH=feature/android-offline-skills-v1`. Do not set this to `main`.

## Safety

Before repository writes, the script verifies PR #2 remains open, Draft and unmerged; its head branch/SHA matches the feature branch; and `main` plus PR #2's base SHA remain at the approved baseline `aab010319b6500002844bd24b11da85dd9ca3b00`. `main` is never a target.

Generated changes are restricted to selected `src/*.js`, `scripts/test-*.mjs` and generated idea notes. Core app entry points, provider lists, AI Team routing, Android/native code, workflows, dependencies, settings and secrets are blocked. Source changes must include regression tests.

**Model-generated code is untrusted.** The pipeline does not execute generated code or automatically dispatch CI. Review each separate Draft PR first, then manually run the Android regression workflow for that branch. Human review and any merge remain manual.

## Scheduling limitation

GitHub's `schedule` trigger only runs when the workflow exists on the repository's default branch. Since PR #2 must remain Draft and `main` must remain untouched, the daily cron is not active while this workflow exists only on the feature branch. `workflow_dispatch` is available for manual runs. Activating the daily cron requires the workflow file to be added to the default branch in a separately approved change. GitHub may also delay scheduled runs, so the three times are targets rather than exact-minute guarantees.
