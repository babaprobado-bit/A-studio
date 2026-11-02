# Session 3 of 4 — Finish Skills and the three Local Coder modes

## Goal
Make Skill system match prior requirements and polish three Local Coder modes without breaking existing providers or backups. Do not implement REA/MCP here; that is Session 4.

## Read first
- docs/HANDOFF/README.md
- docs/HANDOFF/PROJECT_STATE.md
- Session 1 and 2 results, especially device memory/context findings
- src/skill-library.js
- src/main.js
- scripts/test-skills.mjs
- scripts/test-device-local-coder.mjs
- README.md

## Current Skill implementation — 2026-11-02

- Original AI Studio starter set: 15 Superpowers-inspired instructions, 22 Caveman-style instructions and one AI Studio-authored Karpathy-inspired guideline summary (38 total).
- Existing preset IDs retained for compatibility: `karpathy`, `superpowers`, `caveman`, `balanced`. New presets: `superpowers-development`, `planning`, `review`, `caveman-short`. The `custom` select entry is the manual-selection mode, not a preset. Karpathy remains default-enabled.
- Max eight selected Skills. Each prompt stage has a strict 36,000-character budget including opening/closing wrappers and the newline separators between Skills.
- Markdown import accepts `.md` files; each selected file is parsed and previewed before it is saved. Multiple files are handled one by one. User sees filename, title, description, stage, content and available source/license/author/version metadata.
- Supported front matter is a bounded, simple scalar `key: value` format with `name`, `description`, `stage`, `source`, `source_url`, `license`, `author`, `version`. Unknown scalar keys are retained in metadata; malformed lines or unclosed front matter are rejected. Multiline YAML/list syntax is not supported.
- Filename extension validation is fixed. Duplicate names are retained as separate custom Skills with unique IDs and a warning in the preview; duplicates do not overwrite existing Skills.
- Imported content is text-only instructions and is never executed. The UI explicitly says this.
- Limits: 50,000 chars per source file, 12,000 chars per Skill body, max 100 custom Skills, max eight selected at a time.
- Stage context inserts actual line breaks rather than literal backslash-n text. Regression test covers malformed/empty/oversized files, front matter metadata, invalid stage fallback, eight-Skill cap and strict 36k cap.
- Standard and encrypted export both use the same workspace snapshot, which includes custom Skills, selected IDs and profile ID. Workspace restore normalizes custom Skills and falls back to Karpathy if an older backup has no Skill data. Dedicated automated backup/restore round-trip tests still remain.
- Skill backup tests and the new API fake-provider tests are now included in both Android CI workflows. Check live Actions before treating the new test commit or APK as passed.

## Remaining Skill / API work

- [ ] Add automated tests for standard workspace backup and encrypted backup Skill round-trip, custom profile persistence, and old backups with no Skill section.
- [ ] Add mocked tests for API Local Coder provider selection, missing-key handling, demo-mode consent, exactly three stage requests, no retry/fallback and no API secret in backup/log data. Do not send real billable calls in tests.
- [ ] Verify duplicate-name preview interaction and multiple-file queue manually or with a DOM test harness.
- [ ] Consider adding UTF-8 BOM and CRLF front matter fixtures.
- [ ] Maintain source/author/license attribution when importing external Skill files; do not copy copyrighted skill collections wholesale.
- [ ] Keep imported Skills as untrusted text instructions; do not execute Markdown, scripts or arbitrary commands.


## Three Local Coder modes

### PC / Ollama
- Existing PC endpoint connection; model runs on a different computer, not phone.
- Keep default.
- Include project/Skill context and preserve Plan → Code → Review draft workflow.

### Phone / GGUF
- Show as available only when native plugin/device support is confirmed.
- Use physical-device findings from Session 2 to adjust RAM estimates/context.
- Once model loaded, inference should not call network/API; first download needs internet.
- Context trimming must be visible; never pretend all Skill/file context was sent.
- If native unsupported/unavailable, allow Ollama/API mode without losing task text.

### Cloud API
- Existing adapters: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter.
- API key must already exist in secure storage.
- One run makes three requests: Plan, Code, Review.
- Explicitly tell user provider quotas/charges may apply before sending.
- Demo stays default; user confirmation required before switching Demo off/making real calls.
- No silent retries or automatic provider fallback; those can multiply costs or send project context to another company without consent.
- Preserve selected provider ID in settings/backups only, never secret key.

## Regression suite

Run:
  npm install --no-audit --no-fund
  npm run build
  npm run test:workshop
  npm run test:site
  npm run test:skills
  npm run test:device-local-coder

Add tests for API dispatcher routing/consent/provider selection without calling a real paid API where possible. Use mocks/fakes and label them. Do not claim real API test unless real authorized request sent with permission.

## Session exit criteria
- [x] Five requested profile concepts implemented while retaining legacy profile IDs.
- [x] SKILL.md import preview and bounded source/license metadata implemented.
- [x] Max 8 and strict 36k stage context constraints covered by the passing Skill regression test.
- [ ] Automated standard/encrypted backup round-trip and legacy backup tests.
- [ ] Mocked API consent/provider-routing tests; no real paid API request made.
- [ ] Device GGUF compared against real Session 2 measurements (still blocked on physical-device test).
- [ ] README, project state and tests match actual behavior; CI/artifacts rechecked.

## Copy-ready prompt for next conversation

Continue AI Studio. Read docs/HANDOFF/README.md, PROJECT_STATE.md and SESSION_3_SKILLS_AND_API.md; inspect current code on feature branch first. Finish requested Skill profiles (Karpathy, Superpowers development, Planning, Review, Caveman short mode), custom SKILL.md import preview and source/license metadata, and regression tests. Preserve existing 38 original AI Studio instructions, 8-Skill cap, 36,000-character stage cap, old backup compatibility and three Local Coder engines (Ollama, on-device GGUF, API). API mode makes three requests and must keep explicit consent. Do not start REA/MCP in this chat; leave it for Session 4. Update repo docs as work completes.
