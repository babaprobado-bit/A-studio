# AI Studio — latest new-chat handoff

## Resume code
`AI-STUDIO-SESSION2-SOFTWARE-CONTINUATION`

## Current source checkpoint — 2026-11-03
- Product: **AI Studio**. Keep Android application ID `com.aistudio.alpha1`.
- Repo: https://github.com/babaprobado-bit/A-studio
- Branch: `feature/android-offline-skills-v1`
- Latest source/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86` (idempotent already-loaded GGUF behavior; native build [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) queued at last check)
- `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 is open, draft and unmerged: https://github.com/babaprobado-bit/A-studio/pull/2
- Native GGUF build [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) succeeded for source `6afe4cc...` and uploaded artifact `13266781713` (18,154,318 bytes; SHA-256 `d9ab6beafb65a6d570436fe1eeda959cdbbd55a608c5cde3f411b8e2c42583a7`). Newer source `b967781...` adds idempotent load behavior; its native build [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) was queued at last check.
- Last successful APKs from older app-code SHA `9400716...`: native artifact `13205399062` [run 41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560); demo artifact `13205386533` [run 41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607). These do not include local import/cancel updates.

## Latest offline-first improvements
- Android can import an already-available `.gguf` file via `ACTION_OPEN_DOCUMENT`; copy it to the phone with USB/SD/file sharing first. Import itself does not need internet.
- Import is app-scoped, stages as `.part`, has a sanitized filename and 8 GB cap, checks free storage, reports progress and validates GGUF magic before installed-model insertion.
- Large local imports can be cancelled in-app; native code checks a cancellation flag while copying and cleans the partial file.
- The in-app model manager includes DownloadManager cancel, local-import cancel and license controls in the real `index.html`.
- Tests inspect the actual app HTML and JS button bindings; fake-plugin tests cover progress, cancellation, lock/listener cleanup and imported-GGUF RAM guardrails.
- Skills Library and API Local Coder remain; no paid API calls are made by tests.

## User's current constraint and next task
The user reports no internet and no phone/computer available for hands-on tests. **Do not ask for device testing or pause development.** Continue source review, regression coverage and GitHub-hosted native CI. Local GGUF import is useful only when a model file is already available to copy; it does not create or download model weights.

First inspect live branch/PR/Actions. Review RAM checks for both catalogue and imported GGUF files, lifecycle/unload behavior, cancellation cleanup and Android failure handling. Add tests and commit only to `feature/android-offline-skills-v1`.

No physical APK install, model import, native inference or airplane-mode proof has been completed. The user has no phone/computer available for tests now. Preserve all features. Keep PR #2 open and draft; never modify `main` or merge without explicit permission.

## Links
- Native build (current source): https://github.com/babaprobado-bit/A-studio/actions/runs/41706818257
- Demo build (current source): https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331
- PR #2: https://github.com/babaprobado-bit/A-studio/pull/2
- Project state: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/PROJECT_STATE.md
- Device checklist: https://github.com/babaprobado-bit/A-studio/blob/feature/android-offline-skills-v1/docs/HANDOFF/SESSION_2_DEVICE_TESTING.md
