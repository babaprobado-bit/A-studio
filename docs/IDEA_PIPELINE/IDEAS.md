# AI Studio — Idea Pipeline

**Generated:** 2026-11-18  
**Repository:** `babaprobado-bit/A-studio`  
**Branch snapshot:** `feature/android-offline-skills-v1` @ `98e743d6aba1d567e5fc1f0e9dc4afe5d3f60b58`  
**PR:** #2 — open, Draft, base `main`  
**Main snapshot:** `aab010319b6500002844bd24b11da85dd9ca3b00`

This file contains proposals only. Nothing below is implemented by this commit.

## Guardrails for every idea

- Keep all work on `feature/android-offline-skills-v1`; keep PR #2 open and Draft; never write to or merge into `main`.
- Preserve all ten default AI Team engines and the existing free-only model gates. Never silently fall back to a paid model.
- Do not store API keys, tokens, passwords or other secrets in Git, idea records, logs or backups.
- No arbitrary PC shell execution, unrestricted filesystem access, or unattended public publishing.
- Any external write, publish, billable generation or destructive action needs a clear user approval step.
- Treat provider quotas and availability as unknown unless the provider actually reports them.

## Prioritized ideas

### IDEA-REA-001 — Live REA Companion pairing and read-only bridge

- **Priority:** P0
- **Status:** NEW
- **Estimated scope:** XL
- **Why it is new:** `src/rea-companion-contract.js` already validates protocol v1 and the read-only operations `project.overview`, `files.inspect` and `symbols.search`. The plugin catalog and marketplace still identify REA as contract/mock-only; the live companion connection is not implemented.
- **User benefit:** Use the user's desktop REA project-analysis capability from AI Studio without giving a phone app unrestricted access to the computer.
- **Technical approach:** Add an optional desktop companion host for the REA process. Pair it with a short-lived one-time code, register projects explicitly, issue revocable short-lived sessions, and require the user to select paths for each request. Reuse the existing exact-schema validators, path allowlist, byte/time limits and disclosure response. Start read-only; do not add shell, arbitrary file writes, or automatic forwarding to another model provider.
- **Dependencies:** REA CLI/host process, a documented companion transport, Android secure session storage, and the existing REA contract module.
- **Risks:** Local-network exposure, pairing replay, path disclosure and malicious project content. Mitigate with origin/host checks, nonces, rate limits, explicit project/path selection, bounded responses and a visible disconnect/revoke control.
- **Acceptance criteria:** A paired project can return overview, selected-file inspection and symbol-search results; unregistered projects and unselected paths are rejected; expired/revoked sessions stop working; no shell or write operation is exposed.

### IDEA-AUTO-001 — GitHub-backed three-stage Project Idea Pipeline

- **Priority:** P0
- **Status:** NEW
- **Estimated scope:** XL
- **Why it is new:** The README explicitly lists unattended agents that continuously invent tasks as not implemented. GitHub is still marked planned in the connector registry; the current Power Hub Swarm is a bounded, user-started run rather than a persistent scheduled pipeline.
- **User benefit:** Make the requested idea → review → implementation cycle visible and manageable inside AI Studio, with every idea traceable to a GitHub record.
- **Technical approach:** Add three separate jobs: (1) generator creates uniquely identified ideas, (2) reviewer checks duplication, architecture, risks and readiness, and (3) executor works only on READY items. Use an Android WorkManager schedule with visible last-run/next-run state; Android background execution is best-effort, not an exact-minute guarantee. Use downloaded GGUF for offline generation when available; defer cloud-only work until connectivity returns. Write only through a narrowly scoped GitHub integration to a configured feature branch. Require approval before code changes; use GitHub Actions for build/test evidence rather than running arbitrary PC shell commands.
- **Dependencies:** GitHub OAuth/device authorization and secure token storage, WorkManager, a versioned idea schema, existing AI Team/Swarm and local GGUF paths.
- **Risks:** Background scheduling drift, token exposure, duplicate ideas and incorrect autonomous changes. Mitigate with idempotent IDs, deduplication, branch allowlists, bounded work budgets, a run log, cancellation and approval gates.
- **Acceptance criteria:** The three stages have separate states and outputs; a failed stage does not silently skip ahead; only READY ideas enter execution; all writes stay on the configured feature branch; the user can pause, inspect and revoke the integration.

### IDEA-OPENSHORTS-001 — Local video upload and approved clip recutting

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** L
- **Why it is new:** `src/openshorts-mcp.js` recognizes optional `create_upload` and `recut_clip` tools, but the Creator Studio Clips UI currently accepts a source URL and does not expose local-file upload or recutting controls.
- **User benefit:** Process a video already on the device and refine an existing clip without finding a public HTTPS URL first.
- **Technical approach:** Add a bounded Android file picker and upload-progress state. Show upload/recut controls only when the connected MCP server advertises the exact optional tool. Validate file type and size against the server's documented limits, check quota before upload, retain the existing rights-confirmation step, and require a separate preview/approval before each recut. Keep What If, In My Town and Clips as independent modes.
- **Dependencies:** OpenShorts server support for `create_upload` and `recut_clip`, documented limits, Capacitor file access and existing quota/status polling.
- **Risks:** Large uploads, private media disclosure, unsupported formats, quota use and rights violations. Mitigate with size/type checks, clear destination disclosure, explicit rights confirmation and no automatic publishing.
- **Acceptance criteria:** Unsupported tools remain hidden; upload failure is recoverable; quota is checked before upload; recut requires user approval; source files are not silently retained in app storage.

### IDEA-PROVIDER-001 — Free-provider health and observed-quota ledger

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** AI Studio has a ranked provider directory, manual connection tests and APInex free-model refresh, but no shared provider-health/cooldown ledger or consistent record of observed rate-limit responses.
- **User benefit:** See which free providers are currently responding and avoid repeatedly sending requests to a provider that is failing or rate-limited.
- **Technical approach:** Record provider/model, last success, latency, response class, observed `Retry-After` and locally counted requests. Display reported quota separately from estimated local usage; show “unknown” when the provider gives no trustworthy quota data. Add a user-configurable cooldown and an explicit free-provider fallback list. Preserve APInex `free/*`, OpenRouter `:free` and all existing allowlists; never select a paid model automatically.
- **Dependencies:** Existing provider adapters, connection-test path, APInex model refresh and local settings storage.
- **Risks:** Providers may omit or change headers; local counters are not authoritative billing data. Mitigate by labeling evidence and estimates clearly, never inventing numeric quotas, and keeping keys out of the ledger.
- **Acceptance criteria:** A provider's health state is based on actual responses; 429/cooldown behavior is tested; unknown quota remains unknown; fallback uses only user-enabled free routes.

### IDEA-SWARM-001 — AI Swarm run history and safe replay

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** The Power Hub displays the current Swarm board and results, while the existing unified activity history covers chat, team calls, pipelines, comparisons and Local Coder. The Swarm path does not currently write a structured run record to that history.
- **User benefit:** Revisit what the agents planned, see which subtask failed, and continue a useful run without rebuilding the whole request.
- **Technical approach:** Add a bounded local run record containing task ID, plan, role/provider/model identifiers, task states, retry count, elapsed time, file-conflict summary and final synthesis. Store no credentials. Offer “re-run failed tasks” only after the user reviews the plan and confirms. Add an export-to-Markdown action and a retention limit.
- **Dependencies:** `runAgentSwarm` event callbacks, Power Hub UI and existing local activity-history storage/export.
- **Risks:** Sensitive prompts or project details could be retained longer than expected. Mitigate with opt-in full details, redaction, bounded retention and a clear delete/export control.
- **Acceptance criteria:** Completed and failed Swarm runs survive navigation/restart; no API key is stored; replay is limited to selected failed tasks and requires confirmation.

### IDEA-SKILL-001 — Imported Skill version comparison and rollback

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** Skill import already has a preview queue, metadata display and duplicate-name warnings. It does not provide a version-aware update/diff flow for an already imported Skill.
- **User benefit:** Update a downloaded Skill without accumulating confusing duplicates or silently replacing instructions that were previously reviewed.
- **Technical approach:** Derive a stable source identity from normalized source URL plus Skill name; calculate a content hash; compare incoming version/source/license metadata with the installed copy; show a side-by-side diff; let the user update, keep both or skip; retain one rollback snapshot. Unknown license/source should be visibly flagged, not guessed.
- **Dependencies:** Existing `parseSkillMarkdown`, `prepareSkillImportQueue`, Skill backup state and import preview dialog.
- **Risks:** Untrusted instructions, spoofed version metadata and license uncertainty. Mitigate with explicit review, no execution of Skill content, preserved previous versions and a clear unknown-license warning.
- **Acceptance criteria:** Re-importing the same source offers a diff instead of silently creating/replacing a record; update and rollback preserve IDs and profile selections; missing license metadata is not invented.

### IDEA-PLUGIN-001 — Plugin archive trust receipt

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** The marketplace restricts downloads to a curated repository allowlist, but its current archive URL is branch-based and the catalog does not provide a verified commit/hash, archive file inventory or permission/license receipt.
- **User benefit:** Know exactly what is being downloaded before importing a Skill or using a desktop-required tool.
- **Technical approach:** Resolve the allowlisted repository branch to a commit SHA; show repository, pinned commit, license evidence, desktop requirement and declared capabilities. After download, calculate an archive hash and inspect ZIP paths/file inventory before extraction. Reject path traversal and unexpected executable entrypoints. Keep downloads inert; do not run plugin code in the Android app.
- **Dependencies:** Existing `PLUGIN_REPOSITORY_CATALOG`, GitHub repository metadata, archive download handling and safe ZIP inspection.
- **Risks:** Repository contents can change, license data can be absent, and archives can contain malicious paths or scripts. Mitigate with commit pinning, hash display, explicit unknown-license state, path validation and no auto-execution.
- **Acceptance criteria:** Every download shows its exact source revision; malformed/path-traversal archives are rejected; no plugin is executed merely because it was downloaded.

### IDEA-DEVICE-001 — Offline GGUF preflight and device benchmark

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** Device RAM/CPU/storage guardrails and safe model loading already exist, but the project still lacks a repeatable on-device acceptance report for actual model compatibility and inference performance.
- **User benefit:** Choose a model based on measured behavior on the phone instead of relying only on approximate hardware thresholds.
- **Technical approach:** After explicit user initiation, run a short local-only prompt against the selected GGUF model. Record model-file integrity, ABI, available RAM before/after, load time, first-token latency and a short throughput sample. Abort safely if memory pressure rises; unload the model after the test; save a per-device profile that can be cleared. Never send benchmark content to a cloud provider.
- **Dependencies:** Native GGUF runtime, existing device-info bridge, model manager and a bounded benchmark prompt.
- **Risks:** Benchmarking can consume RAM or heat the device and short tests may not predict long sessions. Mitigate with a short workload, memory guard, cooldown and clear “sample only” wording.
- **Acceptance criteria:** The benchmark works without internet after model import, aborts on low-memory pressure, reports measured values separately from estimates and does not claim physical-device results until actually run.

### IDEA-OLLAMA-001 — Native trusted-endpoint broker for Ollama

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** L
- **Why it is new:** Current endpoint validation and redirect rejection are useful, but the handoff records a residual app-wide Android cleartext permission and no DNS resolution/IP pinning for remote HTTPS hostnames.
- **User benefit:** Keep trusted-LAN PC Ollama working while reducing the network access granted to unrelated app requests.
- **Technical approach:** Move Ollama transport behind a narrowly scoped native broker. Pair an explicit endpoint, resolve and validate its destination at connection time, reject public cleartext HTTP and redirects, and bind requests to the approved host/address for the session. Add a host-scoped trust profile and investigate removing the broad manifest cleartext flag without breaking local Ollama.
- **Dependencies:** Kotlin Capacitor plugin, native HTTP client/DNS resolver, existing `normalizeOllamaEndpoint` checks and Android manifest workflow.
- **Risks:** DNS rebinding, changing LAN addresses, certificate management and regressions in trusted-LAN support. Mitigate with revalidation, short-lived endpoint approvals, strict tests and a fail-closed path.
- **Acceptance criteria:** Unapproved destinations and redirects are blocked; trusted local Ollama remains usable; public cleartext endpoints are rejected; manifest policy is narrowed if technically supported.

### IDEA-CREATOR-001 — Mode-specific Creator Series continuity profiles

- **Priority:** P2
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** What If, In My Town and Clips are deliberately separate modes and drafts are saved, but there is no reusable series-level continuity profile shared across episodes.
- **User benefit:** Produce multiple episodes with consistent characters, locations, tone and visual rules without repeating the same setup every time.
- **Technical approach:** Let the user create a series profile inside one mode only. Store editable facts, recurring characters/locations, style rules, episode index and “already used” topics. Inject a small bounded profile into the selected mode's prompt. What If progression rules remain separate from In My Town lore; Clips never receives story-series instructions.
- **Dependencies:** Existing Creator mode identifiers, local draft queue, prompt builders and bounded project-context helper.
- **Risks:** Stale continuity notes and accidental cross-mode mixing. Mitigate with editable facts, per-mode storage keys, bounded context and a visible profile selector.
- **Acceptance criteria:** A series profile can be reused and edited across drafts; switching modes never mixes profile data; the user can clear a profile without deleting unrelated drafts.

## Review order

1. `IDEA-REA-001` — highest integration priority and a concrete extension of the existing mock contract.
2. `IDEA-AUTO-001` — matches the requested generator/reviewer/executor workflow; requires a separate GitHub authorization design.
3. `IDEA-OPENSHORTS-001` — unlocks the already allowlisted optional upload/recut tools.
4. `IDEA-PROVIDER-001` and `IDEA-OLLAMA-001` — improve free-route reliability and network safety.
5. Remaining ideas can be scheduled after dependency and scope review.

**Pipeline status:** All entries start as `NEW`. The review stage must independently verify duplicates and current source before changing any item to `READY`. The implementation stage must not treat this file as approval to perform external, destructive, paid or publishing actions.

---

## Fresh ideas — 2026-11-20

**Source snapshot before this append:** feature branch `5c05c641af7889f73f7ab4c237ddc3d96442ec86`  
**PR #2:** open, Draft, unmerged; base `main`  
**Main snapshot:** `aab010319b6500002844bd24b11da85dd9ca3b00`

These proposals were checked against the current source modules and the ten existing ideas above. They are new proposals only; no application code or existing idea status was changed. All cloud-model paths must continue to use verified free model IDs; local Ollama/GGUF routes remain local. No silent paid fallback is allowed.

### IDEA-CONTEXT-001 — Per-request context disclosure inspector

- **Priority:** P0
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** `src/main.js` currently reports a project name and approximate file/snippet counts in `renderProjectContextStatus()`. The actual provider system prompt is assembled separately in `systemFor()` from project context, selected shared-vault references and general Skills. There is no per-request screen that shows the exact context sections and sizes that will accompany a specific provider call. This is broader than the separate REA disclosure rule because it covers ordinary chat, AI Team, Local Coder and other provider routes.
- **User benefit:** Know what project notes, source files, snippets, saved references and Skills are being sent before a cloud model receives them; remove a section for one request without changing permanent settings.
- **Technical approach:** Add a pure context-manifest builder alongside `src/project-context.js` and `src/shared-vault-context.js`. Build the manifest from the same normalized sections used to assemble the final request, with source labels, character/byte counts and the destination provider/model. Add a preview step for cloud calls with per-request include/exclude controls. Keep local GGUF/Ollama calls visibly marked as local. Do not display or serialize API keys; do not persist preview contents or create extra network requests.
- **Dependencies:** Existing `systemFor()`, `buildSharedProjectContext()`, `buildSharedVaultContext()`, Skill context builder, provider routing and chat/Team/Local Coder confirmation UI.
- **Risks:** Preview and actual payload could drift; sensitive text could remain in UI state; added confirmation could interrupt simple chat. Mitigate by deriving both preview and request from one immutable payload object, clearing preview state after the request, and using a compact expandable preview with a clear local/cloud label.
- **Acceptance criteria:** The preview exactly matches the context sections sent in the request; toggling a section changes only that request; local routes are identified accurately; API keys never appear; tests cover every context source and prevent preview/request mismatch.

### IDEA-PATCH-001 — Multi-file patch preview and transactional apply

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** L
- **Why it is new:** The code workspace stores multiple files, but `applyLocalCoderDraft()` currently replaces and saves only the active editor file. AI Swarm produces plans and results but does not write workspace files. There is no structured, reviewable multi-file patch format with stale-file conflict detection and one explicit apply operation.
- **User benefit:** Apply a coordinated change across several workspace files without manually copying each AI result or accidentally overwriting newer edits.
- **Technical approach:** Define a bounded patch schema containing workspace file ID/name, expected pre-change content hash, proposed content or a validated unified diff, and a short reason. Validate every target against the current workspace; reject unknown IDs, path-like names, duplicate targets, oversized payloads and stale hashes. Show a per-file diff preview, allow files to be excluded, then ask for one explicit confirmation. Persist the complete updated file list as one workspace preference value; update in-memory state only after persistence succeeds and retain the original snapshot for rollback on failure.
- **Dependencies:** Existing `codeFiles` store, `normalizeCodeFileList()`, active-file save/load flow, Local Coder Plan/Code/Review outputs and AI Swarm result records.
- **Risks:** Stale edits, malformed patches, partial storage failures and prompt-injected code. Mitigate with content-hash preconditions, strict size/path limits, per-file diff review, a pre-apply snapshot, no code execution and rollback if persistence fails.
- **Acceptance criteria:** A multi-file patch can be previewed without changing files; stale hashes block apply; excluded files remain untouched; successful apply updates all selected files; failed persistence restores the prior in-memory workspace; no patch executes automatically.

### IDEA-CHAT-001 — Fork a conversation from a selected message

- **Priority:** P2
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** The current chat system supports creating, searching, switching and persisting separate threads through `makeChatThread()`, `createNewChat()` and `switchChatThread()`. It does not preserve parent/child lineage or create a new thread from a selected point in an existing conversation.
- **User benefit:** Try a different prompt, model or approach from an earlier message while keeping the original conversation intact.
- **Technical approach:** Add a “Continue from here in a new chat” action to eligible messages. Clone only the message prefix through the selected message into a new thread, add bounded parent-thread ID and fork-index metadata, and then continue in the new thread. Keep the source thread unchanged; preserve the existing thread/message caps and migrate older thread records with empty lineage fields.
- **Dependencies:** `chatThreads`, `makeChatThread()`, `persistChatThreads()`, message renderer, sidebar thread list and workspace backup compatibility.
- **Risks:** Duplicated sensitive conversation content, excessive storage growth and broken lineage after deletion/import. Mitigate with an explicit fork action, existing thread caps, visible parent label and safe fallback when the parent is missing.
- **Acceptance criteria:** Forking creates a separate thread containing only the selected prefix; the original thread is unchanged; both threads can be switched independently; old backups and threads still load; deleting a parent does not corrupt the child.

### IDEA-TEAM-001 — Agreement and contradiction synthesis for parallel AI Team

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** `runParallelTeamCalls()` currently returns individual provider answers, and `runCompare()` renders them as separate result cards. The Swarm coordinator has a task-planning synthesis step, but the user-facing parallel Team/Model Compare flows do not offer a separate evidence-linked agreement and contradiction report.
- **User benefit:** See where selected models agree, where they conflict, which claims lack support and what needs human verification instead of comparing several long answers manually.
- **Technical approach:** After the initial parallel results are displayed, offer an optional “Synthesize answers” action. Send only successful, bounded responses to one user-selected evaluator that passes the existing free-model allowlist or is local Ollama/GGUF. Require a separate confirmation before this extra provider call. Ask for structured sections: shared conclusions, contradictions with provider attribution, unique useful points, uncertain claims and checks still needed. Preserve links between each synthesized claim and the source response; never present model agreement as proof.
- **Dependencies:** `runParallelTeamCalls()`, Model Compare result state, `callProvider()`, `isFreeApiProviderModel()` and existing live-request consent UI.
- **Risks:** Additional quota use, evaluator hallucinations and prompt injection embedded in model outputs. Mitigate with opt-in execution, visible request count, free/local-only evaluator selection, treating all source answers as untrusted data and retaining source attribution.
- **Acceptance criteria:** No evaluator request occurs automatically; paid or unverified model IDs are rejected before network access; synthesis identifies the source provider for every disagreement; failed synthesis leaves original answers intact; tests cover partial failures and malicious instruction text in model outputs.

---

## Fresh ideas — 2026-11-22

**Source snapshot:** `feature/android-offline-skills-v1` @ `58e6a6e0d3cdd5295a19d82c3af309126fc93ad7`  
**Main snapshot:** `aab010319b6500002844bd24b11da85dd9ca3b00`

These proposals were compared with the current Agent Swarm, Skill selector, project-memory and AgentShield source modules. They are proposals only. No application code is changed by this update. Keep all provider selection on the existing verified-free/local routes; do not introduce paid fallback.

### IDEA-AGENT-BUDGET-001 — Enforced per-run Agent Swarm request budget

- **Priority:** P0
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** `src/agent-swarm.js` exposes `estimateSwarmCallBudget()` and returns expected/maximum call metrics, but its internal `requestProvider()` currently increments `modelCallCount` and forwards the call without enforcing a caller-selected hard ceiling. Retries and dynamic Skill expansion can therefore consume additional calls beyond the expected count.
- **User benefit:** Prevent unexpectedly long agent runs, make retry/expansion behavior predictable, and let users cap how many provider requests one task may make.
- **Technical approach:** Add a validated per-run `maxProviderCalls` limit and route every planning, worker, retry, Skill-expansion and synthesis request through one budget gate. Reserve or explicitly account for planning/synthesis calls so workers cannot consume the entire budget before finalization. When exhausted, stop issuing requests, emit a `budget_exhausted` event, retain completed/partial results and return a clear reason. Keep request-count budgeting separate from monetary quota claims; do not estimate provider prices or weaken existing free-model allowlists.
- **Dependencies:** `runAgentSwarm()`, `requestProvider()`, `estimateSwarmCallBudget()`, Swarm UI settings/events and existing regression tests.
- **Risks:** A too-small limit may prevent synthesis or leave dependent tasks incomplete; concurrent workers may race for the final slot. Mitigate with atomic reservation before each request, visible minimum/maximum validation, explicit partial-run status and deterministic concurrency tests.
- **Acceptance criteria:** No provider call begins after the configured limit; retries and dynamic Skill expansion count against the same limit; concurrent workers cannot exceed it; partial results remain visible; default behavior stays backward-compatible; tests verify exact call counts and no paid fallback.

### IDEA-SKILL-TRACE-001 — Explainable Skill selection and per-run controls

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** `src/skill-selector.js` already calculates selection scores and reason labels, but `src/agent-swarm.js` emits only selected IDs/names for most Skill events and the UI does not expose a compact per-run explanation with pin/exclude controls. Session 24 added task-aware refresh; this proposal does not repeat that selection behavior.
- **User benefit:** Understand why a Skill was assigned to an agent, identify irrelevant instructions, and override one run without permanently changing Skill profiles.
- **Technical approach:** Carry bounded reason metadata from `selectSkillsForTask()` and `refreshTaskSkillContext()` into `skills_selected` and `skills_refreshed` events. Add per-run `pinnedSkillIds` and `excludedSkillIds` inputs, validate them against the installed catalog, and preserve the existing hard eight-Skill and prompt-character limits. Show selected, added, retained and omitted Skills with concise reasons in Agent Activity; do not expose full Skill bodies in logs.
- **Dependencies:** `src/skill-selector.js`, `src/agent-swarm.js`, Agent Activity UI in `src/main.js`, and `scripts/test-agent-systems.mjs`.
- **Risks:** Over-pinning can displace more relevant Skills; long explanations can clutter the UI or leak imported Skill content. Mitigate with ID-only references, short reason labels, fixed caps and clear warnings when a pin is excluded by stage or budget.
- **Acceptance criteria:** Each selected Skill shows a concise selection reason; newly added Skills show why they became relevant; per-run pin/exclude choices do not mutate saved profiles; the eight-Skill and character caps remain enforced; older activity records still render.

### IDEA-MEMORY-REVIEW-001 — Project memory lifecycle and duplicate review

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** M
- **Why it is new:** `src/agent-memory.js` supports project-scoped records, sensitive-content rejection, relevance matching and backup/restore. The current UI displays recent records and supports manual deletion, but there is no review workflow for stale or near-duplicate records, no archive state, and no explicit lifecycle metadata beyond creation time.
- **User benefit:** Keep project memory useful as code and decisions change, reduce repeated/conflicting notes, and prevent old assumptions from quietly influencing later agent work.
- **Technical approach:** Add backward-compatible optional `updatedAt`, `archivedAt` and `reviewedAt` metadata. Provide deterministic local-only suggestions for likely duplicates or old records using normalized titles/tags and bounded token overlap; treat suggestions as hints, not semantic truth. Let the user open, edit, archive, restore or delete each record. Keep archived records out of `buildProjectMemoryContext()` by default and require explicit user confirmation before merge or deletion. Re-run sensitive-content checks on edits and imports.
- **Dependencies:** `src/agent-memory.js`, memory settings/rendering in `src/main.js`, preference migration and `scripts/test-agent-systems.mjs`.
- **Risks:** False duplicate matches, accidental loss of useful historical context and backup compatibility issues. Mitigate with deterministic explainable matches, no automatic merge/delete, version-tolerant normalization and round-trip backup tests.
- **Acceptance criteria:** Existing v1 memory records load unchanged; duplicate/stale candidates are suggestions only; archived records are excluded from default context but remain restorable; edits/imports retain sensitive-data rejection; no model/API call is required for review.

### IDEA-SHIELD-DETAIL-001 — Detailed AgentShield findings and safe report

- **Priority:** P1
- **Status:** NEW
- **Estimated scope:** S
- **Why it is new:** `src/agent-shield.js` returns rule IDs, severity, line numbers and messages, while current request preflight mainly shows a toast and records a summary in Agent Activity. Skill import reports a general blocked message. There is no consistent detailed findings view for the user to inspect and resolve.
- **User benefit:** Understand what was flagged and where, distinguish a warning from a blocking finding, and correct problematic content without disabling security checks.
- **Technical approach:** Add a reusable findings presentation model and compact detail panel for request preflight and Skill import. Show source, rule ID, severity, line number and a short remediation hint. If an excerpt is shown, mask secret-like values before rendering and never persist raw matched text. Offer export/copy of a sanitized report only after user action. Preserve all existing blocking severities and fail-closed behavior; do not add an override that bypasses critical/high findings.
- **Dependencies:** `src/agent-shield.js`, AgentShield preflight and Skill-import flows in `src/main.js`, Agent Activity rendering and security regression tests.
- **Risks:** A detailed report could accidentally reveal secrets or teach users to evade a detector. Mitigate by showing rule descriptions and safe remediation only, masking matched values, omitting sensitive excerpts and keeping blocking decisions unchanged.
- **Acceptance criteria:** Multiple findings are individually visible with severity/source/line; safe reports contain no detected secret values; blocking findings remain blocked; warnings remain distinguishable; request and Skill-import paths use the same renderer; tests cover masking and no-bypass behavior.

