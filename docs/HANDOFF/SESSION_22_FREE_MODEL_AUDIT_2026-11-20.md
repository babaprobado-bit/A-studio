# Session 22 — Free model catalogue and provider UI audit — 2026-11-20

## Changes
- Updated the Gemini API allowlist with currently documented free-tier Flash models; the default is now `gemini-3.8-flash`. Kept the existing `gemini-2.5-flash-lite` ID for backwards compatibility while it remains listed.
- Added visible model suggestions for Gemini and Groq from their exact allowlists.
- Removed Cloudflare `@cf/nvidia/nemotron-3-120b-a12b` because Cloudflare scheduled it to stop responding on 2026-11-20. The free-plan model list now contains only `@cf/zai-org/glm-4.7-flash` and `@cf/google/gemma-4-26b-a4b-it`.
- Corrected the AI Power Hub provider directory title from 13 to 9; it now matches the active `FREE_API_PROVIDER_CATALOG`.
- Extended the regression suite for the Gemini/Groq allowlists, retired Cloudflare model and provider count.
- Replaced the stale 36-provider research dump in `docs/NOTION/FREE_MODEL_CATALOG.md` with the exact active model gates and a separate unenabled research-candidate section.

## Free-tier and privacy notes
- Gemini's Free Tier is rate-limited and Google states free-tier input/output may be used to improve its products.
- Cloudflare must be configured as a Workers Free account; only the 10,000 Neurons/day allocation is used. Do not use a Workers Paid account or paid overage.
- NVIDIA entries are limited to models marked with a free Developer/Prototype endpoint; production paid endpoints are not included.
- APInex is optional and third-party. Only `free/*` IDs are accepted; quota and routing are provider-controlled.
- The other 27 research candidates remain disabled until exact model IDs, official $0 pricing, recurring free quota and pre-request cost protection are verified.

## Verification boundary
- Source regression checks were updated in this change. Native GGUF workflow `44691719217` was dispatched for source commit `5d1a00f8b95732ce5a398673be7614ace583a712`; verify its final outcome and artifact before release.
- No live provider API request, paid API call, billing action, physical-device test or offline inference test is claimed.

## Repository constraints
- Repository: `babaprobado-bit/A-studio`
- Branch: `feature/android-offline-skills-v1`
- PR #2 remains open and Draft; do not merge, close or mark ready.
- `main` must remain unchanged at `aab010319b6500002844bd24b11da85dd9ca3b00`.
