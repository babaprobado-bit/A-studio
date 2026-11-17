const STAGES = new Set(['runway_submitting','runway_polling','awaiting_clip_approval','openshorts_submitting','openshorts_polling','review','needs_attention','failed','cancelled']);
const RATIOS = new Set(['720:1280','1280:720','960:960']);
const boundedInt = (value, max = 100) => { const n = Number(value); return Number.isInteger(n) ? Math.max(0, Math.min(max, n)) : 0; };

export function normalizeSocialAutomationState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const rawStage = String(value.stage || '');
  return {
    mode: 'full', stage: STAGES.has(rawStage) ? rawStage : 'needs_attention',
    storyPrompt: String(value.storyPrompt || '').trim().slice(0, 2500),
    duration: [5,10,15].includes(Number(value.duration)) ? Number(value.duration) : 10,
    ratio: RATIOS.has(String(value.ratio || '')) ? String(value.ratio) : '720:1280',
    estimatedCostUsd: Number.isFinite(Number(value.estimatedCostUsd)) ? Math.max(0, Number(value.estimatedCostUsd)) : null,
    runwayPollCount: boundedInt(value.runwayPollCount, 90), openshortsPollCount: boundedInt(value.openshortsPollCount, 90),
    pollErrors: boundedInt(value.pollErrors, 5), lastPolledAt: String(value.lastPolledAt || '').slice(0,40),
    startedAt: String(value.startedAt || '').slice(0,40), updatedAt: String(value.updatedAt || '').slice(0,40),
    lastError: String(value.lastError || '').slice(0,400)
  };
}

export function buildSocialMultiShotPrompt(draft) {
  const topic = String(draft && draft.topic || '').trim().slice(0, 1200);
  if (!topic) throw new Error('Tam otomasyon için önce video konusunu yaz.');
  const scenes = Array.isArray(draft && draft.scenes) ? draft.scenes.slice(0,5).map((scene,index) => {
    const visual = String(scene && scene.visual || '').trim().slice(0,350);
    const narration = String(scene && scene.narration || '').trim().slice(0,180);
    return visual ? ('Shot ' + (index + 1) + ': ' + visual + (narration ? ' Narration context: ' + narration : '')) : '';
  }).filter(Boolean) : [];
  return [
    'Create an original multi-shot short-form video from this story.',
    'Use 3–5 visually distinct shots with clear cuts, consistent subject and style, and a strong visual opening and ending.',
    'Keep the story coherent and suitable for a broad general audience. Avoid private information, impersonation, unsupported claims, copyrighted characters, and logos.',
    'Do not burn subtitles, captions, hashtags, UI, or title cards into the frames; captions are added in the later editing step.',
    'Generate natural scene audio. The written voiceover remains an editable script and is not automatically spoken by this recipe.',
    'Topic: ' + topic,
    'Title: ' + String(draft && draft.title || '').trim().slice(0,100),
    'Opening hook: ' + String(draft && draft.hook || '').trim().slice(0,300),
    scenes.length ? 'Scene plan:\n' + scenes.join('\n') : '',
    'Voiceover context (not on-screen text): ' + String(draft && draft.voiceover || '').trim().slice(0,900)
  ].filter(Boolean).join('\n\n').slice(0,2500);
}

export function isSocialAutomationPolling(stage) { return stage === 'runway_polling' || stage === 'openshorts_polling'; }
export function getSocialAutomationPollDelay(stage, pollCount = 0) {
  const base = stage === 'openshorts_polling' ? 12000 : 10000;
  const count = boundedInt(pollCount,90);
  return Math.min(30000, base * (2 ** Math.min(2, Math.floor(count / 10))));
}
export const SOCIAL_AUTOMATION_STAGES = Object.freeze([...STAGES]);