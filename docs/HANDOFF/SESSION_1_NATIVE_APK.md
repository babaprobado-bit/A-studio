# New chat starter — AI Studio

## Resume code
`AI-STUDIO-SESSION3-SKILLS-API`

## Current verified state
- Product: **AI Studio**; Alpha 1 is only an internal milestone; keep package ID `com.aistudio.alpha1`.
- Repository: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- Current code/test commit: `389a8b87ee7ebef96eb8ba7d265ca60f0a1aea03`
- `main` remains unchanged; PR #2 is open/draft and unmerged.
- Latest demo run [41481715511](https://github.com/babaprobado-bit/A-studio/actions/runs/41481715511) succeeded, artifact `AI-Studio-Demo-APK` ID `13160940289`. This does not include native GGUF.
- Latest native run [41481715201](https://github.com/babaprobado-bit/A-studio/actions/runs/41481715201) was preparing llama.cpp Android sources; no artifact yet.
- Native artifact `13159701220` exists from older source and predates the latest Skill import queue/API concurrency fix.
- Skills: multi-file queue, preview-before-save, duplicate warning, BOM/CRLF, UI control wiring tests, strict caps, backup round-trip and legacy fallback.
- API: fake-provider tests for consent, selected provider, fixed three-stage sequence, no retry/fallback, secrets excluded from backups/logs; concurrency fix locks before first await.
- User reports Redmi S12 and no internet currently. No physical installation, GGUF download, inference or airplane-mode validation.

## Read first
1. `docs/HANDOFF/README.md`
2. `docs/HANDOFF/PROJECT_STATE.md`
3. `docs/HANDOFF/SESSION_3_SKILLS_AND_API.md`
4. `docs/HANDOFF/SESSION_2_DEVICE_TESTING.md`

## Next prompt

```text
AI-STUDIO-SESSION3-SKILLS-API

Continue the AI Studio project in babaprobado-bit/A-studio. Inspect the live branch, PR #2 and latest GitHub Actions first.

Latest code/test commit: 389a8b87ee7ebef96eb8ba7d265ca60f0a1aea03. Demo run 41481715511 succeeded, artifact 13160940289 (regular demo, no native GGUF). Native run 41481715201 was preparing llama.cpp Android sources at last check.

Recent work: multi-file Skill import queue, BOM/CRLF parsing, duplicate handling and preview UI wiring tests; standard/encrypted backup tests and custom ID remapping; API fake-provider consent/three-stage/error tests; API run lock before secure key lookup to prevent double submissions.

Next: recheck native workflow, manually inspect preview UI when a browser is available, then complete Session 2 physical Redmi S12 tests after internet is available. Do not claim local offline inference until it is tested. Keep PR #2 draft; do not edit main or merge. Session 4 owns REA/MCP.
```

## Links
- Repo: https://github.com/babaprobado-bit/A-studio
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Branch: https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1
- Latest demo: https://github.com/babaprobado-bit/A-studio/actions/runs/41481715511
- Latest native: https://github.com/babaprobado-bit/A-studio/actions/runs/41481715201
- Handoff: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/README.md
