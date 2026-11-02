# New chat starter — AI Studio / Session 2

## Resume code

`AI-STUDIO-SESSION2-APK-READY`

When opening a fresh ChatGPT conversation, paste the resume code and the prompt below. The code is a label for this exact handoff, not an API key or password.

## How to start a new chat

In the ChatGPT Android app, tap **New chat** (the compose/plus icon or the New chat option in the sidebar), then paste the prompt below as the first message.

## Current verified state

- Repository: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2 — open, draft, base `main`; do not merge without the user's explicit instruction.
- Successful native GGUF build: https://github.com/babaprobado-bit/A-studio/actions/runs/41390410229
- App-code commit built: `a30696ff29cdda2dfe43e27a77286e97be026914`
- Artifact: `AI-Studio-Alpha-1.1-OnDevice-LocalCoder-APK` (ID `13117996643`)
- Artifact ZIP: `18,129,889` bytes; available until `2026-11-16 05:04:48 UTC`.
- ZIP integrity passed; it contains `app-debug.apk` (`54,453,328` bytes).
- This is a debug APK, not a signed production release. Model weights are not inside it.
- No physical-phone install, model inference, or airplane-mode test has been completed. Do not claim those features are verified.

## Copy and paste this into the new chat

```text
AI-STUDIO-SESSION2-APK-READY

Continue my existing AI Studio project in GitHub repository babaprobado-bit/A-studio.

Before editing, read these repository files:
1. docs/HANDOFF/README.md
2. docs/HANDOFF/PROJECT_STATE.md
3. docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
4. docs/HANDOFF/NEW_CHAT_STARTER.md

Then inspect the live feature branch feature/android-offline-skills-v1, PR #2, and the latest native Android workflow. Do not assume the saved commit is still the branch tip.

Session 1 is complete. Native GGUF Android workflow run 41390410229 succeeded on app-code commit a30696ff29cdda2dfe43e27a77286e97be026914. It uploaded artifact AI-Studio-Alpha-1.1-OnDevice-LocalCoder-APK, ID 13117996643. Its ZIP was integrity-checked and contains app-debug.apk (54,453,328 bytes). Download the artifact from the Actions run page; its retention expires 2026-11-16 05:04:48 UTC.

Your task is Session 2 only: help me test this native debug APK on a real supported Android phone. Use the exact checklist in SESSION_2_DEVICE_TESTING.md. First check Android version and arm64-v8a compatibility, install the native artifact (not the regular demo APK), protect existing workspace data, then test startup and existing app features. Next download the Qwen2.5-Coder 0.5B GGUF model separately, test model persistence/load and actual on-device inference, and finally prove inference works after disconnecting internet / enabling airplane mode. Record device-independent errors and measurements, but do not collect personal identifiers or secrets.

Do not pretend to have run tests on my physical phone. Tell me what I need to tap or report when a real-device action is required. Do not ask me to paste API keys. Preserve all existing AI Studio features. Work only on feature/android-offline-skills-v1, never edit main directly, keep PR #2 draft, and do not merge it without my explicit instruction. Update the handoff docs with exact verified results before ending the session.
```

## Important links

- Handoff index: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/README.md
- Project state: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/PROJECT_STATE.md
- Session 2 checklist: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
- Successful APK build and artifact: https://github.com/babaprobado-bit/A-studio/actions/runs/41390410229
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
