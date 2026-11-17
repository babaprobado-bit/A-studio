# Session 14 — True AI video generation — 2026-11-17

## Verified repository boundary
- Repository: `babaprobado-bit/A-studio`
- Branch: `feature/android-offline-skills-v1`
- Social/video modules + tests + workflows + Capacitor/CSP commit: `80ff55616063aeb139a6c5887d780364359730c7`
- AI Studio main app / SecureStorage wiring commit: `8df3fd2b09bc601e2fca152ba3bce0b68ec8561f`
- `main` remains `aab010319b6500002844bd24b11da85dd9ca3b00`.
- PR #2 remains open, Draft, unmerged, base `main`: https://github.com/babaprobado-bit/A-studio/pull/2

## Implemented
- Added `src/runway-video.js`, a direct Runway Dev Gen-4.5 client for `POST /v1/text_to_video` and `POST /v1/image_to_video`, plus task polling `GET /v1/tasks/<built-in function id>`.
- Social Media Studio contains a distinct **Sıfırdan AI video üret** panel. It accepts a prompt or first-frame PNG/JPEG/WebP image (max 4 MB), 9:16 or 16:9 ratio and 5/8/10-second options.
- New video task metadata is stored in the local Social Studio draft queue; the API key is not stored in that queue or in workspace backups. Android reuses SecureStoragePlugin; browser preview stores the key in session memory only.
- `capacitor.config.json` enables CapacitorHttp native fetch patching to reduce Android WebView CORS problems. Server CSP allows Runway API requests and the CloudFront output video host.
- User must provide an API key managed by a parent/guardian. Each generation shows the estimate and requires a second confirmation. No background or automatic generation.
- The existing free/local AI text model continues to create scripts/storyboards; Runway video generation is a separate paid/credit-based feature, not a free model.
- Runway result can be passed to the existing OpenShorts process_video step for clipping/captions; the current publish_clip path publishes clips created by OpenShorts, not arbitrary raw MP4 files.
- Both Android workflows contain the new syntax checks and `npm run test:runway-video`; Native workflow path filters now include Social Studio, Runway and Capacitor config changes.

## Pricing and limits
- Official Gen-4.5 API rate: 12 credits/second; Runway Dev pricing states 1 credit = USD $0.01. Estimated costs: 5 seconds $0.60, 8 seconds $0.96, 10 seconds $1.20.
- Runway Dev is usage/credit-priced, not an unlimited free API. Promotional credit, if any, is account-specific and not assumed by AI Studio.
- Gen-4.5 supports 2–10 second short visual clips. Current app choices are 5/8/10 seconds. No generated speech/music is claimed; voiceover is a separate step.
- Runway output URLs may expire within 24–48 hours; the user should download the result soon after completion.
- The UI guardian checkbox is a user declaration, not identity verification. Do not ask the user to purchase credits, add a card or bypass guardian review.

## Tests and current verification
- Passed in the remote Node environment: `node scripts/test-runway-video.mjs`, `node scripts/test-social-studio.mjs`, `node scripts/test-openshorts.mjs`; syntax checks for updated source/test files; package and Capacitor config assertions; both Android workflow YAML files parsed successfully and include the new test commands.
- Remote bash has Node but no npm. Local `npm install`/Vite build could not be run. GitHub Actions must verify Vite build and Android APK packaging on the new source.
- **No real Runway API call was sent. No API key was used, no credits were spent, and no generated MP4 was received.** Mock tests do not prove live provider access, WebView CORS, device behavior or social-account publishing.
- New Demo and Native GGUF workflows have not yet been dispatched for commit `8df3fd2b09bc601e2fca152ba3bce0b68ec8561f`. Do not use older runs from `5ab7109...` as verification of this newer video-generator source.

## Next
1. Verify live branch/PR and ensure `main` remains unchanged.
2. Trigger Demo and Native GGUF Android workflows for `8df3fd2b09bc601e2fca152ba3bce0b68ec8561f`.
3. Verify new `test:runway-video`, Vite build, Capacitor sync, Gradle and uploaded artifacts. Only offer download links for actual verified artifacts.
4. Keep PR #2 Draft/unmerged. Never modify `main`.
