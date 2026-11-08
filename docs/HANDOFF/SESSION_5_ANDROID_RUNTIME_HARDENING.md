# AI Studio — Session 5 Android runtime hardening

## Latest Session 5 update — 2026-11-08 (90e5da source/test checkpoint)

- Latest source/test commit: [90e5da287cc8d50859402cdbf99ccdb533e3360a](https://github.com/babaprobado-bit/A-studio/commit/90e5da287cc8d50859402cdbf99ccdb533e3360a).
- Download crash recovery was added in android-local-runtime/LocalLlmPlugin.kt: a pending marker is durably committed before DownloadManager enqueue; on next refresh a pending record is reconciled by querying DownloadManager and matching the unique title, then its ID is stored. If the service query fails, the pending marker and partial file are retained. Orphan cleanup skips active imports and pending/download-tracked files.
- listActiveDownloads now exposes persisted Android task IDs. src/device-local-coder.js restores the task after app restart and resumes polling the existing ID rather than enqueueing a duplicate. src/main.js shows a resume action for the same model and a cancel option; selecting a different model does not discard the restored active task.
- Regression coverage in scripts/test-device-local-coder.mjs includes pending-marker recovery structure, DownloadManager title/ID matching, restart rehydration, original-task resume (zero duplicate enqueue), selecting another model without losing the active ID, process-teardown import cancellation and native catalogue/storage checks.
- The first restart-test revisions exposed two test-only errors in CI (a forward reference and undefined source-fixture identifiers). Both were corrected; the latest Demo workflow passed the full device Local Coder bridge suite including the restart coverage.
- Demo run [42472155238](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238) **success** on 90e5da. Artifact [AI-Studio-Demo-APK](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238/artifacts/13613679600), ID 13613679600, archive size 3,776,220 bytes, SHA-256 c49230bbcc6a98922d6056d7daacb34a944cf288837c7f65b89b537212ef4f77. Downloaded ZIP digest matched; it contains app-debug.apk, 4,134,919 bytes, APK SHA-256 9933e6bad111f2bce75f071d54c9016f2525ed04ccb919c07aa30032894c02d2. This Demo APK has no llama runtime.
- Native run [42472155008](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155008) passed native toolchain/llama.kt/llama.cpp preparation, existing and new regression suites, web build and Capacitor sync; the retry-aware Gradle debug APK build was still active at last check with no artifact reported. Recheck live state.
- The latest workflow Gradle step pins 8.11.1, uses -bin.zip, Aliyun mirror and upstream distributionSha256Sum, network timeout 120s; it retries only transient network/DNS errors, not compile errors. Prior transient 504 and DNS experiments are historical failed attempts.
- Compare from the Session 5 starting HEAD bacdc233... to 90e5da shows 12 paths changed: the two Android workflows, LocalLlmPlugin.kt, device Local Coder JS, main UI, its regression test, and six handoff docs. No AI Team provider/router, Skills Library, or shared context source files changed.
- PR #2 remains open/Draft/unmerged; main remains aab010319b6500002844bd24b11da85dd9ca3b00. CI is not device acceptance. No physical install, actual GGUF inference, RAM benchmark or airplane-mode test; REA remains mock-only.

---


**Checkpoint date:** 2026-11-08  
**Repository:** https://github.com/babaprobado-bit/A-studio  
**Branch:** `feature/android-offline-skills-v1`  
**PR:** https://github.com/babaprobado-bit/A-studio/pull/2 (must remain open, Draft and unmerged)

## Live repository checkpoint

- Latest branch HEAD at this checkpoint: [`02dff8855b15085d993144da4cf1d5e839105614`](https://github.com/babaprobado-bit/A-studio/commit/02dff8855b15085d993144da4cf1d5e839105614).
- Latest application/runtime hardening commit: [`0ac56447218a5e7e4297b9adb315597367acb1b1`](https://github.com/babaprobado-bit/A-studio/commit/0ac56447218a5e7e4297b9adb315597367acb1b1). The later commits on top update only the two Android CI Gradle distribution steps.
- `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 was rechecked after the latest commit: state `open`, `draft=true`, `merged=false`, base `main`.

## Session 5 source changes

1. `android-local-runtime/LocalLlmPlugin.kt`
   - Download reconciliation no longer returns early when the DownloadManager preference store is empty. The orphan `.gguf.part` sweep can therefore clean partial files left after process death/force-stop.
   - Activity teardown signals active SAF import cancellation flags before queuing engine disposal and shutting down the single-thread executor.
   - Native DownloadManager calls now have an independent fixed catalogue for the three supported Qwen2.5-Coder GGUF files. Exact filename, HTTPS URL and SHA-256 must match; the native bridge also checks at least 115% of the catalogued file size is available before enqueueing.
2. `src/device-local-coder.js`
   - A missing/zero/non-finite free-storage value now fails closed. It does not call the native download bridge unless the storage reading is known and sufficient.
   - The preflight reserve is calculated from the immutable catalogue model size, rather than caller-supplied model fields.
3. `scripts/test-device-local-coder.mjs`
   - Added regression assertions for orphan partial cleanup, preserving active imports, cancellation during Activity teardown, native catalogue/URL/hash enforcement and native storage enforcement.
   - Added mocked JS tests proving unknown and insufficient free storage do not start DownloadManager.
   - The first version of one structural assertion was too strict about intervening Kotlin comments; CI exposed that test-only false negative, the expression was corrected, and the later run passed.

## Android workflow hardening

Both `.github/workflows/build-android-demo.yml` and `.github/workflows/build-android-local-coder.yml` now:

- Use Gradle 8.11.1's smaller `-bin.zip` distribution instead of `-all.zip`.
- Set wrapper `networkTimeout=120000`.
- Use the listed Aliyun Gradle distribution mirror and pin Gradle's official 8.11.1 binary SHA-256 in `distributionSha256Sum` (`f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6`). The wrapper must reject a checksum mismatch.
- Keep Gradle version pinned at 8.11.1; the workflow does not silently switch to the runner's newer preinstalled Gradle.

The other tried hosts failed in this GitHub runner environment: `services.gradle.org` and `downloads.gradle.org` redirected to GitHub Releases and received HTTP 504; `downloads.gradle-dn.com` failed DNS resolution. The Aliyun-backed Demo run below passed all build steps, proving that path worked for that run. It does not by itself prove the Native run has completed.

## Current CI and artifact evidence

### Demo APK — current Session 5 workflow

- Run [42470598165](https://github.com/babaprobado-bit/A-studio/actions/runs/42470598165): **success** on HEAD `02dff8855b15085d993144da4cf1d5e839105614`.
- Passed Node/Java setup, install, website and manifest checks, Vite build, Local Coder/workspace tests, Skills tests, device Local Coder bridge regression tests, REA contract mock tests, private website/login gate, Capacitor Android generation/sync, Gradle debug APK build and artifact upload.
- Artifact: [`AI-Studio-Demo-APK`](https://github.com/babaprobado-bit/A-studio/actions/runs/42470598165/artifacts/13613322995), ID `13613322995`, archive size **3,775,895 bytes**, archive SHA-256 `2dca7141b3b282d9d380979417cbe17098fa36962f11492c0fd96931357c721c`, expires 2026-11-22 10:18:41 UTC.
- Artifact downloaded and inspected: archive contains `app-debug.apk` (4,134,417 bytes); extracted APK SHA-256 is `a316bfcb194146b05b18b48664adf566e8e8d6044bac0cdd5db64af1e9969782`. This is the **Demo** package and has no llama runtime.

### Native GGUF APK — pending at last check

- Run [42470598002](https://github.com/babaprobado-bit/A-studio/actions/runs/42470598002) on the same HEAD `02dff8855b15085d993144da4cf1d5e839105614`.
- Android SDK/native build tools, pinned llama.kt fetch, llama.cpp Android source preparation, web build, all regression suites, Capacitor Android project generation, Gradle preparation and Capacitor sync all passed.
- At the last live check, **Build debug APK was still in progress**; no conclusion and no Native artifact had been reported. Re-fetch the run, job logs and artifact list before claiming success.
- Earlier Native attempts on older Session 5 workflow commits stopped at external Gradle distribution download/network failures (HTTP 504 or DNS); their test/native-source preparation stages had passed. Those failures are not Kotlin compiler results.

### Previous successful baseline (not the latest Session 5 source)

The user-provided 2026-11-07 checkpoint remains valid for its own source commit `1e59e4bf9e30bc94fe0a323f4189ef01bad0dff1`:
- Demo run [42283873011](https://github.com/babaprobado-bit/A-studio/actions/runs/42283873011), artifact ID `13536267896`, archive size 3,775,874 bytes.
- Native run [42283873400](https://github.com/babaprobado-bit/A-studio/actions/runs/42283873400), success, artifact ID `13538300337`, archive size 18,159,448 bytes, archive SHA-256 `0588ceaadbc307cbb6cf7c7945743efb103c41b684c5bf1df79011dbe2536e5a`.
These artifacts belong to commit `1e59e4bf...`, not to the newer Session 5 source commit.

## APK configuration and acceptance boundary

- Product/display name: AI Studio. Capacitor app ID remains `com.aistudio.alpha1` for install/update compatibility.
- Native runtime configuration generated by `scripts/patch-android-local-runtime.py`: Android minSdk 29, compile SDK 35, NDK 27.2.12479018, arm64-v8a only, llama.kt bridge, Kotlin 2.0.21 and versionCode 2 / versionName 1.1.0.
- Native artifact is a debug APK and has no GGUF weights embedded. Runtime model download/import is separate.
- The older verified Native APK for commit `1e59e4bf...` contained the arm64 llama runtime; the Demo APK does not. Do not describe Demo as an on-device GGUF runtime package.
- Generated manifest configuration currently allows cleartext traffic for the existing trusted-LAN PC Ollama path. This is broad app-level permission and must be narrowed/reviewed before a production release without breaking explicit LAN Ollama functionality. Review backup behavior and exclude credentials/session secrets from Android backup. The current workflow outputs are debug APKs, not signed production releases.
- CI proves only the automated tests and packaging performed by the GitHub runner. **No physical phone installation, first launch, real GGUF import, inference, RAM/performance measurement or airplane-mode test has been performed.** Never present CI success as device/offline acceptance.

## Model / lifecycle review

- Three catalogue models use fixed SHA-256 pins: Qwen2.5-Coder 0.5B, 1.5B and 3B Q4_K_M.
- Native catalogue download requires exact filename + URL + SHA, HTTPS Hugging Face scheme/host, at least 115% catalogue-size free storage, DownloadManager tracking and SHA-256 verification of the staged partial file before promoting it to `.gguf`.
- Local imported GGUF is a separate user-selected SAF file flow; it does not require catalogue hash but enforces the native 8 GB cap, declared-size and actual copied-byte checks, storage reserve, cancellation checkpoints and partial-file cleanup.
- Model selection considers supported ABI/API, device memory, free storage, low-memory signal and CPU count. Native load validates GGUF magic, refuses low-memory state and applies a conservative RAM estimate before CPU-only llama.kt load (`nGpuLayers=0`); context size is clamped to 1024–4096.
- Replacement frees the old engine before evaluating RAM for the next model; explicit unload frees the engine and clears loaded state. Activity teardown cancels active imports and queues engine disposal.
- JS fake-plugin tests and native source assertions cover these guardrails. They are not a substitute for a real device test.

## AI Team, Skills and REA preservation

- All ten AI Team engines and their provider adapters/connections remain in place.
- Shared project/vault context and Skills Library paths remain in place; Local Coder's device/API/Ollama modes remain.
- The Session 5 commits were scoped to the two native/model files, the device bridge regression test and two Android workflow definitions. No provider implementation, AI Team router, Skills Library, shared project context or user-data store was replaced.
- REA Companion remains **mock-only**. No package installation, process, listener, pairing, MCP session or real connection was started; no user project files or external providers were accessed. Do not install or connect REA without explicit approval.

## Next Session checklist

1. Re-fetch current branch HEAD, PR #2 and both latest Actions runs/artifacts.
2. Finish diagnosis of Native run `42470598002`; inspect the actual Gradle/Kotlin output if it completes or fails. Do not infer success from an in-progress job.
3. If Native APK succeeds, verify artifact digest, extract APK and inspect manifest/package/version/ABI/native libraries, and keep the artifact linked to exact source SHA.
4. Continue native lifecycle, model memory/unload and Android backup/cleartext review; retain AI Team/Skills/shared-context behavior.
5. Update this file and the index/starter with exact changed paths, tests, commit and run/artifact results.
6. Keep PR #2 open and Draft. Never modify `main`, merge, or install/connect REA.

