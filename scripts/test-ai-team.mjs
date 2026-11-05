import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeTeamSelection, getTeamStageDetails } from '../src/ai-team.js';

const providerIds=['openai','anthropic','gemini','deepseek','groq','openrouter','huggingface','custom','ollama','device'];
assert.deepEqual(normalizeTeamSelection(providerIds,providerIds),providerIds,
  'all cloud, PC-local and phone-local engines must be selectable');
assert.deepEqual(normalizeTeamSelection([...providerIds,'unknown','device'],providerIds),providerIds,
  'selection must de-duplicate and must not truncate team members');
assert.deepEqual(normalizeTeamSelection(['device','openai'],providerIds),['device','openai']);

const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));

assert.ok(!main.includes('slice(0,4)')&&!main.includes('slice(0, 4)'),
  'no four-member team cap may remain');
assert.ok(main.includes("device: { name:'Telefon içi GGUF'"),
  'the phone GGUF engine must be registered as a provider');
assert.ok(main.includes("if(id==='device')return Boolean(nativeApp&&deviceLocalCoder.loadedFileName)"),
  'phone GGUF must only be ready while loaded in the Android runtime');
assert.ok(main.includes("generateWithDeviceModel(devicePrompt,384,'all')"),
  'AI Team calls must route to the on-device inference engine');
assert.ok(main.includes('const selected=configuredTeam()'),
  'live team execution must select only configured providers');
assert.ok(html.includes('id="selectAllTeam"'));
assert.ok(html.includes('Tüm AI sağlayıcılarını takıma ekle'));
assert.ok(pkg.scripts['test:ai-team']);
assert.equal(main.split('function renderCompareResults(').length-1,1,
  'model comparison renderer must be declared only once');
assert.equal(main.split('async function runCompare(').length-1,1,
  'model comparison runner must be declared only once');

assert.equal(getTeamStageDetails(0,10).role,'Mimar / planlayıcı');
assert.equal(getTeamStageDetails(3,10).role,'Testçi / son kontrol');
assert.ok(getTeamStageDetails(9,10).instruction.includes('yeni katkı sun'));
console.log('AI Team tests passed: unlimited selection, all 10 engines, phone GGUF readiness/routing and unique comparison functions.');
