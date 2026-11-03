# AI Studio — Current feature status and next steps

This document separates implemented source, automated checks, CI APK builds and physical-device results. A button, source patch or JavaScript fake does not prove that Android has run a feature. Product name: **AI Studio**; “Alpha 1” is an internal milestone only.

## Current development track

- Repository: `babaprobado-bit/A-studio`
- Active branch: `feature/android-offline-skills-v1`
- Current source head: `985a53f844c661939e5f46ddb8be0fcc2eb1d4d3`
- Review boundary: draft PR #2 — https://github.com/babaprobado-bit/A-studio/pull/2
- `main` remains untouched. PR #2 must stay draft until the user explicitly changes that decision.

## Current product capabilities in source

- Multi-provider chat and comparison: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter and Ollama.
- Local Coder engines: PC/Ollama, Android on-device GGUF and explicit-consent API mode.
- Local GGUF download uses Android DownloadManager, temporary `.part` storage, GGUF header validation and a visible cancel action.
- **No-internet GGUF import:** Android document picker can import a `.gguf` file already present on the phone. Copy it beforehand through USB, SD card or file sharing. Importing the local file itself does not need internet; it does not acquire model weights for the user.
- Local import implementation includes an 8 GB limit, sanitized filenames, app-scoped temporary files, free-storage checks, progress events and GGUF magic validation before the model appears installed.
- Model picker presents per-model license links and the 3B non-commercial research/evaluation notice.
- Skill Library contains 38 original AI Studio starter instructions, profiles, text-only SKILL.md import and preview, multi-file queue, metadata/caps and backup/restore.
- API Local Coder is an explicit-consent Plan → Code → Review workflow; provider credentials stay outside workspace backups.

## Latest source and CI status

- Current branch head: `985a53f844c661939e5f46ddb8be0fcc2eb1d4d3`.
- Current-source native Android workflow [41702571644](https://github.com/babaprobado-bit/A-studio/actions/runs/41702571644) and demo workflow [41702571666](https://github.com/babaprobado-bit/A-studio/actions/runs/41702571666) were still running at the last status check; verify again before calling either APK ready.
- Last successful native build [41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560), artifact `13205399062`, and demo build [41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607), artifact `13205386533`, were built from older app-code SHA `9400716...`. They predate the local-import and actual-index-screen fixes.
- Regression checks now read the live `index.html` and verify that the license, cancel and import controls exist and that `main.js` handlers are wired. Import fake-plugin tests cover success, failure, cancellation, progress and lock/listener cleanup. These are not Android device tests.

## Internet-unavailable development path

1. Continue reviewing native import/download code, storage accounting, path safety and model lifecycle.
2. Add regression tests around Android bridge wrappers and live HTML/handler wiring.
3. Keep the file-picker route available for an already-present GGUF file; clearly state that the model file itself must already exist.
4. Finish current-source CI and inspect failures/artifacts. A CI success proves compile and automated checks, not real device behavior.
5. Keep REA/MCP optional and separate; do not install or connect a remote service as part of offline work.

## Deferred device acceptance

No physical phone install, local GGUF import, model load/inference, temperature/memory measurement or airplane-mode test has been completed. User reports no current internet, so physical checks are deferred. Do not call the native feature proven; also do not stop source development while waiting for internet.

## Release guardrails

- Do not commit provider keys, vault credentials, signing keys or other secrets.
- Keep imported Skill Markdown and model metadata as untrusted input; do not execute them.
- Preserve existing chat, projects, Ollama, API, backups, Skills, snippets and shared vault.
- Keep model weights separate from the APK and retain model/engine license notices.
- Do not merge PR #2 or change `main` without explicit user permission.
