# Session 1 — Native Android GGUF APK

## Current verified checkpoint — 2026-11-05

- Latest application/test commit: `794901f968aec39f6c5d1959a5e79d0ddc71db35`. The latest AI Team implementation commit is `ae6fe2f1e9a0fa8517752cccea921991e4bb4ef1`; follow-up commits fix duplicate model-comparison declarations and stabilize regression assertions.
- AI Team has **10 selectable engines**: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter, Hugging Face Inference, custom OpenAI-compatible API, PC Ollama, and **on-device Android GGUF**. No four-provider cap remains. “Tüm AI sağlayıcılarını takıma ekle” includes all entries. Existing saved selections that contained all nine prior providers are migrated to include the phone GGUF entry.
- The phone GGUF engine is a real provider in single chat, parallel team, sequential pipeline and model comparison. Live calls include it only when the app is running as native Android and a GGUF model is actually loaded into memory. An unloaded / unsupported device provider is skipped in live runs. Demo mode produces templates, not model inference.
- Demo workflow [42066474047](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474047) completed successfully for commit `794901f...`. All checks passed: syntax/manifest checks, Vite build, workshop smoke test, Skill/API/AI Team checks, device Local Coder bridge tests, site login tests, Capacitor sync, Gradle debug APK and artifact upload.
- Latest demo artifact: `AI-Studio-Demo-APK`, artifact ID `13434472811`, **3,774,850 bytes**, SHA-256 `215985c43a5d7813952e5f187ec0ac95d29d4f470512372c40602a20c854d3d7`. Created 2026-11-05 16:40:38 UTC; expires 2026-11-19 16:40:37 UTC. [Open the successful demo build / artifact](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474047). This is the demo APK, not the native GGUF APK.
- Native GGUF workflow [42066474388](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474388) is running on `794901f...`. Android tool installation and pinned llama.kt retrieval passed; llama.cpp Android source preparation was still running at the last check. **No native APK artifact for this commit is verified yet.**
- PR #2 remains open, Draft and unmerged. Base `main` is unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`. Do not modify `main` or merge.
- No physical APK installation, GGUF import/load, actual on-device inference, or airplane-mode test has been performed. User currently has no device/computer available for hands-on testing; do not ask them to test now. CI proves automated checks and APK packaging only, not phone compatibility or offline inference.

This checkpoint supersedes older queued-build notes above; keep those older artifact records as history.


## Status
**Complete.** Native build and artifact packaging are verified in GitHub Actions. Physical-device support is **not** verified; that is Session 2.

## Latest verified build — 2026-11-04
- Repository: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- Native APK source commit: `6afe4ccfde5f29085a3ad0f2079f0f6addbe5107`.
- Native workflow [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) completed successfully. Android SDK/tools, pinned llama.kt/llama.cpp preparation, dependencies, web build, all regression checks, Capacitor generation/sync, Gradle `assembleDebug` and artifact upload passed.
- Native artifact: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, ID `13266781713`, 18,154,318 bytes, SHA-256 `d9ab6beafb65a6d570436fe1eeda959cdbbd55a608c5cde3f411b8e2c42583a7`.
- This APK includes GGUF model import/download, cancellation, model-license details and the imported-model RAM guardrails from `6afe4cc`. It does **not** include the later `b967781` idempotent-load fix; that new commit has its own native build queued at [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742).
- Model weights are separate downloads and are not bundled in the APK. Internet is required for the first catalogue download; import of an already-owned `.gguf` file needs no internet. Offline inference after successful load is intended, not yet proven on a phone.

## Historical native build issue
The initial Kotlin failure in run `41339891960` was caused by the invalid string escape in a filename regex. Commit `ffc332e` replaced the escaped dot with `[.]`; subsequent native runs passed. Keep that fix.

## Handoff
Session 1 deliverable is complete: a current-source native debug APK artifact exists. Next is **Session 2 — real Android device acceptance testing**. Do not claim native inference or airplane-mode behavior until verified on a physical supported device.

## Links
- Repo: https://github.com/babaprobado-bit/A-studio
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Branch: https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1
- Native APK: https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331
- Demo APK: https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607
- Device-test checklist: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
