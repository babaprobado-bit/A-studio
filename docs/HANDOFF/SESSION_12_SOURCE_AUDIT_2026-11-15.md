# Session 12 — 1.1.4 source package audit and safe integration gate

Date: 2026-11-15  
Repository: `babaprobado-bit/A-studio`  
Branch: `feature/android-offline-skills-v1`  
Verified branch HEAD before this documentation commit: `db6d4458aad1e19e9b6b315a15bfe89974ad5e92`  
PR: #2 — keep open, Draft, and unmerged.

## Repository guardrails

- Do not modify `main`; its verified SHA remains `aab010319b6500002844bd24b11da85dd9ca3b00`.
- Do not merge or close PR #2.
- Preserve all ten AI Team engines and existing provider-key storage.
- Keep REA Companion limited to mock/contract tests. Do not install, launch, pair, or connect it.
- Do not claim physical Android installation, actual GGUF inference, RAM/performance validation, or airplane-mode acceptance. None has been performed.

## Source packages located and verified

Two Library archives were inspected:

- `AI-Studio-1.1.4-mobile-update.zip` — 123,258 bytes; SHA-256 `0755e03dd222ebb4165bc3cf6ce09757a0492802b516cb9b0b225938ddf95d78`.
- `AI-Studio-1.1.4-Free-API-Providers.zip` — 358,689 bytes; SHA-256 `967d221a1861dd842b245c8fa8419dd9444ee06edbf8ba9de8b3b81cd0de0661`.

The second archive is a fuller 1.1.4 source snapshot. It includes the mobile chat/OpenRouter work, Agent Swarm, searchable prompt-plugin catalogue, Cohere Trial and Cloudflare Workers AI adapters, documentation, tests, and Android workflow changes.

## 1.1.4 features and terminology

- Agent Swarm has task planning, a shared message board, bounded concurrency, file/path locks, one limited transient retry, confidence capture, and call-budget accounting. Its documented behavior does not automatically write project files or execute shell commands.
- The plugin catalogue contains 34 **prompt templates**. They are instructions selected for a chat, not executable third-party integrations. External connector status is kept separate.
- OpenRouter chat supports up to four selected models, parallel fan-out, and isolated per-model failures.
- Cohere Trial and Cloudflare Workers AI are optional providers; their API-key fields start empty. No shared, guessed, or embedded API keys are included.
- The original ten AI Team engines remain the default team; Cohere and Cloudflare are optional, not silently added.

## Regression checks run on the complete 1.1.4 snapshot

All listed checks passed:

- `node --check` for the main application, Agent Swarm, plugin catalogue, OpenRouter chat, AI Team, device Local Coder, and the relevant test scripts.
- `scripts/test-ai-team.mjs`
- `scripts/test-agent-swarm.mjs`
- `scripts/test-openrouter-chat.mjs`
- `scripts/test-plugin-catalog.mjs`
- `scripts/test-free-api-providers.mjs`
- `scripts/test-api-local-coder.mjs`
- `scripts/test-rea-companion-contract.mjs`
- `scripts/test-openshorts.mjs`
- `scripts/test-skills.mjs`
- `server/workshop-smoke-test.js`

Environment-limited checks were not represented as passes:

- `scripts/test-device-local-coder.mjs` requires the Capacitor package, which is not installed in the extracted offline workspace.
- `server/smoke-test.js` requires Express, which is not installed in the extracted workspace.
- `npm run build` was not completed because Vite dependencies were not installed and the environment could not resolve the npm registry.
- No APK was built from the 1.1.4 archive in this local extraction.

## Critical free-only compatibility findings

The 1.1.4 snapshot is not yet safe to copy wholesale onto the current feature branch:

1. Its provider defaults still contain paid or not-guaranteed-free model IDs: OpenAI `gpt-5-mini`, Anthropic `claude-sonnet-5`, DeepSeek `deepseek-chat`, Groq `llama-3.3-70b-versatile`, OpenRouter `openai/gpt-5-mini`, and Hugging Face `openai/gpt-oss-120b:fastest`. These conflict with the user's free-only default requirement.
2. Its OpenRouter chat selector must inherit the existing free-only validation from the current branch: permit only `openrouter/free` or model IDs ending in `:free`; reject paid IDs in live requests.
3. Its device GGUF catalogue still includes Qwen2.5-Coder 3B under the Qwen Research License. Keep that entry removed. Preserve the current branch's Apache-2.0-only 0.5B/1.5B Coder and 0.5B Instruct set, and keep the JavaScript catalogue, native Kotlin allowlist, and SHA-256 pins identical.
4. The snapshot's `src/main.js`, `index.html`, `src/style.css`, `package.json`, `src/device-local-coder.js`, `android-local-runtime/LocalLlmPlugin.kt`, `server/server.js`, and both Android workflows differ from the newer feature-branch versions. Do not overwrite those files as a group.
5. The new `src/agent-swarm.js`, `src/plugin-catalog.js`, and `src/openrouter-chat.js` modules are absent from the current branch and need to be added with carefully reviewed imports/UI wiring.

Recommended integration order: add the isolated modules and tests first; port their UI/entry-point wiring with a focused diff against the current branch; manually reapply the free-only provider/model gates; retain the current Local Coder and Android runtime hardening; then run the full repository suite, Vite build, Native GGUF workflow, and Demo workflow on the exact same resulting commit.

## Free-tier quota evidence checked on 2026-11-15

- Cohere Trial keys are limited to 1,000 API calls/month; Chat model limits are 20 requests/minute per model. Official docs: https://docs.cohere.com/docs/rate-limits
- Cloudflare Workers AI Free allocation is 10,000 Neurons/day. Workers Free requests stop after the free allocation is exhausted; Workers Paid charges above the allocation. Official docs: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Gemini 3.8 Flash Standard currently lists free input/output token pricing on the Gemini API Free Tier. The pricing page notes free-tier content may be used to improve Google's products; do not hide this disclosure. Official docs: https://ai.google.dev/gemini-api/docs/pricing/
- OpenRouter free variants ending in `:free` are rate-limited (the current free-model page states 20 requests/minute and 50 requests/day). `openrouter/free` routes to an eligible free model. Do not promise unlimited capacity or stable model availability. Official docs: https://openrouter.ai/collections/free-models

Free quotas and provider policies can change. No API calls or quota tests were made with real user keys.

## Current branch/APK status at this audit

- Current source head before this documentation commit: `db6d4458aad1e19e9b6b315a15bfe89974ad5e92`.
- Native GGUF and Demo GitHub Actions checks both completed successfully on that exact SHA (runs `43736480760` and `43736481000`).
- Those APKs include the free-model and GGUF licence changes committed at `db6d445`; they do **not** include the 1.1.4 Agent Swarm, 34-template catalogue, mobile chat, or Cohere/Cloudflare additions because those source files have not yet been integrated.
- APK packaging success is not device acceptance. Real-device testing remains outstanding.

## Next checkpoint

Port 1.1.4 additions into the latest feature branch without wholesale replacement, restore the free-only guarantees, run the complete build/test pipeline, and rebuild both APKs from one verified commit. Keep PR #2 Draft and leave `main` untouched.
