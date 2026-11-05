# AI Studio — latest new-chat handoff

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


## Resume code
`AI-STUDIO-SESSION3-AI-TEAM-EXPANSION-CI`

## Current source checkpoint — 2026-11-03
- Product: **AI Studio**. Keep Android application ID `com.aistudio.alpha1`.
- Repo: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- Latest source/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86` (idempotent already-loaded GGUF behavior; native build [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) queued at last check)
- `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 is open, draft and unmerged: https://github.com/babaprobado-bit/A-studio/pull/2
- Native GGUF build [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) succeeded for source `6afe4cc...` and uploaded artifact `13266781713` (18,154,318 bytes; SHA-256 `d9ab6beafb65a6d570436fe1eeda959cdbbd55a608c5cde3f411b8e2c42583a7`). Newer source `b967781...` adds idempotent load behavior; its native build [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) was queued at last check.
- Last successful APKs from older app-code SHA `9400716...`: native artifact `13205399062` [run 41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560); demo artifact `13205386533` [run 41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607). These do not include local import/cancel updates.

## Latest offline-first improvements
- Android can import an already-available `.gguf` file via `ACTION_OPEN_DOCUMENT`; copy it to the phone with USB/SD/file sharing first. Import itself does not need internet.
- Import is app-scoped, stages as `.part`, has a sanitized filename and 8 GB cap, checks free storage, reports progress and validates GGUF magic before installed-model insertion.
- Large local imports can be cancelled in-app; native code checks a cancellation flag while copying and cleans the partial file.
- The in-app model manager includes DownloadManager cancel, local-import cancel and license controls in the real `index.html`.
- Tests inspect the actual app HTML and JS button bindings; fake-plugin tests cover progress, cancellation, lock/listener cleanup and imported-GGUF RAM guardrails.
- Skills Library and API Local Coder remain; no paid API calls are made by tests.

## User's current constraint and next task
The user reports no internet and no phone/computer available for hands-on tests. **Do not ask for device testing or pause development.** Continue source review, regression coverage and GitHub-hosted native CI. Local GGUF import is useful only when a model file is already available to copy; it does not create or download model weights.

First inspect live branch/PR/Actions. Review RAM checks for both catalogue and imported GGUF files, lifecycle/unload behavior, cancellation cleanup and Android failure handling. Add tests and commit only to `feature/android-offline-skills-v1`.

No physical APK install, model import, native inference or airplane-mode proof has been completed. The user has no phone/computer available for tests now. Preserve all features. Keep PR #2 open and draft; never modify `main` or merge without explicit permission.

## Links
- Native build (current source): https://github.com/babaprobado-bit/A-studio/actions/runs/41706818257
- Demo build (current source): https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Project state: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/PROJECT_STATE.md
- Device checklist: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
## Agent context wiring — 2026-11-05

- The shared live-provider system context now carries the active project notes, opt-in code files/snippets, opt-in shared-vault references, and selected general (`all` stage) Skills.
- This shared path applies to single-provider chat, parallel AI Team, sequential pipelines, model comparison, provider connection checks, Ollama, and cloud API adapters.
- Local Coder keeps Plan/Code/Review-specific Skills in their own stage prompts; those calls explicitly skip the general Skill injection to avoid duplicate instructions.
- The active editor buffer is snapshotted into the opt-in project context, so unsaved edits are not silently omitted when an agent request starts.
- `npm run test:ai-team`, the broader smoke tests, Vite build, and Android packaging are the CI verification path. Physical-device inference/offline acceptance remains a separate gate.
