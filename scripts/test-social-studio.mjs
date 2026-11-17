import assert from 'node:assert/strict';
import {
  SOCIAL_PLATFORMS, buildSocialPrompt, normalizeSocialDraft,
  normalizeSocialQueue, normalizeSocialClips, buildSocialPublishArgs
} from '../src/social-studio-core.js';

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
console.log('Social Studio tests passed: prompt generation, safe JSON normalization, queue validation, clip normalization and guarded publishing schedule.');
