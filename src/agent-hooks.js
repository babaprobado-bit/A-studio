export const AGENT_HOOK_EVENTS=Object.freeze(['sessionStart','sessionEnd','beforeAgentRun','afterAgentRun','beforeSkillImport','afterSkillImport','beforeMemoryWrite','afterMemoryWrite']);
const DEFAULT_HOOK_TIMEOUT_MS=2500;
const MAX_HOOK_TIMEOUT_MS=30000;

export function createAgentHookBus({isEnabled=()=>true,onError=()=>{},timeoutMs=DEFAULT_HOOK_TIMEOUT_MS}={}){
 const listeners=new Map();
 const valid=event=>event==='*'||AGENT_HOOK_EVENTS.includes(event);
 const timeout=Number.isFinite(Number(timeoutMs))?Math.max(1,Math.min(MAX_HOOK_TIMEOUT_MS,Number(timeoutMs))):DEFAULT_HOOK_TIMEOUT_MS;
 function on(event,handler){
  if(!valid(event)||typeof handler!=='function')throw new TypeError('Geçersiz hook kaydı.');
  const list=listeners.get(event)||[];list.push(handler);listeners.set(event,list);
  let active=true;
  return ()=>{if(!active)return false;active=false;return off(event,handler);};
 }
 function off(event,handler){
  const list=listeners.get(event)||[],index=list.indexOf(handler);
  if(index<0)return false;
  list.splice(index,1);
  if(list.length)listeners.set(event,list);else listeners.delete(event);
  return true;
 }
 function reportError(error,data){
  try{Promise.resolve(onError(error,data)).catch(()=>{});}catch{}
 }
 async function emit(event,payload={}){
  if(!AGENT_HOOK_EVENTS.includes(event))return {event,emitted:0,failed:0};
  const details=payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};
  const data=Object.freeze({...details,event,at:Date.now()});
  let enabled;
  try{enabled=Boolean(isEnabled());}
  catch(error){reportError(error,data);return {event,emitted:0,failed:1};}
  if(!enabled)return {event,emitted:0,failed:0};
  const handlers=[...(listeners.get(event)||[]),...(listeners.get('*')||[])];
  let failed=0;
  await Promise.all(handlers.map(async handler=>{
   let timer;
   try{
    await Promise.race([
     Promise.resolve().then(()=>handler(data)),
     new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Hook zaman aşımı.')),timeout);})
    ]);
   }catch(error){failed++;reportError(error,data);}
   finally{if(timer)clearTimeout(timer);}
  }));
  return {event,emitted:handlers.length,failed};
 }
 return Object.freeze({on,off,emit,listenerCount:event=>(listeners.get(event)||[]).length});
}
