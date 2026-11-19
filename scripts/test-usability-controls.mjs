import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [html, main, css, powerHub] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('src/main.js', root), 'utf8'),
  readFile(new URL('src/style.css', root), 'utf8'),
  readFile(new URL('src/ai-power-hub.js', root), 'utf8')
]);

for (const id of [
  'providerSearch', 'providerFilter', 'providerFilterSummary', 'teamSelectionSummary',
  'localCoderPanel', 'skillLibraryPanel', 'openShortsPanel', 'reuseCatalogPanel',
  'snippetVaultPanel', 'agentActivityPanel', 'codeWorkspacePanel', 'projectForm'
]) {
  assert.ok(html.includes('id="' + id + '"'), 'Expected usability control: ' + id);
}
assert.ok(html.includes('data-project-template="game"') && html.includes('data-project-template="app"'));
assert.ok(html.includes('data-tools-jump="aiPowerHub"'));
assert.ok(main.includes('function applyProviderFilter()'), 'Provider search and filter handler is required');
assert.ok(main.includes('providerIsReady(id)'), 'Provider status filter must use actual configured state');
assert.ok(main.includes('data-project-template'), 'Project templates must prefill the project form');
assert.ok(main.includes('data-tools-jump'), 'Tool shortcuts must scroll to their sections');
assert.ok(main.includes('section-jump-highlight'), 'Jump targets should be visibly highlighted');
assert.ok(main.includes('<details class="provider-settings">'), 'Provider settings should be collapsed by default');
assert.ok(main.includes('</details></article>'), 'Provider details wrapper must be closed');
assert.ok(html.includes('<details class="advanced-disclosure openshorts-advanced">'));
assert.ok(css.includes('.tools-quick-nav') && css.includes('.provider-discovery-toolbar'));
assert.ok(powerHub.includes("host.id='aiPowerHub'"), 'AI Power Hub shortcut target must exist');
console.log('Usability controls passed: provider filters, compact settings, project templates and tool shortcuts.');
