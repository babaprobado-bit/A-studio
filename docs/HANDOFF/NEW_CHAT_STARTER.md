# New chat starter — AI Studio / Session 2

## Resume code

`AI-STUDIO-SESSION2-APK-READY`

When opening a fresh ChatGPT conversation, paste the resume code and the prompt below. The code is a label for this exact handoff, not an API key or password.

## How to start a new chat

In the ChatGPT Android app, tap **New chat** (the compose/plus icon or the New chat option in the sidebar), then paste the prompt below as the first message.

## Current verified state

- Product: **AI Studio**. “Alpha 1” is a development-stage label only; keep Android package ID `com.aistudio.alpha1` unchanged.
- Repository: https://github.com/babaprobado-bit/A-studio
- Branch head: `feature/android-offline-skills-v1` at `c2417699cca0ec1381c6a41422f5b7d837c91f02`.
- PR #2: open, draft, base `main`; do not merge without explicit user instruction.
- Demo workflow [41472090928](https://github.com/babaprobado-bit/A-studio/actions/runs/41472090928) succeeded on the current head and produced `AI-Studio-Demo-APK` (ID `13155362741`). This is **not** the native GGUF test APK.
- Native GGUF workflow [41472242158](https://github.com/babaprobado-bit/A-studio/actions/runs/41472242158) is running on the current head; at last check it was fetching the pinned llama.kt engine. Wait for success and artifact upload.
- A previous native workflow [41459856700](https://github.com/babaprobado-bit/A-studio/actions/runs/41459856700) succeeded on `7341a83...`, which includes hardware-aware model selection, but it is not the latest `c2417699...` build.
- Device-model selection is available for Qwen2.5-Coder 0.5B / 1.5B / 3B; the Android bridge reads ABI/SDK, CPU core count, total/available RAM, low-memory pressure and storage. Recommendations are estimates; manual model selection remains supported.
- User reports a Redmi S12 and currently has no internet. Exact device compatibility is unverified. No physical-phone install, model download, on-device inference or airplane-mode test has been completed.

## Copy and paste this into the new chat

```text
AI-STUDIO-SESSION2-APK-READY

Continue my existing AI Studio project in GitHub repository babaprobado-bit/A-studio.

Before editing, read these repository files:
1. docs/HANDOFF/README.md
2. docs/HANDOFF/PROJECT_STATE.md
3. docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
4. docs/HANDOFF/NEW_CHAT_STARTER.md

Then inspect the live feature branch feature/android-offline-skills-v1, PR #2, and the latest native Android workflow. Do not assume the saved commit is still the branch tip. Official product name is AI Studio; Alpha 1 is only a milestone label.

A previous native GGUF build succeeded (run 41459856700 on commit 7341a83...), but the latest native workflow run 41472242158 for commit c2417699cca0ec1381c6a41422f5b7d837c91f02 is still running. Wait for the latest run and download its `AI-Studio-1.1-OnDevice-LocalCoder-APK` artifact only after successful upload. The current demo artifact is not suitable for GGUF testing.

Your task is Session 2 only: help me test this native debug APK on the user-reported Redmi S12 once its Android version/ABI are verified and internet is available for the initial model download. Use the exact checklist in SESSION_2_DEVICE_TESTING.md. First check Android version and arm64-v8a compatibility, install the native artifact (not the regular demo APK), protect existing workspace data, then test startup and existing app features. Next download the Qwen2.5-Coder 0.5B GGUF model separately, test model persistence/load and actual on-device inference, and finally prove inference works after disconnecting internet / enabling airplane mode. Record device-independent errors and measurements, but do not collect personal identifiers or secrets.

Do not pretend to have run tests on my physical phone. Tell me what I need to tap or report when a real-device action is required. Do not ask me to paste API keys. Preserve all existing AI Studio features. Work only on feature/android-offline-skills-v1, never edit main directly, keep PR #2 draft, and do not merge it without my explicit instruction. Update the handoff docs with exact verified results before ending the session.
```

## Important links

- Handoff index: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/README.md
- Project state: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/PROJECT_STATE.md
- Session 2 checklist: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
- Successful APK build and artifact: https://github.com/babaprobado-bit/A-studio/actions/runs/41390410229
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
