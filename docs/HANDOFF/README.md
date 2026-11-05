# AI Studio — Four-session handoff

## Current verified checkpoint — 2026-11-05

- Latest app-code/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86`. Native workflow [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) completed successfully, including all regression checks, Capacitor generation/sync, Gradle `assembleDebug` and artifact upload.
- Latest native GGUF APK: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, artifact ID `13351543088`, **18,154,391 bytes**. SHA-256: `65b16549595534ba9996223cb99c29e1cbf3cee79fcb25a76017bad8a75598ee`. Artifact was created 2026-11-04 18:29:28 UTC and expires 2026-11-18 18:29:26 UTC. [Open the successful native build and download its artifact](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742).
- This APK is built from `b967781...` and includes the already-loaded-model idempotent-load fix plus the prior imported-GGUF RAM guardrails. It is the current native artifact; do not confuse it with the smaller demo APK.
- GitHub Actions proves regression/build/package success only. No physical install, Android GGUF import/load, actual on-device inference or airplane-mode test has been performed. The user currently has no phone/computer available for hands-on validation; do not ask them to test right now.
- PR #2 remains open, Draft and unmerged. Base `main` remains `aab010319b6500002844bd24b11da85dd9ca3b00`; do not modify `main` or merge.

This checkpoint supersedes older queued/in-progress status notes below. Older artifact records remain as build history.


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
- Latest app-code/test commit: `6afe4ccfde5f29085a3ad0f2079f0f6addbe5107`. It adds JavaScript and native Android RAM guardrails for imported GGUF files, with mock regression coverage. Current-source native builds are running; no artifact for this commit has been verified yet. Always inspect live Actions before using an APK.

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

## Latest verified status — 2026-11-04

- Latest app-code/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86` (idempotent already-loaded GGUF handling). `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`. PR #2 is open, Draft and unmerged.
- Current-source native APK build [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) succeeded for app commit `6afe4cc...`. It passed Android tool setup, pinned llama.kt and llama.cpp preparation, dependencies, web build, all regression checks, Capacitor sync, Gradle `assembleDebug` and artifact upload. Artifact: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, ID `13266781713`, 18,154,318 bytes. SHA-256: `d9ab6beafb65a6d570436fe1eeda959cdbbd55a608c5cde3f411b8e2c42583a7`. [Open the successful build](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331).
- The next source fix, `b967781...`, makes loading an already-active GGUF idempotent and adds a low-memory fake-plugin regression test. Its native workflow [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) was queued at the last check; its APK has not been built yet.
- Commit `6afe4cc` adds a conservative RAM estimate for imported GGUF files in the JavaScript loader and a second live-memory/low-memory check in Kotlin before native model loading. This is a heuristic, not a compatibility guarantee.
- A duplicate manual build [41706818257](https://github.com/babaprobado-bit/A-studio/actions/runs/41706818257) was cancelled; the successful PR run above is retained.
- No physical APK installation, GGUF import, native model load, inference or airplane-mode test has been performed. User currently has no phone/computer available for hands-on testing; defer device acceptance while continuing source/CI work.
- Offline model path: Android file picker imports an already-owned `.gguf` file. Copy the file to the phone first by USB, memory card or file sharing; import itself does not need internet. This path does not download or provide a model file.
- Local import writes to app-scoped `.part`, sanitizes the file name, enforces an 8 GB cap, checks free storage, reports progress approximately every 8 MB, rechecks storage approximately every 16 MB and validates the GGUF header before model-list insertion.
- Large local imports can now be cancelled in-app. Native code checks a cancellation flag during the copy, deletes the incomplete `.part` file and resolves the import as cancelled. The import picker can also be cancelled before file selection.
- DownloadManager model downloads also have an in-app cancel action and partial-file cleanup. The actual model-manager controls live in `index.html`; the test checks that screen and the JS event bindings, not just a detached HTML fragment.
- Recent commits: `6f10570` atomic partial download handling; `9400716` model-specific license details; `2e20d23` Android local file import; `562f8ea` import progress/storage checks; `4953749` import-listener cleanup; `5f2aca6` live index screen controls; `985a53f` actual-screen regression tests; `0a80834` cancel large local imports; `6afe4cc` RAM guardrails for imported GGUF files.
- Skill Library: 38 original starter instructions, backward-compatible profiles, additional presets, safe SKILL.md preview/import, multi-file queue, duplicate flags, BOM/CRLF handling, 100 custom Skill cap, eight-selection cap, strict 36k stage prompt budget and backup/restore tests.
- API Local Coder: mocked provider tests cover explicit consent, selected provider, exactly three stages, no retries/fallback, errors and secret boundaries. UI busy lock is acquired before async key lookup/consent; no real paid API calls were made.
- Model licensing: 0.5B/1.5B GGUF are tagged Apache-2.0; 3B GGUF is tagged `qwen-research` and warns about non-commercial research/evaluation. Model weights are not bundled in the APK.
- User reports no current internet. The USB/SD/file-picker path is useful when a `.gguf` file is already available locally. No physical installation, model load, local inference or airplane-mode test has been performed; CI and JS fakes do not prove device behavior.
- Continue source hardening and offline-first development while internet is unavailable. Keep PR #2 draft; never change `main` or merge without explicit instruction.

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
- Latest successful native GGUF build/artifact: https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560
- New-chat resume prompt: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/NEW_CHAT_STARTER.md
- Regular Android workflow: https://github.com/babaprobado-bit/A-studio/actions/workflows/build-android-demo.yml
- Native GGUF Android workflow: https://github.com/babaprobado-bit/A-studio/actions/workflows/build-android-local-coder.yml
- Latest native build: https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560

## Updating this memory

At the end of each conversation:
1. Update the relevant session document with what actually changed.
2. Update PROJECT_STATE.md and this status snapshot if branch, PR, commit, CI or tested behavior changed.
3. Commit the handoff update on the feature branch.
4. Leave the next session's prompt and exact starting task clear.
5. Do not mark a session complete until its deliverables are verified.
