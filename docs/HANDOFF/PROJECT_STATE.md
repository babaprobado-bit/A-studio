# AI Studio — Project state and technical handoff

## Latest continuation status — 2026-11-03

- Official product name is **AI Studio**; Alpha 1 is only a milestone label. Keep `com.aistudio.alpha1`.
- Latest branch head: `9400716fefaa41a96b6661b8f66370d57c3dd421`; base `main` remains `aab010319b6500002844bd24b11da85dd9ca3b00`. PR #2 is open/draft, mergeable and unmerged.
- Native Android GGUF build [41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560) succeeded on this branch head. Artifact `13205399062`, `AI-Studio-1.1-OnDevice-LocalCoder-APK`, 18,135,849 bytes. All native source setup, regression tests, Capacitor sync, Gradle and upload steps passed.
- Demo build [41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607) succeeded on the same commit. Artifact `13205386533`, `AI-Studio-Demo-APK`, 3,769,925 bytes. It is not the native GGUF APK.
- Commit `6f10570` makes model downloads atomic: DownloadManager stores to `.part`; successful completion is promoted to `.gguf` only after a size and GGUF-magic check; failed/missing tasks are cleaned up and reconciled after app restart. JavaScript active download ID is cleared in `finally`. A mock regression test covers failure and retry state.
- Commit `9400716` displays exact per-model license names and links in the picker. 0.5B/1.5B GGUF are Apache-2.0; 3B GGUF is `qwen-research` with a non-commercial research/evaluation notice. Do not infer commercial use rights.
- Skills Library includes 38 original AI Studio starter instructions, backward-compatible profiles, extra presets, safe Markdown preview/import, multi-file queue, duplicate flags, BOM/CRLF parsing, bounded metadata, 100 custom Skill limit, eight-selection cap and strict 36k prompt budget.
- API Local Coder has mock-provider tests for consent, key checks, exactly three sequential stages, stable provider, no retry/fallback, failure stop and secret boundaries. The UI lock is acquired before async key lookup/consent to prevent double submissions. No real paid API calls were made.
- User reports a Redmi S12 and no current internet. Exact Android SDK version, arm64 ABI and RAM are not verified. No physical install, GGUF download, inference or airplane-mode proof has passed. CI proves buildability only.
- Next scope is Session 2 real-device testing; optional REA/MCP remains Session 4. Keep PR #2 draft; never change `main` or merge without explicit instruction.

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
The app has adapters for OpenAI, Anthropic/Claude, Google Gemini, DeepSeek, Groq, OpenRouter and Ollama. Provider endpoints/model IDs may change; keep them editable and reuse existing adapter code. Provider keys on Android use capacitor-secure-storage-plugin; browser preview stores keys in memory only. Provider keys are not included in workspace backups.

Demo mode is on by default. It returns example/template output, not real inference. The API Local Coder path asks for confirmation before switching out of Demo mode and sends three requests (Plan, Code, Review). The user must approve multi-request/billable operations.

### Agent workspace
Existing workspace features include:
- Multi-provider chat and model comparison.
- Parallel team requests and sequential pipelines (team selection is limited to four providers).
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
- android-local-runtime/LocalLlmPlugin.kt — native Android Capacitor plugin. It uses pinned tensai-app/llama.kt runtime (CPU-first nGpuLayers=0) to list, download, load, chat, unload and delete GGUF files.
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

DownloadManager is Wi-Fi-only by default (allowMetered=false) and disallows roaming. Files are app-scoped under models. Downloads are written as `.part`; after DownloadManager success, Kotlin checks file size and GGUF magic before renaming to `.gguf`. Failed/missing tasks and stale partials are reconciled on refresh/restart. JS clears the active download ID in `finally`. App exposes load/unload/delete; there is still no in-app cancel-download control or guaranteed resume UX.

### Device capability detection and model recommendation

The native Android `getDeviceInfo` bridge reports manufacturer/model label, Android SDK, supported ABI list, processor core count, total RAM, currently available RAM, Android low-memory pressure and free model-storage space. The UI keeps a manual model selector for Qwen2.5-Coder 0.5B, 1.5B and 3B GGUF variants, and marks the best estimated fit for the current phone.

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
