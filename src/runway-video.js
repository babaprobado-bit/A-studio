const API_BASE = 'https://api.dev.runwayml.com/v1';
export const RUNWAY_API_VERSION = '2024-11-06';
export const RUNWAY_VIDEO_MODEL = 'gen4.5';
export const RUNWAY_USD_PER_SECOND = 0.12;
export const RUNWAY_CREDITS_PER_SECOND = 12;
export const RUNWAY_RATIOS = Object.freeze(['720:1280', '1280:720']);

const MAX_PROMPT_CHARS = 1000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const cleanText = (value, max = 1200) => String(value ?? '').trim().slice(0, max);

export function estimateRunwayVideoCost(durationSeconds) {
  const duration = Number(durationSeconds);
  if (!Number.isInteger(duration) || duration < 2 || duration > 10) {
    throw new Error('Runway Gen-4.5 video süresi 2–10 saniye arasında tam sayı olmalı.');
  }
  const credits = duration * RUNWAY_CREDITS_PER_SECOND;
  return { duration, credits, usd: Number((credits / 100).toFixed(2)), usdPerSecond: RUNWAY_USD_PER_SECOND };
}

export function validateRunwayImageDataUrl(value) {
  const image = String(value ?? '').trim();
  if (!image) return '';
  const match = image.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Görsel PNG, JPG veya WebP biçiminde olmalı.');
  const encoded = match[2];
  const estimatedBytes = Math.floor((encoded.length * 3) / 4) - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
  if (estimatedBytes <= 0 || estimatedBytes > MAX_IMAGE_BYTES) throw new Error('Referans görsel en fazla 4 MB olabilir.');
  return image;
}

export function buildRunwayVideoPayload({ promptText, ratio = '720:1280', duration = 5, imageDataUrl = '' }) {
  const prompt = cleanText(promptText, MAX_PROMPT_CHARS);
  if (!prompt) throw new Error('Video için bir sahne açıklaması yaz.');
  if (String(promptText ?? '').trim().length > MAX_PROMPT_CHARS) throw new Error('Video açıklaması en fazla 1000 karakter olabilir.');
  if (!RUNWAY_RATIOS.includes(ratio)) throw new Error('Desteklenmeyen video oranı.');
  const cost = estimateRunwayVideoCost(duration);
  const image = validateRunwayImageDataUrl(imageDataUrl);
  const payload = { model: RUNWAY_VIDEO_MODEL, promptText: prompt, ratio, duration: cost.duration, outputFormat: 'mp4' };
  if (image) {
    payload.promptImage = image;
    payload.position = 'first';
  }
  return { endpoint: image ? '/image_to_video' : '/text_to_video', payload, cost };
}


export const RUNWAY_MULTI_SHOT_VERSION = '2026-06';
export const RUNWAY_MULTI_SHOT_CREDITS_PER_SECOND = 13;
export const RUNWAY_MULTI_SHOT_RATIOS = Object.freeze(['720:1280', '1280:720', '960:960']);

export function estimateRunwayMultiShotCost(durationSeconds, ratio = '720:1280') {
  const duration = Number(durationSeconds);
  if (![5, 10, 15].includes(duration)) throw new Error('Runway Multi-Shot video süresi 5, 10 veya 15 saniye olmalı.');
  if (!RUNWAY_MULTI_SHOT_RATIOS.includes(ratio)) throw new Error('Runway Multi-Shot için desteklenmeyen kadraj.');
  const credits = duration * RUNWAY_MULTI_SHOT_CREDITS_PER_SECOND;
  return { duration, credits, usd: Number((credits / 100).toFixed(2)), creditsPerSecond: RUNWAY_MULTI_SHOT_CREDITS_PER_SECOND };
}

export function buildRunwayMultiShotPayload({ storyPrompt, ratio = '720:1280', duration = 10, audio = true }) {
  const prompt = cleanText(storyPrompt, 2500);
  if (!prompt) throw new Error('Çok sahneli video için hikâye açıklaması boş olamaz.');
  if (String(storyPrompt ?? '').trim().length > 2500) throw new Error('Çok sahneli video açıklaması en fazla 2500 karakter olabilir.');
  const cost = estimateRunwayMultiShotCost(duration, ratio);
  return { endpoint: '/recipes/multi_shot_video', payload: { version: RUNWAY_MULTI_SHOT_VERSION, mode: 'auto', prompt, ratio, duration: cost.duration, audio: Boolean(audio) }, cost };
}

export async function createRunwayMultiShotVideo({ apiKey, storyPrompt, ratio = '720:1280', duration = 10, audio = true, fetchImpl = fetch }) {
  const built = buildRunwayMultiShotPayload({ storyPrompt, ratio, duration, audio });
  const result = await runwayRequest({ apiKey, path: built.endpoint, method: 'POST', body: built.payload, fetchImpl });
  const taskId = cleanText(result?.id, 100);
  if (!taskId) throw new Error(redact(result?.error || 'Runway Multi-Shot yanıtında üretim işi kimliği bulunamadı.', apiKey));
  return { taskId, status: cleanText(result?.status || 'PENDING', 30).toUpperCase(), model: 'multi_shot_video', cost: built.cost, audio: Boolean(audio) };
}

function redact(value, key) {
  let message = String(value || 'Runway video isteği başarısız oldu.');
  if (key) message = message.split(key).join('[API anahtarı gizlendi]');
  return message.replace(/Bearer\s+[^\s"']+/gi, 'Bearer [gizlendi]').slice(0, 500);
}

async function runwayRequest({ apiKey, path, method = 'GET', body, fetchImpl = fetch }) {
  const key = cleanText(apiKey, 500);
  if (!key || key.length < 8) throw new Error('Runway API anahtarı ayarlanmamış.');
  let response;
  try {
    response = await fetchImpl(API_BASE + path, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
        'X-Runway-Version': RUNWAY_API_VERSION,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(45000)
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new Error('Runway isteği zaman aşımına uğradı. Görev başlamış olabilir; tekrar üretmeden önce görev durumunu kontrol et.');
    if (error instanceof TypeError) throw new Error('Runway API bağlantısı engellendi veya kurulamadı. Android APK için CapacitorHttp etkin; web önizlemesinde CORS kısıtlaması olabilir.');
    throw error;
  }
  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { throw new Error('Runway geçerli JSON yanıtı döndürmedi.'); }
  if (!response.ok) throw new Error(redact(data?.error || data?.message || data?.detail || `HTTP ${response.status}`, key));
  return data;
}

export async function createRunwayVideo({ apiKey, promptText, ratio = '720:1280', duration = 5, imageDataUrl = '', fetchImpl = fetch }) {
  const { endpoint, payload, cost } = buildRunwayVideoPayload({ promptText, ratio, duration, imageDataUrl });
  const result = await runwayRequest({ apiKey, path: endpoint, method: 'POST', body: payload, fetchImpl });
  const taskId = cleanText(result?.id, 100);
  if (!taskId) throw new Error(redact(result?.error || 'Runway yanıtında üretim işi kimliği bulunamadı.', apiKey));
  return {
    taskId,
    status: cleanText(result?.status || 'PENDING', 30).toUpperCase(),
    model: RUNWAY_VIDEO_MODEL,
    cost,
    providerEstimateCredits: Number.isFinite(Number(result?.estimatedCost?.credits)) ? Number(result.estimatedCost.credits) : null
  };
}

export async function getRunwayVideoTask({ apiKey, taskId, fetchImpl = fetch }) {
  const id = cleanText(taskId, 100);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Runway üretim işi kimliği geçersiz.');
  }
  const result = await runwayRequest({ apiKey, path: `/tasks/${encodeURIComponent(id)}`, fetchImpl });
  const status = cleanText(result?.status || 'UNKNOWN', 30).toUpperCase();
  const output = Array.isArray(result?.output) ? result.output : [];
  let videoUrl = '';
  for (const candidate of output) {
    try {
      const url = new URL(String(candidate));
      if (url.protocol === 'https:' && /\.mp4(?:$|\?)/i.test(url.href)) { videoUrl = url.href; break; }
    } catch {}
  }
  return {
    taskId: id,
    status,
    videoUrl,
    failure: cleanText(result?.failure || result?.error, 500),
    costCredits: Number.isFinite(Number(result?.cost?.credits)) ? Number(result.cost.credits) : null
  };
}

export const RUNWAY_VIDEO_LIMITS = Object.freeze({ maxPromptChars: MAX_PROMPT_CHARS, maxImageBytes: MAX_IMAGE_BYTES, minDuration: 2, maxDuration: 10 });
