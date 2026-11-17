import assert from 'node:assert/strict';
import {
  RUNWAY_API_VERSION, RUNWAY_VIDEO_MODEL, RUNWAY_RATIOS,
  estimateRunwayVideoCost, validateRunwayImageDataUrl, buildRunwayVideoPayload,
  createRunwayVideo, getRunwayVideoTask
} from '../src/runway-video.js';

const fiveSeconds = estimateRunwayVideoCost(5);
assert.equal(fiveSeconds.credits, 60);
assert.equal(fiveSeconds.usd, 0.6);
assert.equal(estimateRunwayVideoCost(8).usd, 0.96);
assert.equal(estimateRunwayVideoCost(10).usd, 1.2);
assert.throws(() => estimateRunwayVideoCost(1), /2–10/);
assert.throws(() => estimateRunwayVideoCost(11), /2–10/);

assert.throws(() => buildRunwayVideoPayload({ promptText: '', duration: 5 }), /açıklaması/);
assert.throws(() => buildRunwayVideoPayload({ promptText: 'test', ratio: '960:960', duration: 5 }), /oranı/);
assert.throws(() => buildRunwayVideoPayload({ promptText: 'test', duration: 11 }), /2–10/);
assert.deepEqual(RUNWAY_RATIOS, ['720:1280', '1280:720']);
const imageDataUrl = 'data:image/png;base64,aGVsbG8=';
assert.equal(validateRunwayImageDataUrl(imageDataUrl), imageDataUrl);
assert.throws(() => validateRunwayImageDataUrl('https://example.com/photo.png'), /PNG/);
const textPayload = buildRunwayVideoPayload({ promptText: 'A paper boat crosses a neon city canal in the rain', duration: 5, ratio: '720:1280' });
assert.equal(textPayload.endpoint, '/text_to_video');
assert.equal(textPayload.payload.model, RUNWAY_VIDEO_MODEL);
assert.equal(textPayload.payload.duration, 5);
const imagePayload = buildRunwayVideoPayload({ promptText: 'Animate gentle wind and a slow camera push-in', duration: 8, ratio: '1280:720', imageDataUrl });
assert.equal(imagePayload.endpoint, '/image_to_video');
assert.equal(imagePayload.payload.position, 'first');
assert.equal(imagePayload.payload.promptImage, imageDataUrl);

const calls = [];
const key = 'rw_test_key_123456789';
const taskId = '123e4567-e89b-42d3-a456-426614174000';
const fakeFetch = async (url, options = {}) => {
  calls.push({ url, options });
  if (options.method === 'POST') return { ok: true, status: 200, text: async () => JSON.stringify({ id: taskId, status: 'PENDING', estimatedCost: { credits: 60 } }) };
  return { ok: true, status: 200, text: async () => JSON.stringify({ id: taskId, status: 'SUCCEEDED', output: ['https://dnznrvs05pmza.cloudfront.net/output.mp4?_jwt=temp'], cost: { credits: 60 } }) };
};
const created = await createRunwayVideo({ apiKey: key, promptText: 'An original cinematic paper boat floating on a rainy canal', ratio: '720:1280', duration: 5, fetchImpl: fakeFetch });
assert.equal(created.taskId, taskId);
assert.equal(created.cost.usd, 0.6);
assert.equal(calls[0].url, 'https://api.dev.runwayml.com/v1/text_to_video');
assert.equal(calls[0].options.headers.Authorization, `Bearer ${key}`);
assert.equal(calls[0].options.headers['X-Runway-Version'], RUNWAY_API_VERSION);
assert.equal(JSON.parse(calls[0].options.body).model, RUNWAY_VIDEO_MODEL);

await createRunwayVideo({ apiKey: key, promptText: 'Animate this still image slowly', ratio: '1280:720', duration: 8, imageDataUrl, fetchImpl: fakeFetch });
assert.equal(calls[1].url, 'https://api.dev.runwayml.com/v1/image_to_video');
assert.equal(JSON.parse(calls[1].options.body).promptImage, imageDataUrl);
assert.equal(JSON.parse(calls[1].options.body).position, 'first');

const finished = await getRunwayVideoTask({ apiKey: key, taskId, fetchImpl: fakeFetch });
assert.equal(finished.status, 'SUCCEEDED');
assert.equal(finished.videoUrl, 'https://dnznrvs05pmza.cloudfront.net/output.mp4?_jwt=temp');
await assert.rejects(getRunwayVideoTask({ apiKey: key, taskId: 'not-a-task-id', fetchImpl: fakeFetch }), /kimliği/);

const failedFetch = async () => ({ ok: false, status: 401, text: async () => JSON.stringify({ error: `Invalid token ${key}` }) });
await assert.rejects(createRunwayVideo({ apiKey: key, promptText: 'test video', fetchImpl: failedFetch }), error => !error.message.includes(key) && /API anahtarı gizlendi/.test(error.message));
console.log('Runway video tests passed: text/image requests, cost estimate, polling, temporary MP4 output and secret redaction.');
