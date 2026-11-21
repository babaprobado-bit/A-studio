export const AGENT_HOOK_EVENTS=Object.freeze(['sessionStart','sessionEnd','beforeAgentRun','afterAgentRun','beforeSkillImport','afterSkillImport','beforeMemoryWrite','afterMemoryWrite']);
export function createAgentHookBus({isEnabled=()=>true,onError=()=>{},timeoutMs=2500}={}){
 const listeners=new Map(),valid=e=>e==='*'||AGENT_HOOK_EVENTS.includes(e);
 function on(event,handler){if(!valid(event)||typeof handler!=='function')throw new TypeError('Geçersiz hook kaydı.');const list=listeners.get(event)||[];list.push(handler);listeners.set(event,list);return()=>off(event,handler);}
 function off(event,handler){const list=(listeners.get(event)||[]).filter(x=>x!==handler);if(list.length)listeners.set(event,list);else listeners.delete(event);}
 async function emit(event,payload={}){if(!AGENT_HOOK_EVENTS.includes(event)||!isEnabled())return {event,emitted:0,failed:0};
  const data=Object.freeze({...payload,event,at:Date.now()}),handlers=[...(listeners.get(event)||[]),...(listeners.get('*')||[])];let failed=0;
  await Promise.all(handlers.map(async fn=>{let timer;try{await Promise.race([Promise.resolve().then(()=>fn(data)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Hook zaman aşımı.')),timeoutMs);})]);}catch(error){failed++;try{onError(error,data);}catch{}}finally{if(timer)clearTimeout(timer);}}));
  return {event,emitted:handlers.length,failed};
 }
 return Object.freeze({on,off,emit,listenerCount:e=>(listeners.get(e)||[]).length});
}
