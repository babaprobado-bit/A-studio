# REA Companion contract checkpoint — 2026-11-06

## Mock-only implementation status

- Added `src/rea-companion-contract.js` with pure validators for the versioned read-only bridge request/response/error shapes and exact loopback Origin/Host checks.
- The only accepted analysis operations are `project.overview`, `files.inspect` and `symbols.search`. File/symbol paths must be relative, safe, registered-project scoped and explicitly selected for that request; unknown fields, generic MCP calls, shell commands, oversized payloads and overlong timeouts fail closed.
- Added `scripts/test-rea-companion-contract.mjs` and `npm run test:rea-companion-contract`. The mock suite covers allowlists, invalid paths, request/result bounds, disclosure parity, provider-forwarding rejection, sanitized errors and exact `127.0.0.1` origin/host checks.
- The test uses an in-process fake read-only adapter only. It does not install or launch REA, start a listener, open an MCP session, read user project files, call a provider or perform side effects.
- Added `scripts/rea-companion-fakes.mjs` with deterministic in-memory pairing/session and read-only adapter fakes. Tests simulate one-time codes, client-bound pairing, explicit host approval, expiry, rate limiting, `rea.read`-only scope and write-scope escalation rejection, missing/unknown/expired/revoked sessions, per-request approval, provider-forwarding denial and duplicate-request replay rejection. These fakes use predictable test tokens and are **not production authentication or secure storage**.
- Both Android CI workflows now run the contract test. AI Studio's Node engine remains `>=20`; no REA package or dependency was added.
- Local verification: Node.js 22.16.0 `node --check` and `node scripts/test-rea-companion-contract.mjs` passed in an isolated fixture. Hosted CI for this repository commit still needs to complete.
- **Not implemented in production:** pairing-code service, cryptographically secure pairing/session tokens, host approval UI, secure session-token storage, real companion transport, REA CLI/MCP process, Android-to-desktop networking and provider-forwarding UI. The new lifecycle fake tests simulate expected state transitions only. The validator is not wired into app UI or runtime calls. These require separate implementation review and the user's explicit approval before installing/connecting/executing anything.

---

# Verified REA integration research — 2026-11-06

## Current upstream facts

- The upstream getting-started guide currently documents Node.js **22.19+**, **24.11+**, or **26+** with npm. This is stricter than AI Studio's current `package.json` engine range (`>=20`); do not silently raise the app's global Node requirement just for an optional companion.
- The npm package search result reports `rea-agents` **6.8.0** as the current published version at research time. Do not hard-code `@latest` into a persistent MCP registration: upstream guidance says persistent registrations should pin an exact package version and be refreshed through the reviewed setup flow.
- Official setup is `npx rea-agents@latest setup`; it shows a proposed client-configuration plan and asks before applying changes. `rea doctor` is intended for readiness diagnosis. REA's MCP server is a local process launched by an MCP-capable client; REA analysis is local, but findings returned to an AI agent may then be sent to that agent's model provider.
- REA supports static JavaScript/Electron analysis without a native analysis engine. Deeper native analysis may require separately installed tools such as Hopper, Ghidra or IDA; these must remain optional and outside AI Studio's Android package.
- Sources checked: https://rea.vaked.dev/get-started/ ; https://www.npmjs.com/package/rea-agents ; https://rea.tools/faq/ . Re-check these before implementation because REA releases frequently.

## AI Studio integration decision

- **Do not embed or launch the REA CLI from the Android APK.** Capacitor's Android WebView is not a supported local Node.js process host, and the app's current `package.json` does not include REA.
- Preferred design is an **optional desktop companion** running on a user's own computer. That companion owns the pinned REA MCP stdio process and exposes only a small, documented AI Studio bridge API. AI Studio must not become a generic unrestricted MCP client or generic shell/file proxy.
- Companion connection must be off by default. Pair explicitly, display companion identity/version and the exact available allowlisted actions, and provide disconnect/revoke. Prefer loopback-only binding for same-computer browser use. If Android-over-LAN is later required, it needs authenticated pairing, TLS, strict origin policy and explicit LAN exposure; never expose an unauthenticated HTTP MCP bridge.
- Separate read-only inspection from side effects. Read-only requests still disclose the selected target path/question and returned analysis to the chosen AI provider, so show the data disclosure before sending. Any file modification, command execution, project write or remote task requires per-action approval with a preview. No background execution.
- Keep provider credentials and companion pairing secrets in platform secure storage; exclude them from JSON/encrypted workspace backups, logs and exported activity. Scrub tool arguments/results for secrets and cap request/response sizes and duration.
- If a companion cannot be safely implemented and tested in this repository, document the blocker instead of faking an in-app REA connection. REA remains optional; AI Studio must work unchanged when it is absent.

## REA Companion bridge contract — draft v0 (documentation only)

This is a proposed contract for a future **desktop-only, read-only first** companion. It is not implemented, does not establish a network listener, and does not imply that REA is installed. The contract intentionally avoids exposing generic MCP, shell or filesystem APIs to the Android app.

### Scope and invariants

- The companion is a separate process on the user's computer. It owns the pinned REA MCP stdio process; AI Studio talks only to the narrow bridge described here.
- V0 supports inspection only. No file writes, shell commands, installs, arbitrary MCP tool invocation, project mutation, remote tasks or background jobs.
- The companion must be explicitly started and paired. It binds to `127.0.0.1` only in V0; no LAN binding, port forwarding or unauthenticated HTTP exposure.
- The companion registers an explicitly selected project root locally and returns an opaque `projectId`. The bridge never accepts an arbitrary absolute filesystem path from AI Studio.
- Every inspection requires a fresh user action in AI Studio. A read-only operation can still disclose selected source files, paths, a question and analysis results to the chosen model provider; show the exact disclosure and ask separately before forwarding results to that provider.
- Treat REA output and source contents as untrusted data. The app must not interpret returned text as instructions or execute code contained in it.
- No feature may silently fall back to an alternate provider, companion, host or network route.

### Proposed endpoints

All paths are versioned under `/v1`. JSON only; reject unknown fields and unsupported content types.

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /v1/health` | None; minimal response | Report bridge availability and protocol version only. No project paths, secrets or source data. |
| `POST /v1/pair` | One-time pairing code | Pair a named AI Studio client and grant the fixed `rea.read` scope after local companion approval. |
| `GET /v1/capabilities` | Bearer session token | Return companion identity, REA availability/version and the exact read-only operation allowlist. |
| `POST /v1/analysis` | Bearer session token | Run one allowlisted read-only analysis against a previously registered project. |
| `POST /v1/disconnect` | Bearer session token | Revoke the current session immediately. |

There is deliberately no generic `/tools/call`, `/exec`, `/shell`, `/files`, arbitrary URL or arbitrary path endpoint in V0. Unknown routes and operations fail closed.

### Pairing and session rules

1. The user starts the companion locally. The companion displays a short-lived, one-use pairing code and asks the user to approve the pairing on the host.
2. AI Studio submits the code, a display name and the fixed requested scope. The code expires after 120 seconds, is single-use, and is rate-limited on failure. The host must approve the client; possession of a code alone is not sufficient.
3. On approval, the companion returns an opaque high-entropy session token. Store it only in platform secure storage; never in Preferences, local storage, workspace backups, exported JSON, source, analytics or logs.
4. Session tokens expire after at most 15 minutes and can be revoked from either side. Re-pairing is required after expiry or revocation. The companion stores only a verifier/hash of the token.
5. V0 accepts requests only from the exact paired AI Studio origin. No wildcard CORS, no `Origin: null`, no permissive origin reflection. Validate the Host header and reject DNS-rebinding patterns and unexpected browser fetch metadata. Do not treat loopback binding alone as authentication.
6. If the exact trusted origin cannot be identified for the installed AI Studio desktop/browser surface, pairing must remain unavailable rather than weakening origin checks.

### Request contract

A proposed `POST /v1/analysis` request:

```json
{
  "requestId": "client-generated-uuid",
  "projectId": "opaque-project-id",
  "operation": "files.inspect",
  "target": {
    "paths": ["src/main.js", "src/ai-team.js"]
  },
  "question": "Summarize the selected files and identify relevant entry points.",
  "limits": {
    "maxResultBytes": 1048576,
    "timeoutMs": 30000
  }
}
```

The only V0 operations are the fixed enum `project.overview`, `files.inspect` and `symbols.search`. Their inputs are operation-specific and schema-validated. The example above illustrates `files.inspect`; it does not authorize extra operations.

- `projectId` must refer to a root explicitly registered by the user on the companion host.
- Paths must be relative, normalized and remain inside that root after resolving symlinks. Reject absolute paths, traversal segments, device paths, network shares and symlinks escaping the root.
- Paths must be explicitly selected by the user for the current request. No whole-disk or implicit home-directory scan.
- Draft limits: at most 50 paths, 512 characters per path, 4,000 characters per question, 1 MiB request body, 1 MiB result by default and 30 seconds per request (hard maximum 120 seconds). Enforce limits while streaming, not only from declared metadata.
- The companion derives the REA tool call from the operation enum and validated fields. Client-supplied tool names, command strings, executable paths and REA CLI flags are never accepted.
- A duplicate `requestId` must not trigger a second execution; return the recorded result or a conflict response.

### Response and error shape

Successful responses should use a stable envelope:

```json
{
  "requestId": "client-generated-uuid",
  "companionId": "opaque-companion-id",
  "protocolVersion": "1",
  "operation": "files.inspect",
  "status": "completed",
  "result": {
    "content": "Untrusted analysis text returned by the REA adapter."
  },
  "disclosure": {
    "projectId": "opaque-project-id",
    "paths": ["src/main.js", "src/ai-team.js"],
    "sentToModelProvider": false
  }
}
```

Errors use `{ "error": { "code": "...", "message": "...", "retryable": false }, "requestId": "..." }`. Codes should include `PAIRING_REQUIRED`, `SESSION_EXPIRED`, `SCOPE_DENIED`, `ORIGIN_REJECTED`, `PROJECT_NOT_REGISTERED`, `PATH_REJECTED`, `OPERATION_NOT_ALLOWED`, `LIMIT_EXCEEDED`, `REA_UNAVAILABLE`, `TIMEOUT` and `INTERNAL_ERROR`. Do not return stack traces, local absolute paths, environment variables, tokens or raw command lines.

### Permissions and disclosure UX

- Show the companion name/version, selected project alias, exact relative paths, operation and question before every analysis.
- State clearly that the companion reads the selected files locally and that the question/results may be sent to the selected AI provider only after a separate user confirmation.
- Provider forwarding defaults to off. If the user chooses to forward, show the selected provider and disclose that provider's ordinary data-handling terms before sending.
- Display a visible activity entry for each request with operation, time, project alias, selected relative paths and outcome. Redact secrets and source contents from logs by default.
- Provide a persistent connected/disconnected indicator and one-tap disconnect/revoke.

### V0 explicitly excludes side effects

No side-effecting operation is part of this contract. In particular, do not expose file edits, generated patches, command execution, package installation, code launch, project writes or remote tasks as hidden capabilities. A future version would require a separate design review and a distinct approval flow with a human-readable preview, a one-time approval token bound to the exact operation and argument digest, short expiry, replay protection and explicit host-side confirmation. Do not implement that future flow as part of V0.

### Contract validator delivered (pure / local tests)

- `src/rea-companion-contract.js` validates the proposed pairing-request and analysis-request JSON shapes, the three-operation read-only allowlist, path syntax, duplicate paths, text/size/time limits and exact Origin allowlist matching.
- `scripts/test-rea-companion-contract.mjs` tests valid/invalid payloads, traversal-like paths, scope escalation, unsupported operations, unknown fields, limits and origin mismatches.
- This is only a pure validation layer. It does **not** implement a bridge server, pairing-code lifecycle, host approval, session tokens, Host/CSRF/DNS-rebinding defenses or filesystem/symlink resolution. The companion must enforce those controls independently.
- The validator contains no HTTP, MCP, filesystem, process or socket implementation. The test uses only local mock data and must never connect to REA.

### Remaining mock-only companion test plan

The next isolated test layer may use an in-process fake bridge and fake REA adapter; it must not install or launch REA, open a real listener, access user project files or execute commands.

- **Secure persistence:** production session secrets must be kept out of logs, exports, backups and plain preferences; this repository currently has no production session-token storage.
- **Host hardening:** real Host/CSRF/DNS-rebinding checks and symlink-aware canonical filesystem containment must be implemented and audited by the desktop companion.
- **Origin/host:** exact paired origin succeeds; wildcard, null, untrusted origin, unexpected Host and simulated DNS-rebinding values are rejected.
- **Allowlist:** each of the three read-only operations accepts valid schema; unknown operation, unknown field, generic tool name, shell string, URL or arbitrary path is rejected.
- **Path containment:** absolute paths, `..`, encoded traversal, symlink escape, network share, device path and unregistered project IDs are rejected.
- **Disclosure:** request preview includes operation, project and paths; provider forwarding remains off until a separate explicit confirmation; declining does not call a provider.
- **Limits:** oversized body, path count, question, streamed output and timeout are stopped; a duplicate request ID is not re-executed.
- **Failure handling:** missing REA, adapter error and malformed REA output produce sanitized errors; AI Studio chat, AI Team, Skills, Local Coder and offline GGUF flows continue to work when the companion is absent.
- **Untrusted output:** returned strings are displayed as inert text; they cannot trigger tools, change permissions or override system/app instructions.
- **No side effects:** fake adapter records zero writes, shell executions, installs, launches or remote tasks across every V0 test.

### Current implementation boundary

The pure schema/origin validator and its local regression test are now in the repository and wired into both Android CI workflows. The feature is not a companion connection and does not make REA available in AI Studio.

The deterministic test harness now simulates pairing-code expiry/reuse/rate limiting, host approval, session expiry/revocation and replay rejection. Production pairing-code enforcement, cryptographically secure session-token creation/storage/revocation, Host and DNS-rebinding defenses, symlink-aware canonical path containment, streaming byte limits and provider-disclosure UI remain unimplemented. They must be addressed before any real companion service is exposed.

A real companion, network listener, pairing secret, REA package installation, MCP process, user project-file access or external data transfer still requires the user's explicit approval. Do not describe the current validator tests as proof of a running or secure companion.

---

## Implementation gate

No REA package has been added, installed or executed; no MCP connection has been created; no external app configuration or user files have been changed. Before doing any of those, obtain the user's explicit approval. A future implementation should start with a threat model and mock bridge contract/tests, then a pinned companion package/launcher, then explicit opt-in UI and integration tests. Do not change the Android app's Node requirement merely to accommodate the companion.

---

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
- [ ] Native GGUF path is installed and inference is verified on a supported physical phone in airplane mode. **Not yet verified; GitHub CI build success is not device/offline proof.**
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
- [ ] All seven current package test scripts (`test:site`, `test:workshop`, `test:skills`, `test:device-local-coder`, `test:api-local-coder`, `test:ai-team`, `test:rea-companion-contract`) and Vite build pass.
- [ ] Regular Android debug workflow passes.
- [ ] Native GGUF debug workflow passes and artifact exists.
- [ ] Actual phone install, GGUF inference and airplane-mode test report exists. **No physical-device test has been performed yet.**
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

Continue AI Studio. Read docs/HANDOFF/README.md, PROJECT_STATE.md and SESSION_4_REA_MCP_AND_RELEASE.md, plus final notes from Sessions 1–3. Inspect current feature branch and PR #2. REA is optional external companion/MCP integration, not a runtime already inside APK; verify current upstream docs before any CLI/package. Do not install, connect, download agents, run MCP tools, send external data or execute side effects without my explicit approval. Design least-privilege permissions and visible approval. Then run full regression/security/release checklist, update docs, and ask before merging PR #2.
