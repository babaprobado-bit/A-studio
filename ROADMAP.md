# AI Studio Alpha 1 — Feature status and next steps

This document separates implemented features from plans. A button or prompt template is not a working autonomous agent.

## Working in the current workspace

- Multi-provider chat and model comparison, with configured provider API keys.
- Parallel team requests and a sequential text-passing agent pipeline. Runs are explicitly started by the user, not always-on computer control.
- Prompt-only plugin creation/import/export. Imported plugins do not execute code.
- Local project notes, chat history, and JSON workspace backup/restore.
- Private web server gate with one shared site password and signed session cookie; hosting must still be configured.
- Local Coder: user-started three-stage workflow using a model already running in Ollama.
- Reuse Catalog: links to upstream engines and asset repositories, including license pages.
- Snippet Vault: local reusable code/text records with source/license fields; JSON import/export.
- Recent Local Coder stage log in local app/browser storage.

## Not implemented yet

- A model binary shipped inside the APK or website. Install/download a model separately; a small quantized model can still be slow or inaccurate on low-memory hardware.
- Agent writes directly into arbitrary PC folders, runs shell commands, launches game engines, installs dependencies, or executes test suites.
- Long-running unattended agent loop that changes code without the user starting/approving each run.
- Cloud database, individual accounts, end-to-end encrypted cloud vault, or cross-device synchronization.
- Website deployment and a permanent public URL.
- Automatic downloading/reuse of third-party repositories/assets. The catalog is a source directory, not an asset mirror.

## Next stages

1. Add a local desktop companion with a clear per-folder permission boundary, diff/approval screen, command allowlist, and captured test results.
2. Add signed project exports and integrity checks to the local snippet vault.
3. Add per-user login and server-side database before multi-device cloud sync.
4. Add an optional opt-in scheduler only after these are tested; show activity, resource use, stop control, and explicit permissions.

## Reuse and licensing

Catalog links are starting points only. Verify the actual version and license of every code, model, sound, texture, 3D asset, add-on and bundled dependency. Keep required attribution and license notices in the project.
