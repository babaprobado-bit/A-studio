# Session 13 — Social Media Studio — 2026-11-17

## Source commits
- Social Studio modules, OpenShorts publish permission, documentation, tests and both Android workflow updates: `89dd84c9778550d0899bb1e1b7a50535cea6d0a7`.
- Main app integration that injects the Social tab and connects it to existing provider/OpenShorts state: `5ab71091d5daedae87da08be5563f091f2936f71`.
- Repository: `babaprobado-bit/A-studio`.
- Branch: `feature/android-offline-skills-v1`.
- PR #2: open, Draft, base `main`, not merged. Main must remain untouched.

## Delivered
- A responsive Social Media Studio screen, accessible from the home dashboard and bottom navigation.
- AI brief-to-script generation: title, hook, voiceover, scene/storyboard plan, caption, hashtags and CTA. It reuses the currently selected AI Studio provider path but only permits Gemini, Groq, OpenRouter `:free`, Ollama or on-device GGUF; Demo mode is blocked and no paid-provider fallback is attempted.
- Draft editor and a local content queue persisted in Capacitor Preferences. OpenShorts/API keys are not copied into that queue or backup data.
- OpenShorts pipeline: validate YouTube/direct HTTPS source, require confirmation of source rights, check quota first and fail closed if remaining minutes are unknown/zero, submit vertical clipping with captions and auto-hook, poll job status, list finished clips.
- Optional `publish_clip` MCP tool is now allowlisted and tested. It is only treated as available if the connected server advertises it. The user chooses a clip, platforms, title/description and immediate or future scheduled time; every public publish/schedule action requires a separate confirmation. The UI stores a request receipt and does not label a post as live merely because the API accepted a request.
- UI currently supports TikTok, Instagram Reels and YouTube Shorts. Connected accounts/platform permissions must already be configured in OpenShorts/Upload-Post.
- Both Demo and Native GGUF workflows now run `test:social-studio` and `test:openshorts`; both also syntax-check the new modules.

## Exact scope limitation
- This implementation generates the AI script/storyboard and clips an existing YouTube/direct-HTTPS source video into vertical shorts. It does **not** yet generate a finished AI-actor/UGC video from text alone. The OpenShorts AI Shorts/UGC creation experience is a separate product workflow with external video/voice providers; it is not exposed by the current MCP tool surface used by this integration. Do not claim prompt-to-finished-video generation is implemented.
- No automatic unattended public posting. Immediate publishing and scheduling each require a deliberate user confirmation. A schedule is submitted to OpenShorts; AI Studio does not run its own background scheduler.
- Source uploads from local files (`create_upload`) and recutting (`recut_clip`) are not implemented in this UI. The current source input is YouTube or direct HTTPS video URLs.
- Keep public content privacy-safe, follow each platform's age rules, remove private details/location and obtain parent/guardian approval when required.

## Verification checkpoint
- Local remote sandbox has Node.js but no npm executable. `npm install` / local Vite build could not be run there.
- Passed directly in the remote sandbox: `node scripts/test-social-studio.mjs`; `node scripts/test-openshorts.mjs`; `node --check` for `src/main.js`, `src/openshorts-mcp.js`, `src/social-studio.js`, `src/social-studio-core.js` and both test files; `package.json` parse and workflow text assertions.
- GitHub Demo workflow `44040503272` checked out commit `5ab71091d5daedae87da08be5563f091f2936f71`: dependency install, syntax/manifest, Vite web build, Local Coder/workspace, chat layout, Social Studio + OpenShorts publishing tests, Skills, Local Coder bridge, REA mock contract and private-login tests passed. At the last checkpoint Gradle debug APK build was in progress; no artifact verified yet.
- GitHub Native GGUF workflow `44040503458` checked out the same commit. Android SDK setup succeeded; native build tools were still installing at the last checkpoint. Social Studio regression tests, Gradle build and artifact upload had not yet run at that checkpoint.
- No physical phone installation, social platform account connection, real video processing, public post, on-device GGUF inference or airplane-mode test was performed.

## Continue next
1. Poll workflow runs `44040503272` (Demo) and `44040503458` (Native GGUF); inspect exact job steps and logs if a step fails.
2. If both CI runs succeed, inspect the actual artifact list and download metadata before providing any APK link; Demo and Native GGUF are distinct artifacts.
3. Update this session file and PROJECT_STATE/README only with verified final run/artifact outcomes.
4. Keep PR #2 open and Draft. Never touch `main`, merge, or mark PR ready.
