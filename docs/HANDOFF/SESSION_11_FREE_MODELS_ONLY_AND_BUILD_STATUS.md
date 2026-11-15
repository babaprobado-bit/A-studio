# Session 11 — Free model defaults and GGUF licence cleanup

Date: 2026-11-15
Repository: `babaprobado-bit/A-studio`
Branch: `feature/android-offline-skills-v1`
PR: #2 (must remain open and Draft; do not merge)

## Changes

- Kept all ten AI Team engine slots and retained existing API-key storage.
- Removed preset paid model IDs from OpenAI, Anthropic, DeepSeek, Groq, and Hugging Face. Existing saved defaults and imported-backup defaults matching those old preset IDs are cleared during migration.
- Set OpenRouter to `openrouter/free`; live calls reject model IDs unless they are `openrouter/free` or end in `:free`. OpenRouter free availability and rate limits are controlled by OpenRouter.
- Kept Gemini `gemini-3.8-flash` as a free-tier API option. Free-tier quota limits still apply.
- Kept local Ollama available.
- Removed the Qwen2.5-Coder 3B GGUF catalog entry because it used the Qwen Research License, which is limited to non-commercial research/evaluation unless a separate license is obtained.
- Replaced it with Qwen2.5 Instruct 0.5B Q2_K GGUF (415 MB), licensed Apache-2.0.
- Kept Qwen2.5-Coder 0.5B Q4_K_M (491 MB) and 1.5B Q4_K_M (1120 MB), both Apache-2.0.
- The general chat model is available in the device catalog but excluded from automatic coding-model recommendation.
- Updated the Android native download allowlist and SHA-256 pin to match the JavaScript catalog.

## Validation

- `node --check` passed for `src/main.js`, `src/device-local-coder.js`, and `scripts/test-device-local-coder.mjs`.
- `node scripts/test-device-local-coder.mjs` passed in the remote sandbox using a minimal Capacitor module stub. This is a source regression test, not an Android device test.
- GitHub Actions Native GGUF and Demo APK workflows should run when the PR branch is updated because the changed paths are included in their pull-request triggers.
- Do not claim phone compatibility, on-device inference, or offline-mode acceptance until a real Android device test is completed.

## Safety / release gate

- Do not change `main`.
- Do not merge or close PR #2.
- API keys are preserved; only model defaults are changed.
- CI APK packaging is not proof of real-device compatibility or airplane-mode behavior.
