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

- Current branch head: `6afe4ccfde5f29085a3ad0f2079f0f6addbe5107`.
- PR-triggered native GGUF run [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) passed Android tool setup, pinned llama.kt fetch and llama.cpp preparation; dependency installation was running at last check. No current-source artifact was available. Duplicate manual run [41706818257](https://github.com/babaprobado-bit/A-studio/actions/runs/41706818257) has a cancellation request accepted.
- Previous native APK [41696652109](https://github.com/babaprobado-bit/A-studio/actions/runs/41696652109), artifact `13262651732`, is for older commit `77527995...` and does not include current RAM guard changes.
- Commit `6afe4cc` adds an approximate size-based available-RAM guard for imported GGUFs in JS and a second live Android memory check in Kotlin; mock regression tests cover pass/fail thresholds.
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
