export const OPENROUTER_CHAT_MODEL_LIMIT=4;
const MODEL_ID_PATTERN=/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:-]*$/i;
export function isValidOpenRouterModelId(value){const id=String(value??'').trim();return id.length>0&&id.length<=140&&MODEL_ID_PATTERN.test(id);}
export function isFreeOpenRouterModelId(value){const id=String(value??'').trim().toLowerCase();return isValidOpenRouterModelId(id)&&(id==='openrouter/free'||id.endsWith(':free'));}
export function isZeroPriceOpenRouterModel(model){
  if(!model||!isFreeOpenRouterModelId(model.id))return false;
  const prompt=Number(model.pricing?.prompt),completion=Number(model.pricing?.completion);
  return Number.isFinite(prompt)&&Number.isFinite(completion)&&prompt===0&&completion===0;
}
export function normalizeOpenRouterModelSelection(values,limit=OPENROUTER_CHAT_MODEL_LIMIT){
  const max=Math.max(1,Math.min(OPENROUTER_CHAT_MODEL_LIMIT,Number(limit)||OPENROUTER_CHAT_MODEL_LIMIT));
  const out=[],seen=new Set();
  if(!Array.isArray(values))return out;
  for(const raw of values){const id=String(raw??'').trim(),key=id.toLowerCase();if(!isFreeOpenRouterModelId(id)||seen.has(key))continue;seen.add(key);out.push(id);if(out.length>=max)break;}
  return out;
}
export async function runOpenRouterMultiModelCalls({modelIds,prompt,history=[],callModel}){
  if(typeof callModel!=='function')throw new TypeError('callModel must be a function.');
  const models=normalizeOpenRouterModelSelection(modelIds);
  if(models.length<2)throw new Error('En az iki ücretsiz OpenRouter modeli seçilmelidir.');
  return Promise.all(models.map(async modelId=>{
    try{const answer=await callModel(modelId,prompt,history);if(!String(answer??'').trim())throw new Error('Model boş yanıt verdi.');return {modelId,answer:String(answer).trim()};}
    catch(error){return {modelId,error:String(error?.message||'Model çağrısı başarısız.').slice(0,500)};}
  }));
}
