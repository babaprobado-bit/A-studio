import assert from 'node:assert/strict';
import {
  PLUGIN_REPOSITORY_CATALOG,
  getPluginRepositoryArchiveUrl,
  getPluginRepositoryById,
  isAllowedPluginRepositoryDownload
} from '../src/plugin-marketplace.js';

assert.equal(PLUGIN_REPOSITORY_CATALOG.length, 33, 'REA plus the 32 screenshot repositories must be listed');
assert.equal(PLUGIN_REPOSITORY_CATALOG[0].id, 'rea-companion', 'REA must be the first and featured entry');
assert.equal(PLUGIN_REPOSITORY_CATALOG.filter(item => item.repository).length, 32, 'Exactly 32 GitHub repositories must be downloadable');
assert.equal(new Set(PLUGIN_REPOSITORY_CATALOG.map(item => item.id)).size, 33, 'Catalog IDs must be unique');
assert.equal(new Set(PLUGIN_REPOSITORY_CATALOG.filter(item => item.repository).map(item => item.repository.toLowerCase())).size, 32, 'Repository sources must be unique');

for (const item of PLUGIN_REPOSITORY_CATALOG.filter(item => item.repository)) {
  assert.match(item.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, item.id + ' must use an owner/repository source');
  assert.match(item.sourceUrl, /^https:\/\/github\.com\//, item.id + ' must use GitHub as its source');
  const archive = getPluginRepositoryArchiveUrl(item.id);
  assert.match(archive, /^https:\/\/github\.com\/.+\/archive\/refs\/heads\/.+\.zip$/, item.id + ' must have a valid ZIP URL');
  assert.equal(isAllowedPluginRepositoryDownload(item.id, archive), true);
  assert.equal(isAllowedPluginRepositoryDownload(item.id, item.sourceUrl), false);
}
assert.equal(getPluginRepositoryArchiveUrl('rea-companion'), null, 'REA must not be misrepresented as a GitHub ZIP');
assert.equal(getPluginRepositoryArchiveUrl('../other-repo'), null, 'Unknown repository IDs must not produce download URLs');
assert.equal(getPluginRepositoryArchiveUrl('https://example.com'), null, 'External arbitrary URLs must not produce download URLs');
assert.equal(getPluginRepositoryById('rea-companion').docsUrl, 'https://rea.vaked.dev/get-started/');
assert.equal(getPluginRepositoryById('karpathy-skills').community, true, 'Third-party Karpathy skill bundle must be marked community-made');
assert.equal(getPluginRepositoryById('rtk').branch, 'develop', 'RTK branch must be explicit');
assert.equal(getPluginRepositoryById('wshobson-agents').archived, false, 'Current wshobson agents repo must not be marked archived');
assert.equal(getPluginRepositoryById('mattpocock-skills').repository, 'mattpocock/skills');
assert.equal(getPluginRepositoryById('beads').repository, 'steveyegge/beads');
console.log('Plugin marketplace contract passed: REA priority, 32 allowlisted repositories and safe ZIP URL generation.');
