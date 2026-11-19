import assert from 'node:assert/strict';
import {
  estimateModelTokens,
  resolveModelContextWindow,
  fitModelContext
} from '../src/model-context.js';

assert.equal(resolveModelContextWindow('device'), 4096);
assert.equal(resolveModelContextWindow('ollama'), 8192);
assert.equal(resolveModelContextWindow('gemini'), 16384);
assert.equal(resolveModelContextWindow('gemini', 32768), 32768);
assert.equal(resolveModelContextWindow('gemini', 999), 16384);
assert.equal(estimateModelTokens(''), 0);
assert.equal(estimateModelTokens('123456'), 2);

const fitted = fitModelContext({
  providerId: 'openai',
  modelId: 'example-model',
  contextWindowTokens: 4096,
  systemPrompt: 'S'.repeat(24000),
  history: [
    { role: 'user', content: 'old'.repeat(12000) },
    { role: 'assistant', content: 'middle'.repeat(5000) },
    { role: 'user', content: 'recent question' },
    { role: 'system', content: 'must be ignored' }
  ],
  prompt: 'current request',
  maxOutputTokens: 512
});
assert.equal(fitted.modelId, 'example-model');
assert.equal(fitted.contextWindowTokens, 4096);
assert.ok(fitted.systemPrompt.length < 24000, 'system context is bounded');
assert.ok(fitted.history.every(item => item.role === 'user' || item.role === 'assistant'));
assert.equal(fitted.history.at(-1).content, 'recent question');
assert.ok(fitted.estimatedInputTokens <= fitted.inputBudgetTokens);
assert.ok(fitted.history.every(item => !item.content.includes('must be ignored')));

const newestPromptWins = fitModelContext({
  providerId: 'ollama',
  contextWindowTokens: 2048,
  systemPrompt: 'system '.repeat(5000),
  history: [{ role: 'user', content: 'old '.repeat(5000) }],
  prompt: 'CURRENT_TASK'
});
assert.equal(newestPromptWins.promptExceedsBudget, false);
assert.ok(newestPromptWins.systemPrompt.length < 15000);
assert.ok(newestPromptWins.estimatedInputTokens <= newestPromptWins.inputBudgetTokens);
assert.equal(fitModelContext({ prompt: 'X'.repeat(20000), contextWindowTokens: 1024 }).promptExceedsBudget, true);

console.log('Model context budgeting tests passed.');
