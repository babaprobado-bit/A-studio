export const CREATOR_MODES = Object.freeze({ WHAT_IF: 'what_if', IN_MY_TOWN: 'in_my_town', CLIPS: 'clips' });
const VALID_MODES = new Set(Object.values(CREATOR_MODES));
const INTERVALS = new Set(['every second', 'every minute', 'every 10 minutes', 'every hour', 'every day', 'every week']);
const clean = (value, limit = 500) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, limit);
export function normalizeCreatorMode(value) { return VALID_MODES.has(value) ? value : CREATOR_MODES.WHAT_IF; }
export function buildCreatorPrompt(options = {}) {
  const mode = normalizeCreatorMode(options.mode);
  if (mode === CREATOR_MODES.CLIPS) throw new Error('Clips modu senaryo üretmez; kaynak video işleme akışını kullanır.');
  const language = clean(options.language || 'English', 40);
  const duration = Math.max(15, Math.min(90, Number(options.duration) || 30));
  const tone = clean(options.tone || 'energetic', 50);
  const audience = clean(options.audience || 'general short-form video viewers', 120);
  let formatInstructions = '';
  let topic = '';
  if (mode === CREATOR_MODES.WHAT_IF) {
    const thing = clean(options.whatIfThing || 'money', 100) || 'money';
    const rawInterval = clean(options.whatIfInterval || 'every hour', 40);
    const interval = INTERVALS.has(rawInterval) ? rawInterval : 'every hour';
    topic = 'What if ' + thing + ' doubled ' + interval + '?';
    formatInstructions = [
      'FORMAT: WHAT IF ONLY. This is a standalone hypothetical scenario video.',
      'Use this exact premise as the central question: "' + topic + '"',
      'Do NOT add "in my town", "in my city", or a town-based premise. Do NOT turn this into the In My Town format.',
      'Show an escalating sequence with mathematically correct doubling: 1x, 2x, 4x, 8x, 16x. Each stage must match the selected interval.',
      'Explain the consequences clearly, keep cause and effect understandable, and end with a strong payoff.'
    ].join('\n');
  } else {
    const townName = clean(options.townName || 'My Town', 80) || 'My Town';
    const townEvent = clean(options.townEvent || '', 400);
    topic = townEvent ? 'In My Town (' + townName + '): ' + townEvent : 'In My Town (' + townName + '): invent a fresh unusual town scenario';
    formatInstructions = [
      'FORMAT: IN MY TOWN ONLY. This is a standalone town-life / town-event short video.',
      'Use a fictional town named "' + townName + '".',
      townEvent ? 'Build the video around this town event: "' + townEvent + '"' : 'Invent one original, visually clear, funny or surprising event that happens in this fictional town.',
      'Do NOT start with a "What if" question. Do NOT use a doubling-every-interval mechanic. Do NOT merge this with the What If format.',
      'Keep the town layout, visual style, and recurring characters consistent across scenes. Never include a real address or personal identifying details.'
    ].join('\n');
  }
  return [
    'Create a high-retention short-form video script for AI Studio Creator Studio.',
    formatInstructions,
    'TOPIC: ' + topic,
    'LANGUAGE: ' + language + '. TARGET DURATION: ' + duration + ' seconds. TONE: ' + tone + '. AUDIENCE: ' + audience + '.',
    'Create a strong opening hook, a clear progression, concise narration, and a satisfying ending. Provide 4-7 chronological scenes with concrete visual directions usable by a video-generation model.',
    'Return ONLY valid JSON with this shape: {"title":"...","hook":"...","voiceover":"...","scenes":[{"time":"0-5s","visual":"...","narration":"..."}],"caption":"...","hashtags":["#..."],"cta":"..."}.',
    'Do not wrap the JSON in Markdown fences. Do not invent statistics or present fiction as real news.'
  ].join('\n\n');
}
