import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildLocalCoderStages } from '../src/workshop-data.js';
import { runApiLocalCoderSequence } from '../src/local-coder-api.js';

const providers = {
  openai: { name: 'OpenAI' },
  gemini: { name: 'Gemini' },
  ollama: { name: 'Ollama' }
};
const stages = buildLocalCoderStages({
  task: 'Create a tiny JavaScript function',
  language: 'javascript',
  sourceCode: 'const existing = true;'
});
assert.deepEqual(stages.map(stage => stage.id), ['plan', 'code', 'review']);
const common = {
  providerId: 'openai',
  providers,
  stages,
  confirmConsent: async message => { assert.match(message, /3/); assert.match(message, /ücret|kota/i); return true; },
  makePrompt: (stage, previous) => stage.makePrompt ? stage.makePrompt(previous) : stage.prompt,
  callProvider: async () => 'unused'
};

const invalidProvider = await runApiLocalCoderSequence({
  ...common, providerId: 'ollama', hasKey: true, demoMode: true,
  confirmConsent: async () => { throw new Error('invalid provider must not prompt'); },
  disableDemoMode: async () => {}
});
assert.equal(invalidProvider.status, 'invalid-provider');
assert.equal(invalidProvider.requestCount, 0);

const missingKey = await runApiLocalCoderSequence({
  ...common, hasKey: false, demoMode: true,
  confirmConsent: async () => { throw new Error('missing key must not prompt'); },
  disableDemoMode: async () => {}
});
assert.equal(missingKey.status, 'missing-key');
assert.equal(missingKey.requestCount, 0);

let calls = 0;
let demoDisabled = false;
let approved = false;
let order = [];
const cancelled = await runApiLocalCoderSequence({
  ...common, hasKey: true, demoMode: true,
  confirmConsent: async message => { assert.match(message, /Demo modu kapanacak/); return false; },
  disableDemoMode: async () => { demoDisabled = true; },
  callProvider: async () => { calls++; return 'unexpected'; }
});
assert.equal(cancelled.status, 'cancelled');
assert.equal(demoDisabled, false);
assert.equal(calls, 0);

const success = await runApiLocalCoderSequence({
  ...common,
  hasKey: true,
  demoMode: true,
  confirmConsent: async message => { assert.match(message, /Demo modu kapanacak/); return true; },
  disableDemoMode: async () => { order.push('disable-demo'); demoDisabled = true; },
  onApproved: async provider => { assert.equal(provider.name, 'OpenAI'); order.push('approved'); approved = true; },
  makePrompt: (stage, previous) => {
    const prompt = stage.makePrompt ? stage.makePrompt(previous) : stage.prompt;
    if (stage.id === 'code') assert.match(prompt, /reply-1/);
    if (stage.id === 'review') assert.match(prompt, /reply-2/);
    return prompt;
  },
  onStageStart: async stage => { order.push('start-' + stage.id); },
  callProvider: async (providerId, prompt, messages) => {
    assert.equal(providerId, 'openai', 'provider must not silently change');
    assert.deepEqual(messages, []);
    assert.ok(approved, 'API calls must start only after approval');
    assert.ok(prompt.length > 0);
    calls++;
    order.push('request-' + calls);
    return 'reply-' + calls;
  }
});
assert.equal(success.status, 'completed');
assert.equal(success.requestCount, 3);
assert.deepEqual(Object.keys(success.outputs), ['plan', 'code', 'review']);
assert.equal(calls, 3);
assert.equal(demoDisabled, true);
assert.deepEqual(order.slice(0, 2), ['disable-demo', 'approved']);

let liveConsentMessage = '';
const liveCancelled = await runApiLocalCoderSequence({
  ...common,
  hasKey: true,
  demoMode: false,
  confirmConsent: async message => { liveConsentMessage = message; return false; },
  disableDemoMode: async () => { throw new Error('live mode must not rewrite Demo preference'); }
});
assert.equal(liveCancelled.status, 'cancelled');
assert.match(liveConsentMessage, /kota|ücret/i);
assert.doesNotMatch(liveConsentMessage, /Demo modu kapanacak/);

const failedProviders = [];
await assert.rejects(runApiLocalCoderSequence({
  ...common,
  hasKey: true,
  demoMode: false,
  confirmConsent: async () => true,
  callProvider: async providerId => {
    failedProviders.push(providerId);
    if (failedProviders.length === 2) throw new Error('simulated provider error');
    return 'first response';
  }
}), /simulated provider error/);
assert.deepEqual(failedProviders, ['openai', 'openai'], 'failure must stop without retry or fallback');

let emptyCalls = 0;
await assert.rejects(runApiLocalCoderSequence({
  ...common,
  hasKey: true,
  demoMode: false,
  confirmConsent: async () => true,
  callProvider: async () => { emptyCalls++; return '   '; }
}), /boş yanıt/i);
assert.equal(emptyCalls, 1);

await assert.rejects(runApiLocalCoderSequence({
  ...common,
  hasKey: true,
  stages: stages.slice(0, 2),
  confirmConsent: async () => true
}), /Plan, Code ve Review/);
console.log('API Local Coder mocked consent and routing tests passed.');

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const snapshotStart = mainSource.indexOf('function buildWorkspaceSnapshot()');
const snapshotEnd = mainSource.indexOf('async function exportWorkspace()', snapshotStart);
assert.ok(snapshotStart >= 0 && snapshotEnd > snapshotStart, 'workspace snapshot function must exist');
const snapshotSource = mainSource.slice(snapshotStart, snapshotEnd);
assert.doesNotMatch(snapshotSource, /getSecret|runtimeKeys|apiKey|secret/i,
  'workspace backups must not read or include provider secrets');

const apiStart = mainSource.indexOf('async function runApiLocalCoderWorkshop()');
const apiEnd = mainSource.indexOf('async function runLocalCoderWorkshop()', apiStart);
assert.ok(apiStart >= 0 && apiEnd > apiStart, 'API Local Coder entry point must exist');
const apiSource = mainSource.slice(apiStart, apiEnd);
assert.match(apiSource, /hasKey:Boolean\(key\)/,
  'the API sequence receives only a key-presence flag, not the key value');
const activityCalls = [...apiSource.matchAll(/logAgentActivity\(([\\s\\S]*?)\\);/g)];
assert.ok(activityCalls.length >= 3, 'API flow activity should be logged');
assert.ok(activityCalls.every(match => !/\\bkey\\b|secret/i.test(match[1])),
  'provider secrets must never be included in activity log arguments');
console.log('API Local Coder secret-boundary checks passed.');
