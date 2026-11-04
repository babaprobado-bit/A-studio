# Session 1 — Native Android GGUF APK

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
