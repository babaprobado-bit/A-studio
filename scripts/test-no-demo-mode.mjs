import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [html, main, nativeWorkflow] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('src/main.js', root), 'utf8'),
  readFile(new URL('.github/workflows/build-android-local-coder.yml', root), 'utf8')
]);
assert.match(main, /demoMode:\s*false/, 'New installs must default to real model mode');
assert.match(main, /settings\.demoMode=false/, 'Existing saved settings must be migrated to real model mode');
assert.match(main, /nextSettings\.demoMode=false/, 'Imported workspace backups must not enable demo mode');
assert.doesNotMatch(main, /demoMode\s*=\s*true/, 'No code path may turn demo mode back on');
assert.doesNotMatch(html, /id="demoToggle"|id="settingsDemoToggle"|DEMO MODU/, 'Demo switches and badges must be removed from the UI');
assert.ok(html.includes('id="firstRunSetup"'), 'First-run setup card must be present');
assert.ok(main.includes('function openFirstRunSetup'), 'First-run actions must route to a provider setup section');
assert.ok(nativeWorkflow.includes('workflow_dispatch'), 'Native APK workflow remains manually runnable');
await assert.rejects(access(new URL('.github/workflows/build-android-demo.yml', root)), 'Demo APK workflow must be removed');
console.log('Real-model-only contract passed: demo disabled, no demo build workflow, and first-run model setup present.');
