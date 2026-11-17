import { normalizeSocialAutomationState } from './social-studio-automation.js';
export const SOCIAL_PLATFORMS = Object.freeze([
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram Reels' },
  { id: 'youtube', label: 'YouTube Shorts' }
]);

const PLATFORM_IDS = new Set(SOCIAL_PLATFORMS.map((platform) => platform.id));
const RUNWAY_RATIOS_SAFE = new Set(['720:1280', '1280:720', '960:960']);
const text = (value, max = 4000) => String(value ?? '').trim().slice(0, max);

export function buildSocialPrompt({ topic, platforms, tone = 'energetic', language = 'Turkish', duration = 30, audience = '' }) {
  const cleanTopic = text(topic, 1200);
  const cleanPlatforms = [...new Set((Array.isArray(platforms) ? platforms : []).filter((id) => PLATFORM_IDS.has(id)))];
  if (!cleanTopic) throw new Error('Video fikrini veya konusunu yaz.');
  if (!cleanPlatforms.length) throw new Error('En az bir yayın platformu seç.');
  const seconds = Math.max(15, Math.min(90, Number(duration) || 30));
  return [
    'You are a careful short-form video producer. Create an original, platform-ready short-video package.',
    `Language: ${text(language, 40) || 'Turkish'}. Tone: ${text(tone, 50)}. Target duration: ${seconds} seconds.`,
    `Platforms: ${cleanPlatforms.join(', ')}. Audience: ${text(audience, 180) || 'general audience'}.`,
    `Idea: ${cleanTopic}`,
    'Return ONLY valid JSON with this shape: {"title":"...","hook":"...","voiceover":"...","scenes":[{"time":"0-4s","visual":"...","narration":"..."}],"caption":"...","hashtags":["#..."],"cta":"..."}.',
    'Use 4-7 concise scenes, an honest hook, a clear ending, and platform-appropriate wording.',
    'Do not invent statistics, endorsements, facts, testimonials, or product claims. Do not impersonate a real person or imitate a living creator.',
    'Do not include copyrighted lyrics, unlicensed footage instructions, private personal details, or requests to reveal someone\'s identity.',
    'Clearly disclose sponsorship or advertising when the idea describes a promotion. Avoid misleading engagement bait.'
  ].join('\n');
}

export function normalizeSocialDraft(raw, fallbackTopic = '') {
  const source = text(raw, 12000);
  let parsed = null;
  const candidate = source.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { parsed = JSON.parse(candidate); } catch { parsed = null; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      title: text(fallbackTopic, 100) || 'Yeni kısa video',
      hook: '',
      voiceover: source,
      scenes: [],
      caption: '',
      hashtags: [],
      cta: '',
      rawOutput: source
    };
  }
  const scenes = Array.isArray(parsed.scenes) ? parsed.scenes.slice(0, 10).map((scene, index) => ({
    time: text(scene?.time, 24) || `Sahne ${index + 1}`,
    visual: text(scene?.visual, 500),
    narration: text(scene?.narration, 500)
  })) : [];
  const tags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags.slice(0, 15).map((tag) => {
      const value = text(tag, 60).replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
      return value ? `#${value}` : '';
    }).filter(Boolean)
    : text(parsed.hashtags, 500).split(/\s+/).filter((tag) => tag.startsWith('#')).slice(0, 15);
  return {
    title: text(parsed.title, 100) || text(fallbackTopic, 100) || 'Yeni kısa video',
    hook: text(parsed.hook, 300),
    voiceover: text(parsed.voiceover, 6000),
    scenes,
    caption: text(parsed.caption, 1200),
    hashtags: tags,
    cta: text(parsed.cta, 240),
    rawOutput: ''
  };
}

export function normalizeSocialQueue(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).filter((item) => item && typeof item === 'object').map((item) => ({
    id: text(item.id, 80) || `social-${Date.now()}`,
    title: text(item.title, 100) || 'Yeni kısa video',
    topic: text(item.topic, 1200),
    creatorMode: ['what_if', 'in_my_town', 'clips'].includes(item.creatorMode) ? item.creatorMode : 'what_if',
    creatorSettings: {
      whatIfThing: text(item.creatorSettings?.whatIfThing, 100) || 'money',
      whatIfInterval: ['every second', 'every minute', 'every 10 minutes', 'every hour', 'every day', 'every week'].includes(item.creatorSettings?.whatIfInterval) ? item.creatorSettings.whatIfInterval : 'every hour',
      townName: text(item.creatorSettings?.townName, 80) || 'My Town',
      townEvent: text(item.creatorSettings?.townEvent, 400)
    },
    hook: text(item.hook, 300),
    voiceover: text(item.voiceover, 6000),
    scenes: Array.isArray(item.scenes) ? item.scenes.slice(0, 10) : [],
    caption: text(item.caption, 1200),
    hashtags: Array.isArray(item.hashtags) ? item.hashtags.slice(0, 15).map((tag) => text(tag, 60)) : [],
    cta: text(item.cta, 240),
    platforms: Array.isArray(item.platforms) ? [...new Set(item.platforms.filter((id) => PLATFORM_IDS.has(id)))] : [],
    status: text(item.status, 40) || 'script_ready',
    sourceUrl: text(item.sourceUrl, 2048),
    jobId: text(item.jobId, 160),
    clips: Array.isArray(item.clips) ? item.clips.slice(0, 30) : [],
    pipeline: normalizeSocialAutomationState(item.pipeline),
    aiVideo: item.aiVideo && typeof item.aiVideo === 'object' ? {
      provider: text(item.aiVideo.provider, 40) || 'runway',
      generator: text(item.aiVideo.generator, 50),
      audio: item.aiVideo.audio === true,
      model: text(item.aiVideo.model, 40) || 'gen4.5',
      taskId: text(item.aiVideo.taskId, 100),
      status: text(item.aiVideo.status, 30).toUpperCase(),
      promptText: text(item.aiVideo.promptText, item.aiVideo.generator === 'multi_shot_video' ? 2500 : 1000),
      ratio: RUNWAY_RATIOS_SAFE.has(text(item.aiVideo.ratio, 20)) ? text(item.aiVideo.ratio, 20) : '720:1280',
      duration: item.aiVideo.generator === 'multi_shot_video'
        ? ([5, 10, 15].includes(Number(item.aiVideo.duration)) ? Number(item.aiVideo.duration) : 10)
        : Math.max(2, Math.min(10, Number(item.aiVideo.duration) || 5)),
      estimatedCostUsd: Number.isFinite(Number(item.aiVideo.estimatedCostUsd)) ? Math.max(0, Number(item.aiVideo.estimatedCostUsd)) : null,
      videoUrl: text(item.aiVideo.videoUrl, 2048),
      failure: text(item.aiVideo.failure, 500),
      actualCostCredits: Number.isFinite(Number(item.aiVideo.actualCostCredits)) ? Math.max(0, Number(item.aiVideo.actualCostCredits)) : null,
      createdAt: text(item.aiVideo.createdAt, 40)
    } : null,
    publishRequests: Array.isArray(item.publishRequests) ? item.publishRequests.slice(0, 30) : [],
    createdAt: text(item.createdAt, 40) || new Date().toISOString(),
    updatedAt: text(item.updatedAt, 40) || new Date().toISOString()
  }));
}

export function normalizeSocialClips(value) {
  const clips = Array.isArray(value) ? value : (Array.isArray(value?.clips) ? value.clips : []);
  return clips.slice(0, 30).map((clip, index) => ({
    index,
    title: text(clip?.title || clip?.youtube_title, 160) || `Klip ${index + 1}`,
    videoUrl: text(clip?.video_url || clip?.download_url || clip?.url, 2048),
    duration: Number.isFinite(Number(clip?.duration_seconds)) ? Math.max(0, Number(clip.duration_seconds)) : null,
    description: text(clip?.description, 1200)
  }));
}

export function buildSocialPublishArgs({ jobId, clipIndex, platforms, title, description, scheduledLocal, timezone, now = new Date() }) {
  const cleanJobId = text(jobId, 160);
  const index = Number(clipIndex);
  const selectedPlatforms = [...new Set((Array.isArray(platforms) ? platforms : []).filter((id) => PLATFORM_IDS.has(id)))];
  if (!cleanJobId) throw new Error('Önce tamamlanmış bir video işi seç.');
  if (!Number.isInteger(index) || index < 0) throw new Error('Yayınlanacak klip seçilmedi.');
  if (!selectedPlatforms.length) throw new Error('En az bir platform seç.');
  const args = {
    job_id: cleanJobId,
    clip_index: index,
    platforms: selectedPlatforms,
    title: text(title, 100),
    description: text(description, 1200)
  };
  if (scheduledLocal) {
    const date = new Date(scheduledLocal);
    if (!Number.isFinite(date.getTime())) throw new Error('Zamanlama tarihi geçerli değil.');
    if (date.getTime() <= now.getTime()) throw new Error('Zamanlama için gelecekte bir tarih ve saat seç.');
    args.scheduled_date = date.toISOString();
    args.timezone = text(timezone, 80) || 'UTC';
  }
  return args;
}
