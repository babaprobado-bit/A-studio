# AI Studio — Current feature status and next steps

This document separates implemented source, automated checks, CI APK builds and physical-device results. A button, source patch or JavaScript fake does not prove that Android has run a feature. Product name: **AI Studio**; “Alpha 1” is an internal milestone only.

## Current development track

- Repository: `babaprobado-bit/A-studio`
- Active branch: `feature/android-offline-skills-v1`
- Current source head: `0a8083466792b14310bc5cb2dbf681552d8cfd81`
- Review boundary: draft PR #2 — https://github.com/babaprobado-bit/A-studio/pull/2
- `main` remains untouched. PR #2 stays draft until the user explicitly changes that decision.

## Current product capabilities in source

- Multi-provider chat and comparison: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter and Ollama.
- Local Coder engines: PC/Ollama, Android on-device GGUF and explicit-consent API mode.
- Local GGUF download uses Android DownloadManager, temporary `.part` storage, GGUF header validation and a visible cancel action.
- **No-internet GGUF import:** Android document picker can import a `.gguf` file already present on the phone. Copy it beforehand through USB, SD card or file sharing. Import itself does not need internet; it does not acquire model weights.
- Local import includes an 8 GB cap, sanitized filenames, app-scoped temporary files, free-storage checks, progress events, in-copy cancellation, partial-file cleanup and GGUF validation.
- Model picker presents per-model license links and the 3B non-commercial research/evaluation notice.
- Skill Library contains 38 original AI Studio starter instructions, profiles, safe text-only SKILL.md import/preview, multi-file queue, metadata/caps and backup/restore.
- API Local Coder is an explicit-consent Plan → Code → Review workflow; provider credentials stay outside workspace backups.

## Latest source and CI status

- Current branch head: `0a8083466792b14310bc5cb2dbf681552d8cfd81`.
- Native Android workflow [41703474174](https://github.com/babaprobado-bit/A-studio/actions/runs/41703474174) and demo workflow [41703474052](https://github.com/babaprobado-bit/A-studio/actions/runs/41703474052) were in progress at the last status check. Demo regression tests and Capacitor sync had passed; Gradle packaging was running. Native build was setting up Android tools. Check live state before claiming a current-source APK.
- Last successful native/demo artifacts `13205399062` and `13205386533` are from older app-code SHA `9400716...`; they do not include these recent local import/cancellation UI changes.
- Regression tests inspect the actual `index.html`, button IDs and event handlers; fake-plugin tests cover local import progress, cancellation and lock/listener cleanup. These are not physical device tests.

## Internet-unavailable development path

1. Continue reviewing native import/download code, storage accounting, path safety, cancellation and model lifecycle.
2. Add regression tests around Android bridge wrappers and live HTML/handler wiring.
3. Keep the file-picker path for an already-present GGUF file; the model itself must already exist and be copied onto the phone.
4. Finish current-source CI and inspect failures/artifacts. CI proves compilation and automated tests, not real device behavior.
5. Keep REA/MCP optional and separate; do not install or connect remote services as part of offline work.

## Deferred device acceptance

No physical phone install, GGUF import, model load/inference, temperature/memory measurement or airplane-mode test has been completed. User reports no current internet, so physical checks are deferred. Do not call native inference proven; also do not stop source development while waiting for internet.

## Release guardrails

- Do not commit provider keys, vault credentials, signing keys or other secrets.
- Keep imported Skill Markdown and model metadata as untrusted input; do not execute them.
- Preserve existing chat, projects, Ollama, API, backups, Skills, snippets and shared vault.
- Keep model weights separate from the APK and retain model/engine license notices.
- Do not merge PR #2 or change `main` without explicit user permission.
