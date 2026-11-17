# Session 17 — Ollama transport and GGUF chat-boundary hardening — 2026-11-17

## Scope and source findings
- Repository: `babaprobado-bit/A-studio`
- Branch: `feature/android-offline-skills-v1`
- PR #2 must remain open and Draft; `main` must remain unchanged.
- Re-read the current `src/ai-team.js`, `src/main.js`, `src/device-local-coder.js`, `android-local-runtime/LocalLlmPlugin.kt`, and their regression tests.
- The older Session 4 review findings were still present: the Ollama adapter accepted arbitrary HTTP hosts, and the JS/native GGUF chat bridge had no message-count or UTF-8 byte budget.

## Changes in this session
1. Added `normalizeOllamaEndpoint()` to the shared AI Team helper:
   - HTTPS is accepted for remote endpoints.
   - Plain HTTP is limited to localhost, IPv4 loopback, and RFC1918 private IPv4 addresses.
   - Public HTTP, IPv4 link-local, carrier-grade NAT, private IPv6, unsupported schemes, URL credentials, query strings, and fragments are rejected.
   - The Ollama settings save path validates before persisting; `callProvider()` validates again before `/api/chat`, including restored/older settings and AI Team/Local Coder calls.
2. Added a bounded GGUF chat input contract in JavaScript and Kotlin:
   - Maximum 64 input messages.
   - Maximum 65,536 UTF-8 bytes per non-empty message.
   - Maximum 131,072 UTF-8 bytes total.
   - Only `system`, `user`, and `assistant` roles pass; blank messages are omitted.
   - JavaScript validates before the Capacitor call; Kotlin repeats the checks before llama.kt inference.
3. Added endpoint-policy, request-order, Unicode byte-count, role, count, aggregate-size, bridge-forwarding and native-source regression assertions.

## Preserved behavior
- All 10 AI Team engines and their parallel/sequential orchestration remain unchanged.
- OpenRouter free-only model validation, provider order, Skills Library, GGUF catalogue/SHA-256 pins, model licensing, Ollama mode, and the separate Demo/Native APK workflows remain unchanged.
- No secrets, credentials, provider calls, or user data were added or changed.
- REA remains mock-only; no companion installation or connection was attempted.

## Verification in the remote Node workspace
- `node --check` passed for `src/ai-team.js`, `src/main.js`, `src/device-local-coder.js`, `scripts/test-ai-team.mjs`, and `scripts/test-device-local-coder.mjs`.
- `node scripts/test-ai-team.mjs` passed, including all 10 engine assertions and Ollama endpoint restrictions.
- `node scripts/test-device-local-coder.mjs` passed using a temporary test-only `@capacitor/core` stub and fake native plugin. This is JavaScript bridge logic testing, not Android runtime verification.
- No live Ollama request was sent.
- Local `npm run build` and Kotlin/Gradle compilation were not run in this remote workspace; GitHub Actions must verify them after the commit.
- No physical phone test, GGUF inference, RAM benchmark, or airplane-mode test was performed.

## Residual risk
Both Android workflows still inject `android:usesCleartextTraffic="true"` to preserve trusted-LAN PC Ollama support. The new Ollama adapter guard prevents its own remote HTTP requests, but this does not create a host-scoped Android manifest policy for every future networking path. Do not claim app-wide cleartext has been eliminated. Revisit a narrowly scoped Network Security Config only if it can preserve intentional LAN Ollama compatibility.

## Next work
1. Verify the feature branch, PR #2 and `main` again before pushing; commit only to the feature branch.
2. Run Demo and Native GGUF CI on the exact source commit and inspect artifacts separately.
3. Continue the carefully scoped 1.1.4 integration: Agent Swarm and searchable prompt-template catalog are not yet present in the current branch. Preserve the ten-engine AI Team and free-only model gates; do not wholesale-copy the old package.
4. Recheck provider free-tier claims against current official documentation before exposing any new provider as free.
