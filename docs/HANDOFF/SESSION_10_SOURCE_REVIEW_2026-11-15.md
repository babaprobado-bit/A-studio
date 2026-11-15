# AI Studio — Session 10 source package review (2026-11-15)

## Source bundle reviewed

- Package: `AI-Studio-1.1.4-mobile-update.zip`
- Package SHA-256: `0755e03dd222ebb4165bc3cf6ce09757a0492802b516cb9b0b225938ddf95d78`
- `package.json` version: `1.1.4`
- ZIP archive opened successfully; all 20 listed files were readable.
- Source manifest checks: all file sizes and SHA-256 values in `AI-STUDIO-UPDATE-MANIFEST.json` matched the archive payload (45 entries in the expanded branch-update bundle; no mismatches).

## Features in the 1.1.4 bundle

- Mobile-first chat screen update and OpenRouter multi-model chat (up to four selected models, parallel fan-out, isolated model failures).
- Searchable prompt-plugin catalog with 34 prompt templates and explicit separation between prompt templates and external integrations.
- Qwen2.5 Instruct 0.5B Q2_K compact GGUF chat model selection/download integration with pinned checksum (model weights are not embedded in the APK).
- Lightweight JCode-inspired Agent Swarm coordinator/worker queue, bounded concurrency, shared message board, path locks, limited transient retry, and no automatic file writes or shell execution.
- Optional Cohere Trial and Cloudflare Workers AI providers; key fields are empty by default. Android key storage uses the existing secure-storage path. Cloudflare Account ID is validated as 32 hexadecimal characters. The existing ten-engine AI Team stays the default team.
- Additional regression tests and updated Android CI workflows.

## Local checks performed on the extracted bundle

Passed:
- JavaScript syntax checks for selected application, test, server and desktop JavaScript files.
- `scripts/test-agent-swarm.mjs`
- `scripts/test-openrouter-chat.mjs`
- `scripts/test-plugin-catalog.mjs`
- `scripts/test-free-api-providers.mjs`
- `scripts/test-openshorts.mjs`

Not completed in this extraction environment:
- `scripts/test-device-local-coder.mjs` needs `@capacitor/core`, which is not installed here.
- Full repository smoke tests need the baseline files and packages (including Express); the source ZIP is an update bundle, not a complete clean checkout.
- `npm run build` could not be run locally because Vite dependencies are not installed and this environment cannot resolve npm registry DNS.
- No APK was built from the 1.1.4 source bundle in this extraction environment.

## Critical source / APK distinction

Two fresh GitHub Actions APK builds were completed earlier in this session, but both checked out source commit `44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c` before the 1.1.4 source bundle was integrated:

- Native GGUF run [43706583890](https://github.com/babaprobado-bit/A-studio/actions/runs/43706583890), artifact ID `14159431240`, archive SHA-256 `4ee4eb19d8748153fdadb150f14a40d5d397dbdb8911490ef6cf846eaa29e01e`.
- Demo run [43706581476](https://github.com/babaprobado-bit/A-studio/actions/runs/43706581476), artifact ID `14158542919`, archive SHA-256 `10a077d77de9f41c9616b18a9b056a00f2e6724a1fd80d479ac756277d3e50bf`.

Therefore those APKs must **not** be labelled as containing the 1.1.4 chat, plugin catalog, Agent Swarm or Cohere/Cloudflare additions.

## GitHub checkpoint

- A documentation-only commit `9d7746c368ac7a0bf0c1206e42367428037abf01` was added to `feature/android-offline-skills-v1` with the APK build evidence.
- At the last verified recheck, `main` remained `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remained open, Draft, and unmerged.
- The 1.1.4 application source bundle has **not** been committed to the feature branch yet; no new 1.1.4 APK workflow has been run.
- The extracted bundle was saved in the user's Library as `AI-Studio-1.1.4-mobile-update(1).zip`.

## Remaining work

1. Import the 1.1.4 application source files into `feature/android-offline-skills-v1`.
2. Run the complete test suite and Vite build from the resulting branch commit.
3. Run Native GGUF and Demo APK workflows from that exact new commit; verify both artifacts and their hashes.
4. Keep PR #2 Draft and do not modify `main` or merge without explicit user approval.
5. Keep physical-device installation, model inference, RAM/performance and airplane-mode testing marked as not performed until they are actually tested.
