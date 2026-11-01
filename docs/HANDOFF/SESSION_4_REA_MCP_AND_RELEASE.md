# Session 4 of 4 — Optional REA/MCP and final release

## Goal
Design and, if safe and feasible, implement optional REA/MCP companion connection. Then run full regression/security/release checklist, update docs and decide with user whether PR #2 is ready to merge.

Do not assume REA is installed, connected or available inside Android APK.

## Read first
- docs/HANDOFF/README.md
- docs/HANDOFF/PROJECT_STATE.md
- final notes from Sessions 1–3
- current PR #2 description/checks
- current REA upstream documentation and package/version support (verify live docs before implementation)

## REA design decision already made
- REA is separate optional companion/MCP tool, not a Node CLI bundled inside Android APK.
- Earlier intended commands: npx -y rea-agents@latest analyze ..., doctor --json, and setup for MCP.
- Historical environment note said modern Node support (then noted as Node 22.19+, 24.11+ or 26+). Verify current REA docs before relying on those numbers.
- Android APK cannot be assumed to host Node REA CLI. Prefer a separately running companion host/MCP endpoint.
- Keep REA completely optional. App must work normally when REA is absent.
- Do not install packages, download agents, create MCP connections, run tools or modify external files without explicit user approval.

## Safe integration boundaries
- User configures companion/MCP endpoint explicitly.
- Store credentials only in secure storage, never Preferences/plain backup/source.
- Show server identity, available tool list, scopes and descriptions before enabling.
- Ask before each side-effecting operation (file write, shell command, project modification, remote task). Read-only calls can still disclose prompts/project context; show what data is sent.
- Require least-privilege scopes; separate read-only from read-write.
- Provide disconnect/revoke controls and visible activity log with arguments/results scrubbed of secrets.
- Add timeouts, cancellation, input/output-size limits, allowlisted operations and error handling.
- No unrestricted shell, arbitrary filesystem access or hidden background tasks.
- Treat remote MCP responses and imported Skill text as untrusted data.
- If browser/Capacitor cannot safely host MCP client, use companion-host API boundary rather than faking direct integration.

## Final regression/security checklist

### Functionality
- [ ] Existing chat and all six cloud API providers remain selectable.
- [ ] API keys stay encrypted in Android secure storage; never in workspace backup.
- [ ] Demo mode stays default; multiple paid calls ask before sending.
- [ ] Team parallel/sequential and comparison paths remain functional.
- [ ] Project context and selected file/snippet sharing remain opt-in.
- [ ] Code editor/file import/export and 100-file/100-KB limits remain.
- [ ] Snippet Vault, reuse catalog, activity history and both backups work.
- [ ] Skill profiles/import/preview/caps behave correctly.
- [ ] Ollama path works on trusted LAN.
- [ ] Native GGUF path works offline on supported phone as proven in Session 2.
- [ ] REA absent/disconnected path does not break app.

### Security / provenance
- [ ] No secrets in source/docs/logs/PR.
- [ ] No silent API fallback or hidden billable requests.
- [ ] No execution of imported Skill Markdown.
- [ ] MCP scopes and side-effect approval tested.
- [ ] usesCleartextTraffic=true risk reviewed; HTTPS used for remote endpoints/model downloads.
- [ ] llama.kt notices and model-card/license details present before redistribution.
- [ ] Backup restores preserve old formats and do not overwrite provider credentials.

### Release
- [ ] All four test scripts and Vite build pass.
- [ ] Regular Android debug workflow passes.
- [ ] Native GGUF debug workflow passes and artifact exists.
- [ ] Actual phone test report exists.
- [ ] README/ROADMAP/handoff docs match implementation.
- [ ] PR #2 is no longer draft only after gates pass.
- [ ] Ask user before merging PR #2; do not merge automatically.
- [ ] For external distribution, plan signed release APK/AAB and protect signing keys separately.

## Session exit criteria
- [ ] REA/MCP implemented behind explicit opt-in and tested, or concrete documented blocker/design provided.
- [ ] Full regression checklist complete with actual pass/fail evidence.
- [ ] Final PR and build links recorded in docs.
- [ ] User receives accurate summary of features and limits.
- [ ] Merge/release decision explicitly left to user.

## Copy-ready prompt for next conversation

Continue AI Studio Alpha 1. Read docs/HANDOFF/README.md, PROJECT_STATE.md and SESSION_4_REA_MCP_AND_RELEASE.md, plus final notes from Sessions 1–3. Inspect current feature branch and PR #2. REA is optional external companion/MCP integration, not a runtime already inside APK; verify current upstream docs before any CLI/package. Do not install, connect, download agents, run MCP tools, send external data or execute side effects without my explicit approval. Design least-privilege permissions and visible approval. Then run full regression/security/release checklist, update docs, and ask before merging PR #2.
