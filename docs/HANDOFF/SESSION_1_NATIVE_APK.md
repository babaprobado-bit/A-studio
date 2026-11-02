# Session 1 of 4 — Finish native Android GGUF APK

> **Session 1 complete — 2026-11-02:** The Kotlin failure was fixed in commit [`ffc332e`](https://github.com/babaprobado-bit/A-studio/commit/ffc332eb9d21b616c3fcdb199b21dc6bf69dc1c8) by using `[.]` in the GGUF filename regex. Native build run [41389970211](https://github.com/babaprobado-bit/A-studio/actions/runs/41389970211) succeeded, and the latest branch-tip native build [41390410229](https://github.com/babaprobado-bit/A-studio/actions/runs/41390410229) also completed successfully on app-code commit `a30696ff29cdda2dfe43e27a77286e97be026914`. All 16 build/upload steps passed. Artifact: `AI-Studio-Alpha-1.1-OnDevice-LocalCoder-APK`, ID `13117996643`, ZIP size `18,129,889` bytes, expires `2026-11-16 05:04:48 UTC`. The downloaded ZIP passed integrity inspection (`testzip() == None`) and contains `app-debug.apk` (54,453,328 bytes). **This verifies CI build and artifact contents only; no physical-phone install or offline inference test has been done.** Session 2 is next.

## Goal
Make the optional native Android build actually compile and produce the GGUF-capable debug APK artifact. This session is about CI/build/plugin integration only; do not start broad Skill redesign or REA integration here.

## Mandatory starting steps
1. Read docs/HANDOFF/README.md and PROJECT_STATE.md.
2. Query live repo/PR and current branch head. Do not assume the last documented SHA is still current.
3. Query latest run for .github/workflows/build-android-local-coder.yml and inspect every job step.
4. If build already succeeded and artifact exists, verify artifact name/size/retention and skip duplicate build.
5. If failed, download exact run logs and work from the first real error.

## Relevant files
- .github/workflows/build-android-local-coder.yml
- scripts/patch-android-local-runtime.py
- android-local-runtime/LocalLlmPlugin.kt
- src/device-local-coder.js
- src/device-local-coder-panel.html
- src/main.js
- package.json
- src/skill-library.js

## Current native build facts
- Target: Android 10+ (minSdk 29) and 64-bit arm64-v8a.
- Native runtime: tensai-app/llama.kt, pinned SHA 1cbaffa1986b5a339482b33da4f7cd91db94e7e8.
- Engine CPU-first (nGpuLayers=0).
- NDK 27.2.12479018; Android platform/build-tools 35; Java 21; Node 20.
- Native app dependency includes project :llama-kt and explicit kotlinx-coroutines-core:1.9.0.
- Workflow builds llama.cpp Android sources via scripts/bootstrap.sh and scripts/build-opencl.sh.
- Model weights are not part of APK.

## Historical failures and fixes

| Failure | Root cause | Fix already committed | What remains |
|---|---|---|---|
| SDK setup failed | Setup action tried obsolete sdkmanager tools package. | Use runner's preinstalled SDK; explicit sdkmanager --install packages. | Verify current run. |
| Site test returned 404 | test:site ran before Vite built dist. | npm run build now comes before smoke tests. | Verify current run. |
| Native bridge patch failed | Generated Capacitor MainActivity was empty; script expected existing onCreate. | Commit 4b0c7b1 adds a Java/Kotlin onCreate when missing and registers plugin before super.onCreate. | Real generated project not yet verified after this fix. |
| Coroutines dependency risk | llama.kt declares coroutines implementation-only; bridge calls runBlocking/Flow. | Patcher adds app-level coroutines-core 1.9.0. | Confirm real Gradle build. |
| Kotlin compile failed at generated LocalLlmPlugin.kt line 40:53 | One literal backslash before `.gguf` formed unsupported Kotlin escape `\.`. | Commit `ffc332eb9d21b616c3fcdb199b21dc6bf69dc1c8` replaces the escaped dot with `[.]`. | Resolved and verified by successful native runs 41389970211 and 41390410229. |

Historical failed run: 41339891960 on SHA 4b0c7b1734611936f93c0764afb691e0f383a647. Its Kotlin error was resolved as documented above. The current verified successful native run is 41390410229; always check live GitHub status before relying on this snapshot.

## Verified build result and next action

1. The regex root cause was a single backslash before `.gguf`, which Kotlin rejected as an invalid string escape. The `[.]` fix is committed in `ffc332e`.
2. Native workflow run [41389970211](https://github.com/babaprobado-bit/A-studio/actions/runs/41389970211) succeeded on `ffc332e`.
3. Latest branch-tip native workflow run [41390410229](https://github.com/babaprobado-bit/A-studio/actions/runs/41390410229) succeeded on app-code commit `a30696ff29cdda2dfe43e27a77286e97be026914`; Gradle `assembleDebug` and artifact upload both passed.
4. Artifact `AI-Studio-Alpha-1.1-OnDevice-LocalCoder-APK` (ID `13117996643`) is available from the run page until `2026-11-16 05:04:48 UTC`.
5. ZIP integrity was checked and the archive contains `app-debug.apk` (54,453,328 bytes). The APK is a debug build, not a signed production release.
6. Continue with Session 2 physical-device testing. Do not claim native phone support or offline inference until tested on a real compatible device.

## Risks to inspect
- Patcher Gradle plugin versions and generated project layout.
- Pinned llama.kt Kotlin API signatures versus bridge usage.
- Native runtime libraries/ABIs packaged and discoverable in APK.
- MainActivity package and Gradle configuration handled in real Capacitor template.
- Whether OpenCL step is necessary for CPU-only inference.
- Engine lifecycle and freeing on activity destroy/model replacement.
- Download failures, partial files, retries, duplicates, low storage/memory, interrupted downloads.
- Verify model URLs, actual size/hash, GGUF compatibility and model license.
- App-wide usesCleartextTraffic=true is broader than a host-specific Ollama allowlist.

## Session exit criteria
- [x] Native GitHub Actions run completes successfully.
- [x] Artifact name and downloadable APK archive verified; ZIP contains app-debug.apk.
- [x] Kotlin/Gradle/NDK patcher checks pass on generated Capacitor project through the real APK build.
- [x] Regular Android workflow and web regression checks pass.
- [x] PROJECT_STATE.md, README.md, handoff index and this note are updated.
- [x] Next session is scoped to physical-device testing.

## Copy-ready prompt for next conversation

Use resume code `AI-STUDIO-ALPHA1-SESSION2-APK-READY`. Continue AI Studio Alpha 1 in `babaprobado-bit/A-studio`. Read `docs/HANDOFF/NEW_CHAT_STARTER.md`, `docs/HANDOFF/README.md`, `docs/HANDOFF/PROJECT_STATE.md` and `docs/HANDOFF/SESSION_2_DEVICE_TESTING.md`. Verify the live feature branch, PR #2 and latest native workflow before doing anything. Session 1 is complete: native GGUF APK workflow 41390410229 succeeded and artifact 13117996643 contains `app-debug.apk`. The next scope is real-phone testing only. Do not claim offline inference or physical-device support before the phone test. Preserve all existing features, work only on `feature/android-offline-skills-v1`, keep PR #2 draft, never change `main`, and update handoff docs with verified results.
