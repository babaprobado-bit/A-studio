# AI Studio Alpha 1 — Android demo

A lightweight mobile UI prototype with a demo team chat, model comparison templates, and project notes stored locally on the device.

## Build the APK

Open GitHub **Actions** → **Build Android Demo APK** → **Run workflow** on `main`. On a successful run, download the `AI-Studio-Alpha-1-Demo-APK` artifact and extract `app-debug.apk`.

## Current limits

Chat outputs are locally generated templates. This demo does not connect to GPT, Claude, Gemini, or LocalCoder and does not request or store API keys. A real provider integration should call a protected backend; never bundle provider secrets directly in an APK.
