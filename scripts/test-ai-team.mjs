import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeTeamSelection } from '../src/ai-team.js';

const providers = ['openai', 'anthropic', 'gemini', 'deepseek', 'groq', 'openrouter', 'huggingface', 'ollama'];
assert.deepEqual(normalizeTeamSelection(providers, providers), providers,
  'every integrated AI provider must remain selectable in the team');
assert.deepEqual(normalizeTeamSelection([...providers, 'unknown', 'openai'], providers), providers,
  'selection should remove unknown and duplicate IDs without truncating valid providers');
assert.deepEqual(normalizeTeamSelection(null, providers), []);
assert.deepEqual(normalizeTeamSelection([], providers), []);

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(main, /huggingface:\s*\{[^\n]*https:\/\/router\.huggingface\.co\/v1\/chat\/completions/,
  'Hugging Face Inference Providers must be registered');
assert.match(main, /normalizeTeamSelection\(settings\.team,Object\.keys\(providers\)\)/,
  'team runners must use the full provider selection');
assert.doesNotMatch(main, /slice\(0,\s*4\)/,
  'team selection, backup import and execution must not truncate to four');
assert.doesNotMatch(main, /settings\.team\.length\s*>=\s*4/,
  'checkbox handling must not enforce a four-provider ceiling');
assert.match(html, /id="teamSelectAll"/);
assert.match(html, /Takım turuna katılacak AI sağlayıcılarını seç \(sınır yok\)/);
assert.match(html, /Paralel takım \(seçilenlerin hepsi\)/);
console.log('AI Team provider selection tests passed: all providers, Hugging Face, backup restore and unlimited team selection.');
