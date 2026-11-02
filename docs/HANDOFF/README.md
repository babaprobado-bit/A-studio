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
- Latest code commit: `a277892d712d903e985a05d98440afc55f5684f2`. Its JavaScript, Vite, Local Coder, Skill Library, device bridge and private-site checks have passed; the demo APK is still compiling Gradle and the native GGUF APK is still building. Earlier successful native artifacts exist on older commits, but they do not verify this latest source.

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

- Official product name: **AI Studio**. “Alpha 1” is an internal milestone label only. Keep Android application ID `com.aistudio.alpha1` stable.
- Current feature branch head: `a277892d712d903e985a05d98440afc55f5684f2`. `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains open and draft, base `main`, head `feature/android-offline-skills-v1`. Do not merge without explicit user instruction.
- Skill Library updates in commits `9f1577a...`, `6ddc063...` and `a277892...` fix the .md filename filter, add a save-before-preview flow, metadata retention, duplicate warnings and new profile presets, correct real newline insertion, and enforce the 36,000-character stage cap including block separators.
- Existing profile IDs `karpathy`, `superpowers`, `caveman` and `balanced` remain. Added `superpowers-development`, `planning`, `review` and `caveman-short`; every preset stays within the eight-Skill selection cap.
- Demo workflow [41474730949](https://github.com/babaprobado-bit/A-studio/actions/runs/41474730949) is running on `a277892...`. Vite, Local Coder/reuse, Skill Library, device bridge and private-site checks passed; Gradle debug APK creation was still in progress at last inspection. No artifact had been uploaded yet.
- Native GGUF workflow [41474731858](https://github.com/babaprobado-bit/A-studio/actions/runs/41474731858) is running on `a277892...`; it had passed setup/native build-tools and pinned llama.kt checkout, and was preparing llama.cpp Android sources. No APK artifact had been uploaded yet.
- The previous demo run [41474499329](https://github.com/babaprobado-bit/A-studio/actions/runs/41474499329) on `6ddc063...` failed the Skill boundary test. That exposed a real prompt-size accounting bug: inter-Skill separators were not counted. Commit `a277892...` fixes the budget and the latest Skill Library test step passed. Do not use the older failure as the current branch status.
- The earlier native GGUF build [41459856700](https://github.com/babaprobado-bit/A-studio/actions/runs/41459856700) succeeded on `7341a83...` and included the hardware-aware selector. It remains a historical build, not a verification of `a277892...`.
- User reports a Redmi S12 and no current internet access. Exact Android version, ABI and device memory have not been read from the phone. No physical installation, separate GGUF download, on-device inference or airplane-mode test has passed. Session 2 remains incomplete.
- Session 3 Skills code is improved, but mocked API-dispatch/consent tests and explicit standard/encrypted backup round-trip regression tests remain to be completed. See `SESSION_3_SKILLS_AND_API.md`.
- Use `docs/HANDOFF/SESSION_3_SKILLS_AND_API.md` for the next source task. Preserve all features; never edit `main`; keep PR #2 draft; never merge without explicit instruction.

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
