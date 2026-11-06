# Session 3 of 4 — Skills and Local Coder modes

## Latest verified checkpoint — 2026-11-06

- Repository: https://github.com/babaprobado-bit/A-studio
- Active branch: `feature/android-offline-skills-v1`
- Latest source/test commit: [c9b3d4c](https://github.com/babaprobado-bit/A-studio/commit/c9b3d4c8ac2335a37afe054a49fccb672774314c).
- `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains **open, Draft and unmerged**: https://github.com/babaprobado-bit/A-studio/pull/2. Do not merge or mark ready without explicit user approval.
- Both latest workflows were dispatched for `c9b3d4c` on 2026-11-06:
  - Demo run [42262971664](https://github.com/babaprobado-bit/A-studio/actions/runs/42262971664): Vite build, workshop/Local Coder, Skill Library, device Local Coder bridge, site login gate, Android generation and Capacitor sync passed. Gradle debug APK step was still running at the last check; no artifact was yet reported for this commit.
  - Native GGUF run [42262972234](https://github.com/babaprobado-bit/A-studio/actions/runs/42262972234): Android SDK/native tool setup and pinned llama.kt fetch passed; llama.cpp source preparation was in progress. Regression and Gradle steps were pending at the last check.
- Previous source commit `cfd5468` has successful Demo and Native GGUF APK runs [Demo 42090697495](https://github.com/babaprobado-bit/A-studio/actions/runs/42090697495) and [Native 42090697496](https://github.com/babaprobado-bit/A-studio/actions/runs/42090697496). Their artifacts are historical evidence for `cfd5468`, not for `c9b3d4c`.
- GGUF catalogue SHA-256 pins were checked against the matching Hugging Face file metadata:
  - Qwen2.5-Coder 0.5B Q4_K_M: `1d9614638d18024d0fbb36575a15f1302a3adf044df10345688ec4f6e1c4ff32`
  - Qwen2.5-Coder 1.5B Q4_K_M: `cc324af070c2ecbfd324a30884d2f951a7ff756aba85cb811a6ec436933bb046`
  - Qwen2.5-Coder 3B Q4_K_M: `724fb256bec1ff062b2f65e4569e871ad2e95ab2a3989723d1769c54294730b7`
- SHA verification runs on Android against the staged `.part` file before it can be promoted to an installed catalogue `.gguf`. The expected digest persists with DownloadManager state and is cleared with terminal download records. User-selected local GGUF imports intentionally do not require a catalogue hash.
- AI Team tests cover all 10 providers, uncapped selection, provider readiness, explicit live-call consent, parallel fan-out/error isolation, sequential role/prompt/history hand-off, and preservation of completed stages on failure. Shared project/vault/general Skills context remains wired into supported provider routes; Local Coder keeps stage-specific Skills.
- Additional runtime hardening: load-progress listener cleanup cannot mask native load success or the primary load error; imported GGUF copies stop before writing bytes beyond declared source size, while the absolute 8 GB and final-size checks remain.
- Important acceptance boundary: CI verifies source tests and APK build/package steps only. No physical-device install, native GGUF inference, or airplane-mode operation has been tested. Do not present CI as proof of offline operation. The user has no internet for local/device testing; continue with source and hosted CI work.


## Current verified checkpoint — 2026-11-05 (AI Team expansion)

- Latest feature-branch source head: `66daa33f56220a7257825106147d37c974b7398a`. PR #2 remains open, Draft and unmerged. `main` is unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- AI Team now has nine provider entries: OpenAI, Anthropic/Claude, Google Gemini, DeepSeek, Groq, OpenRouter, Hugging Face Inference Providers, a user-configurable OpenAI-compatible API endpoint, and PC Ollama.
- The four-agent cap was removed from parallel team runs, sequential pipelines, model comparison, selection change handling, startup normalization and backup restoration. Fresh installs select all providers by default; existing saved preferences are preserved and the Models screen has a **Tüm AI sağlayıcılarını takıma ekle** action.
- Sequential pipelines use Plan, Implement, Independent Review and Test roles for the first four selected providers; additional selected providers receive separate independent-expert review prompts.
- Hugging Face uses its OpenAI-compatible Inference Providers route `https://router.huggingface.co/v1/chat/completions` and editable model ID. Official docs describe access to hundreds of models through one token. The custom provider supports OpenAI-compatible chat-completions APIs; it is not a universal adapter for arbitrary non-compatible APIs. Remote custom endpoints require HTTPS; HTTP is allowed only for localhost.
- API keys continue to use the existing secure-storage path and are not added to workspace backups. Team calls with Demo mode enabled still produce demo templates, not real model inference. Live multi-provider operations can issue one request per selected provider and may incur provider charges; explicit confirmation remains.
- Regression assertions were added for unlimited provider selection, de-duplication/unknown IDs, additional pipeline roles and custom endpoint URL validation. These tests have not yet been confirmed green by the newest Actions runs.
- Demo build [42062569036](https://github.com/babaprobado-bit/A-studio/actions/runs/42062569036) completed successfully on source commit `66daa33...`: Vite build, all regression tests, Capacitor generation/sync, Gradle `assembleDebug` and artifact upload passed. Demo artifact: `AI-Studio-Demo-APK`, ID `13432193970`, **3,773,590 bytes**, SHA-256 `0b5247aae3f270e83137f7e348f4dc6e65275ca06069f40d7cfe5a64b2889a9f`, expires 2026-11-19 16:17:52 UTC. It includes AI Team changes but is **not** the native GGUF APK.
- Native GGUF build [42062566776](https://github.com/babaprobado-bit/A-studio/actions/runs/42062566776) has passed Android setup, llama.kt/llama.cpp preparation, web build, all regression checks, Capacitor generation/sync and trusted-LAN bridge setup. Gradle `assembleDebug` was still in progress at the last check; there is no artifact yet for the AI Team-expanded native source.
- Earlier premature run [42062088282](https://github.com/babaprobado-bit/A-studio/actions/runs/42062088282) failed at Vite because it checked out commit `8a82f41...` after the import was added but before the new helper file `src/ai-team.js` was committed. The helper and UI/test changes are now on the branch; use the newer runs above to evaluate the complete source.
- No physical install, real provider-key call, native GGUF inference or airplane-mode test has been performed. Do not claim those from a successful APK build or mock test.

This AI Team checkpoint supersedes earlier source-head/queued-build snapshots below; historical APK details remain valid only for their recorded older commits.


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
