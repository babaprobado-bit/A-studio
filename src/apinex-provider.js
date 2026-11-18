export const APINEX_API_BASE_URL = 'https://api.apinex.bond/v1';
export const APINEX_CHAT_ENDPOINT = APINEX_API_BASE_URL + '/chat/completions';
export const APINEX_MODELS_ENDPOINT = APINEX_API_BASE_URL + '/models';
export const APINEX_DEFAULT_FREE_MODEL = 'free/gemini-3.8-flash';

const FREE_MODEL_ID = /^free\/[a-z0-9][a-z0-9._-]{0,130}$/i;

export function isFreeApinexModelId(value) {
  const id = String(value ?? '').trim();
  return id.length <= 140 && FREE_MODEL_ID.test(id);
}

export function extractApinexFreeModels(payload) {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
  const seen = new Set(), ids = [];
  for (const item of list) {
    const id = typeof item === 'string' ? item : item?.id;
    if (!isFreeApinexModelId(id)) continue;
    const normalized = String(id).trim(), key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key); ids.push(normalized);
    if (ids.length >= 100) break;
  }
  return ids.sort((a, b) => a.localeCompare(b));
}
