# AI Studio — Session 6 APK build verification (2026-11-15)

## Repository state

- Repository: `babaprobado-bit/A-studio`
- Feature branch: `feature/android-offline-skills-v1`
- Source commit used by both new Android workflows: `44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c`
- `main` remained at `aab010319b6500002844bd24b11da85dd9ca3b00` at this verification.
- PR #2 remains open, Draft, and unmerged. Do not merge without explicit user approval.

## Fresh APK workflow results

### Native GGUF / llama.cpp

- Workflow: [Run 43706583890](https://github.com/babaprobado-bit/A-studio/actions/runs/43706583890)
- Result: **success**
- Artifact: [AI-Studio-1.1-OnDevice-LocalCoder-APK](https://github.com/babaprobado-bit/A-studio/actions/runs/43706583890/artifacts/14159431240)
- Artifact ID: `14159431240`
- Artifact ZIP size: 18,165,181 bytes
- Artifact archive SHA-256: `4ee4eb19d8748153fdadb150f14a40d5d397dbdb8911490ef6cf846eaa29e01e`
- Expiry: 2026-11-29 11:11:17 UTC
- The job completed all build and upload steps successfully, including native llama.kt/llama.cpp preparation, web build, repository regression checks, Capacitor sync, Gradle debug APK packaging, and artifact upload.
- Downloaded APK size: 54,503,156 bytes
- Extracted APK SHA-256: `85b3a75c58052e1d27327f3947d5ac17822814aa7d13f84580bff9d32a0e6386`
- APK archive integrity, Android manifest presence, and DEX presence were verified after download.

### Demo APK

- Workflow: [Run 43706581476](https://github.com/babaprobado-bit/A-studio/actions/runs/43706581476)
- Result: **success**
- Artifact: [AI-Studio-Demo-APK](https://github.com/babaprobado-bit/A-studio/actions/runs/43706581476/artifacts/14158542919)
- Artifact ID: `14158542919`
- Artifact archive SHA-256: `10a077d77de9f41c9616b18a9b056a00f2e6724a1fd80d479ac756277d3e50bf`

## Scope and limitations

- These are debug APK builds, not signed production releases.
- CI success verifies the source checks, Android build and packaging steps. It does not prove successful installation, first launch, real GGUF inference, device RAM suitability, performance, or airplane-mode operation on a physical phone. No physical-device test was performed.
- The verified build source is the branch head `44326c8`; it includes the OpenShorts MCP integration and existing Local Coder/Skill Library work.
- **The separate locally prepared 1.1.4 source bundle (mobile chat/OpenRouter, plugin catalog, JCode-style agent swarm, and additional free-provider UI/tests) was not part of commit `44326c8` and must not be described as included in these APKs.** It still needs a proper branch commit and a new CI build.
- OpenShorts and REA runtime claims remain limited to the source's mock/contract tests. No live external service connection was performed.

## Next required work

1. Transfer and review the 1.1.4 source bundle into this feature branch.
2. Run all new 1.1.4 tests and both Android workflows from the resulting source commit.
3. Keep PR #2 Draft and do not touch `main` or merge without explicit approval.
