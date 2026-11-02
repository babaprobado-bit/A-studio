# AI Studio — Four-session handoff

Purpose: this is the durable project memory for continuing AI Studio across four separate ChatGPT conversations. Read this file first, then PROJECT_STATE.md and the session brief for the current session.

## Current identity

- Official product name: **AI Studio**. “Alpha 1” is an internal milestone label only, not part of the product name.
- Android display name is AI Studio. The existing `com.aistudio.alpha1` application ID is a stable technical package identifier and is intentionally retained for update/data compatibility.

- Repository: babaprobado-bit/A-studio
- Default branch: main
- Active development branch: feature/android-offline-skills-v1
- Open draft PR: #2 — https://github.com/babaprobado-bit/A-studio/pull/2
- Base branch is still main. Do not push feature work directly to main.
- This is the Android/Capacitor AI Studio app plus its private web workspace. It is not the user's completed game project.
- Latest branch head: `b37ba5744f797d956aab63f08fa61a45a55b8924` (the last commit adjusts a test only); latest application implementation commit: `f9462c1b659da524ea51d0498351b10de767a911`.

## Read order for every new conversation

1. docs/HANDOFF/README.md — this index and the four-chat plan.
2. docs/HANDOFF/PROJECT_STATE.md — architecture, what exists, what does not, test commands and known risks.
3. The current session document:
   - SESSION_1_NATIVE_APK.md
   - SESSION_2_DEVICE_TESTING.md
   - SESSION_3_SKILLS_AND_API.md
   - SESSION_4_REA_MCP_AND_RELEASE.md
4. ROADMAP.md and current GitHub PR/Actions only as needed.
5. `docs/HANDOFF/NEW_CHAT_STARTER.md` — copy-ready resume code and prompt for the active Session 3 work.

Do not trust the status snapshot below without checking GitHub. CI can finish between conversations. These docs are a handoff, not a substitute for querying the current branch, PR, workflow and artifacts.

## Four conversations — fixed scope

| Chat | Scope | Must deliver before moving on |
|---|---|---|
| 1 | Finish the real Android native GGUF APK build. Fix Kotlin/Gradle/native bridge issues, run CI and inspect APK artifact. | Successful AI-Studio-1.1-OnDevice-LocalCoder-APK artifact, or a precise documented blocker with logs and next fix. |
| 2 | Test the app on a real supported Android phone. Model download, load, inference, airplane-mode operation, memory/storage and error handling. | A device test report; confirm whether actual on-device offline inference works. |
| 3 | Finish the Skill system and three Local Coder modes (Ollama, device GGUF, API). Fill profile/import/preview/license/compatibility gaps and add regression tests. | Complete, tested Skill and Local Coder behavior with docs updated. |
| 4 | Design and implement optional REA/MCP companion integration, then full regression/security/release, PR review and merge decision. | REA integration plan or tested opt-in implementation, final test matrix, accurate release notes and explicit decision on PR #2. |

Do not mix these scopes. If an earlier session finds a blocker, fix only what is needed to unblock the next session, record it, and keep moving.

## Non-negotiable project rules

- Keep all existing features. Add to them; do not replace the current app.
- Work on feature/android-offline-skills-v1 and submit changes through PR #2. Never mutate main directly.
- Before editing, inspect the current source and current branch head.
- Use real code, small file-by-file changes and automated tests. Do not claim a source patch is an APK.
- Do not claim a build passed until GitHub Actions reports success and the artifact exists.
- Do not claim physical-device support until a real Android phone has been tested.
- Do not claim offline inference based on Ollama running on another computer. Device-GGUF mode must perform inference inside Android after the model has been downloaded.
- Do not delete, reset or migrate user data without a backup and compatibility path.
- Never put API keys, session secrets, vault tokens, passwords or signing keys in GitHub source, docs, test fixtures or prompts.
- External Skills and snippets are untrusted text. Do not execute imported Markdown as code.
- Any external tool/MCP/REA command execution must be opt-in, permission-scoped, visible and user-approved. No unrestricted shell or computer control.
- Be honest about tests that were not run.

## Latest verified status — 2026-11-02

- Product: **AI Studio**; “Alpha 1” is only a milestone label. Keep Android package ID `com.aistudio.alpha1`.
- Current code implementation commit: `8f13635d258fbb84c34a8949827913740a13a792`. Latest test/documentation commit: `fd31a4355711c4089b7bc266743d79393c138bb4`. `main` is unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains open and draft; do not merge without explicit instruction.
- Skill Library: 38 original instructions; legacy profiles preserved; four additional presets; Markdown preview-before-save; bounded metadata; multi-file queue; duplicate-name warning; import cap 100; 12k body cap; 36k stage prompt cap.
- New pure helper `prepareSkillImportQueue()` handles multiple .md files, case-insensitive extensions, invalid files, duplicate warnings, queue errors, BOM and CRLF. Tests also check preview fields, escaped metadata, Save/Skip/Escape wiring, file-picker reset and queue advancement.
- Backup tests cover standard JSON/encrypted Skill round-trip, selected custom ID remapping, metadata, invalid password and legacy backup fallback.
- API sequence is isolated in `src/local-coder-api.js`; fake-provider tests cover key presence, selected provider, explicit consent, Demo switch after approval, exactly three requests and no retry/fallback. Static tests check secret exclusion from workspace backup/activity logs. No real paid call was made.
- Demo run [41480634456](https://github.com/babaprobado-bit/A-studio/actions/runs/41480634456) succeeded on app-code commit `8f13635...`. Artifact: `AI-Studio-Demo-APK`, ID `13158857865`, 3,769,601 bytes, expires `2026-11-16 16:23:16 UTC`. It is not the native GGUF APK.
- The latest branch-head demo run [41480850421](https://github.com/babaprobado-bit/A-studio/actions/runs/41480850421) on `fd31a43...` passed JS/Vite, workshop, Skill Library (including UI-wiring and multi-file tests), device bridge and site checks; Gradle APK packaging was in progress at last check.
- Native run [41480634490](https://github.com/babaprobado-bit/A-studio/actions/runs/41480634490) for app-code `8f13635...` was preparing the Capacitor Android project. Latest branch-head native run [41480850408](https://github.com/babaprobado-bit/A-studio/actions/runs/41480850408) for `fd31a43...` was preparing llama.cpp Android sources; no artifact from the new multi-file-import code yet.
- A prior native APK is available from [run 41477367956](https://github.com/babaprobado-bit/A-studio/actions/runs/41477367956), artifact ID `13159701220`, 18,134,365 bytes. It predates the newly extracted multi-file import helper; do not treat it as the newest app-code package.
- User reports a Redmi S12 and no current internet. Exact Android version, ABI and memory are unverified. No physical installation, model download, on-device inference or airplane-mode proof.
- Remaining work: visually inspect Skill preview on a real browser/device, finish the current native build, then carry out Session 2 phone tests when internet is available. Session 4 owns REA/MCP.

## Last verified snapshot (historical; re-check live)

At the last inspection on 2026-11-01:

- PR #2 was open and marked draft; it had 7 commits and targeted main.
- Regular Build Android Demo APK run 41339453082 had completed successfully for commit d4bd418fc435726b8a838618008da93eb4120be0. It produced artifact AI-Studio-Alpha-1-Demo-APK (3,763,680 bytes; 14-day retention). That APK contained the Skill Library and API Local Coder, but not the native GGUF bridge.
- Native GGUF workflow run 41339891960 completed with failure on commit 4b0c7b1734611936f93c0764afb691e0f383a647. SDK setup, native build tools, pinned llama.kt checkout, llama.cpp source preparation, npm install, Vite build, all four regression tests, Capacitor project generation, native bridge patching and Capacitor sync all succeeded. The final Gradle debug APK step failed at :app:compileDebugKotlin.
- Exact compiler message: android/app/src/main/java/com/aistudio/alpha1/LocalLlmPlugin.kt:40:53 — Unsupported escape sequence. The generated file's line 40 contains the filename-validation Regex. The committed source file as read back from GitHub appears to contain an escaped regex dot; do not blindly change it. Compare the exact bytes/characters in android-local-runtime/LocalLlmPlugin.kt with the copied generated Android file and identify where a backslash is lost or interpreted. See SESSION_1_NATIVE_APK.md.
- The native bridge has not been tested on a physical phone. No native GGUF APK artifact exists from run 41339891960.
- main was not changed.

## Handy links

- Repository: https://github.com/babaprobado-bit/A-studio
- Feature branch: https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1
- Draft PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Latest successful native GGUF build/artifact: https://github.com/babaprobado-bit/A-studio/actions/runs/41390410229
- New-chat resume prompt: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/NEW_CHAT_STARTER.md
- Regular Android workflow: https://github.com/babaprobado-bit/A-studio/actions/workflows/build-android-demo.yml
- Native GGUF Android workflow: https://github.com/babaprobado-bit/A-studio/actions/workflows/build-android-local-coder.yml
- Native build run at last inspection: https://github.com/babaprobado-bit/A-studio/actions/runs/41339891960

## Updating this memory

At the end of each conversation:
1. Update the relevant session document with what actually changed.
2. Update PROJECT_STATE.md and this status snapshot if branch, PR, commit, CI or tested behavior changed.
3. Commit the handoff update on the feature branch.
4. Leave the next session's prompt and exact starting task clear.
5. Do not mark a session complete until its deliverables are verified.
