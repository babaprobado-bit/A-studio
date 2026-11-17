# Session 18: Ollama endpoint hardening and provider free-tier audit

**Date:** 2026-11-17  
**Repository:** `babaprobado-bit/A-studio`  
**Branch:** `feature/android-offline-skills-v1`  
**Code commit:** `acb74e2ed3c26299a27cb863bfe0f2c43912d46e`  
**PR:** #2, open and Draft; base remains `main`  
**Main SHA at audit:** `aab010319b6500002844bd24b11da85dd9ca3b00`

## 1. Security finding and source changes

Session 17 introduced Ollama endpoint transport checks, but the literal-IP restrictions were applied mainly to plain HTTP. An HTTPS URL could still target link-local, carrier-grade NAT, private IPv6, multicast, unspecified, or documentation/benchmark ranges. Examples confirmed against the old code included `https://169.254.169.254:11434`, `https://100.64.0.1:11434`, and `https://[fd00::1]:11434`.

Commit `acb74e2` updates:

- `src/ai-team.js`: parse IPv4 and IPv6 literals and reject special-use ranges regardless of HTTP/HTTPS. This includes IPv4 unspecified, link-local, CGNAT, IETF special/documentation, benchmark, multicast and reserved ranges; IPv6 ULA, link-local, multicast, unspecified, documentation, benchmarking, ORCHID, Teredo/6to4 and non-global ranges.
- Preserve the existing local Ollama use case: HTTP remains allowed only for localhost/loopback and RFC1918 IPv4. HTTPS remote DNS names, RFC1918 IPv4, loopback and global-unicast IPv6 remain supported.
- `src/main.js`: set `redirect: 'error'` on Ollama chat requests so an allowed HTTPS host cannot silently redirect the request to a different, unvalidated IP address.
- `scripts/test-ai-team.mjs`: add regression cases for the blocked IPv4/IPv6 ranges, preserved private/loopback HTTPS, public IPv6 HTTPS, and redirect rejection.

**Residual limitation:** remote HTTPS DNS names are not DNS-resolved or IP-pinned in the browser. Only literal IPs and HTTP transport are classified here. Users should configure only trusted remote Ollama endpoints. Redirects are rejected.

## 2. Test and build results

Local isolated Node checks passed:

- `node --check src/ai-team.js`
- `node --check src/main.js`
- `node --check scripts/test-ai-team.mjs`
- `node scripts/test-ai-team.mjs`
- `node scripts/test-skills.mjs`
- `node scripts/test-api-local-coder.mjs`
- `node scripts/test-rea-companion-contract.mjs`
- `node scripts/test-openshorts.mjs`
- `node scripts/test-chat-layout.mjs`
- `node scripts/test-social-studio.mjs`
- `node scripts/test-runway-video.mjs`
- `node scripts/test-device-local-coder.mjs`
- `node server/workshop-smoke-test.js`
- `node --check` across the fetched project JS/MJS source and test files.

`test-device-local-coder.mjs` used a temporary test-only `@capacitor/core` stub and injected fake native plugin; it validates the JavaScript bridge wrapper, not the actual Capacitor runtime. `server/smoke-test.js` was not run because npm/Express dependencies were unavailable in the audit shell.

The remote audit shell did not provide `npm`, so no local npm install/build was attempted. Both GitHub Actions workflows installed dependencies and built web assets successfully.

### Demo APK

- Workflow run: https://github.com/babaprobado-bit/A-studio/actions/runs/44143068283
- Result: successful
- Artifact: `AI-Studio-Demo-APK`
- Artifact ID: `14355397500`
- Size: `3,810,463` bytes
- SHA-256: `46b3002f27d40aba9567f20ad63e24a6488887e87b1bad5fc1fbe8b45260f549`
- Expiry: `2026-12-01T18:03:46Z`
- Download: https://api.github.com/repos/babaprobado-bit/A-studio/actions/artifacts/14355397500/zip

### Native GGUF APK

- Workflow run: https://github.com/babaprobado-bit/A-studio/actions/runs/44143072161
- At the last audit poll, the job was still running at `Build debug APK (retry transient repository failures)`. All previous steps passed, including native tools, pinned llama.kt, llama.cpp sources, web build and the full regression step. APK upload had not started and no artifact was available yet.
- Do not treat the build as a successful APK until the workflow and artifact metadata confirm it.

CI results are not physical-device acceptance. No phone/PC test, APK installation, actual GGUF inference, airplane-mode test, or real REA Companion connection was performed.

## 3. Provider free-tier status snapshot (official sources checked 2026-11-17)

Keep the user's preference order unchanged. Never label a trial credit, paid tier, or broker-specific offer as an ongoing universal free tier.

| Order | Provider | Verified status and implementation guidance |
|---:|---|---|
| 1 | Google Gemini (AI Studio) | Free API tier exists for selected models; Gemini 3.8 Flash is listed free. Free-tier content may be used to improve Google products. Model access and quotas vary by account/model. https://ai.google.dev/gemini-api/docs/pricing |
| 2 | Groq | A Free Plan Limits view exists, but exact per-model quotas are account-specific in the Limits page. The public rate-limit table also shows Developer-tier values; do not copy those into the free tier. https://console.groq.com/docs/rate-limits |
| 3 | OpenRouter (`:free` only) | Free variants are $0 and capped at 20 RPM and 50 RPD; failed attempts count toward the daily cap. Preserve strict `:free` filtering. https://openrouter.ai/collections/free-models |
| 4 | Cloudflare Workers AI | Workers Free includes 10,000 Neurons/day, reset at 00:00 UTC. Some frontier models require paid billing. https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| 5 | SambaNova Cloud | Official Free Tier applies when no payment method is linked. Current production models show 20 RPM, 20 RPD and 200,000 TPD; preview models have limited capacity and may be removed. https://docs.sambanova.ai/docs/en/models/rate-limits |
| 6 | NVIDIA NIM | NVIDIA Developer Program grants free hosted NIM API access for prototyping/research/development/testing. Production use requires NVIDIA AI Enterprise; do not label it free production hosting. https://docs.api.nvidia.com/nim/docs/product |
| 7 | Z.ai / Zhipu GLM Flash | Official pricing lists GLM-4.7-Flash, GLM-4.5-Flash and GLM-4.6V-Flash at $0. Numeric free-model rate limits are not publicly listed. GLM-5.3-Flash is paid, not free. https://docs.z.ai/guides/overview/pricing |
| 8 | LLM7.io | The official site is accessible but its current page did not expose readable pricing/quota details in this audit. Treat free access and numeric limits as unverified until confirmed in the official account/terms; do not hardcode a quota. https://llm7.io/ |
| 9 | SiliconFlow | Official pricing advertises $1 in starter free credits, then pay-as-you-go. Treat as one-time credit, not an ongoing free tier. https://www.siliconflow.com/pricing |
| 10 | Cohere | Evaluation/trial keys are free and limited to 1,000 API calls/month; endpoint/model rate limits differ. Listed trial Chat models show 20 RPM. https://docs.cohere.com/docs/rate-limits |
| 11 | Mistral AI | Free mode is the default API mode with the lowest limits for evaluation/prototyping. Exact quotas are account-specific in the Limits page. Pay-as-you-go unlocks higher tiers. This corrects the earlier handoff claim that Free mode did not cover API usage. https://help.mistral.ai/en/articles/698531-why-am-i-hitting-api-rate-limits-and-how-do-i-increase-them |
| 12 | OVHcloud AI Endpoints | The UK offer advertises £175 Public Cloud trial credit for one month. This is a time-limited trial, not a perpetual free API tier; region/currency may vary. https://www.ovhcloud.com/en-gb/public-cloud/free-ai-api/ |
| 13 | Gonka Broker | No universal free broker quota is guaranteed by the core docs. Community brokers independently set retail prices, payment methods, rate limits and data terms. Treat as paid/unknown until a specific broker's current terms prove otherwise. https://gonka.ai/docs/developer/quickstart/ and https://gonka.ai/docs/wallet/pricing/ |

## 4. Verified 1.1.4 source archive for future selective integration

Library archive `AI-Studio-1.1.4-Free-API-Providers.zip` was materialized and SHA-256 checked against its verification record: `967d221a1861dd842b245c8fa8419dd9444ee06edbf8ba9de8b3b81cd0de0661`.

Its isolated checks passed:

- `node --check` across archive JS/MJS/CJS files
- `node scripts/test-agent-swarm.mjs`
- `node scripts/test-plugin-catalog.mjs`
- `node scripts/test-openrouter-chat.mjs`
- `node scripts/test-free-api-providers.mjs`

The current feature branch does not contain `src/agent-swarm.js`, `src/plugin-catalog.js` or `src/openrouter-chat.js`. These archive modules have **not** been integrated. Next work should compare the archive with the current source and selectively port compatible Agent Swarm, prompt-plugin catalogue and provider adapter pieces. Do not replace the branch with the whole archive or reduce the ten AI Team engines.

## 5. Repository invariants and next actions

- `main` remained at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains open, Draft, base `main`, unmerged.
- Preserve all ten AI Team engines and current Skills Library/Local Coder/GGUF/REA mock contracts.
- No credentials were created, read, copied or committed. No real REA service was contacted.
- Next: finish/poll Native GGUF run `44143072161`, collect its artifact metadata if successful, then selectively integrate the verified 1.1.4 Agent Swarm/Plugin Catalog/OpenRouter modules with focused tests.
