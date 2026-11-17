# Session 16 — Creator Studio replacement — 2026-11-17

## Product decision
The former Social Media Studio screen is replaced by Creator Studio with three independent formats. Do not combine them:

1. **What If:** the user chooses a variable and interval. Prompt example: What if money doubled every hour? The prompt enforces 1x → 2x → 4x → 8x → 16x progression consistent with the interval and forbids an In My Town setting.
2. **In My Town:** a separate fictional-town story format with its own town name/event. It must not become a What If question and must not use the doubling mechanic. Keep fictional town scenery and recurring characters consistent.
3. **Clips:** a separate tool for creating short clips/captions from a source video. Existing OpenShorts integration remains; it requires a validated HTTPS source, rights confirmation and quota verification.

## UI and behavior
- Existing AI chat screen is now the default opening screen and first bottom navigation tab; Creator is second. The Home screen remains accessible.
- The Creator screen provides three mode tabs. What If and In My Town share the existing script editor and the separately confirmed Runway video generation path, but the prompt builders are format-specific.
- When What If/In My Town video generation completes, the pipeline stops with the video ready for review. It does not automatically start OpenShorts or enter Clips.
- Clips displays only the source-video workflow. The generated AI video can be deliberately sent to Clips from its output action, but this is a user-selected transition.
- Drafts persist creatorMode and mode-specific settings. Queue cards show What If / In My Town / Clips labels.
- Legacy public publish/schedule panel is hidden. There is no Creator UI action that publicly posts or schedules content.
- Text generation continues to use the existing free/local provider guard in src/main.js; Demo mode and paid text model fallback remain blocked.
- Runway still requires the existing per-generation visible cost/confirmation and parent/guardian-managed account/billing. Clips retains source rights and quota checks.
- Do not remove the other AI Studio features, ten AI Team engines, Skills Library, GGUF/Ollama/Local Coder, project context or vault.

## Implementation files
- index.html: Chat is initial screen; Chat first in bottom navigation.
- src/creator-studio-core.js: dedicated What If / In My Town prompt builder; Clips cannot request a story prompt.
- src/social-studio.js: mounts Creator Studio, format tabs, source Clips and persisted mode fields.
- src/social-studio-core.js: normalizes persisted creator mode/settings.
- src/social-studio-automation.js: adds explicit mode locks to the Runway multi-shot prompt.
- src/social-studio.css: Creator mode UI.
- scripts/test-social-studio.mjs: distinct prompt, queue and video prompt tests.
- scripts/test-chat-layout.mjs: verifies AI chat is the default landing screen and retains its anchored composer/layout.

## Verification at handoff
- Node syntax checks passed for changed JS modules and tests.
- scripts/test-social-studio.mjs passed.
- scripts/test-chat-layout.mjs passed.
- Dynamic ID audit: all 66 IDs referenced by src/social-studio.js are present in its generated markup.
- GitHub commit/CI/APK artifacts must be rechecked after the source commit. Remote workbench tests are not Vite/Gradle build verification.
- No physical-device test, live Runway/OpenShorts provider call, credit spend or public post has been performed.

## Git / release guardrails
- Repo: babaprobado-bit/A-studio.
- Feature branch: feature/android-offline-skills-v1.
- PR #2 remains open and Draft; do not merge or close.
- main last known SHA: aab010319b6500002844bd24b11da85dd9ca3b00; re-fetch before write.
- Commit only to the feature branch with force:false. Re-check the branch head and PR before committing.
- Re-check Demo and Native GGUF workflows after commit. Do not claim an APK artifact until the workflow succeeds and artifact is listed.

## Next steps
1. Recheck exact feature branch SHA, main SHA, PR #2 open/Draft/head/base.
2. Commit the Creator source, tests and docs on the feature branch only.
3. Run/inspect GitHub web build and regression checks, then both APK workflows.
4. Report only verified commit, CI status and artifact links; no device tests were requested.
