# New chat starter — AI Studio / Session 3

## Resume code

`AI-STUDIO-SESSION3-SKILLS-API`

This is a label for the current handoff, not a key or password.

## Current verified state

- Product: **AI Studio**. “Alpha 1” is an internal milestone only; keep Android package ID `com.aistudio.alpha1` stable.
- Repository: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- Latest code commit: `a277892d712d903e985a05d98440afc55f5684f2`
- `main` remains unchanged. PR #2 remains open/draft; do not merge without explicit user instruction.
- The latest demo run [41474730949](https://github.com/babaprobado-bit/A-studio/actions/runs/41474730949) passed JS checks, Vite, Local Coder/reuse, Skill Library, device bridge and private site tests; it was compiling Gradle at last inspection.
- The latest native GGUF run [41474731858](https://github.com/babaprobado-bit/A-studio/actions/runs/41474731858) checked out pinned llama.kt successfully and was preparing llama.cpp Android sources; no fresh native APK artifact was available at last check.
- Skills: legacy profile IDs retained; added Superpowers Development, Planning, Review and Caveman Short; fixed .md validation; preview-before-save; source/license metadata; duplicate-name warning; actual newline injection; stage context has strict 36,000-character cap including separators. Latest Skill tests passed.
- Standard/encrypted workspace snapshots include custom Skills/profile selection, and restore supports old backups without Skill fields by using Karpathy fallback; dedicated round-trip automated tests remain to be added.
- API Local Coder asks before the three Plan/Code/Review requests and checks provider key first. Source-reviewed only; no real paid API call.
- User reports Redmi S12 and no internet now. Physical install/model-download/inference/airplane-mode tests remain blocked and unverified.

## Copy and paste this into the new chat

```text
AI-STUDIO-SESSION3-SKILLS-API

Continue my existing AI Studio project in GitHub repository babaprobado-bit/A-studio.

Before editing, read:
1. docs/HANDOFF/README.md
2. docs/HANDOFF/PROJECT_STATE.md
3. docs/HANDOFF/SESSION_3_SKILLS_AND_API.md
4. docs/HANDOFF/SESSION_2_DEVICE_TESTING.md

Inspect the LIVE feature branch feature/android-offline-skills-v1, PR #2, and latest GitHub Actions runs first. Do not assume the saved SHA is still the branch tip. Product name is AI Studio; Alpha 1 is only a milestone.

Current code commit is a277892d712d903e985a05d98440afc55f5684f2. Skill Library test now passes after fixing the strict 36,000-character stage-context budget to count all separators. Latest demo APK build was at Gradle compilation; latest native GGUF build was preparing llama.cpp Android sources at last inspection. Check current run status before doing anything else.

Session 3 remaining tasks:
- Add automated tests for standard and encrypted workspace backup Skill round-trip, custom-profile persistence and old backups with no skills.
- Add mocked tests for API provider selection, missing key, demo-mode/three-request consent, and no retries/fallback; do not call any real paid API.
- Verify import preview/multiple-file behavior as practical and preserve source/license attribution.
- Review the three Local Coder modes without breaking Ollama, on-device GGUF or API features.
- Update SESSION_3_SKILLS_AND_API.md, PROJECT_STATE.md and README handoff status after verified work.

Session 2 physical-device tests remain separate: user reports Redmi S12 and no current internet. Do not claim native install, GGUF download, inference or airplane-mode operation until measured on the real phone.

Do not start REA/MCP yet; that is Session 4. Preserve every existing AI Studio feature. Work only on feature/android-offline-skills-v1, never edit main directly, keep PR #2 as a draft and do not merge it without explicit instruction. Never put secrets in source, logs or backups.
```

## Important links

- Repository: https://github.com/babaprobado-bit/A-studio
- Feature branch: https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Latest demo workflow: https://github.com/babaprobado-bit/A-studio/actions/runs/41474730949
- Latest native workflow: https://github.com/babaprobado-bit/A-studio/actions/runs/41474731858
- Handoff index: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/README.md
