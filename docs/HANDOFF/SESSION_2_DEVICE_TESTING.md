# Session 2 of 4 — Test on a real Android phone

## Goal
Once Session 1 produces the native GGUF APK, test installation, model management and actual offline inference on a physical supported Android phone. The key proof is that a user can download a model once, disconnect internet, and still send a prompt to the model running inside the phone.

Do not use the regular demo APK for this test; it does not contain the native GGUF bridge. Use artifact from build-android-local-coder.yml.

## Software-side progress — 2026-11-03 (not a device-test pass)

- Native GGUF APK is built successfully from current branch head `9400716...`: [run 41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560), artifact `13205399062` (18,135,849 bytes). Use this native artifact, not the demo APK.
- Demo run [41580209607](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209607) also passed; artifact `13205386533` is only the regular demo build.
- The device model manager offers Qwen2.5-Coder GGUF 0.5B, 1.5B and 3B variants with RAM/CPU/storage estimates and shows each model's license. 0.5B and 1.5B show Apache-2.0; 3B shows `qwen-research` plus a non-commercial research/evaluation notice.
- Commit `6f10570` changed native downloads to temporary `.part` files; Kotlin promotes only a sufficiently sized file with a valid GGUF header after DownloadManager success. Failed/missing downloads are cleaned and reconciled when the model list refreshes, including after app restart. JS download IDs clear in `finally`.
- Automated mock regression tests include failed-download cleanup state and retry. They do not test Android DownloadManager or the native runtime on a physical phone.

## Latest project status — 2026-11-03

- User-reported test phone: Redmi S12. Exact Android version, supported ABI and available RAM remain unknown until read from the phone's device profile.
- User previously reported no current internet. First model download cannot be tested without internet.
- Latest app-code commit packaged in these APKs: `9400716fefaa41a96b6661b8f66370d57c3dd421`; docs-only handoff commits may make the live branch head newer. PR #2 remains open/draft and unmerged; `main` unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
- No physical installation, actual GGUF download, native model load/inference or airplane-mode proof has passed. Do not infer phone compatibility from CI success.

## Read first
- docs/HANDOFF/README.md
- docs/HANDOFF/PROJECT_STATE.md
- Session 1 updated results and exact APK artifact link
- src/device-local-coder.js
- android-local-runtime/LocalLlmPlugin.kt
- scripts/patch-android-local-runtime.py

## Preconditions
- Physical Android device with Android 10+ and arm64-v8a.
- Sufficient free storage/RAM. Start with Qwen2.5-Coder 0.5B Q4_K_M; current size/RAM figures are estimates only.
- Wi-Fi for initial model download. Model separate from APK.
- Safe backup of existing AI Studio workspace before install/update.
- Never ask user to paste API keys into testing chat. GGUF inference should not require an API key.

## Test sequence

### A. Installation / baseline
- [ ] Install native artifact and check package/version update behavior.
- [ ] Launch app; verify projects, code editor, chat, Skill Library, API settings and Ollama screen still render.
- [ ] Confirm default remains PC/Ollama unless user chooses another engine.
- [ ] Confirm on-device selection disabled on unsupported ABI/Android version.

### B. Model download and persistence
- [ ] Select 0.5B entry.
- [ ] Confirm size/free-space warning is sensible.
- [ ] Start on Wi-Fi; inspect Android DownloadManager notification and in-app progress.
- [ ] Verify model appears in installed list after restart.
- [ ] Confirm files remain app-scoped.
- [ ] Test low storage, failed network, duplicate download, interrupted download, app restart during download.
- [ ] Confirm failed/interrupted downloads leave no visible installed .gguf; latest code uses .part files and cleans failed/missing DownloadManager tasks. Verify this on-device.
- [ ] Verify actual GGUF header is accepted.

### C. Load / inference
- [ ] Load 0.5B with context 1024, then try 2048 if stable.
- [ ] Ask a short harmless code explanation/task; record response time and memory.
- [ ] Run Plan → Code → Review once and confirm actual output from phone model.
- [ ] Verify Skill instructions and selected project context survive context-window trimming.
- [ ] Verify output is only a draft; no file execution/arbitrary filesystem writes.
- [ ] Unload and confirm memory release; reload and repeat.
- [ ] Delete model and confirm disappearance.

### D. Prove offline behavior
- [ ] Finish download.
- [ ] Enable airplane mode and disable Wi-Fi/mobile data.
- [ ] Force-stop and relaunch app if practical.
- [ ] Load already downloaded model.
- [ ] Run inference.
- [ ] Check network monitor/logs if available: local inference must not call API endpoints or PC Ollama.
- [ ] Record whether startup/model load requires network. If yes, fix or document.

### E. Failure and stability
- [ ] Load without downloaded model.
- [ ] Load with very low available RAM.
- [ ] Try a model that does not fit; app should fail gracefully, not crash.
- [ ] Background/foreground during load and inference.
- [ ] Unload during app close/activity recreation.
- [ ] Observe temperature, battery and memory under several prompts.
- [ ] Confirm errors are actionable and switching back to Ollama/API works.

## Known limitations to verify
- No in-app cancel-download button yet. The latest JS clears activeDownloadId in finally; verify Android DownloadManager task and partial-file behavior after app restart.
- RAM thresholds are approximate and can be wrong due to reserved/system memory.
- GGUF files are stored in app-specific external files; uninstall removes them.
- Larger 1.5B/3B may be impractical on low-memory devices even if download succeeds.
- Android testing is the only evidence for native inference. Node mocks do not prove Kotlin/native behavior.

## Session exit criteria
- [ ] At least one supported physical device installs native APK.
- [ ] 0.5B model loads and generates output.
- [ ] Airplane-mode inference succeeds after initial download.
- [ ] App does not crash during normal load/unload/relaunch.
- [ ] Record device model, Android version, ABI, RAM, context, model filename, approximate load time and inference time. Avoid collecting personal identifiers.
- [ ] Update PROJECT_STATE.md with exact pass/fail results and device limits.
- [ ] Next session focuses on Skill/API quality and remaining gaps.

## Copy-ready prompt for next conversation

Continue AI Studio Session 2. Read `docs/HANDOFF/README.md`, `PROJECT_STATE.md` and this checklist. Verify the live branch, PR #2 and latest native APK first. Current branch head at last checkpoint is `9400716fefaa41a96b6661b8f66370d57c3dd421`; native APK run [41580209560](https://github.com/babaprobado-bit/A-studio/actions/runs/41580209560), artifact `13205399062`. The next goal is physical Redmi S12 compatibility testing: inspect Android version/ABI/RAM, install native APK, test 0.5B download, load, short inference, unload/reload, failed download cleanup, restart persistence and airplane-mode inference after the model is downloaded. Do not call mocks or CI a device pass. User reported no internet, so state what cannot be tested until connectivity returns. Preserve all features; work only on `feature/android-offline-skills-v1`; keep PR #2 draft; never edit `main` or merge without explicit permission.
