# Session 2 of 4 — Test on a real Android phone

## Goal
Once Session 1 produces the native GGUF APK, test installation, model management and actual offline inference on a physical supported Android phone. The key proof is that a user can download a model once, disconnect internet, and still send a prompt to the model running inside the phone.

Do not use the regular demo APK for this test; it does not contain the native GGUF bridge. Use artifact from build-android-local-coder.yml.

## Software-side progress (2026-11-02; not a device-test pass)

- The native model manager exposes manual selection of Qwen2.5-Coder 0.5B, 1.5B and 3B GGUF variants.
- The Android bridge now reports manufacturer/model label, Android SDK, ABI, CPU core count, total/available RAM, low-memory pressure and free model storage.
- The app recommends a model using approximate RAM/CPU/storage thresholds, labels model fit in the picker, preserves manual selection and refreshes live resource readings before download/load.
- These heuristics do not replace real performance, thermal or memory-stability testing. No physical-phone install, GGUF inference or airplane-mode test has been completed.
- Initial GGUF download still requires internet. After a complete model download, inference is intended to run locally without internet or an API key.

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
- [ ] Check partial .gguf files after a failed download and whether safely resumable/cleanable.
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
- No current cancel-download UI button; JS tracks activeDownloadId but may not expose real cancel.
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

Continue AI Studio. Read docs/HANDOFF/README.md, PROJECT_STATE.md and SESSION_2_DEVICE_TESTING.md. First inspect latest native APK artifact and Session 1 build result. Test on a real Android 10+ arm64 device. Critical acceptance test: download Qwen2.5-Coder 0.5B once, switch to airplane mode, restart if possible, load it and run Local Coder entirely on-device. Distinguish JS mocks from real native-device results. Preserve API/Ollama/Skill/project functionality and write measurements/failures back to repo docs.
