# Session 1 of 4 — Finish native Android GGUF APK

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
| Kotlin compile failed at generated LocalLlmPlugin.kt line 40:53 | Gradle reports Unsupported escape sequence on filename-validation Regex. The GitHub source readback appears to contain two backslashes before .gguf, which should be a valid Kotlin string escape. | Not fixed yet. The previous patcher/MainActivity/SDK/test-order issues are already past this point. | Compare source bytes and generated Android copy; find where the escape is reduced/interpreted. Add a deterministic test/assertion and rerun native workflow. |

Latest known run at handoff creation: run 41339891960, manually dispatched for SHA 4b0c7b1734611936f93c0764afb691e0f383a647. It completed failure at :app:compileDebugKotlin after 2m 8s; all earlier steps passed. Exact message: generated android/app/src/main/java/com/aistudio/alpha1/LocalLlmPlugin.kt:40:53 Unsupported escape sequence. No native artifact was uploaded. Re-check live status and current branch head.

## Exact work order
1. Confirm current run status and PR head SHA.
2. If failed, download log archive and isolate the failing step; don't guess from generic failure.
3. First reproduce the Kotlin compiler error. Inspect line 40 in committed android-local-runtime/LocalLlmPlugin.kt and, in the generated Android project before Gradle, inspect android/app/src/main/java/com/aistudio/alpha1/LocalLlmPlugin.kt byte-for-byte (repr/hex or compiler snippet). GitHub source readback appeared to have two backslashes before .gguf, while Gradle says Unsupported escape sequence. Find the transformation/discrepancy before changing escaping blindly.
4. Validate patcher against actual generated android/ tree or reproduce with same Capacitor 7.4.0 template.
4. Fix only actual error. Add test/fixture for every patcher regression.
5. Run: npm run build; npm run test:workshop; npm run test:site; npm run test:skills; npm run test:device-local-coder.
7. Run npx cap add android, patcher, npx cap sync android, then ./gradlew --no-daemon assembleDebug.
8. Verify artifact AI-Studio-Alpha-1.1-OnDevice-LocalCoder-APK exists and contains app-debug.apk.
9. Update docs and PR description with exact status. This is a debug APK, not signed production release.

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
- [ ] Native GitHub Actions run completes successfully.
- [ ] Artifact name and downloadable APK verified.
- [ ] Kotlin/Gradle/NDK patcher checks pass on generated Capacitor project.
- [ ] Regular Android workflow and web tests do not regress.
- [ ] PROJECT_STATE.md, README.md and this note are updated.
- [ ] Next session starts with physical-device testing.

## Copy-ready prompt for next conversation

We are on AI Studio Alpha 1. Read docs/HANDOFF/README.md, docs/HANDOFF/PROJECT_STATE.md and docs/HANDOFF/SESSION_1_NATIVE_APK.md in babaprobado-bit/A-studio. Inspect the live feature branch feature/android-offline-skills-v1, PR #2 and latest native Android workflow before editing. Finish the GGUF/llama.kt Android debug APK build. Use actual GitHub Actions logs, not guesses. Preserve all existing features, never edit main directly, and update handoff docs with verified results. Do not claim physical-device support yet.
