# Model-aware context handling

## Purpose

AI Studio must pass useful project context to different models without blindly sending the same oversized prompt to every provider. The context packer uses a conservative multilingual token estimate because providers use different tokenizers.

## Behavior

- Context-window size can be supplied per request through `contextWindowTokens`, per provider/model through `settings.modelContextWindows`, or as provider metadata (`contextWindowTokens`).
- Conservative defaults are 4,096 tokens for on-device GGUF, 8,192 for Ollama, and 16,384 for cloud/custom providers until verified metadata is configured.
- Output tokens and a safety margin are reserved before fitting input.
- The current user prompt is preserved; older chat history is discarded first, newest messages retained.
- System instructions and appended project/Shared Vault/Skills context are bounded together. Truncation removes the tail first, so the stable system rules at the beginning remain.
- The returned diagnostics include the selected context window, input budget, estimated input tokens, and whether the current prompt itself exceeds the budget.
- No content is sent to another provider by this module; it only prepares the request already selected by the user.

## Privacy and safety

Project files/snippets and Shared Vault references continue to obey their existing opt-in settings. Imported notes and Skills remain untrusted reference data, not higher-priority instructions. Provider/model context sizes must be configured from verified model metadata; defaults are conservative fallbacks, not claims about maximum model capacity.

## Verification

Run `npm run test:model-context` and the existing provider/AI Team tests. CI build success does not prove a physical device's actual available RAM or local GGUF inference.
