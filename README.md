# AI Studio Alpha 1 — Mobile Workspace 0.3

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
