import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [html, css, main] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('src/style.css', root), 'utf8'),
  readFile(new URL('src/main.js', root), 'utf8')
]);

const requiredIds = [
  'chatProvider', 'providerState', 'firstRunSetup', 'firstRunSetupStatus', 'chatMessages',
  'chatForm', 'chatInput', 'teamRun', 'pipelineRun', 'exportChat', 'clearChat',
  'sidebarToggleBtn', 'appSidebar', 'chatThreadList', 'newChatBtn',
  'plusMenuToggle', 'composerPlusMenu', 'composerPluginDialog',
  'composerPluginList', 'pluginMarketplacePanel', 'pluginMarketplaceList',
  'pluginMarketplaceFeatured', 'pluginMarketplaceSearch', 'pluginMarketplaceType',
  'pluginForm', 'chatFileInput'
];
for (const id of requiredIds) {
  assert.match(html, new RegExp('id="' + id + '"'), 'Missing chat control: ' + id);
}
assert.match(html, /class="screen active" id="chat"/, "AI chat must be the default landing screen");
assert.match(html, /class="chat-shell"/, 'Chat shell must exist');
assert.match(html, /role="log"[^>]*aria-live="polite"/, 'Conversation needs an accessible live log');
assert.match(html, /class="compose chat-composer"/, 'Composer must use the dedicated chat layout');
assert.match(html, /class="app-sidebar"/, 'Chat-first sidebar must contain conversation and GPT navigation');
assert.match(html, /data-composer-action="plugins"/, 'Plus menu must expose plugin selection');
assert.match(html, /class="bottom-nav hidden"/, 'Legacy bottom navigation must not displace the chat');
assert.match(css, /\.screen#chat\.active\s*\{[^}]*display:\s*flex;/s, 'Chat screen must use a full-height flex layout');
assert.match(css, /\.chat-window\.chat-messages\s*\{[^}]*overflow-y:\s*auto;/s, 'Message history must scroll independently');
assert.match(css, /\.chat-composer\s*\{[^}]*flex-shrink:\s*0;/s, 'Composer must remain anchored');
assert.match(main, /function renderChat\(\)/, 'Chat renderer must remain available');
assert.match(main, /function fitChatInput\(\)/, 'Composer auto-resize must be available');
assert.match(main, /function renderSidebarChats\(\)/, 'Saved conversations must render in the sidebar');
assert.match(main, /function persistChatThreads\(\)/, 'Conversation threads must persist locally');
assert.match(main, /function renderComposerPlugins\(\)/, 'Saved plugins must be selectable from the composer');
assert.match(main, /requestSubmit\(\)/, 'Enter must submit the chat form');
assert.match(main, /settings\.team/, 'Existing AI Team selection logic must remain');
assert.ok(main.includes('function renderPluginMarketplace()'), 'Curated repository marketplace must render inside plugin selection');
assert.ok(main.includes('isAllowedPluginRepositoryDownload'), 'Repository downloads must use the fixed allowlist');
assert.ok(main.includes('function openFirstRunSetup'), 'First-run setup must open the correct provider or local model section');
assert.ok(main.includes('if(!providerIsReady(providerId))'), 'An unconfigured provider must not send an empty live request');
assert.doesNotMatch(html, /id="demoToggle"|id="settingsDemoToggle"/, 'Demo-mode switches must not be exposed');
console.log('Chat layout contract passed: message history, anchored composer, accessible controls, marketplace and AI Team hooks are present.');
