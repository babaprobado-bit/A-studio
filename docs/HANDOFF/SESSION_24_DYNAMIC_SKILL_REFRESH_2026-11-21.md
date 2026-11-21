# Session 24 — Dynamic task-aware Skill refresh — 2026-11-21

## Result

Automatic Skill selection now refreshes as Agent Swarm work progresses. A downstream worker does not rely only on the original task description: its selector receives the completed prerequisite outputs and the current bounded team-board findings, then chooses the Skills relevant to its own role and the newly discovered needs.

## Runtime behavior

- src/skill-selector.js exports refreshTaskSkillContext().
- The selector re-scores the full normalized Skill catalog using the evolving task context, agent role and current stage.
- Manually selected Skills retain priority. Compatible Skills from completed prerequisite agents are preserved, while newly relevant Skills are added.
- The first worker starts with up to four Skills, leaving room for up to four newly discovered Skills at a downstream handoff. The hard global maximum remains eight Skills and the prompt context remains character-bounded.
- Code output that reveals a security issue can cause a downstream security/test agent to receive ECC Agent Security Hardening and ECC Security Scan instructions even when those were not the initial top matches.
- The coordinator's synthesis stage also refreshes its reviewer Skill set using bounded worker outputs.
- Dynamic additions are returned as addedSkillIds/retainedSkillIds, emitted as skills_refreshed, and recorded in Agent Activity.
- Selection is local deterministic matching. It does not create another provider request or increase the model-call budget.

## Files changed

- src/skill-selector.js — dynamic refresh API, prior-skill retention, stage compatibility and bounded prompt rendering.
- src/agent-swarm.js — refresh at each dependency-ready worker handoff and before final synthesis; report dynamic Skill metadata/metrics.
- src/main.js — record dynamic Skill additions in Agent Activity.
- scripts/test-agent-systems.mjs — tests new skill discovery from an upstream worker's security findings, preference retention, 8-Skill cap and prompt character limit.
- .github/workflows/build-android-local-coder.yml already watches src/skill-selector.js so selector-only changes enter Android CI.

## Verification

The following commands passed in the remote Node workspace:

- node --check src/main.js
- node --check src/skill-selector.js
- node --check src/agent-swarm.js
- node scripts/test-agent-systems.mjs
- node scripts/test-skills.mjs
- node scripts/test-ai-team.mjs
- node scripts/test-chat-layout.mjs
- node scripts/test-model-context.mjs
- node scripts/test-usability-controls.mjs
- node scripts/test-no-demo-mode.mjs
- node server/workshop-smoke-test.js

The remote workbench does not have npm, so Vite was not built there. GitHub Actions workflow 44934388701 was dispatched on the latest application commit e67c6f0c683dd74d3542697376bfc7e854541851. Last inspected state: AgentShield scan and Android SDK setup passed; native build tools were installing. No APK artifact had been uploaded at that checkpoint.

## GitHub safety

- Branch: feature/android-offline-skills-v1
- Latest source checkpoint before this handoff-only commit: e67c6f0c683dd74d3542697376bfc7e854541851
- PR #2 remains open and Draft. Do not merge or mark ready.
- main remains aab010319b6500002844bd24b11da85dd9ca3b00. Do not write to main.
- Latest Android run: https://github.com/babaprobado-bit/A-studio/actions/runs/44934388701
- PR: https://github.com/babaprobado-bit/A-studio/pull/2

## Next steps

1. Check workflow 44934388701 through AgentShield, native compilation, regression checks, Vite, Gradle APK packaging and artifact upload.
2. If CI finds a failure, fix only the failing step/source and rerun on this feature branch.
3. Review skills_refreshed Activity entries and confirm that dependency outputs add relevant Skills without exceeding eight.
4. Continue ECC skill coverage and test any further provider/agent integrations without weakening free-model request guards.
5. Keep PR #2 open/Draft and leave main unchanged.
