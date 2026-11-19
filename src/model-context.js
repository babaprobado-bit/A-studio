const DEFAULT_CONTEXT_WINDOWS = Object.freeze({ device: 4096, ollama: 8192, default: 16384 });
const MIN_CONTEXT_WINDOW = 1024;
const MAX_CONTEXT_WINDOW = 2000000;

function validPositiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && Number.isInteger(number) && number >= MIN_CONTEXT_WINDOW && number <= MAX_CONTEXT_WINDOW
    ? number : null;
}

/** Conservative multilingual estimate; providers do not share one tokenizer. */
export function estimateModelTokens(value) {
  const text = String(value ?? '');
  return text ? Math.ceil(text.length / 3) : 0;
}

function takeTokenBudget(value, tokens) {
  const text = String(value ?? '');
  if (!text || tokens <= 0) return '';
  const maxChars = Math.max(0, Math.floor(tokens * 3));
  return text.length <= maxChars ? text : text.slice(0, maxChars);
}

/** Resolve a safe default while allowing provider/model metadata to override it. */
export function resolveModelContextWindow(providerId, configuredValue) {
  return validPositiveInteger(configuredValue)
    || DEFAULT_CONTEXT_WINDOWS[providerId]
    || DEFAULT_CONTEXT_WINDOWS.default;
}

/**
 * Fit the system context and recent chat history into a model-specific input budget.
 * The newest user prompt is never silently truncated; older history is discarded first.
 */
export function fitModelContext({
  providerId = 'default',
  modelId = '',
  systemPrompt = '',
  history = [],
  prompt = '',
  contextWindowTokens,
  maxOutputTokens = 2048,
  safetyMarginTokens
} = {}) {
  const windowTokens = resolveModelContextWindow(providerId, contextWindowTokens);
  const outputReserve = Math.min(
    Math.max(256, Number(maxOutputTokens) || 2048),
    Math.max(256, Math.floor(windowTokens * 0.2))
  );
  const safety = Number.isFinite(Number(safetyMarginTokens))
    ? Math.max(0, Math.min(windowTokens / 4, Number(safetyMarginTokens)))
    : Math.min(512, Math.max(64, Math.floor(windowTokens * 0.04)));
  const inputBudget = Math.max(256, windowTokens - outputReserve - safety);
  const promptText = String(prompt ?? '');
  const promptTokens = estimateModelTokens(promptText);
  const systemBudget = Math.min(
    Math.max(128, Math.floor(inputBudget * 0.45)),
    Math.max(0, inputBudget - promptTokens)
  );
  const fittedSystemPrompt = takeTokenBudget(systemPrompt, systemBudget);
  let remaining = Math.max(0, inputBudget - promptTokens - estimateModelTokens(fittedSystemPrompt));

  const safeHistory = Array.isArray(history)
    ? history.filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    : [];
  const newestFirst = [];
  for (let index = safeHistory.length - 1; index >= 0 && remaining > 0; index--) {
    const item = safeHistory[index];
    const cost = estimateModelTokens(item.content);
    if (cost <= remaining) {
      newestFirst.push({ role: item.role, content: item.content });
      remaining -= cost;
      continue;
    }
    const partial = takeTokenBudget(item.content.slice(-remaining * 3), remaining);
    if (partial) newestFirst.push({ role: item.role, content: partial });
    remaining = 0;
  }
  const fittedHistory = newestFirst.reverse();
  const estimatedInputTokens = estimateModelTokens(fittedSystemPrompt)
    + fittedHistory.reduce((sum, item) => sum + estimateModelTokens(item.content), 0)
    + promptTokens;

  return {
    providerId,
    modelId: String(modelId || ''),
    contextWindowTokens: windowTokens,
    inputBudgetTokens: inputBudget,
    reservedOutputTokens: outputReserve,
    safetyMarginTokens: safety,
    estimatedInputTokens,
    systemPrompt: fittedSystemPrompt,
    history: fittedHistory,
    promptExceedsBudget: promptTokens > inputBudget
  };
}
