import assert from 'node:assert/strict';
import {
  SKILL_CATALOG, SKILL_PROFILES, MAX_SELECTED_SKILLS, MAX_STAGE_SKILL_CHARS,
  parseSkillMarkdown, normalizeSkill, buildStageSkillContext, getProfileSkillIds,
  createSkillBackupState, restoreSkillBackupState,
  prepareSkillImportQueue
} from '../src/skill-library.js';
import { encryptWorkspaceBackup, decryptWorkspaceBackup } from '../src/encrypted-backup.js';
import { webcrypto } from 'node:crypto';

assert.equal(SKILL_CATALOG.length, 38, 'starter pack must contain 15 Superpowers, 22 Caveman and one guideline');
assert.equal(SKILL_CATALOG.filter(skill => skill.group === 'Superpowers').length, 15);
assert.equal(SKILL_CATALOG.filter(skill => skill.group === 'Caveman').length, 22);
for (const id of ['karpathy','superpowers','superpowers-development','planning','review','caveman','caveman-short','balanced']) {
  assert.ok(SKILL_PROFILES[id], 'missing profile: ' + id);
  assert.ok(SKILL_PROFILES[id].skillIds.length <= MAX_SELECTED_SKILLS, 'profile exceeds eight Skills: ' + id);
  assert.equal(getProfileSkillIds(id).length, SKILL_PROFILES[id].skillIds.length);
}
assert.deepEqual(getProfileSkillIds('karpathy'), ['karpathy-guidelines']);
assert.equal(getProfileSkillIds('balanced').length, MAX_SELECTED_SKILLS);

const parsed = parseSkillMarkdown(
  '---\nname: My Skill\ndescription: A test skill\nstage: code\nlicense: MIT\nsource: Example repository\nsource_url: https://example.com/skill\nauthor: Example Author\nversion: 1.2\ncategory: testing\n---\n# My Skill\nUse small, verifiable changes.',
  'SKILL.md'
);
assert.equal(parsed.name, 'My Skill');
assert.equal(parsed.stage, 'code');
assert.match(parsed.content, /verifiable/);
assert.equal(parsed.license, 'MIT');
assert.equal(parsed.source, 'Example repository');
assert.equal(parsed.sourceUrl, 'https://example.com/skill');
assert.equal(parsed.author, 'Example Author');
assert.equal(parsed.version, '1.2');
assert.equal(parsed.metadata.category, 'testing');


const bomSkill = parseSkillMarkdown(
  '\uFEFF---\r\nname: BOM Skill\r\nstage: review\r\nlicense: MIT\r\n---\r\n# BOM Skill\r\nReview with care.',
  'bom-skill.md'
);
assert.equal(bomSkill.name, 'BOM Skill');
assert.equal(bomSkill.stage, 'review');
assert.equal(bomSkill.license, 'MIT');
assert.equal(bomSkill.content, 'Review with care.');

const crlfSkill = parseSkillMarkdown(
  '---\r\nname: CRLF Skill\r\ndescription: Windows line endings\r\nstage: plan\r\n---\r\n# CRLF Skill\r\nPlan in small steps.',
  'crlf-skill.md'
);
assert.equal(crlfSkill.name, 'CRLF Skill');
assert.equal(crlfSkill.description, 'Windows line endings');
assert.equal(crlfSkill.content, 'Plan in small steps.');

const fakeFile = (name, content) => ({ name, text: async () => content });
const importQueue = await prepareSkillImportQueue([
  fakeFile('first.md', '---\nname: Duplicate\n---\nFirst instructions.'),
  fakeFile('second.MD', '---\nname: duplicate\n---\nSecond instructions.'),
  fakeFile('not-a-skill.txt', 'ignored'),
  fakeFile('broken.md', '---\nname: Broken\n# Missing delimiter'),
  fakeFile('third.md', '# Third Skill\nThird instructions.')
], [{ name: 'Duplicate' }]);
assert.equal(importQueue.queue.length, 3);
assert.equal(importQueue.queue[0].duplicateName, true, 'existing name collision must be flagged');
assert.equal(importQueue.queue[1].duplicateName, true, 'queued file name collision must be flagged');
assert.equal(importQueue.queue[2].skill.name, 'Third Skill');
assert.equal(importQueue.errors.length, 2);
assert.match(importQueue.errors[0], /yalnızca \.md/i);
assert.match(importQueue.errors[1], /kapanmamış/i);

const importLimit = await prepareSkillImportQueue([
  fakeFile('one.md', '# One\nOne.'),
  fakeFile('two.md', '# Two\nTwo.')
], Array.from({ length: 99 }, (_, index) => ({ name: 'Existing ' + index })));
assert.equal(importLimit.queue.length, 1, 'the import queue must respect the 100 custom Skill cap');
assert.equal(importLimit.errors.length, 1);
assert.match(importLimit.errors[0], /100/);

const invalidStage = parseSkillMarkdown('---\nname: Fallback\nstage: unknown\ncustom_field: preserved\n---\nDo the work.', 'fallback.md');
assert.equal(invalidStage.stage, 'all');
assert.equal(invalidStage.metadata.unsupported_stage, 'unknown');
assert.equal(invalidStage.metadata.custom_field, 'preserved');
assert.throws(() => parseSkillMarkdown('   '), /boş/i);
assert.throws(() => parseSkillMarkdown('---\nname: Broken\n# Missing closing delimiter'), /kapanmamış/i);
assert.throws(() => parseSkillMarkdown('---\nname: Broken\nnot a key value\n---\nBody'), /okunamadı/i);
assert.throws(() => parseSkillMarkdown('x'.repeat(50001)), /50 KB/i);
assert.throws(() => parseSkillMarkdown('---\nname: Too large\n---\n' + 'x'.repeat(12001)), /12.000/i);
assert.equal(normalizeSkill({name: 'bad', content: 'x'.repeat(12001)}), null);

const many = Array.from({length: 12}, (_, index) => ({
  id: 'x' + index, name: 'Skill ' + index, stage: 'all', content: 'A'.repeat(1000)
}));
const context = buildStageSkillContext(many, 'code');
assert.ok(context.includedIds.length <= MAX_SELECTED_SKILLS);
assert.ok(context.charCount <= MAX_STAGE_SKILL_CHARS);
assert.ok(context.promptText.includes('AI STUDIO SKILLS'));
assert.equal(context.promptText.includes('\\n'), false, 'context must contain real line breaks, not literal slash-n text');
assert.equal(context.promptText.includes('\n'), true, 'context should be separated by real line breaks');
assert.equal(context.omittedByCount, true);

const planOnly = buildStageSkillContext([{id: 'p', name: 'Plan', stage: 'plan', content: 'Plan carefully.'}], 'review');
assert.equal(planOnly.includedIds.length, 0);
const largeSkills = Array.from({length: 8}, (_, index) => ({
  id: 'large-' + index, name: 'Large ' + index, stage: 'code', content: 'Z'.repeat(8000)
}));
const cap = buildStageSkillContext(largeSkills, 'code');
assert.ok(cap.charCount <= MAX_STAGE_SKILL_CHARS, 'separators and wrappers must count toward the stage cap');
assert.ok(cap.includedIds.length <= MAX_SELECTED_SKILLS);
assert.ok(cap.excludedIds.length > 0, 'overflow Skills must be reported as excluded');
assert.equal(new Set(getProfileSkillIds('superpowers-development')).size, 8);
console.log('Skill library tests passed, including BOM/CRLF and multi-file import queue checks.');

const custom = normalizeSkill({
  id: 'custom-imported-skill', name: 'Imported Skill', description: 'Imported for backup coverage',
  stage: 'code', content: 'Keep the source and license metadata.', source: 'Test source',
  sourceUrl: 'https://example.test/skill', license: 'MIT', author: 'AI Studio test',
  version: '1.0', metadata: { category: 'backup-test' }
});
const savedSkillState = createSkillBackupState({
  customSkills: [custom], selectedSkillIds: ['karpathy-guidelines', custom.id], profileId: 'custom'
});
assert.equal(savedSkillState.profileId, 'custom');
assert.equal(savedSkillState.customSkills.length, 1);
assert.ok(savedSkillState.selectedSkillIds.includes(custom.id));

const standardSnapshot = JSON.parse(JSON.stringify({ format: 'ai-studio-workspace-v1', skills: savedSkillState }));
const standardRestore = restoreSkillBackupState(standardSnapshot.skills);
assert.equal(standardRestore.customSkills[0].content, custom.content);
assert.equal(standardRestore.customSkills[0].license, 'MIT');
assert.equal(standardRestore.customSkills[0].sourceUrl, 'https://example.test/skill');
assert.equal(standardRestore.customSkills[0].metadata.category, 'backup-test');
assert.ok(standardRestore.selectedSkillIds.includes(standardRestore.customSkills[0].id),
  'selected custom Skill ID must be remapped along with the restored Skill ID');
assert.equal(standardRestore.profileId, 'custom');

const encryptedSnapshot = { format: 'ai-studio-workspace-v1', settings: { demoMode: true }, skills: savedSkillState };
const backupPassword = 'skill-backup-test-passphrase';
const sealedSkillsBackup = await encryptWorkspaceBackup(encryptedSnapshot, backupPassword, webcrypto);
const openedSkillsBackup = await decryptWorkspaceBackup(sealedSkillsBackup, backupPassword, webcrypto);
const encryptedRestore = restoreSkillBackupState(openedSkillsBackup.skills);
assert.equal(encryptedRestore.customSkills[0].name, 'Imported Skill');
assert.ok(encryptedRestore.selectedSkillIds.includes(encryptedRestore.customSkills[0].id));
assert.equal(encryptedRestore.profileId, 'custom');
await assert.rejects(
  decryptWorkspaceBackup(sealedSkillsBackup, 'wrong-skill-backup-passphrase', webcrypto),
  /Parola yanl[iı]ş veya yedek dosyas[ıi] de[gğ]i[sş]tirilmi[sş]/
);

const legacySkillRestore = restoreSkillBackupState(undefined);
assert.equal(legacySkillRestore.profileId, 'karpathy');
assert.deepEqual(legacySkillRestore.selectedSkillIds, ['karpathy-guidelines']);
const manyCustom = Array.from({ length: 105 }, (_, index) => ({
  id: 'custom-limit-' + index, name: 'Custom ' + index, content: 'Safe test instructions.'
}));
const boundedBackup = createSkillBackupState({
  customSkills: manyCustom,
  selectedSkillIds: [...SKILL_CATALOG.map(item => item.id), ...manyCustom.map(item => item.id)],
  profileId: 'balanced'
});
assert.equal(boundedBackup.customSkills.length, 100);
assert.equal(boundedBackup.selectedSkillIds.length, MAX_SELECTED_SKILLS);
assert.equal(boundedBackup.profileId, 'balanced');
console.log('Skill backup compatibility tests passed.');
