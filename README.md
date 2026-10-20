# AI Studio Alpha 1 — Mobile Workspace 0.2

This mobile Android build includes:
- Real API calls for OpenAI-compatible chat providers, Anthropic Messages, Google Gemini generateContent, and Ollama chat.
- Encrypted Android API-key storage using Android Keystore-backed secure storage (web preview never persists API keys).
- Demo mode enabled by default to avoid accidental API charges.
- Multi-provider chat and comparison; a team run explicitly confirms when it may make multiple paid requests.
- Ollama endpoint settings for a model hosted on another computer in the same trusted network. No language model is bundled inside this APK.
- Local project notes with JSON backup/import, chat export, custom prompt plugins, workflow templates, and a code scratchpad.

## Build Android APK
GitHub Actions → **Build Android Demo APK** → **Run workflow** on `main`. Download the `AI-Studio-Alpha-1-Demo-APK` artifact and extract `app-debug.apk`.

## Provider notes
Provider endpoints and default model IDs can change. Model IDs are editable in Settings. Requests are sent directly from the app to the chosen provider; the provider receives the prompt/context you submit. Configure API keys only on your own device. Key storage is encrypted at rest on Android but cannot protect secrets on a compromised/rooted device. API calls may incur provider charges.

## Local models
Ollama is a connection to a model running on another computer, not an on-device model. Use only a trusted local network when HTTP is enabled. This app does not install Ollama or download a model.

## Security boundaries
API keys are never written to GitHub or included in the source. Browser preview stores keys only in memory, not localStorage. Project/chat backups do not contain provider keys. This standalone mobile workspace does not bundle the desktop LocalCoder/AirLLM runtime or video render engine.
