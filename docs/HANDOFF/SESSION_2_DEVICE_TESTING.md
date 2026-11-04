# Session 2 of 4 — Test on a real Android phone

## Goal
Once Session 1 produces the native GGUF APK, test installation, model management and actual offline inference on a physical supported Android phone. The key proof is that a user can download a model once, disconnect internet, and still send a prompt to the model running inside the phone.

Do not use the regular demo APK for this test; it does not contain the native GGUF bridge. Use artifact from build-android-local-coder.yml.

## Software-side progress — 2026-11-04 (source/CI work only, not a device-test pass)

- Latest app-code/test commit: `b9677813676c8138651848620fa1ef0ab5fc3b86`; it makes load requests for an already-active GGUF idempotent. Its follow-up native workflow [41885349742](https://github.com/babaprobado-bit/A-studio/actions/runs/41885349742) was queued when this handoff was written.
- The preceding native build [41706759331](https://github.com/babaprobado-bit/A-studio/actions/runs/41706759331) completed successfully for app commit `6afe4cc...`, producing artifact `13266781713` (18,154,318 bytes; SHA-256 `d9ab6beafb65a6d570436fe1eeda959cdbbd55a608c5cde3f411b8e2c42583a7`). Regression checks, Capacitor sync, Gradle APK build and upload all passed.
- The `6afe4cc` source contains imported-GGUF size-based RAM guardrails in JS and Kotlin. This is a heuristic and not proof of phone compatibility.

## Latest project status — 2026-11-04

- User currently has no phone/computer available for hands-on tests. Do not request physical testing now; continue source development and GitHub-hosted CI/mock tests.
- The local import path is useful only when the `.gguf` file is already available locally or can be copied to the phone. The app does not bundle or create model weights.
- Device was previously described as Redmi S12, but the exact commercial model, Android version, ABI and RAM are unverified.
- No physical APK installation, GGUF import on Android, model load/inference or airplane-mode proof has passed. The `6afe4cc` APK is a real native artifact, but GitHub Actions cannot prove native runtime behavior or phone compatibility.
- PR #2 remains open/draft; main unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.

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
- Either Wi-Fi for DownloadManager acquisition OR an already-available `.gguf` file copied onto the phone through USB, SD card or file sharing. The local import action itself does not need internet.
- Safe backup of existing AI Studio workspace before install/update.
- Never ask user to paste API keys into testing chat. GGUF inference should not require an API key.

## Test sequence

### A. Installation / baseline
- [ ] Install native artifact and check package/version update behavior.
- [ ] Launch app; verify projects, code editor, chat, Skill Library, API settings and Ollama screen still render.
- [ ] Confirm default remains PC/Ollama unless user chooses another engine.
- [ ] Confirm on-device selection disabled on unsupported ABI/Android version.

### B. Model acquisition and persistence

**No-internet route:** place an existing `.gguf` file on the phone by USB, SD card or file sharing, then use “Dosyadan GGUF içe aktar”. This does not require an app network connection, but it does require that the model file already exists.
- [ ] Select 0.5B entry.
- [ ] Confirm size/free-space warning is sensible.
- [ ] Download via Wi-Fi when available; inspect DownloadManager notification, progress and the in-app cancel control.
- [ ] Alternatively select a local `.gguf` file through the Android picker; verify import progress and installed-model list without internet.
- [ ] Verify model appears in installed list after restart.
- [ ] Confirm files remain app-scoped.
- [ ] Test low storage, failed network, duplicate download, interrupted download, app restart during download and cancellation.
- [ ] For local import, test picker cancellation, in-copy cancel, duplicate/sanitized file names, non-GGUF extension, invalid header, unknown source size, insufficient free storage and cleanup of partial `.part` files.
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
- Download and large local-import cancellation are available in the in-app model manager. Verify Android DownloadManager task/partial cleanup and SAF stream cancellation on-device.
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

Continue AI Studio software development without relying on phone or computer testing; the user currently has no internet and no device available for hands-on validation. Read `docs/HANDOFF/README.md`, `PROJECT_STATE.md`, this file and `NEW_CHAT_STARTER.md`. Latest source/test commit at this checkpoint: `6afe4ccfde5f29085a3ad0f2079f0f6addbe5107`; inspect latest branch head and Actions first. Recent change: imported/custom GGUF files now receive size-based free-RAM guardrails in JavaScript and Kotlin, with mock regression tests. Continue code review, automated regression coverage and native CI; preserve all current features. Keep PR #2 open and Draft; never modify main or merge. No physical install/import/inference/offline test has been done.
