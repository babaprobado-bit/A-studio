# Session 23 — ECC Agent Systems integration — 2026-11-21

## Implemented in source
- Added a separate 10-entry ECC Agent Systems Skill pack as original, text-only adaptations. Upstream runtime code, shell scripts, and hook executables are not copied into the Android app.
- Extended the existing 10-role Agent Swarm with role-aware provider assignment.
- Added complexity-based auto-delegation to normal chat with a live-request estimate and explicit confirmation.
- Automatic workers use only providers already accepted by the app's existing readiness and free-model checks, or configured local Ollama / loaded native GGUF. Existing RAM-based concurrency caps remain active.
- Added local, project-scoped memory with relevance retrieval, explicit save, privacy filtering, backup and restore. Sending records to models is a separate opt-in.
- Added bounded, failure-isolated lifecycle hooks for sessions, agent runs, Skill imports, and memory writes.
- Added an in-app heuristic AgentShield preflight for prompts and imported Skills. It is not equivalent to the official CLI.
- Added the official AgentShield 1.6.0 CLI scan to the Android CI workflow, with a separate JSON report artifact.

## Verification pending
- CI must run the existing regression suite plus `npm run test:agent-systems` and the official AgentShield scan.
- Android Native GGUF APK build must complete successfully before a new APK is announced.
- No physical-device test, offline inference test, or live-provider test is implied by source commits.

## Repository guardrails
- Work only on `feature/android-offline-skills-v1`.
- Keep PR #2 open and Draft; never merge or mark ready.
- Leave `main` unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
