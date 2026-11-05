# Session 3 of 4 — Skills and Local Coder modes

## Goal
Finish the Skill instruction library and verify the three Local Coder paths without removing current app functionality. REA/MCP is reserved for Session 4.

## Current implementation — 2026-11-02

### Skill Library
- 38 original AI Studio-authored starter instructions: 15 Superpowers-inspired, 22 Caveman-style and one Karpathy-inspired guideline summary.
- Legacy profile IDs remain compatible: `karpathy`, `superpowers`, `caveman`, `balanced`. Added `superpowers-development`, `planning`, `review`, `caveman-short`; `custom` is manual selection.
- Maximum eight selected Skills. Strict 36,000-character stage prompt budget counts opening/closing wrappers and separators.
- Markdown import previews each file before saving, supports bounded scalar front matter for name/description/stage/source/source_url/license/author/version, retains unknown scalar metadata and does not execute imported text.
- Import preparation is extracted to `prepareSkillImportQueue()`: case-insensitive .md extension, multi-file queue, invalid extension/parse errors, duplicate-name flags (including collisions with existing Skills and earlier queued files), and 100-custom-Skill limit.
- Parser handles UTF-8 BOM and CRLF as well as normal line endings. Limits: 50 KB source file, 12,000 chars per Skill body, 100 custom Skills, eight selected.
- UI previews content through textContent, escapes metadata values, and has wired Save, Skip, and Escape-to-skip actions. File picker resets after selection to allow selecting the same file again.

### Backups
- Standard and encrypted backups share `buildWorkspaceSnapshot()` and `createSkillBackupState()`.
- `restoreSkillBackupState()` normalizes Skills, bounds custom count, remaps custom IDs and remaps selected custom IDs to the restored IDs.
- Legacy backups without a Skills field fall back to Karpathy.
- Regression tests cover standard JSON and encrypted Skill round-trip, license/source metadata, wrong password rejection, legacy fallback and custom ID/selection remapping.

### Three Local Coder routes
1. **PC / Ollama** — stays default; endpoint is a different PC on a trusted LAN, not on-device inference.
2. **Phone / GGUF** — native llama.kt/llama.cpp; model weights are downloaded separately; after download inference is designed to run locally.
3. **Cloud API** — OpenAI, Claude, Gemini, DeepSeek, Groq and OpenRouter. Requires stored key and explicit consent before Plan/Code/Review requests.

### API safety and tests
- API sequencing lives in `src/local-coder-api.js`, with injected provider and consent functions.
- Only key-presence boolean enters the sequence helper; provider secret remains outside the workspace snapshot and activity log path.
- Consent cancellation sends no requests; Demo switches off only after explicit approval; the selected provider gets exactly three sequential stage calls; errors/empty replies stop the sequence without retry or automatic fallback.
- Fake-provider tests cover invalid provider, missing key, consent, Demo transition, exactly three requests, provider continuity, empty response, and failure stop. Static checks cover secret boundaries. No real paid API call made.

## Verified CI

- Latest app-code commit: `8f13635d258fbb84c34a8949827913740a13a792`.
- Latest test/documentation commit: `fd31a4355711c4089b7bc266743d79393c138bb4`.
- Demo run [41480634456](https://github.com/babaprobado-bit/A-studio/actions/runs/41480634456) succeeded on app-code commit `8f13635...`; artifact `AI-Studio-Demo-APK` ID `13158857865`, 3,769,601 bytes. It is not native GGUF.
- Latest branch-head demo run [41480850421](https://github.com/babaprobado-bit/A-studio/actions/runs/41480850421) passed JS/Vite, workshop, Skill Library (including new multi-file/BOM/CRLF/UI-wiring checks), device bridge and private-site checks; Gradle debug APK was in progress at last check.
- Latest branch-head native run [41480850408](https://github.com/babaprobado-bit/A-studio/actions/runs/41480850408) was preparing llama.cpp Android sources at last inspection. No native artifact from the new multi-file import app code yet.
- Older native artifact [13159701220](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367956) is valid but predates the extracted Skill import helper.

## Remaining work

- [ ] Manually inspect duplicate-name and multi-file Skill preview visuals on a browser or physical phone. Static UI-wiring tests are not a visual test.
- [ ] Finish latest native GGUF build; then complete Session 2 installation/model/inference/offline acceptance on a real supported phone.
- [ ] Perform final three-engine review and document any remaining unsupported-device fallback behavior.
- [ ] Do not start REA/MCP here; Session 4 owns it.

## Regression commands

```sh
npm install --no-audit --no-fund
npm run build
npm run test:workshop
npm run test:site
npm run test:skills
npm run test:api-local-coder
npm run test:device-local-coder
```

## Session exit criteria

- [x] Profiles and old IDs preserved.
- [x] SKILL.md preview, metadata attribution, input bounds and multi-file queue.
- [x] BOM/CRLF, duplicate-name and file-limit tests.
- [x] UI wiring checks for preview/save/skip/Escape/queue advancement.
- [x] Eight-Skill and strict 36k stage context caps.
- [x] Standard/encrypted Skill backup round-trip and legacy fallback.
- [x] API consent, exact three stages, no retry/fallback and secret boundary checks.
- [ ] Visual UI verification.
- [ ] Current native build and physical-device verification (Session 2).

## Copy-ready prompt for next conversation

Continue AI Studio on `feature/android-offline-skills-v1`. Read README.md, PROJECT_STATE.md, this file and SESSION_2_DEVICE_TESTING.md. Latest app-code commit is `8f13635d258fbb84c34a8949827913740a13a792`; latest test/doc commit is `fd31a4355711c4089b7bc266743d79393c138bb4`. The demo build for 8f succeeded and uploaded artifact `13158857865`; latest branch-head demo run `41480850421` passed tests and was packaging. Latest native run `41480850408` was preparing llama.cpp sources. Check current Actions before assuming status. Remaining: visual Skill import preview and latest native build; physical Redmi S12 testing is blocked because user reports no internet. Keep PR #2 draft, do not edit main or merge. Session 4 is for REA/MCP.
