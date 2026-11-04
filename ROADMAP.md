# AI Studio — Current feature status and next steps

This document separates implemented source, automated checks, CI APK builds and physical-device results. A button, source patch or JavaScript fake does not prove that Android has run a feature. Product name: **AI Studio**; “Alpha 1” is an internal milestone only.

## Current development track

- Repository: `babaprobado-bit/A-studio`
- Active branch: `feature/android-offline-skills-v1`
- Current source head: `6afe4ccfde5f29085a3ad0f2079f0f6addbe5107`
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
