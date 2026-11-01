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

## Requirements already present
- Original AI Studio starter set: 15 Superpowers-inspired, 22 Caveman-style, one Karpathy-inspired guideline summary (38 total).
- Current profiles: karpathy, superpowers, caveman, balanced.
- Karpathy is default-enabled.
- Max 8 selected Skills.
- Max 36,000 characters per Local Coder stage.
- Custom .md / SKILL.md import; simple front matter: name, description, stage.
- Imported Markdown is text only; never execute as code.
- Stage mapping supports plan, code, review, all.
- Skill settings/custom Skills included in workspace backup and restore; API keys excluded.

## Remaining Skill gaps

Prior requirement list included:
- Karpathy
- Superpowers development
- Planning
- Review
- Caveman short mode

Current source does not expose separate exact planning and review profiles or named superpowers-development alias. Add these while retaining current profile IDs for backward compatibility, or provide documented aliases. Profile definitions must respect eight-Skill maximum.

Also review:
- [ ] Add user-facing import preview (filename, parsed title/description/stage, content, source/license metadata) before saving/activating.
- [ ] Parse safe, bounded license and source metadata from front matter or separate import dialog; unknown fields should be retained or shown unsupported, not silently lost.
- [ ] Make clear imported Skills are instructions, not trusted tools/code.
- [ ] Define duplicate-ID/name behavior for repeated imports.
- [ ] Preserve custom profile selection and custom Skills across restart, standard backup and encrypted backup.
- [ ] Add tests for empty/malformed/oversized Markdown, front matter edge cases, duplicate names, wrong stages, 8-item cap, 36k cap, custom profile backup/restore, old backups without skills.
- [ ] Keep starter text original and AI Studio-authored. Do not copy full copyrighted text from third-party Skill collections; provide attribution/links where appropriate and obey licenses.

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
- [ ] Five profile concepts implemented or documented equivalent.
- [ ] Profile IDs and old backup compatibility maintained.
- [ ] SKILL.md import supports preview and source/license info.
- [ ] Max 8 and 36k constraints tested, including edge cases.
- [ ] API consent/provider selection verified with mocked provider; no secret reaches backups/logs.
- [ ] Device GGUF compatible with Session 2 measured limits.
- [ ] README, project state and tests match actual behavior.

## Copy-ready prompt for next conversation

Continue AI Studio Alpha 1. Read docs/HANDOFF/README.md, PROJECT_STATE.md and SESSION_3_SKILLS_AND_API.md; inspect current code on feature branch first. Finish requested Skill profiles (Karpathy, Superpowers development, Planning, Review, Caveman short mode), custom SKILL.md import preview and source/license metadata, and regression tests. Preserve existing 38 original AI Studio instructions, 8-Skill cap, 36,000-character stage cap, old backup compatibility and three Local Coder engines (Ollama, on-device GGUF, API). API mode makes three requests and must keep explicit consent. Do not start REA/MCP in this chat; leave it for Session 4. Update repo docs as work completes.
