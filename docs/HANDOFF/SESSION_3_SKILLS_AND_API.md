# Session 3 of 4 — Skills and Local Coder modes

## Goal
Finish the Skills system and add regression coverage for the three Local Coder routes without removing existing functionality. REA/MCP stays in Session 4.

## Current implementation — 2026-11-02

### Skill Library
- 38 original AI Studio starter instructions: 15 Superpowers-inspired, 22 Caveman-style and one AI Studio-authored Karpathy-inspired guideline summary.
- Legacy profile IDs are preserved: `karpathy`, `superpowers`, `caveman`, `balanced`. Added `superpowers-development`, `planning`, `review`, `caveman-short`. The `custom` selector is manual selection, not a preset.
- Maximum eight selected Skills; strict 36,000-character stage context budget including wrappers and inter-Skill separators.
- Markdown import accepts `.md`, prepares multi-file import queues, shows a preview before saving each file, flags duplicate names, supports BOM/CRLF input and simple bounded scalar front matter (`name`, `description`, `stage`, `source`, `source_url`, `license`, `author`, `version`), and retains unknown scalar metadata. Multiline YAML/list front matter is not supported.
- Duplicate names are allowed but warned about; each file is saved as a separate Skill with a generated ID. Multiple files are processed one at a time. Malformed front matter, empty content and oversized files are rejected.
- Imported Markdown is untrusted text and is never executed.
- Limits: 50 KB input file, 12,000 chars per Skill body, 100 custom Skills, eight selected Skills.

### Backup compatibility
- `buildWorkspaceSnapshot()` includes the Skill state created by `createSkillBackupState()`. Standard JSON and encrypted exports use the same snapshot.
- `restoreSkillBackupState()` normalizes and bounds custom Skills, remaps IDs, and remaps selected custom IDs with the new Skill IDs. This closes the earlier selection-loss bug on restore.
- Legacy backups without a Skills section safely restore the Karpathy profile.
- Regression tests cover standard JSON round-trip, encrypted round-trip, metadata, selected custom Skill remapping, wrong-password rejection, old backup fallback and size/count bounds.

### Three Local Coder routes
1. **PC / Ollama**: existing LAN endpoint. Keep default and do not confuse it with on-device inference.
2. **Phone / GGUF**: native llama.kt/llama.cpp bridge. Separate weights download; first download needs internet; inference should run inside Android after download.
3. **Cloud API**: OpenAI, Claude, Gemini, DeepSeek, Groq and OpenRouter. API mode requires a stored key and explicit confirmation before real calls. The selected provider is used for exactly Plan, Code and Review; the flow stops on errors and does not retry or fall back silently.

### API flow and key boundaries
- API orchestration is in `src/local-coder-api.js`, with injected `confirmConsent`, `callProvider` and stage callbacks.
- Only a boolean key-presence value enters this sequence helper; the secret itself remains in the existing secure-storage/provider call path.
- Demo mode is disabled only after explicit consent. If the user cancels, no request is sent and Demo remains on.
- Automated tests use fake provider calls; they do not contact providers or spend quota.
- Static checks verify that workspace snapshots and Local Coder activity log arguments do not include provider secrets. No real paid API call has been made.

## Verified CI

- Latest branch head: `b37ba5744f797d956aab63f08fa61a45a55b8924`.
- Demo run [41477367948](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367948) completed successfully on this branch head. It passed Vite and regression tests and uploaded `AI-Studio-Demo-APK`, artifact ID `13157453492`. This is not the native GGUF APK.
- Native run [41477367956](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367956) is still running on this branch head; at last inspection it was preparing llama.cpp Android sources. No latest-branch native artifact yet.
- Earlier native artifact [41472242158](https://github.com/babaprobado-bit/A-studio/actions/runs/41472242158), artifact ID `13157875497`, succeeded on older commit `c241769...`; it predates the latest Skills/API changes.
- No real paid API request or physical-phone test was performed.

## Remaining work

- [ ] Manually verify the duplicate-name and multi-file import preview UI on a browser/phone.
- [x] Add automated BOM, CRLF, multi-file queue, duplicate-name warning, invalid-extension, malformed-file and 100-Skill limit tests.
- [ ] Run the full three-engine regression on a real capable PC/phone when available; native phone testing is tracked in Session 2.
- [ ] Re-check the native build on the latest branch head and update the handoff with its final artifact status.
- [ ] Do not start REA/MCP here; Session 4 owns that work.

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

- [x] Requested profiles implemented and legacy profile IDs retained.
- [x] SKILL.md preview, source/license metadata and import limits implemented.
- [x] Eight-Skill and strict 36k context limits covered by tests.
- [x] Standard/encrypted Skill backup round-trip and legacy fallback tests.
- [x] Custom selected Skill ID remapping on restore.
- [x] API provider selection, missing key, consent, Demo transition, exactly three stages, no retry/fallback and error stop tested with fakes.
- [x] Static checks for secret exclusion from backup and activity log.
- [ ] Manual preview UI verification.
- [ ] Latest native GGUF APK build and real-device testing; physical-device acceptance remains Session 2.

## Copy-ready prompt for next conversation

Continue AI Studio Session 3 from the live branch `feature/android-offline-skills-v1`. Read README.md, PROJECT_STATE.md and this file first. Latest branch head is `b37ba5744f797d956aab63f08fa61a45a55b8924`; latest demo run [41477367948](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367948) succeeded with artifact `13157453492`; latest native run [41477367956](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367956) was still preparing llama.cpp Android sources at last check. Manually verify Skills import preview/multiple-file behavior and recheck the native workflow. Do not merge PR #2, do not change main, preserve all features. Real phone is reported as Redmi S12 and has no internet currently; do not claim offline device inference. Session 4 owns REA/MCP.
