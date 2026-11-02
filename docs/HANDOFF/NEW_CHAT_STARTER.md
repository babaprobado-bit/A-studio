# New chat starter — AI Studio

## Resume code
`AI-STUDIO-SESSION3-SKILLS-API`

## Current verified state
- Product: **AI Studio**; Alpha 1 is only an internal milestone; keep package ID `com.aistudio.alpha1`.
- Repository: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- App-code commit: `8f13635d258fbb84c34a8949827913740a13a792`
- Latest test/doc commit: `fd31a4355711c4089b7bc266743d79393c138bb4`
- `main` remains unchanged. PR #2 remains open/draft; do not merge.
- Demo artifact for app code 8f: [run 41480634456](https://github.com/babaprobado-bit/A-studio/actions/runs/41480634456), artifact `13158857865`, 3,769,601 bytes. Does not contain native GGUF.
- Latest branch-head demo run [41480850421](https://github.com/babaprobado-bit/A-studio/actions/runs/41480850421) passed regression checks including Skill multi-file/BOM/CRLF and preview UI-wiring tests; Gradle package was in progress.
- Latest native run [41480850408](https://github.com/babaprobado-bit/A-studio/actions/runs/41480850408) was preparing llama.cpp Android sources; no native artifact containing the new Skill queue helper yet.
- Earlier native artifact [13159701220](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367956) exists but predates the latest Skill import helper.
- Skill Library covers profile compatibility, SKILL.md preview, safe metadata, multi-file queue, duplicate warning, BOM/CRLF, size caps, backup round-trips and queue UI wiring.
- API tests cover consent, key presence, selected provider, exactly three stages and no retry/fallback; no real paid API call.
- User reports Redmi S12 and no current internet. No physical install/model download/inference/airplane-mode test is verified.

## Read first
1. `docs/HANDOFF/README.md`
2. `docs/HANDOFF/PROJECT_STATE.md`
3. `docs/HANDOFF/SESSION_3_SKILLS_AND_API.md`
4. `docs/HANDOFF/SESSION_2_DEVICE_TESTING.md`

## Next prompt

```text
AI-STUDIO-SESSION3-SKILLS-API

Continue the existing AI Studio project in babaprobado-bit/A-studio. Inspect the live feature branch, PR #2 and Actions runs first.

Current app-code commit: 8f13635d258fbb84c34a8949827913740a13a792.
Latest test/doc commit: fd31a4355711c4089b7bc266743d79393c138bb4.
Latest branch-head demo run 41480850421 passed tests and was packaging the APK. Latest native run 41480850408 was preparing llama.cpp Android sources. Recheck the live state.

The Skill Library now has multi-file import queue, case-insensitive .md validation, duplicate warnings, BOM/CRLF parsing, preview-before-save, static preview control wiring checks and backup tests. API Local Coder is isolated and fake-provider tested for explicit consent, exact Plan/Code/Review sequence, no retry/fallback and secret boundaries.

Remaining: visually verify the multi-file/duplicate Skill preview in a browser/phone, finish the current native GGUF build and then do Session 2 physical Redmi S12 install/model/inference/offline checks when internet is available. Do not claim phone inference before testing. Preserve all features. Work only on feature/android-offline-skills-v1; never edit main; keep PR #2 draft and do not merge. Session 4 owns REA/MCP.
```

## Links
- Repo: https://github.com/babaprobado-bit/A-studio
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Branch: https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1
- Latest demo: https://github.com/babaprobado-bit/A-studio/actions/runs/41480850421
- Latest native: https://github.com/babaprobado-bit/A-studio/actions/runs/41480850408
- Handoff: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/README.md
