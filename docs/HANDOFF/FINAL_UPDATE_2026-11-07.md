# AI Studio — final CI and APK update (2026-11-07)

## Verified Android build results

The following GitHub Actions results were checked on 2026-11-07. Both builds ran from source/test commit `1e59e4bf9e30bc94fe0a323f4189ef01bad0dff1` on `feature/android-offline-skills-v1`.

### Native GGUF / on-device Local Coder APK

- Workflow: [Build Android APK with on-device Local Coder](https://github.com/babaprobado-bit/A-studio/actions/runs/42283873400)
- Run ID: `42283873400`
- Result: **success**
- Gradle output: `BUILD SUCCESSFUL in 13m 46s`; 180 actionable tasks executed.
- Native llama.kt / llama.cpp Android build completed for the `arm64-v8a` ABI in this runner.
- Artifact: [AI-Studio-1.1-OnDevice-LocalCoder-APK](https://github.com/babaprobado-bit/A-studio/actions/runs/42283873400/artifacts/13538300337)
- Artifact ID: `13538300337`
- Uploaded artifact size: `18,159,448 bytes`
- Uploaded artifact archive SHA-256: `0588ceaadbc307cbb6cf7c7945743efb103c41b684c5bf1df79011dbe2536e5a`
- Artifact expiry: 2026-11-20 20:12:23 UTC.

The build log contains non-fatal upstream/toolchain warnings (including an OpenCL target-version warning and deprecated C++ APIs); Gradle nevertheless completed successfully and the artifact upload was finalized. The digest above is the uploaded GitHub artifact archive digest, not a separately calculated digest of the extracted APK file.

### Demo APK

- Workflow: [Android Demo APK](https://github.com/babaprobado-bit/A-studio/actions/runs/42283873011)
- Result: **success**
- Artifact: [AI-Studio-Demo-APK](https://github.com/babaprobado-bit/A-studio/actions/runs/42283873011/artifacts/13536267896)
- Artifact ID: `13536267896`
- Uploaded artifact size: `3,775,874 bytes`
- Uploaded artifact archive SHA-256: `a6f1ad9d5ede4d23c5c79a33dbddbf681714312ba9e105e464cfcdc70505d078`
- Artifact expiry: 2026-11-20 19:57:28 UTC.

## What CI proves — and does not prove

- The GitHub runner completed web checks, regression suites, Capacitor Android project generation/sync, native Gradle debug APK packaging and artifact upload for the corresponding workflows.
- The Native workflow ran project regression checks before building the APK, including the REA Companion contract mock tests.
- **No physical Android device installation, first launch, model import, GGUF inference, RAM/performance measurement or airplane-mode/offline inference test has been performed.** CI success must not be described as proof of those behaviors.
- The native workflow is an Android debug build, not a signed production release.

## Repository and PR state

- Feature branch: `feature/android-offline-skills-v1`
- Current branch HEAD at verification: `7d3d27557b1be17d15c3c1fe5c0d25be0e0d2e1c`
- Build source/test commit: `1e59e4bf9e30bc94fe0a323f4189ef01bad0dff1` (the later branch HEAD contains a documentation-only checkpoint on top).
- `main` remains at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains **open, Draft, and unmerged**: https://github.com/babaprobado-bit/A-studio/pull/2
- Do not merge or mark ready without the user's explicit approval.

## REA Companion boundary

REA remains optional and mock-only in this repository. No REA package was installed or launched, no real MCP connection or listener was created, and no user project files or external services were accessed. The fake pairing/session tests and pure contract validator are not proof of a production companion.

## Next work

1. Review APK packaging metadata and app configuration in source; distinguish build-time evidence from device-only verification.
2. Continue static review of Local Coder model selection/import/inference paths, memory safeguards and lifecycle handling without claiming device validation.
3. Keep the AI Team's ten engines, all provider connections, Skills/context transfer and existing features intact.
4. Continue security review of the optional REA bridge; do not install/connect/execute or forward user data without explicit approval.
5. Run CI again after any source changes. Keep PR #2 Draft and do not touch `main` or merge without explicit approval.

This file supersedes the earlier status sentence in `SESSION_4_REA_MCP_AND_RELEASE.md` that said Native build 42283873400 was still running and no Native APK artifact existed.


## Session 5 follow-up — 2026-11-08

The 2026-11-07 successful artifacts above remain valid for source commit `1e59e4bf...`. They are not the latest Session 5 APK outputs. Session 5 changes and current CI are documented in [SESSION_5_ANDROID_RUNTIME_HARDENING.md](SESSION_5_ANDROID_RUNTIME_HARDENING.md): latest branch HEAD `02dff885...`, Demo run `42470598165` passed with artifact `13613322995`, while Native run `42470598002` was still in the debug APK build step at the last check. Re-fetch live Actions before claiming a Native artifact.


## Session 5 current checkpoint — 2026-11-08 (latest recheck)

- Latest source/test commit at verification: 90e5da287cc8d50859402cdbf99ccdb533e3360a.
- Demo workflow [42472155238](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238) succeeded on 90e5da. Artifact ID 13613679600, 3,776,220 bytes, archive SHA-256 c49230bbcc6a98922d6056d7daacb34a944cf288837c7f65b89b537212ef4f77. Downloaded archive digest matched; extracted APK 4,134,919 bytes, SHA-256 9933e6bad111f2bce75f071d54c9016f2525ed04ccb919c07aa30032894c02d2. Demo has no llama runtime.
- Native GGUF workflow [42472155008](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155008) passed SDK/native setup, llama.kt, llama.cpp, all regression suites, web build and Capacitor sync. At the last check the Gradle debug APK retry step was still running; no Native artifact had been reported.
- Latest source improvements include durable pending-download recovery after process death, rehydrating/resuming the original DownloadManager task without duplicate enqueue, preservation of an active task when a different model is selected, native catalogue/storage verification, orphan partial cleanup and import cancellation at Activity teardown. See SESSION_5_ANDROID_RUNTIME_HARDENING.md.
- Branch remains feature/android-offline-skills-v1; PR #2 open/Draft/unmerged; main unchanged. No physical Android install/inference/airplane-mode test. REA is mock-only.
