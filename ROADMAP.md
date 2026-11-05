# AI Studio — Current feature status and next steps

## Current verified checkpoint — 2026-11-05 (AI Team expansion)

- Latest feature-branch source head: `66daa33f56220a7257825106147d37c974b7398a`. PR #2 remains open, Draft and unmerged. `main` is unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- AI Team now has nine provider entries: OpenAI, Anthropic/Claude, Google Gemini, DeepSeek, Groq, OpenRouter, Hugging Face Inference Providers, a user-configurable OpenAI-compatible API endpoint, and PC Ollama.
- The four-agent cap was removed from parallel team runs, sequential pipelines, model comparison, selection change handling, startup normalization and backup restoration. Fresh installs select all providers by default; existing saved preferences are preserved and the Models screen has a **Tüm AI sağlayıcılarını takıma ekle** action.
- Sequential pipelines use Plan, Implement, Independent Review and Test roles for the first four selected providers; additional selected providers receive separate independent-expert review prompts.
- Hugging Face uses its OpenAI-compatible Inference Providers route `https://router.huggingface.co/v1/chat/completions` and editable model ID. Official docs describe access to hundreds of models through one token. The custom provider supports OpenAI-compatible chat-completions APIs; it is not a universal adapter for arbitrary non-compatible APIs. Remote custom endpoints require HTTPS; HTTP is allowed only for localhost.
- API keys continue to use the existing secure-storage path and are not added to workspace backups. Team calls with Demo mode enabled still produce demo templates, not real model inference. Live multi-provider operations can issue one request per selected provider and may incur provider charges; explicit confirmation remains.
- Regression assertions were added for unlimited provider selection, de-duplication/unknown IDs, additional pipeline roles and custom endpoint URL validation. These tests have not yet been confirmed green by the newest Actions runs.
- Demo build [42062569036](https://github.com/babaprobado-bit/A-studio/actions/runs/42062569036) completed successfully on source commit `66daa33...`: Vite build, all regression tests, Capacitor generation/sync, Gradle `assembleDebug` and artifact upload passed. Demo artifact: `AI-Studio-Demo-APK`, ID `13432193970`, **3,773,590 bytes**, SHA-256 `0b5247aae3f270e83137f7e348f4dc6e65275ca06069f40d7cfe5a64b2889a9f`, expires 2026-11-19 16:17:52 UTC. It includes AI Team changes but is **not** the native GGUF APK.
- Native GGUF build [42062566776](https://github.com/babaprobado-bit/A-studio/actions/runs/42062566776) has passed Android setup, llama.kt/llama.cpp preparation, web build, all regression checks, Capacitor generation/sync and trusted-LAN bridge setup. Gradle `assembleDebug` was still in progress at the last check; there is no artifact yet for the AI Team-expanded native source.
- Earlier premature run [42062088282](https://github.com/babaprobado-bit/A-studio/actions/runs/42062088282) failed at Vite because it checked out commit `8a82f41...` after the import was added but before the new helper file `src/ai-team.js` was committed. The helper and UI/test changes are now on the branch; use the newer runs above to evaluate the complete source.
- No physical install, real provider-key call, native GGUF inference or airplane-mode test has been performed. Do not claim those from a successful APK build or mock test.

This AI Team checkpoint supersedes earlier source-head/queued-build snapshots below; historical APK details remain valid only for their recorded older commits.


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
