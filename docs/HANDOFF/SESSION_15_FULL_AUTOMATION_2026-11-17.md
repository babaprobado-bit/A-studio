# Session 15 — Full Social Media Studio automation — 2026-11-17

## Scope
Social Media Studio now has a guided full-production pipeline:
1. The currently selected free/local text model generates an editable content package.
2. AI Studio derives a story prompt and starts the Runway Multi-Shot Video recipe.
3. Runway task status is polled automatically while AI Studio is foregrounded.
4. After the result is ready, the user separately confirms source rights and OpenShorts quota use.
5. AI Studio submits one OpenShorts clipping/captioning job, polls its status and clip list, and stores the completed clips for review.
6. Public publishing/scheduling remains a separate, explicit user-confirmed action.

## Runway Multi-Shot
- API endpoint: POST /v1/recipes/multi_shot_video; recipe version 2026-06; API header version 2024-11-06.
- Auto mode decomposes one story prompt into 3–5 shots. Duration options are 5, 10 or 15 seconds. Audio is enabled for generated scene sound; this is not a spoken rendering of the editable voiceover text.
- Supported 720p ratios: vertical 9:16, horizontal 16:9 and square 1:1.
- Rate: 13 credits per second at 720p, USD $0.01 per credit. Estimates: 5s = 65 credits / $0.65; 10s = 130 credits / $1.30; 15s = 195 credits / $1.95.
- Each billable generation shows its estimate and requires a separate confirmation. Runway account access and billing must be parent/guardian-managed. AI Studio does not buy credits.

## Automation safety and resume
- The stage is persisted before every billable provider submission.
- Ambiguous submission errors move the pipeline to needs_attention. The request is never blindly resubmitted, avoiding duplicate provider jobs and charges.
- Runway and OpenShorts status polling uses bounded retries and backoff. Polling pauses while the app is hidden and resumes when it becomes visible or is reopened. This does not claim Android background execution.
- OpenShorts processing has a separate rights confirmation, quota check and user approval. The processing request is sent once.
- Public publishing and scheduling retain the existing separate confirmation step.
- Queue data stores task metadata and pipeline state only, never the Runway/OpenShorts API keys.

## Verification and limitations
- Regression tests cover the Multi-Shot payload, pricing calculation, story prompt, persisted state normalization, polling limits and safe handling of credentials.
- GitHub Actions workflows syntax-check the automation module and run the existing Social Studio regression suite.
- No live Runway or OpenShorts API call, credit use, generated real video, physical-device test or public social post has been performed.
- Repository: babaprobado-bit/A-studio; branch: feature/android-offline-skills-v1.
- Keep PR #2 open, Draft and unmerged. Do not modify main.