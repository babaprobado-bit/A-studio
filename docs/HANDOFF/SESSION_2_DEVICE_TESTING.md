# Session 2 of 4 — Test on a real Android phone

## Current verified checkpoint — 2026-11-05

- Latest application/test commit: `794901f968aec39f6c5d1959a5e79d0ddc71db35`. Latest handoff-documentation commit before this update: `e5dc039738938900c615a07d717a7190c52e9077`.
- AI Team has **10 selectable engines**: OpenAI, Anthropic/Claude, Gemini, DeepSeek, Groq, OpenRouter, Hugging Face Inference, custom OpenAI-compatible API, PC Ollama, and **on-device Android GGUF**. No four-provider cap remains. “Tüm AI sağlayıcılarını takıma ekle” includes all entries. Existing saved selections containing all nine previous providers are migrated to include the phone GGUF entry.
- The phone GGUF engine is integrated in single chat, parallel team, sequential pipeline and model comparison. Live calls include it only when the app is native Android and a GGUF model is loaded into memory. An unloaded or unsupported device provider is skipped in live runs. Demo mode returns templates, not model inference.
- Demo workflow [42066474047](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474047) completed successfully for `794901f...`. All checks, Capacitor sync, Gradle APK build and artifact upload passed. Artifact `AI-Studio-Demo-APK`, ID `13434472811`, size **3,774,850 bytes**, artifact SHA-256 `215985c43a5d7813952e5f187ec0ac95d29d4f470512372c40602a20c854d3d7`. [Demo build](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474047).
- **Native GGUF workflow [42066474388](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474388) completed successfully** for app-code commit `794901f...`. Android tool setup, pinned llama.kt fetch, llama.cpp preparation, Vite build, all regression checks, Capacitor generation/sync, Gradle debug APK and artifact upload all passed.
- Latest native artifact: `AI-Studio-1.1-OnDevice-LocalCoder-APK`, ID `13435042754`, size **18,156,804 bytes**, artifact SHA-256 `a6b30af35b016aec390b1662dfc9f66ca29cbf3a88e6555c4c95a1612c378f69`. Created 2026-11-05 16:54:26 UTC; expires 2026-11-19 16:54:24 UTC. [Native GGUF build and artifact](https://github.com/babaprobado-bit/A-studio/actions/runs/42066474388). This is the native GGUF APK, not the demo artifact.
- PR #2 remains open, Draft and unmerged. Base `main` remains unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`. Do not modify `main` or merge without explicit user approval.
- No physical APK installation, GGUF import/load, actual on-device inference, or airplane-mode test has been performed. User currently has no device/computer available for hands-on testing; do not ask them to test now. CI proves automated checks and APK packaging only, not device compatibility or offline inference.

This checkpoint supersedes older queued-build notes above; keep older artifact records as history.


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
