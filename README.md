# AI Studio Alpha 1 — Mobile + Private Web Workspace 0.6

This mobile Android build includes:
- Real API calls for OpenAI-compatible chat providers, Anthropic Messages, Google Gemini generateContent, and Ollama chat.
- Encrypted Android API-key storage using Android Keystore-backed secure storage (web preview never persists API keys).
- Demo mode enabled by default to avoid accidental API charges.
- Multi-provider chat and comparison; parallel team runs and a sequential agent pipeline explicitly confirm when they may make multiple paid requests. Each sequential stage sees the prior stage's output.
- Ollama endpoint settings for a model hosted on another computer in the same trusted network. No language model is bundled inside this APK.
- Local project notes with JSON backup/import, chat export, custom prompt plugins with JSON import/export, workflow templates, and a code scratchpad.

## Build Android APK
GitHub Actions → **Build Android Demo APK** → **Run workflow** on `main`. Download the `AI-Studio-Alpha-1-Demo-APK` artifact and extract `app-debug.apk`.

## Provider notes
Provider endpoints and default model IDs can change. Model IDs are editable in Settings. Requests are sent directly from the app to the chosen provider; the provider receives the prompt/context you submit. Configure API keys only on your own device. Key storage is encrypted at rest on Android but cannot protect secrets on a compromised/rooted device. API calls may incur provider charges.

## Local models
Ollama is a connection to a model running on another computer, not an on-device model. Use only a trusted local network when HTTP is enabled. This app does not install Ollama or download a model.

## Security boundaries
API keys are never written to GitHub or included in the source. Browser preview stores keys only in memory, not localStorage. Project/chat backups do not contain provider keys. This standalone mobile workspace does not bundle the desktop LocalCoder/AirLLM runtime or video render engine.


## Mobile Workspace 0.3 notes
- Updated provider request compatibility for OpenAI-style calls and Anthropic direct-client requests. Providers can change API behavior; always check their current docs and model IDs.
- The default Ollama address is intentionally blank so a placeholder IP is not mistaken for a working connection. Enter the computer's actual trusted-LAN address.
- The sequential agent chain is an orchestration feature, not an autonomous computer operator: it does not run shell commands, edit arbitrary files on the PC, or claim tests passed unless a connected model reports them. Demo mode returns templates rather than model inference.
- Prompt plugin import accepts JSON instructions only and does not execute imported code. Backups never include provider API keys.


## Full workspace backup
The one-file workspace backup includes local settings, projects, conversation history, and custom prompt instructions. Provider API keys are excluded. Restoring a backup replaces those local records after an explicit confirmation; existing provider secrets remain separate in Android secure storage.


## Private website / browser version (0.4)
The same responsive workspace can be served as a PWA from a password-gated Node.js server. The server requires `SITE_PASSWORD` (at least 12 characters) and `SESSION_SECRET` (at least 32 characters) at startup; it refuses to start if either is missing. The site password is checked server-side, the signed session cookie is HttpOnly, Secure in production, SameSite=Strict, and expires after 8 hours. Login attempts are rate-limited in memory. HTTPS must be enabled by the host.

### Deploy the private website
1. Import this repository as a **Web Service** in your Node.js host, or use the included `render.yaml` Blueprint.
2. Build command: `npm install --no-audit --no-fund && npm run build`; start command: `npm start`.
3. In host environment variables, set `SITE_PASSWORD` to a new long passphrase (12+ characters) and create a strong `SESSION_SECRET` with at least 32 random characters. Never paste these secrets into GitHub, source code, screenshots, or chat. The included Render Blueprint generates the session secret and asks you to provide the site password.
4. Use the host's HTTPS URL. The app's API requests go directly from the browser to the chosen AI provider; keys typed into the browser are held in memory only, so you may need to enter them again after refresh.

### Data and privacy boundaries
- This is a **single shared site password**, not individual accounts. Anyone who knows the password can enter. Rotate it in the hosting dashboard if it is exposed.
- Projects, chats, and prompt plugins are stored in the current browser's local storage; they are not synced to a cloud database and are not end-to-end encrypted. Avoid using a shared/public device. The login gate protects the website route, not someone who already has access to that browser profile.
- The PWA service worker caches static app assets only, never AI API responses or project data. Real offline AI inference is not included.
- Before using real provider keys, confirm provider pricing/quotas. The server never receives provider API keys through the current app.
- For multiple users, cross-device project sync, or encrypted cloud storage, add a proper database and per-user authentication rather than sharing one site password.


## Workspace 0.5: Local Coder, reuse catalog and snippet vault

- Local Coder runs a user-started three-stage plan → code draft → review/test-plan workflow against a model already running in Ollama. After the model is downloaded once, Ollama can run it without internet; hardware limits affect speed and output quality.
- The generated draft is not executed and is not written directly to arbitrary files. Review it first, then explicitly apply it to the scratchpad or download it. The review stage suggests tests; it does not claim to have run them.
- Reuse Catalog links to upstream engines and asset repositories. It does not scrape or automatically copy third-party code/assets. Check the exact file, version, license, attribution and bundled notices before shipping.
- Snippet Vault stores code/text with source URL and license notes in this device's storage. Export/import JSON to move the vault between devices. Full workspace backup includes snippets and recent Local Coder activity.
- HTTPS-hosted browser apps may be prevented by browser security rules from calling a local HTTP Ollama endpoint. Do not expose Ollama's unauthenticated port to the public internet.

## Implementation status — no pretend features

Present: provider API adapters; selectable multi-agent parallel runs and a sequential text pipeline; prompt-only plugins; local project/chat records; workspace export/import; Local Coder drafting and review via configured Ollama; reuse catalog; local snippet vault; recent activity log; password-gated web gateway code; Android APK workflow.

Still not implemented: unattended agents continuously inventing tasks; unrestricted access to the PC filesystem or shell; automatic code execution/build/test on your computer; a model bundled inside the APK/site; encrypted cloud sync, individual accounts, or a public deployment URL. These need separate implementations and/or hosting setup.


## Workspace 0.6: encrypted full-workspace backup

- Export an optional encrypted backup using AES-256-GCM. A random salt and nonce are generated for each export; PBKDF2-SHA-256 derives the encryption key from a passphrase (250,000 iterations).
- Import validates the encrypted envelope and authenticates the ciphertext. A wrong passphrase or modified file is rejected before workspace data is restored.
- The passphrase is not saved or sent to the server. There is no password recovery, so keep the passphrase in a safe place separate from the backup.
- This protects the downloaded encrypted backup only. Working browser records still use the browser's local storage and are not encrypted at rest by this feature; the site's shared password is not local-data encryption. API keys remain excluded from both backup formats.
- The ordinary JSON backup remains available for convenience and is **not encrypted**. Use the encrypted backup when storing a copy in cloud drives or sharing it with your future devices.
