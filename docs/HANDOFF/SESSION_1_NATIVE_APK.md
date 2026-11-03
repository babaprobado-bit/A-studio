# Session 1 — Native Android GGUF APK

## Status
**Complete.** Native build and artifact packaging are verified in GitHub Actions. Physical-device support is **not** verified; that is Session 2.

## Latest verified build — 2026-11-03
- Repository: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- Latest branch head at this checkpoint: `9400716fefaa41a96b6661b8f66370d57c3dd421`
- Native workflow [41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560) completed successfully. Android SDK/tools, pinned llama.kt/llama.cpp preparation, dependencies, web build, regression checks, Capacitor generation and sync, Gradle `assembleDebug`, and artifact upload all passed.
- Native artifact: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, ID `13205399062`, 18,135,849 bytes.
- Demo workflow [41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607) also passed. Demo artifact ID `13205386533`, 3,769,925 bytes. It does not contain the native GGUF bridge.
- Latest native APK includes commit `6f10570` partial-download hardening and `9400716` visible model-license information.
- Model weights are separate downloads and are not bundled in the APK. Internet is needed for the first download; offline inference after download is intended, not yet proven.

## Historical native build issue
The initial Kotlin failure in run `41339891960` was caused by the invalid string escape in a filename regex. Commit `ffc332e` replaced the escaped dot with `[.]`; subsequent native runs passed. Keep that fix.

## Handoff
Session 1 deliverable is complete: a current-source native debug APK artifact exists. Next is **Session 2 — real Android device acceptance testing**. Do not claim native inference or airplane-mode behavior until verified on a physical supported device.

## Links
- Repo: https://github.com/babaprobado-bit/A-studio
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Branch: https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1
- Native APK: https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560
- Demo APK: https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607
- Device-test checklist: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
