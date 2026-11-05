# Session 1 — Native Android GGUF APK

## Current verified checkpoint — 2026-11-05

- Latest app-code/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86`. Native workflow [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) completed successfully, including all regression checks, Capacitor generation/sync, Gradle `assembleDebug` and artifact upload.
- Latest native GGUF APK: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, artifact ID `13351543088`, **18,154,391 bytes**. SHA-256: `65b16549595534ba9996223cb99c29e1cbf3cee79fcb25a76017bad8a75598ee`. Artifact was created 2026-11-04 18:29:28 UTC and expires 2026-11-18 18:29:26 UTC. [Open the successful native build and download its artifact](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742).
- This APK is built from `b967781...` and includes the already-loaded-model idempotent-load fix plus the prior imported-GGUF RAM guardrails. It is the current native artifact; do not confuse it with the smaller demo APK.
- GitHub Actions proves regression/build/package success only. No physical install, Android GGUF import/load, actual on-device inference or airplane-mode test has been performed. The user currently has no phone/computer available for hands-on validation; do not ask them to test right now.
- PR #2 remains open, Draft and unmerged. Base `main` remains `aab010319b6500002844bd24b11da85dd9ca3b00`; do not modify `main` or merge.

This checkpoint supersedes older queued/in-progress status notes below. Older artifact records remain as build history.


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
