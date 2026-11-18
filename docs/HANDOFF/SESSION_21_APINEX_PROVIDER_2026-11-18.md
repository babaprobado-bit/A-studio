# Session 21 — APInex optional free-model provider — 2026-11-18

## Scope and behavior
- Added APInex as an optional OpenAI-compatible provider at `https://api.apinex.bond/v1/chat/completions`.
- Default model is `free/gemini-3.8-flash`; users may refresh the provider's `/models` list and select only lowercase IDs beginning with `free/`.
- APInex is excluded from the default ten-engine AI Team selection. Users may add it explicitly from Models / Team settings.
- The generic provider plumbing makes the configured provider available to standard chat, AI Team, comparison, pipeline and API Local Coder. Creator text generation allows it only when the selected model has the free namespace.
- API keys use the existing Android SecureStorage path; browser preview keys remain session-memory only. Workspace backups do not serialize provider keys.
- The connector registry labels APInex as an integrated optional third-party gateway. Requests and prompts are routed through APInex and then its upstream model provider; this is not a direct Gemini/OpenAI connection.

## Cost guardrails
- Application validation rejects any APInex model ID not beginning with `free/`, including calls through model overrides and imported workspace settings.
- The selectable model list filters the API response to `free/*` IDs only. IDs are deduplicated and capped at 100.
- APInex free access has provider-controlled quotas and availability. A `free/` model name does not mean unlimited usage or a service-level guarantee. No numeric daily quota is hardcoded.
- No paid model ID, live API key, account, balance, billing action or provider request was used during this source change.

## Security and tests
- Added an APInex-specific validator and model-list parser with tests for free IDs, paid IDs, malformed/nested IDs and duplicates.
- Added `https://api.apinex.bond` to server Content Security Policy `connect-src`.
- Existing 10 AI Team engines remain selected by default. APInex is optional.
- Existing Power Hub 34 prompt templates, 13-entry ranked provider directory, OpenRouter free-only rules, GGUF, Ollama, Skills and Creator Studio flows are preserved.
- CI is required after this commit; no physical-device test or live APInex request is claimed.

## Repository guardrails
- Repository: `babaprobado-bit/A-studio`
- Branch: `feature/android-offline-skills-v1`
- PR #2 remains open and Draft. Do not merge, close or mark ready.
- `main` remains `aab010319b6500002844bd24b11da85dd9ca3b00`. Do not modify it.
