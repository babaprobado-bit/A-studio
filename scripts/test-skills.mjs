import assert from 'node:assert/strict';
import {
  SKILL_CATALOG, SKILL_PROFILES, MAX_SELECTED_SKILLS, MAX_STAGE_SKILL_CHARS,
  parseSkillMarkdown, normalizeSkill, buildStageSkillContext, getProfileSkillIds
} from '../src/skill-library.js';

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
console.log('Skill library tests passed.');
