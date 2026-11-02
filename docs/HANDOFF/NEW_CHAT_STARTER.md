# New chat starter — AI Studio

## Resume code
`AI-STUDIO-SESSION3-SKILLS-API`

## Current state
- Official product name: **AI Studio**. “Alpha 1” is only an internal milestone label; keep Android package ID `com.aistudio.alpha1` unchanged.
- Repository: https://github.com/babaprobado-bit/A-studio
- Feature branch: `feature/android-offline-skills-v1`
- Latest branch head: `b37ba5744f797d956aab63f08fa61a45a55b8924`
- Latest application implementation: `f9462c1b659da524ea51d0498351b10de767a911`; `b37ba57` changes the secret-boundary test only.
- `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains open/draft. Do not merge.
- Latest demo run [41477367948](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367948) succeeded on branch head and uploaded `AI-Studio-Demo-APK`, artifact ID `13157453492`. This APK does not include native GGUF.
- Latest native run [41477367956](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367956) was still preparing llama.cpp Android sources at last inspection; no native artifact for the latest branch head yet.
- An older native APK exists from [run 41472242158](https://github.com/babaprobado-bit/A-studio/actions/runs/41472242158), artifact ID `13157875497`, on old commit `c241769...`. It predates latest Skills/API code.
- Skills implementation/tests now cover 38 starter Skills, retained legacy profiles, four added profiles, Markdown preview/metadata/limits, 36k strict prompt budget, standard/encrypted backup round-trip, legacy backup fallback and custom selected-ID remapping.
- API orchestration is extracted to `src/local-coder-api.js`; fake tests cover consent, key presence, exact Plan/Code/Review sequence, selected provider only, no retry/fallback, and empty-response stop. Static checks cover secret exclusion from backups/logs. No paid API was called.
- User reports a Redmi S12 and no current internet. Android version, ABI, RAM, physical install, GGUF download, local inference and airplane-mode operation are not verified.

## Read these before making changes
1. `docs/HANDOFF/README.md`
2. `docs/HANDOFF/PROJECT_STATE.md`
3. `docs/HANDOFF/SESSION_3_SKILLS_AND_API.md`
4. `docs/HANDOFF/SESSION_2_DEVICE_TESTING.md`

## Copy-ready next prompt

```text
AI-STUDIO-SESSION3-SKILLS-API

Continue the existing AI Studio project in babaprobado-bit/A-studio. First inspect the live feature branch, PR #2 and current Actions status; do not assume this saved status is still live.

Latest branch head: b37ba5744f797d956aab63f08fa61a45a55b8924. Latest demo workflow 41477367948 succeeded and uploaded AI-Studio-Demo-APK artifact 13157453492. This is not native GGUF. Latest native run 41477367956 was still preparing llama.cpp Android sources at last check. There is an older native artifact 13157875497 on older c241769 code; do not mistake it for latest source.

Read docs/HANDOFF/README.md, PROJECT_STATE.md, SESSION_3_SKILLS_AND_API.md and SESSION_2_DEVICE_TESTING.md. Skill import/profile/prompt-cap/backup and API consent/three-stage/fake-provider/key-boundary tests are now implemented and pass in the latest demo CI. Remaining Session 3 work is manual UI verification of duplicate-name and multi-file preview, optional BOM/CRLF parser tests, and final three-engine review.

User reports Redmi S12 and no current internet. Do not claim phone installation, GGUF download, local inference or airplane-mode use until physically tested after connection is available.

Preserve every feature. Work only on feature/android-offline-skills-v1, never modify main, keep PR #2 draft and do not merge without explicit instruction. Session 4 owns REA/MCP.
```

## Key links
- Repository: https://github.com/babaprobado-bit/A-studio
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Branch: https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1
- Latest demo: https://github.com/babaprobado-bit/A-studio/actions/runs/41477367948
- Latest native build: https://github.com/babaprobado-bit/A-studio/actions/runs/41477367956
- Handoff: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/README.md
