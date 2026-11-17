import assert from 'node:assert/strict';
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

console.log('Social Studio tests passed: prompt generation, safe JSON normalization, queue validation, clip normalization and guarded publishing schedule.');
