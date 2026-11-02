# AI Studio — Current feature status and next steps

This document separates implemented source code from verified builds and physical-device tests. A button, prompt template, mocked test or source-only bridge is not proof of a working native feature. Product name: AI Studio. Alpha 1 is an internal milestone label only.

## Current development track

- Active branch: feature/android-offline-skills-v1
- Review boundary: draft PR #2 — https://github.com/babaprobado-bit/A-studio/pull/2
- main remains base branch and must not be edited directly during this work.
- Four-chat execution plan and durable handoff: docs/HANDOFF/README.md.

## Current product capabilities in source

- Multi-provider chat/adapters: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter and Ollama.
- Parallel team calls, sequential text pipeline and model comparison.
- Local projects, chat history, code workspace, snippets, reuse catalog and local activity history.
- Standard JSON workspace backup and encrypted backup. Provider API keys are excluded.
- Private password-gated web workspace and optional encrypted-at-rest shared vault (not end-to-end encrypted).
- Local Coder Plan → Code draft → Review workflow with three selectable engines in source:
  1. PC / Ollama (default; model runs on another computer).
  2. API provider mode (three requests per run; explicit cost/consent confirmation).
  3. Android device GGUF mode (native bridge source exists; build and real-device proof required).
- Skill Library with 38 AI Studio-authored starter instructions (15 Superpowers-inspired, 22 Caveman-style, one Karpathy-inspired summary), profiles, text-only SKILL.md import, max 8 selected, max 36,000 characters per stage.

## Build and test status

Do not copy a stale green check from a previous commit. Check PR head SHA and newest GitHub Actions run each time.

- JavaScript/Vite/Skill/device-bridge tests:
  - npm run build
  - npm run test:workshop
  - npm run test:site
  - npm run test:skills
  - npm run test:device-local-coder
- Regular Android workflow: .github/workflows/build-android-demo.yml.
- Native GGUF Android workflow: .github/workflows/build-android-local-coder.yml.
- Regular debug APK passed at least once on feature branch, but did not include native GGUF bridge.
- Native GGUF build and physical-phone inference are not complete until current CI artifact and device test report are confirmed.
- APK workflows currently create debug builds, not signed production releases.

## Remaining work — four conversations

1. Session 1 — native APK: finish llama.kt/NDK/Kotlin/Gradle integration, verify native debug APK artifact and all CI steps.
2. Session 2 — physical device: download/load GGUF on supported Android 10+ arm64 device, prove airplane-mode inference, measure memory/stability.
3. Session 3 — Skills/API: add missing Planning/Review/Superpowers-development profile aliases, import preview/source/license metadata, edge-case tests and polish three Local Coder modes.
4. Session 4 — REA/MCP/release: optional least-privilege companion integration, complete regression/security checklist, update PR and request explicit merge decision.

## Still not provided / must not be claimed

- No GGUF model weights bundled inside APK. First download requires internet.
- PC Ollama is not on-device inference.
- Native source code and JS mock tests do not prove Android native compilation or physical-device inference.
- Skills are injected text instructions, not executable tool plugins/MCP skills.
- REA/MCP is not yet integrated.
- No unrestricted PC filesystem/shell access, background autonomous coding, automatic code execution or automatic test execution.
- App does not silently download third-party repositories/assets.
- Shared vault is encrypted at rest, not end-to-end encrypted.

## Reuse and licensing

Reuse catalog links to upstream sources; it does not mirror them. Verify exact version, license, notices and attribution for code/assets/models before shipping. Keep native llama.kt and third-party notices. Model files are separate downloads; check model card/license and redistribution terms.
