import assert from 'node:assert/strict';
import { buildCreatorPrompt, normalizeCreatorMode } from '../src/creator-studio-core.js';
import {
  SOCIAL_PLATFORMS, buildSocialPrompt, normalizeSocialDraft,
  normalizeSocialQueue, normalizeSocialClips, buildSocialPublishArgs
} from '../src/social-studio-core.js';
import { buildSocialMultiShotPrompt, normalizeSocialAutomationState, isSocialAutomationPolling, getSocialAutomationPollDelay } from '../src/social-studio-automation.js';
import { buildRunwayMultiShotPayload, estimateRunwayMultiShotCost } from '../src/runway-video.js';

const prompt = buildSocialPrompt({ topic: 'Yeni bir oyun geliştirme günlüğü', platforms: ['youtube', 'tiktok', 'youtube'], tone: 'storytelling', duration: 45 });
assert.match(prompt, /Yeni bir oyun geliştirme günlüğü/);
assert.match(prompt, /youtube, tiktok/);
assert.throws(() => buildSocialPrompt({ topic: '', platforms: ['youtube'] }), /fikrini/);
assert.throws(() => buildSocialPrompt({ topic: 'Bir fikir', platforms: [] }), /platform/);
assert.deepEqual(SOCIAL_PLATFORMS.map((item) => item.id), ['tiktok', 'instagram', 'youtube']);

const parsed = normalizeSocialDraft('```json\n{"title":"Oyun günlüğü","hook":"Bir hata her şeyi değiştirdi","voiceover":"Bugün...","scenes":[{"time":"0-3s","visual":"Ekran kaydı","narration":"Başlangıç"}],"caption":"Yeni bölüm","hashtags":["oyun","#devlog"],"cta":"Takip et"}\n```', 'Test');
assert.equal(parsed.title, 'Oyun günlüğü');
assert.equal(parsed.hashtags[0], '#oyun');
assert.equal(parsed.scenes.length, 1);
const fallback = normalizeSocialDraft('Ham senaryo metni', 'Test konu');
assert.equal(fallback.voiceover, 'Ham senaryo metni');
assert.equal(fallback.title, 'Test konu');

const queue = normalizeSocialQueue([{ id: 'a', title: 'Draft', platforms: ['youtube', 'unknown'], status: 'script_ready', clips: [{ video_url: 'https://cdn.example/1.mp4' }] }]);
assert.equal(queue.length, 1);
assert.deepEqual(queue[0].platforms, ['youtube']);
assert.equal(queue[0].creatorMode, 'what_if');
assert.equal(queue[0].creatorSettings.whatIfInterval, 'every hour');
assert.deepEqual(queue[0].socialPlan, { status: 'draft', plannedAt: '', note: '' });
const plannedQueue = normalizeSocialQueue([{ id: 'planned', platforms: ['youtube'], socialPlan: { status: 'planned', plannedAt: '2027-01-05T14:30:00.000Z', note: 'Kapak görselini kontrol et' } }]);
assert.equal(plannedQueue[0].socialPlan.status, 'planned');
assert.equal(plannedQueue[0].socialPlan.plannedAt, '2027-01-05T14:30:00.000Z');
assert.equal(plannedQueue[0].socialPlan.note, 'Kapak görselini kontrol et');
const invalidPlan = normalizeSocialQueue([{ id: 'bad-plan', socialPlan: { status: 'planned', plannedAt: 'not-a-date', note: 'x'.repeat(500) } }]);
assert.equal(invalidPlan[0].socialPlan.status, 'draft');
assert.equal(invalidPlan[0].socialPlan.plannedAt, '');
assert.equal(invalidPlan[0].socialPlan.note.length, 240);
const townQueue = normalizeSocialQueue([{ id: 'town', creatorMode: 'in_my_town', creatorSettings: { townName: 'Pine Town', townEvent: 'purple rain' } }]);
assert.equal(townQueue[0].creatorMode, 'in_my_town');
assert.equal(townQueue[0].creatorSettings.townName, 'Pine Town');
assert.equal(townQueue[0].creatorSettings.townEvent, 'purple rain');
const videoQueue = normalizeSocialQueue([{ id: 'video-job', title: 'AI video', platforms: ['youtube'], aiVideo: { provider: 'runway', taskId: 'task-1', status: 'PENDING', promptText: 'A new scene', duration: 5, ratio: '720:1280', estimatedCostUsd: 0.6, apiKey: 'must-not-persist' } }]);
assert.equal(videoQueue[0].aiVideo.provider, 'runway');
assert.equal(videoQueue[0].aiVideo.taskId, 'task-1');
assert.equal(videoQueue[0].aiVideo.estimatedCostUsd, 0.6);
assert.equal('apiKey' in videoQueue[0].aiVideo, false);
const clips = normalizeSocialClips({ clips: [{ title: 'Short 1', video_url: 'https://cdn.example/1.mp4', duration_seconds: 20 }] });
assert.equal(clips[0].index, 0);
assert.equal(clips[0].duration, 20);

const publish = buildSocialPublishArgs({ jobId: 'job-1', clipIndex: 0, platforms: ['youtube', 'instagram', 'youtube'], title: 'Short', description: 'Caption', scheduledLocal: '2030-01-01T12:00', timezone: 'Europe/Istanbul', now: new Date('2029-01-01T00:00:00Z') });
assert.deepEqual(publish.platforms, ['youtube', 'instagram']);
assert.equal(publish.timezone, 'Europe/Istanbul');
assert.ok(publish.scheduled_date.endsWith('Z'));
assert.throws(() => buildSocialPublishArgs({ jobId: '', clipIndex: 0, platforms: ['youtube'] }), /iş/);
assert.throws(() => buildSocialPublishArgs({ jobId: 'job-1', clipIndex: 0, platforms: ['bad'] }), /platform/);
assert.throws(() => buildSocialPublishArgs({ jobId: 'job-1', clipIndex: 0, platforms: ['youtube'], scheduledLocal: '2020-01-01T12:00', now: new Date('2025-01-01T00:00:00Z') }), /gelecekte/);

const whatIfPrompt = buildCreatorPrompt({ mode: 'what_if', whatIfThing: 'money', whatIfInterval: 'every hour', language: 'English' });
assert.match(whatIfPrompt, /What if money doubled every hour\?/);
assert.match(whatIfPrompt, /1x, 2x, 4x, 8x, 16x/);
assert.match(whatIfPrompt, /Do NOT add "in my town"/);
assert.doesNotMatch(whatIfPrompt, /IN MY TOWN ONLY/);
const townPrompt = buildCreatorPrompt({ mode: 'in_my_town', townName: 'My Town', townEvent: 'all street lights turn purple' });
assert.match(townPrompt, /IN MY TOWN ONLY/);
assert.match(townPrompt, /all street lights turn purple/);
assert.match(townPrompt, /Do NOT start with a "What if" question/);
assert.doesNotMatch(townPrompt, /doubled every/);
assert.equal(normalizeCreatorMode('clips'), 'clips');
assert.equal(normalizeCreatorMode('unknown'), 'what_if');
assert.throws(() => buildCreatorPrompt({ mode: 'clips' }), /Clips modu/);
const clipsDraft = normalizeSocialQueue([{ id: 'clips', creatorMode: 'clips', topic: 'Clips: source video processing' }]);
assert.equal(clipsDraft[0].creatorMode, 'clips');
assert.match(clipsDraft[0].topic, /^Clips:/);

const multiShot = buildRunwayMultiShotPayload({ storyPrompt: 'A robot explores a neon city.', ratio: '720:1280', duration: 15, audio: true });
assert.equal(multiShot.endpoint, '/recipes/multi_shot_video');
assert.equal(multiShot.payload.version, '2026-06');
assert.equal(multiShot.payload.mode, 'auto');
assert.equal(multiShot.payload.duration, 15);
assert.equal(multiShot.payload.audio, true);
assert.equal(multiShot.cost.credits, 195);
assert.equal(multiShot.cost.usd, 1.95);
assert.equal(estimateRunwayMultiShotCost(10, '960:960').usd, 1.3);
assert.throws(() => estimateRunwayMultiShotCost(8), /5, 10 veya 15/);
const multiShotPrompt = buildSocialMultiShotPrompt({ topic: 'Bir robotun şehirde kaybolması', title: 'Kayıp Robot', hook: 'Bu ışık nereden geliyor?', scenes: [{visual:'Yağmurlu neon sokak'},{visual:'Robot ışığı takip eder'}] });
const whatIfVideoPrompt = buildSocialMultiShotPrompt({ creatorMode: 'what_if', topic: 'What if money doubled every hour?', title: 'Money Doubles', scenes: [{ visual: 'Coins multiply on a table' }] });
assert.match(whatIfVideoPrompt, /FORMAT LOCK: WHAT IF ONLY/);
assert.match(whatIfVideoPrompt, /powers-of-two progression/);
const townVideoPrompt = buildSocialMultiShotPrompt({ creatorMode: 'in_my_town', topic: 'In My Town: purple rain', title: 'Purple Rain', scenes: [{ visual: 'A fictional town square under purple rain' }] });
assert.match(townVideoPrompt, /FORMAT LOCK: IN MY TOWN ONLY/);
assert.match(townVideoPrompt, /not a What If scenario/);

assert.match(multiShotPrompt, /3–5/);
assert.match(multiShotPrompt, /Yağmurlu neon sokak/);
assert.throws(() => buildSocialMultiShotPrompt({ topic: '' }), /konusunu/);
const pipeline = normalizeSocialAutomationState({ stage: 'runway_polling', duration: 15, ratio: '960:960', estimatedCostUsd: 1.95, runwayPollCount: 999, apiKey: 'must-not-persist' });
assert.equal(pipeline.stage, 'runway_polling');
assert.equal(pipeline.duration, 15);
assert.equal(pipeline.ratio, '960:960');
assert.equal(pipeline.runwayPollCount, 90);
assert.equal('apiKey' in pipeline, false);
const queuedMultiShot = normalizeSocialQueue([{
  id: 'multi-shot-15s',
  title: 'Kısa test',
  aiVideo: { generator: 'multi_shot_video', ratio: '960:960', duration: 15, promptText: 'x'.repeat(1400) }
}])[0];
assert.equal(queuedMultiShot.aiVideo.duration, 15);
assert.equal(queuedMultiShot.aiVideo.ratio, '960:960');
assert.equal(queuedMultiShot.aiVideo.promptText.length, 1400);

assert.equal(isSocialAutomationPolling(pipeline.stage), true);
assert.equal(isSocialAutomationPolling('awaiting_clip_approval'), false);
assert.ok(getSocialAutomationPollDelay('openshorts_polling', 20) <= 30000);

console.log('Creator mode and Social Media planner tests passed: prompt generation, queue validation, local planned/ready metadata, date validation, caption-copy source, clip normalization and publishing guard contracts.');
