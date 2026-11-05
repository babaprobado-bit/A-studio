# AI Studio — Current feature status and next steps

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


This document separates implemented source, automated checks, CI APK builds and physical-device results. A button, source patch or JavaScript fake does not prove that Android has run a feature. Product name: **AI Studio**; “Alpha 1” is an internal milestone only.

## Current development track

- Repository: `babaprobado-bit/A-studio`
- Active branch: `feature/android-offline-skills-v1`
- Current source head: `66daa33f56220a7257825106147d37c974b7398a`
- Review boundary: draft PR #2 — https://github.com/babaprobado-bit/A-studio/pull/2
- `main` remains untouched. PR #2 stays draft until the user explicitly changes that decision.

## Current product capabilities in source

- AI Team providers: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter, Hugging Face Inference Providers, configurable custom OpenAI-compatible API, and PC/Ollama. Parallel team, sequential pipeline and comparison use all selected providers with no four-provider cap; all nine are selected by default and a select-all control is available.
- Local Coder engines: PC/Ollama, Android on-device GGUF and explicit-consent API mode.
- AI Team supports every selected provider without a four-agent cap across parallel runs, sequential pipelines and comparisons; fresh installations default to all providers and existing users can choose all in one action.
- Local GGUF download uses Android DownloadManager, temporary `.part` storage, GGUF header validation and a visible cancel action.
- **No-internet GGUF import:** Android document picker can import a `.gguf` file already present on the phone. Copy it beforehand through USB, SD card or file sharing. Import itself does not need internet; it does not acquire model weights.
- Local import includes an 8 GB cap, sanitized filenames, app-scoped temporary files, free-storage checks, progress events, in-copy cancellation, partial-file cleanup and GGUF validation.
- Model picker presents per-model license links and the 3B non-commercial research/evaluation notice.
- Skill Library contains 38 original AI Studio starter instructions, profiles, safe text-only SKILL.md import/preview, multi-file queue, metadata/caps and backup/restore.
- API Local Coder is an explicit-consent Plan → Code → Review workflow; provider credentials stay outside workspace backups.

## Latest source and CI status

- Current app-code/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86`; follow-up native build [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) was queued at last check.
- Native GGUF run [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) succeeded for source `6afe4cc...`: APK artifact `13266781713`, 18,154,318 bytes, SHA-256 `d9ab6beafb65a6d570436fe1eeda959cdbbd55a608c5cde3f411b8e2c42583a7`.
- `6afe4cc` includes the imported-GGUF RAM estimate in JS and live-memory check in Kotlin; `b967781` adds idempotent same-model load behavior so a second tap does not need additional RAM or re-enter native load. A fake-plugin test covers the low-memory case.
- Regression tests exercise the JS/native bridge through fakes and actual-screen HTML wiring. CI compilation does not prove real phone inference.

## Internet-unavailable development path

1. Continue reviewing native import/download code, storage accounting, path safety, cancellation and model lifecycle.
2. Add regression tests around Android bridge wrappers and live HTML/handler wiring.
3. Keep the file-picker path for an already-present GGUF file; the model itself must already exist and be copied onto the phone.
4. Finish current-source CI and inspect failures/artifacts. CI proves compilation and automated tests, not real device behavior.
5. Keep REA/MCP optional and separate; do not install or connect remote services as part of offline work.

## Deferred device acceptance

No physical phone install, GGUF import, model load/inference, temperature/memory measurement or airplane-mode test has been completed. The user currently has no internet and no phone/computer for hands-on tests. Do not call native inference proven; continue source development and GitHub-hosted CI.

## Release guardrails

- Do not commit provider keys, vault credentials, signing keys or other secrets.
- Keep imported Skill Markdown and model metadata as untrusted input; do not execute them.
- Preserve existing chat, projects, Ollama, API, backups, Skills, snippets and shared vault.
- Keep model weights separate from the APK and retain model/engine license notices.
- Do not merge PR #2 or change `main` without explicit user permission.
## Agent context wiring — 2026-11-05

- The shared live-provider system context now carries the active project notes, opt-in code files/snippets, opt-in shared-vault references, and selected general (`all` stage) Skills.
- This shared path applies to single-provider chat, parallel AI Team, sequential pipelines, model comparison, provider connection checks, Ollama, and cloud API adapters.
- Local Coder keeps Plan/Code/Review-specific Skills in their own stage prompts; those calls explicitly skip the general Skill injection to avoid duplicate instructions.
- The active editor buffer is snapshotted into the opt-in project context, so unsaved edits are not silently omitted when an agent request starts.
- `npm run test:ai-team`, the broader smoke tests, Vite build, and Android packaging are the CI verification path. Physical-device inference/offline acceptance remains a separate gate.
