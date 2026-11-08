# Session 5 current checkpoint — 2026-11-08

## Session 5 current verified checkpoint — Native + Demo APKs

- Source/test SHA: 90e5da287cc8d50859402cdbf99ccdb533e3360a.
- Demo run 42472155238: SUCCESS. Artifact 13613679600, ZIP 3,776,220 bytes, SHA-256 c49230bbcc6a98922d6056d7daacb34a944cf288837c7f65b89b537212ef4f77. Extracted APK 4,134,919 bytes, SHA-256 9933e6bad111f2bce75f071d54c9016f2525ed04ccb919c07aa30032894c02d2. No llama runtime in Demo.
- Native run 42472155008: SUCCESS. All regression, llama.kt/llama.cpp, Gradle, assembleDebug and upload steps passed. Artifact 13614626123, ZIP 18,158,764 bytes, SHA-256 b1f7421d9b8d7f10a8d38301b9abda2597daa073657d5ecc8fa6871123304c4f.
- Extracted Native APK 54,497,680 bytes, SHA-256 cb1ce07516acca97033630cd7d3004b85a9125823045f11274888e729a1e8d8e. Contains arm64-v8a/libllamakt.so (43,535,488 bytes), libOpenCL.so and libc++_shared.so; no GGUF model weights are embedded.
- Manifest: package com.aistudio.alpha1; versionCode 2; versionName 1.1.0; minSdk 29; targetSdk 35; compileSdk 35. Debuggable=true, allowBackup=true, usesCleartextTraffic=true. This is a debug APK, not a signed release. Preserve LAN Ollama while reviewing a scoped cleartext policy and backup exclusions before release.
- First Gradle attempt hit an HTTP 502 resolving Kotlin 2.0.21 from a GitHub Releases redirect; retry succeeded. BUILD SUCCESSFUL in 13m 44s; 180 tasks executed.
- Session 5 source hardening includes native GGUF allowlist/hash/storage validation, orphan partial cleanup, crash-safe DownloadManager pending recovery, restart/resume without duplicate enqueue, import cancellation on teardown and regression coverage.
- PR #2 open/Draft/unmerged. main unchanged at aab010319b6500002844bd24b11da85dd9ca3b00. No physical-device installation, real GGUF inference, RAM test or airplane-mode test. REA remains mock-only.



# Latest working checkpoint — 2026-11-06 (REA contract mock tests added)

- Feature branch: `feature/android-offline-skills-v1`. This change adds only the isolated REA bridge contract validator, mock-only tests, package script, CI wiring and handoff documentation; it does not connect REA or alter existing AI Studio runtime flows.
- Local check: Node.js 22.16.0 `node --check` passed for the new module/test and `node scripts/test-rea-companion-contract.mjs` passed in an isolated fixture. This is not yet hosted CI evidence for the new commit.
- The contract test covers three read-only operation schemas, selected relative-path enforcement, project registration, request/result caps, exact disclosure, no automatic model-provider forwarding, sanitized error envelopes and exact loopback origin/Host validation.
- No `rea-agents` dependency, listener, network request, MCP connection, REA process, project-file access, app UI wiring or external side effect was added. Pairing/session-token lifecycle and a real companion remain unimplemented.
- Existing AI Team 10-provider paths, provider connections, Skills/context routes, Ollama and GGUF Local Coder remain untouched. No physical-device or offline inference test was performed.
- `main` must remain unchanged; PR #2 stays open, Draft and unmerged. Do not merge or mark ready without explicit approval.

---

# Latest verified checkpoint — 2026-11-06 (Native GGUF CI completed)

- Latest application/source commit tested: [c9b3d4c8ac2335a37afe054a49fccb672774314c](https://github.com/babaprobado-bit/A-studio/commit/c9b3d4c8ac2335a37afe054a49fccb672774314c). Subsequent branch commits are handoff-document-only; re-fetch the branch head before continuing.
- Demo workflow [42262971664](https://github.com/babaprobado-bit/A-studio/actions/runs/42262971664) **completed successfully** on c9b3d4c. Artifact `AI-Studio-Demo-APK`, ID `13525991499`, 3,775,868 bytes; ZIP digest `sha256:7ac4eda88327ac172eda84aaa5b5bd84a03725ee4c5bda57f911cec8418b51c1`.
- Native GGUF workflow [42262972234](https://github.com/babaprobado-bit/A-studio/actions/runs/42262972234) **completed successfully** on the same source commit. All 16 workflow steps passed, including pinned llama.kt setup, llama.cpp Android source preparation, regression tests, Capacitor sync, Gradle debug APK build and artifact upload. Native artifact `AI-Studio-1.1-OnDevice-LocalCoder-APK`, ID `13525683883`, artifact archive size 18,159,442 bytes, ZIP digest `sha256:2adf39fa441788ff566e178ba9ff3638008b14a30f991ff747ecc5a5515fd6fa`; expires 2026-11-20 17:51:03 UTC.
- Both CI workflows verify automated tests/build/package on GitHub-hosted runners only. No physical-phone installation, local GGUF inference, or airplane-mode/offline acceptance test has been performed. Do not present CI as proof of real-device or offline operation.
- Feature branch: `feature/android-offline-skills-v1`. Before this documentation refresh, branch head was `89ed3ff882861f2a9160e0573f374c6d71096334`; this refresh adds documentation-only commits after that point. `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains **open, Draft and unmerged**: https://github.com/babaprobado-bit/A-studio/pull/2. Do not merge or mark ready without explicit user approval. The GitHub integration returned HTTP 403 for PR-body update; these handoff files are the detailed source of truth until that permission issue is resolved.
- Preserve all 10 AI Team engines, provider connections, project/vault/Skills context routes, Local Coder API/Ollama/GGUF paths, and existing features. User has no internet for local/device validation; continue through code and hosted CI without asking for a phone/PC test.

---

# AI Studio — Project state and technical handoff

## Latest verified checkpoint — 2026-11-06 (CI refresh)

- Feature source commit under test: [c9b3d4c](https://github.com/babaprobado-bit/A-studio/commit/c9b3d4c8ac2335a37afe054a49fccb672774314c).
- Latest handoff docs commit before this refresh: [b5589e8](https://github.com/babaprobado-bit/A-studio/commit/b5589e880d84c62ce5778da7789b212817edef41).
- Demo workflow [42262971664](https://github.com/babaprobado-bit/A-studio/actions/runs/42262971664) **passed** on c9b3d4c. All source/regression steps (including Local Coder/workspace, Skills, device GGUF bridge, site gate), Vite, Android/Capacitor setup and Gradle debug APK + upload passed.
  - Artifact: AI-Studio-Demo-APK, ID 13525991499, 3,775,868 bytes.
  - GitHub artifact digest: sha256:7ac4eda88327ac172eda84aaa5b5bd84a03725ee4c5bda57f911cec8418b51c1
- Native GGUF workflow [42262972234](https://github.com/babaprobado-bit/A-studio/actions/runs/42262972234) is still **in progress** at the last check. llama.kt, llama.cpp source preparation, dependency install, Vite, all regression checks (including new import-size and load-listener tests), Capacitor generation/sync and trusted-LAN Ollama setup passed. Gradle debug APK build was running; no Native artifact had appeared yet.
- Do not infer a Native APK success until run 42262972234 completes and an artifact is listed.
- Source checkpoint c9b3d4c and handoff checkpoint b5589e8 are on feature/android-offline-skills-v1. main remains aab010319b6500002844bd24b11da85dd9ca3b00.
- PR #2 remains open, Draft and unmerged. The PR body update endpoint returned 403 to the connected GitHub integration; these handoff documents are the current detailed checkpoint.
- No physical-device install, local GGUF inference, or airplane-mode test was performed. CI is not proof of offline/device operation.


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


## Current verified checkpoint — 2026-11-05

- Latest application/test commit: `794901f968aec39f6c5d1959a5e79d0ddc71db35`. Latest handoff-documentation commit before this update: `e5dc039738938900c615a07d717a7190c52e9077`.
- AI Team has **10 selectable engines**: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter, Hugging Face Inference, custom OpenAI-compatible API, PC Ollama, and **on-device Android GGUF**. No four-provider cap remains. “Tüm AI sağlayıcılarını takıma ekle” includes all entries. Existing saved selections containing all nine previous providers are migrated to include the phone GGUF entry.
- The phone GGUF engine is integrated in single chat, parallel team, sequential pipeline and model comparison. Live calls include it only when the app is native Android and a GGUF model is loaded into memory. An unloaded or unsupported device provider is skipped in live runs. Demo mode returns templates, not model inference.
- Demo workflow [42066474047](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474047) completed successfully for `794901f...`. All checks, Capacitor sync, Gradle APK build and artifact upload passed. Artifact `AI-Studio-Demo-APK`, ID `13434472811`, size **3,774,850 bytes**, artifact SHA-256 `215985c43a5d7813952e5f187ec0ac95d29d4f470512372c40602a20c854d3d7`. [Demo build](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474047).
- **Native GGUF workflow [42066474388](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474388) completed successfully** for app-code commit `794901f...`. Android tool setup, pinned llama.kt fetch, llama.cpp preparation, Vite build, all regression checks, Capacitor generation/sync, Gradle debug APK and artifact upload all passed.
- Latest native artifact: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, ID `13435042754`, size **18,156,804 bytes**, artifact SHA-256 `a6b30af35b016aec390b1662dfc9f66ca29cbf3a88e6555c4c95a1612c378f69`. Created 2026-11-05 16:54:26 UTC; expires 2026-11-19 16:54:24 UTC. [Native GGUF build and artifact](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474388). This is the native GGUF APK, not the demo artifact.
- PR #2 remains open, Draft and unmerged. Base `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`. Do not modify `main` or merge without explicit user approval.
- No physical APK installation, GGUF import/load, actual on-device inference, or airplane-mode test has been performed. User currently has no device/computer available for hands-on testing; do not ask them to test now. CI proves automated checks and APK packaging only, not device compatibility or offline inference.

This checkpoint supersedes older queued-build notes above; keep older artifact records as history.


## Current verified checkpoint — 2026-11-05

- Latest app-code/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86`. Native workflow [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) completed successfully, including all regression checks, Capacitor generation/sync, Gradle `assembleDebug` and artifact upload.
- Latest native GGUF APK: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, artifact ID `13351543088`, **18,154,391 bytes**. SHA-256: `65b16549595534ba9996223cb99c29e1cbf3cee79fcb25a76017bad8a75598ee`. Artifact was created 2026-11-04 18:29:28 UTC and expires 2026-11-18 18:29:26 UTC. [Open the successful native build and download its artifact](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742).
- This APK is built from `b967781...` and includes the already-loaded-model idempotent-load fix plus the prior imported-GGUF RAM guardrails. It is the current native artifact; do not confuse it with the smaller demo APK.
- GitHub Actions proves regression/build/package success only. No physical install, Android GGUF import/load, actual on-device inference or airplane-mode test has been performed. The user currently has no phone/computer available for hands-on validation; do not ask them to test right now.
- PR #2 remains open, Draft and unmerged. Base `main` remains `aab010319b6500002844bd24b11da85dd9ca3b00`; do not modify `main` or merge.

This checkpoint supersedes older queued/in-progress status notes below. Older artifact records remain as build history.


## Latest continuation status — 2026-11-04

- Product is **AI Studio**; keep Android ID `com.aistudio.alpha1`.
- Latest app-code/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86`; it makes already-loaded GGUF load calls idempotent and adds a fake-plugin low-memory regression. The follow-up native build [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) was queued at last check.
- Base `main` remains `aab010319b6500002844bd24b11da85dd9ca3b00`. PR #2 stays open, Draft and unmerged.
- Current-source native build [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) succeeded for app SHA `6afe4cc...`; APK artifact `13266781713`, `AI-Studio-1.1-OnDevice-LocalCoder-APK`, 18,154,318 bytes. SHA-256 `d9ab6beafb65a6d570436fe1eeda959cdbbd55a608c5cde3f411b8e2c42583a7`. This artifact includes the GGUF engine and imported-model RAM guard but predates the `b967781` idempotent-load fix.
- The successful run passed native source preparation, web build, all five regression commands, Capacitor setup/sync, Gradle `assembleDebug` and artifact upload. It proves APK compilation/packaging, not physical-device execution.
- Last successful APK pair is older source SHA `9400716...`: native [41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560), artifact `13205399062`; demo [41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607).
- Offline GGUF transfer: Android `ACTION_OPEN_DOCUMENT` imports an existing `.gguf` file. The user can copy a model file to the phone by USB, SD card or file sharing; app import itself needs no internet. Model weights are not bundled or created by this flow.
- Local import uses app-scoped `.part`, sanitized filenames, an 8 GB maximum, free-space checks, progress notifications ~8 MB, rechecks ~16 MB, source-size check and GGUF magic verification before installed-model insertion.
- Large local imports now have an in-app cancel button. Native copy checks an AtomicBoolean cancellation flag during streaming, removes the partial file and resolves as cancelled. DownloadManager downloads also have an in-app cancel path.
- The actual model-manager UI lives in `index.html`; license/import/download-cancel/local-import-cancel controls and their handlers are statically checked by the regression suite.
- Skills Library: 38 original instructions, safe multi-file SKILL.md import/preview, duplicate flags, BOM/CRLF, metadata, caps, backups and regression tests.
- API Local Coder: explicit consent, fixed Plan/Code/Review sequence, fake-provider tests, no retry/fallback and pre-await busy lock; no paid API request was made.
- Model license information is visible: 0.5B/1.5B Apache-2.0, 3B Qwen Research/non-commercial warning.
- User currently has no phone/computer available for hands-on testing. Continue source development and GitHub-hosted CI/mock tests; do not ask for device testing now. No phone install, actual GGUF import/load, inference or airplane-mode proof has passed.

## 1. Product goal

**Product naming:** The product is named **AI Studio**. “Alpha 1” is a development-stage label only. The Android display name is AI Studio; the legacy application ID `com.aistudio.alpha1` remains unchanged to preserve package/update identity.

AI Studio is a lightweight Android-first workspace for coordinating AI coding assistants. It must support three Local Coder engines:

1. PC / Ollama — an Ollama endpoint on a separate computer in the trusted local network.
2. Phone / GGUF — a real model loaded and executed inside Android through a native C++ inference runtime. It must work offline after model download.
3. Cloud API — existing provider adapters selected by API key, with clear consent before multiple requests that may be billable.

It also needs a Skill instruction library, user-imported SKILL.md files, profile presets, reusable project context and an optional REA/MCP tool connection. Preserve the current project editor, chats, backups, snippets, team flows, shared vault and provider settings.

## 2. Repository and runtime

- Front end: Vite + vanilla JavaScript modules + CSS/HTML.
- Android container: Capacitor 7.4.0. The repository does not contain a generated android/ project; GitHub Actions runs npx cap add android.
- Web/private workspace: Express 5, password-gated server, optional PostgreSQL-backed encrypted shared vault.
- Node engine declared in package.json: >=20.
- Build: npm install --no-audit --no-fund, then npm run build.
- Regression commands: npm run test:workshop, npm run test:site, npm run test:skills, npm run test:device-local-coder.

## 3. Existing features to preserve

### Providers and chat
The app has nine AI Team provider entries: OpenAI, Anthropic/Claude, Google Gemini, DeepSeek, Groq, OpenRouter, Hugging Face Inference Providers, a configurable custom OpenAI-compatible API, and PC/Ollama. Hugging Face uses its OpenAI-compatible router; the custom endpoint accepts HTTPS remote endpoints (HTTP is restricted to localhost). Model IDs and the custom endpoint are editable. OpenRouter and Hugging Face provide routes to multiple model catalogs. Provider keys on Android use capacitor-secure-storage-plugin; browser preview stores keys in memory only. Provider keys are not included in workspace backups.

Demo mode is on by default. It returns example/template output, not real inference. The API Local Coder path asks for confirmation before switching out of Demo mode and sends three requests (Plan, Code, Review). The user must approve multi-request/billable operations.

### Agent workspace
Existing workspace features include:
- Multi-provider chat and model comparison.
- Parallel team requests, model comparisons and sequential pipelines use every selected registered provider without a four-provider cap. New installs select all nine entries by default; the picker also has a select-all action. Sequential stages use planner, implementer, reviewer, tester and extra independent-expert roles for additional providers.
- User-created/JSON-imported prompt plugins. These are text instructions, not executable plugins.
- Local projects and active project context.
- Code workspace with up to 100 named files, up to 100 KB per file.
- Chat/activity histories are bounded (currently 80 records/messages in their respective stores).
- Snippet Vault and reuse catalog with source/license notes.
- Full JSON workspace backup/import and encrypted backup using AES-256-GCM; PBKDF2-SHA-256 with 250,000 iterations. Provider keys and vault credentials are excluded.
- Optional shared encrypted vault. It is encrypted at rest on the server, not end-to-end encrypted; authorized server processes decrypt records to serve them. Optional PostgreSQL stores the encrypted envelope.
- Local Coder code is a draft/review workflow. It does not execute code, run shell commands, or write arbitrary PC files.

Do not replace these capabilities while adding Skills, GGUF or MCP.

## 4. Current Local Coder source map

- src/main.js — app state, settings, screen rendering, provider calls, Local Coder dispatch, Skill context, backup/restore.
- src/workshop-data.js — existing Local Coder workflow/stage data and project-workshop behavior.
- src/device-local-coder.js — model catalogue, device capability recommendation and JS wrapper for native LocalLlm Capacitor plugin.
- src/device-local-coder-panel.html — device model manager UI fragment.
- src/device-local-coder.css — model manager styling.
- android-local-runtime/LocalLlmPlugin.kt — native Android Capacitor plugin. It uses pinned tensai-app/llama.kt runtime (CPU-first nGpuLayers=0) to list, download, import local GGUF via Android document picker, load, chat, unload, delete, cancel downloads and cancel local imports.
- scripts/patch-android-local-runtime.py — patches generated Capacitor Android project, Gradle settings/app config, copies Kotlin plugin, registers it in MainActivity and copies upstream notices if present.
- .github/workflows/build-android-local-coder.yml — optional native Android build workflow.
- .github/workflows/build-android-demo.yml — regular Capacitor debug APK workflow.

The Local Coder dispatcher in src/main.js chooses:
- settings.localCoderEngine === 'ollama' → runLocalCoderWorkshopOllama()
- settings.localCoderEngine === 'device' → runDeviceLocalCoderWorkshop()
- settings.localCoderEngine === 'api' → runApiLocalCoderWorkshop()

PC/Ollama remains default.

## 5. Native GGUF implementation details

### Target support
The native plugin reports support only when Android SDK level is 29 or later (Android 10+) and arm64-v8a is among supported ABIs. It is not declared supported on 32-bit Android, iOS or browser-only PWA. The Android UI reads total/free RAM and free storage for rough recommendations. These are heuristics, not guaranteed model compatibility.

### Model catalogue
src/device-local-coder.js currently declares three Qwen2.5-Coder GGUF entries:
- 0.5B Q4_K_M (recommended starting point; approximate 491 MB file, ~1.5 GB free-RAM estimate).
- 1.5B Q4_K_M (approximate 1.12 GB file, ~2.3 GB free-RAM estimate).
- 3B Q4_K_M (approximate 2.1 GB file, ~3.8 GB free-RAM estimate).

File sizes are estimates. Model files are not committed or bundled in the APK. The user downloads a model separately from a configured Hugging Face HTTPS endpoint; first download needs internet. Once downloaded, inference is intended to happen locally without network/API credentials.

DownloadManager is Wi-Fi-only by default (allowMetered=false) and disallows roaming. Files are app-scoped under models. Downloads are written as `.part`; after DownloadManager success, Kotlin checks file size and GGUF magic before renaming to `.gguf`. Failed/missing tasks and stale partials are reconciled on refresh/restart. JS clears the active download ID in `finally`; the in-app cancel control calls native DownloadManager cancellation. Local file import uses `ACTION_OPEN_DOCUMENT`, app-scoped `.part`, safe filename normalization, an 8 GB cap, free-space headroom checks, progress updates (~8 MB), storage rechecks (~16 MB), exact-size check when available and GGUF header verification before final rename. Importing an already-present `.gguf` file does not require internet; copying it to the phone is a separate step. Large local imports can be cancelled through a native cancellation flag checked during streaming; cancellation cleans the partial `.part` file. Actual Android provider/stream cancellation still needs physical verification.

### Device capability detection and model recommendation

The native Android `getDeviceInfo` bridge reports manufacturer/model label, Android SDK, supported ABI list, processor core count, total RAM, currently available RAM, Android low-memory pressure and free model-storage space. The UI keeps a manual model selector for Qwen2.5-Coder 0.5B, 1.5B and 3B GGUF variants, and marks the best estimated fit for the current phone.
- Commit `6afe4cc` adds a conservative `estimateMinimumAvailableRamBytes()` guard in JavaScript: catalogue models retain their reviewed thresholds; imported/custom GGUF files use `max(1.5 GiB, file size × 1.4 + 750 MiB)`. The native Kotlin loader independently re-reads `ActivityManager.MemoryInfo`, blocks Android low-memory state and applies the same size-based guardrail immediately before calling llama.kt. The mock regression test rejects a 2 GiB imported file at 3 GiB available RAM and permits the mock bridge at 4 GiB. These are approximate safety guardrails, not measured model requirements or proof of device compatibility.

Model recommendations use coarse guardrails (RAM, available RAM, CPU core count and approximately 15% storage headroom): 0.5B = 4 GB total RAM / 4 CPU cores / 1.5 GB available RAM; 1.5B = 8 GB / 6 cores / 2.3 GB available RAM; 3B = 12 GB / 8 cores / 3.8 GB available RAM. An Android low-memory warning blocks a new model load until memory pressure clears. The app refreshes memory/storage readings before download and load. These are conservative heuristics, not a CPU benchmark or a guarantee of speed, thermal behavior or stability. The smaller model remains manually selectable; a user override is warned about rather than silently changed.

No physical-device test has been performed for this capability update. Real Android compatibility, actual model load and generation, and airplane-mode inference remain Session 2 acceptance tests.

### Native workflow
The workflow currently:
1. Uses GitHub Actions Ubuntu 24.04, Node 20, Java 21 and preinstalled Android SDK.
2. Installs CMake/Ninja/NDK/Android platform/build-tools packages.
3. Clones tensai-app/llama.kt and checks out pinned commit 1cbaffa1986b5a339482b33da4f7cd91db94e7e8.
4. Runs scripts/bootstrap.sh and scripts/build-opencl.sh.
5. Installs app dependencies, builds Vite assets, runs regression tests.
6. Generates Capacitor Android project.
7. Adds trusted-LAN cleartext support and runs scripts/patch-android-local-runtime.py.
8. Runs npx cap sync android, then Gradle assembleDebug.
9. Uploads AI-Studio-1.1-OnDevice-LocalCoder-APK for 14 days.

Historical native run 41339891960 failed at `:app:compileDebugKotlin` with `LocalLlmPlugin.kt:40:53 — Unsupported escape sequence`. Root cause: the Kotlin source had one literal backslash before `.gguf`, creating invalid escape `\.`. Commit `ffc332eb9d21b616c3fcdb199b21dc6bf69dc1c8` fixed this using `[.]`.

**Latest verified native GGUF APK build — 2026-11-03:**
- Native run [41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560) completed successfully on latest branch head `9400716fefaa41a96b6661b8f66370d57c3dd421`.
- All substantive native build steps passed: Android SDK/tools, pinned llama.kt and llama.cpp preparation, app dependencies, Vite build, regression commands, Capacitor generation/patch/sync, Gradle `assembleDebug`, and artifact upload.
- Artifact: `AI-Studio-1.1-OnDevice-LocalCoder-APK`; ID `13205399062`; archive size `18,135,849` bytes; artifact retention is 14 days.
- Demo run [41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607) also succeeded on the same commit; demo artifact ID `13205386533`, size `3,769,925` bytes. Do not use demo APK for GGUF testing.
- The APK does not bundle model weights. The first separate model download requires internet. Offline inference after download is intended, but still requires a physical-device test.
- The latest source changes hardened partial-download handling and added model-specific license disclosure; CI success proves compilation and mocked regression checks, not actual DownloadManager behavior on a phone.

**Earlier native build history — 2026-11-02:**
- Native run [41482249852](https://github.com/babaprobado-bit/A-studio/actions/runs/41482249852) succeeded on docs-head `010ea0f...`; artifact ID `13161381931`. It is superseded by the latest artifact above.
- Older build [41390410229](https://github.com/babaprobado-bit/A-studio/actions/runs/41390410229) succeeded on commit `a30696ff29cdda2dfe43e27a77286e97be026914`; historical, not the latest app source.

### Patcher bug already fixed
First native build reached patch step but failed with “BridgeActivity onCreate call missing.” Cause: generated Capacitor MainActivity was empty, while patcher assumed existing onCreate. Commit 4b0c7b1 changed patcher to add a complete Java/Kotlin onCreate when absent and register LocalLlmPlugin before super.onCreate. It was tested twice against:
- empty Java MainActivity,
- Java MainActivity with existing onCreate,
- empty Kotlin MainActivity.

This was a mocked patcher test, not a real Android build.

Earlier CI problems and fixes:
- setup action tried obsolete sdkmanager tools package. Workflow now uses runner's preinstalled Android SDK and installs explicit packages.
- native CI ran test:site before npm run build, so smoke test returned 404. Workflow now builds Vite assets before the site smoke test.
- app-level Kotlin bridge needs explicit kotlinx-coroutines-core:1.9.0 because llama.kt uses it as implementation dependency. Patcher adds app-level dependency.
- These fixes still need validation in current live run.

### Native code risks to verify
- Compile generated Android project and resolve actual Kotlin/Gradle/API mismatches from logs.
- Verify llama.kt APIs at pinned SHA are compatible with LlamaEngine, SamplingParams, ChatMessage, LoadProgressCallback and chat.
- Verify native runtime libraries/ABIs are packaged and load on physical arm64 device.
- Confirm MainActivity package and generated Gradle layout handled across real Capacitor template.
- Review whether OpenCL build step is necessary for CPU-only inference and whether it adds avoidable CI complexity.
- Review lifecycle/freeing of engine on activity destroy or model replacement.
- Check download failures, partial files, retries, duplicate requests, no storage, low memory and interrupted downloads.
- Verify model URLs, actual file size/hash, GGUF compatibility and license/model-card terms before distribution.
- App-wide usesCleartextTraffic=true enables plain HTTP more broadly than just Ollama; review whether it can be narrowed while retaining intentional trusted-LAN usage.

## 6. Skill Library state

- src/skill-library.js stores starter Skill catalogue and helper functions.
- scripts/test-skills.mjs tests count, profile selection, SKILL.md parsing, validation and per-stage character limits.
- Current starter set: 15 AI Studio-authored Superpowers-inspired prompts, 22 AI Studio-authored Caveman-style prompts, one Karpathy-inspired coding guidelines summary (38 total).
- These are original AI Studio starter instructions, not official upstream Skill files or verbatim copied text.
- Custom SKILL.md imports are parsed as text. Current parser accepts simple front matter for name, description and stage (plan, code, review, all); it is not a full YAML parser and imported text is never executed.
- Max imported content is 12,000 characters; input file cap is 50 KB; up to 100 custom Skills are stored.
- Max selected Skills is 8; each stage is capped at 36,000 Skill-context characters.
- Current built-in profiles: karpathy, superpowers, caveman, balanced. Karpathy selected by default.
- Still missing vs prior requirement: separate named planning and review profiles; specifically named Superpowers development profile alias; fuller source/license metadata and user-facing preview/review of imported SKILL.md content; possibly more exact stage mapping/activation tests. Session 3 must reconcile requested profiles with actual code.
- UI injects instruction text into Local Coder Plan/Code/Review. It does not execute scripts/tools and is not an MCP skill runtime.

## 7. API Local Coder state

- settings.localCoderEngine='api' chooses runApiLocalCoderWorkshop().
- Provider selector uses existing OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq and OpenRouter adapters (not Ollama).
- It checks the existing provider key with getSecret(providerId).
- Each run sends three provider requests: Plan, Code, Review.
- When Demo mode is active, app asks confirmation describing three real API calls, then switches Demo mode off after user confirms. In non-Demo mode it asks again before the three-request run.
- Selected API provider ID persists in settings/workspace backups; API key values never included in backup.
- Existing shared project context and Skill text are attached by normal context builder/stage helper.
- Validate consent text and make failure/partial-run behavior clear. Do not add silent retries that could multiply costs.

## 8. REA / MCP state

Nothing in current APK is a working REA/MCP client integration. Previous design decision:
- REA is separate optional companion/MCP tool, not a Node CLI bundled inside Android APK.
- Earlier intended commands were npx -y rea-agents@latest analyze ..., doctor --json and setup for MCP. Before implementation, check current upstream docs and package requirements.
- Previous environment note said modern Node version (historically noted as 22.19+, 24.11+ or 26+); re-verify current compatibility.
- Android APK cannot be assumed to host Node REA CLI. Use optional companion host/MCP endpoint, user-configured, permission-scoped, with approval before side effects and revoke/disconnect.
- Do not install CLI, download agents, create remote connections or execute tools without explicit user approval.
- Keep REA independent of core Local Coder; app must work when absent.

## 9. Test commands and what they prove

Run from repository root after npm install:
  npm run build
  npm run test:workshop
  npm run test:site
  npm run test:skills
  npm run test:device-local-coder

They test Vite bundle, existing Local Coder/project/encrypted backup behavior, private site/shared vault behavior, Skill library logic and JavaScript device bridge with a mock native plugin.

They do not prove Android Kotlin/NDK/Gradle compilation, successful APK artifact upload, model load on actual phone, airplane-mode inference, speed, temperature, memory stability or battery use. Record those separately.

## 10. Security and licensing

- Never commit provider API keys, vault agent tokens, SITE_PASSWORD, SESSION_SECRET, VAULT_ENCRYPTION_KEY, database URLs containing credentials or signing material.
- API calls send prompt, selected project/code excerpts and Skill instructions to the chosen provider; explain this.
- Local device inference should not send prompts to cloud.
- Use HTTPS for model downloads, allowlist known hosts, validate filenames/paths, keep model files app-scoped.
- Shared web vault is encrypted at rest, not end-to-end encrypted.
- Keep upstream llama.kt and third-party license/notice files with distribution. Model weights are separate downloads; verify model card/license and redistribution terms.
- Reuse catalog links to upstream sources only; verify exact version, license and attribution.

## 11. Collaboration / commit policy

- Work only on feature/android-offline-skills-v1 for this effort.
- PR #2 is review boundary. Keep draft until required CI checks and at least one real device test pass.
- Prefer small descriptive commits.
- Before upsert, fetch current source and do not overwrite newer changes with stale snapshots.
- At end of each session update this handoff, README/ROADMAP and PR body as relevant.
- Do not merge PR #2 without user's explicit instruction.

## 12. Handoff rule

These docs are canonical project memory. The user explicitly wants work split across four chats because a long conversation can lose useful context. Every new chat must read docs/HANDOFF/README.md, this file and its session brief before continuing. Each chat commits verified changes and notes to the same feature branch; the next chat must inspect the new branch head rather than assume an old SHA.
## Agent context wiring — 2026-11-05

- The shared live-provider system context now carries the active project notes, opt-in code files/snippets, opt-in shared-vault references, and selected general (`all` stage) Skills.
- This shared path applies to single-provider chat, parallel AI Team, sequential pipelines, model comparison, provider connection checks, Ollama, and cloud API adapters.
- Local Coder keeps Plan/Code/Review-specific Skills in their own stage prompts; those calls explicitly skip the general Skill injection to avoid duplicate instructions.
- The active editor buffer is snapshotted into the opt-in project context, so unsaved edits are not silently omitted when an agent request starts.
- `npm run test:ai-team`, the broader smoke tests, Vite build, and Android packaging are the CI verification path. Physical-device inference/offline acceptance remains a separate gate.
## Local Coder draft persistence — 2026-11-05

- Applying an approved Local Coder draft now awaits `saveCurrentCodeFile(false)` and persists it into the active workspace file rather than only changing the editor textarea.
- The stale debounced editor-save timer is cancelled before persistence to avoid an older delayed save overwriting the accepted draft.
- If persistence fails, the draft remains visible in the editor and the UI tells the user to retry the explicit Save action.
- The draft is never executed automatically. The workshop smoke test asserts the persistence hand-off.
## Latest full-wiring CI checkpoint — 2026-11-05

- Latest application/test commit: `d75d75b496d6b2874ff9bba8fc484f321868e49b` (shared general Skills and project context across real providers, unsaved editor snapshot, and Local Coder draft persistence).
- Demo workflow [42077081392](https://github.com/babaprobado-bit/A-studio/actions/runs/42077081392) passed for this commit. Artifact `AI-Studio-Demo-APK`, ID `13438697581`, 3,775,270 bytes, SHA-256 `b89c24a2135f74bfd329a5c466f7c874834b6ee35dfc3f44c323510f6320f11a`.
- Native GGUF workflow [42077080777](https://github.com/babaprobado-bit/A-studio/actions/runs/42077080777) checked out this same application commit. Native toolchain, pinned llama.kt, llama.cpp source preparation, npm install, Vite build, all regression checks and Capacitor sync passed; Gradle `assembleDebug` remains in progress at the time of this checkpoint.
- Older native build [42075502247](https://github.com/babaprobado-bit/A-studio/actions/runs/42075502247) targeted commit `48efa01...` and was superseded; its cancellation was requested to prioritize the latest build.
- PR #2 is open and Draft. `main` base SHA remains `aab010319b6500002844bd24b11da85dd9ca3b00`. Do not merge; physical device acceptance is still outstanding.
## GGUF runtime replacement and state-sync checkpoint — 2026-11-05

- Native/JavaScript state reconciliation: commit `478adfd097c594735971694da13f2ef4828d5c48` refreshes device/model state after native load or unload failures, preventing stale `loadedFileName` from falsely marking the phone provider ready.
- Native memory ordering: commit `b611ec73ffa273c08ecbe634f2a0e1a239f2f717` frees the previous engine before measuring free RAM for a replacement model.
- JavaScript preflight: latest runtime commit `ff34a69578ea1fa332ac3d2e73414059566398b4` skips the stale free-RAM snapshot guard only when replacing an already-loaded model; the native loader then rechecks memory after releasing the old engine. First-load safety checks and the physical total-RAM guard remain.
- Device regression tests cover failure after native engine cleanup, native unload cleanup failure, successful replacement while current free RAM is occupied by the previous model, and the native release-before-RAM-check order.
- Latest demo workflow [42078734918](https://github.com/babaprobado-bit/A-studio/actions/runs/42078734918) passed for `ff34a69`. Artifact `AI-Studio-Demo-APK`, ID `13438094755`, 3,775,289 bytes, SHA-256 `e444077574209a1a6fba6e0e665482594370f8d6fa14358cb26dcbb44ad47fbb`.
- Latest native GGUF workflow [42078734707](https://github.com/babaprobado-bit/A-studio/actions/runs/42078734707) is running for the same app commit. Android tools and pinned llama.kt are ready; llama.cpp Android source preparation is in progress at this checkpoint. No artifact yet.
- PR #2 remains open and Draft. Main base SHA remains `aab010319b6500002844bd24b11da85dd9ca3b00`; do not merge before latest native CI, physical-device acceptance, and explicit user approval.
