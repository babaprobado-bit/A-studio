import {createDefaultTaskPlan,organizeTaskPlan,classifyAgentRole} from './agent-orchestrator.js';
import {MAX_SELECTED_SKILLS} from './skill-library.js';
import {buildTaskSkillContext,refreshTaskSkillContext} from './skill-selector.js';
const MAX_AGENTS = 10;
const MAX_BOARD_MESSAGES = 24;
const ROLES = [
  ['architect','Mimar','Mimari ve plan','Görevi ayrıştır, bağımlılıkları ve kabul ölçütlerini belirle.'],
  ['builder','Uygulayıcı','Uygulama taslağı','En küçük uygulanabilir çözümü ve kod taslağını üret.'],
  ['reviewer','İnceleyici','Bağımsız inceleme','Doğruluk, güvenlik ve bakım risklerini bul.'],
  ['tester','Testçi','Test planı','Normal, sınır ve hata senaryolarını tasarla.'],
  ['optimizer','Performans','Kaynak bütçesi','RAM, CPU, pil, ağ ve gecikme maliyetlerini incele.'],
  ['documenter','Dokümantasyon','Kullanım ve teslim','Kurulum, kullanım ve sınırlamaları yaz.'],
  ['integrator','Entegratör','Modüller arası bağlantı','Arayüzleri, veri akışını ve uyumluluğu denetle.'],
  ['ux','UX uzmanı','Kullanıcı deneyimi','Mobil akış, erişilebilirlik ve boş/hata durumlarını değerlendir.'],
  ['reliability','Dayanıklılık','Hata kurtarma','Kesinti ve kısmi başarı senaryolarını ele al.'],
  ['auditor','Son denetçi','Bağımsız son kontrol','Kanıtları, varsayımları ve kalan riskleri sorgula.']
];
const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback;};
const clean=(value,max=1000)=>String(value??'').replace(/\u0000/g,'').trim().slice(0,max);
export function normalizeSwarmFilePath(value){
  const path=clean(value,180).replace(/\\/g,'/').replace(/^\.\//,'');
  if(!path||path.startsWith('/')||/^[a-z]:\//i.test(path))return '';
  const parts=path.split('/').filter(Boolean);
  if(!parts.length||parts.some(part=>part==='..'||part==='.'||!/^[\w.@+-]+$/.test(part)))return '';
  return parts.join('/');
}
export function fallbackSwarmTasks(task,maxTasks=3){
  const limit=clamp(maxTasks,2,MAX_AGENTS,3);
  const tasks=createDefaultTaskPlan(task,{maxTasks:limit});
  const used=new Set(tasks.map(item=>item.id));
  for(const [id,role,title,objective] of ROLES){
    if(tasks.length>=limit)break;
    if(used.has(id))continue;
    used.add(id);
    tasks.push({
      id,role,title,roleGroup:classifyAgentRole({id,role,title,objective}),
      objective:objective+' Ana görev: '+clean(task,800),
      acceptance:['Somut bulgu veya öneri ver','Varsayım ve riski belirt','Doğrulama/test adımı yaz'],
      files:[],dependsOn:[],priority:3,order:tasks.length
    });
  }
  return organizeTaskPlan(tasks,{maxTasks:limit}).tasks.map((item,order)=>({...item,order:item.order??order}));
}
function createFallbackPlan(task,limit,reason){
  const organized=organizeTaskPlan(fallbackSwarmTasks(task,limit),{maxTasks:limit});
  return {...organized,usedFallback:true,reason};
}
export function buildSwarmPlanPrompt(task,maxTasks=3,skillContext=''){
  const count=clamp(maxTasks,2,MAX_AGENTS,3);
  return [
    'AI Studio Swarm koordinatörüsün. Önce görevin türünü ve riskini belirle; sonra yalnızca gerekli uzman rolleriyle doğrulanabilir alt görevlere böl.',
    'Yalnızca JSON döndür: {"tasks":[{"id":"kisa-id","title":"başlık","role":"uzman","objective":"tek görev","acceptance":["kontrol"],"files":["relative/path"],"dependsOn":["onceki-id"],"priority":1}]}',
    'Tam olarak '+count+' görev üret. priority 1-5 arasıdır. dependsOn yalnızca listedeki görev IDlerini içersin. Bağımsız işleri paralel, ön koşulu olan işleri sıralı planla. Kod görevi varsa test; hassas/güvenlik işi varsa güvenlik incelemesi ekle. Bilmediğin dosya yolunu yazma.',
    'Ajanlar dosya değiştiremez veya komut çalıştıramaz; analiz ve taslak üretir.',
    'Ana görev: '+clean(task,3000),
    skillContext
  ].filter(Boolean).join('\n\n');
}
export function parseSwarmPlan(raw,{task='',maxTasks=3}={}){
  const limit=clamp(maxTasks,2,MAX_AGENTS,3);
  const source=clean(raw,20000).replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'');
  let data;
  try{const a=source.indexOf('{'),b=source.lastIndexOf('}');if(a<0||b<=a)throw new Error();data=JSON.parse(source.slice(a,b+1));}
  catch{return createFallbackPlan(task,limit,'Koordinatör geçerli JSON planı üretmedi.');}
  const incoming=Array.isArray(data)?data:data?.tasks;
  if(!Array.isArray(incoming))return createFallbackPlan(task,limit,'Plan içinde görev listesi bulunamadı.');
  const seen=new Set();
  const tasks=incoming.slice(0,limit).map((item,index)=>{
    if(!item||typeof item!=='object')return null;
    const id=clean(item.id||'task-'+(index+1),48).toLowerCase().replace(/[^a-z0-9_-]/g,'-');
    const title=clean(item.title,100),objective=clean(item.objective||item.description||item.goal,1200);
    if(!id||!title||!objective||seen.has(id))return null;seen.add(id);
    const acceptance=Array.isArray(item.acceptance)?item.acceptance.map(x=>clean(x,200)).filter(Boolean).slice(0,5):[];
    const files=Array.isArray(item.files)?[...new Set(item.files.map(normalizeSwarmFilePath).filter(Boolean))].slice(0,8):[];
    return {id,title,role:clean(item.role||'Uzman ajan',60),roleGroup:classifyAgentRole(item),objective,acceptance:acceptance.length?acceptance:['Somut bulgu, risk ve test önerisi ver.'],files,dependsOn:Array.isArray(item.dependsOn)?item.dependsOn:Array.isArray(item.dependencies)?item.dependencies:[],priority:item.priority??3,order:index};
  }).filter(Boolean);
  if(tasks.length<2)return createFallbackPlan(task,limit,'En az iki güvenilir alt görev çıkarılamadı.');
  return {...organizeTaskPlan(tasks,{maxTasks:limit}),usedFallback:false,reason:''};
}
export function resolveSwarmConcurrency({requested=2,isNative=false,deviceInfo=null}={}){
  let limit=clamp(requested,1,isNative?3:4,2);
  const memory=Number(deviceInfo?.availableMemoryBytes||0);
  if(deviceInfo?.lowMemory===true||(memory>0&&memory<900*1024**2))return 1;
  return isNative?Math.min(limit,2):limit;
}
export function estimateSwarmCallBudget(workerCount){
  const n=clamp(workerCount,2,MAX_AGENTS,3);
  return {expected:n+2,maximumWithRetries:n*4+2,retryAllowance:n*2,dynamicSkillAllowance:n};
}
export function resolveSwarmProviderCallLimit(value,workerCount){
  const fallback=estimateSwarmCallBudget(workerCount).maximumWithRetries;
  if(value===undefined||value===null||value==='')return fallback;
  const limit=Number(value);
  if(!Number.isSafeInteger(limit)||limit<3||limit>100)throw new RangeError('Agent Swarm istek sınırı 3 ile 100 arasında tam sayı olmalıdır.');
  return limit;
}
export function isRetryableSwarmError(error){
  const message=String(error?.message||error||'');
  if(/\b(400|401|402|403|404)\b|invalid.?api.?key|unauthorized|insufficient.?credit|billing/i.test(message))return false;
  return /\b(408|425|429|500|502|503|504)\b|timeout|timed out|temporar|rate.?limit|network|fetch failed|connection reset|ağa erişilemedi|zaman aşımına uğradı/i.test(message);
}
function buildWorkerPrompt(task,mainTask,board,completedPrerequisites=[],skillContext=''){
  return [
    'AI Studio Swarm uzman ajanısın. Rol: '+task.role+'.',
    'Ana görev: '+clean(mainTask,2500),
    'Alt görev: '+task.objective,
    task.dependsOn?.length?'Ön koşul görevleri: '+task.dependsOn.join(', '):'Bağımsız görev.',
    completedPrerequisites.length?'Ön koşul çıktıları:\n'+completedPrerequisites.map(item=>'### '+item.title+'\n'+(item.error?'HATA: '+item.error:item.answer)).join('\n\n'):'',
    'Kabul ölçütleri:\n- '+task.acceptance.join('\n- '),
    task.files.length?'İlgili göreli dosyalar (yalnızca incele/öner): '+task.files.join(', '):'Dosya yolu verilmedi; yol uydurma.',
    board.length?'Paylaşılan takım panosu:\n'+board.map(item=>'['+item.from+'] '+item.text).join('\n'):'Takım panosu henüz boş.',
    'Çıktı: bulgular, çözüm/kod taslağı, riskler/varsayımlar, test planı. Dosya değiştirdiğini veya test çalıştırdığını iddia etme.',
    'Yanıtında mevcut Skill talimatlarının yetmediği ve gerçekten gerekli yeni bir uzmanlık varsa son satıra SKILL_NEEDS: kısa, virgülle ayrılmış alanlar yaz. Gerekmiyorsa SKILL_NEEDS: none yaz. Araç, API anahtarı veya model erişimi isteme.',
    'Son satır: CONFIDENCE: 0-100',
    skillContext
  ].filter(Boolean).join('\n\n');
}
export function parseSkillNeeds(answer){
  const match=String(answer??'').match(/(?:^|\n)\s*SKILL_NEEDS\s*:\s*([^\r\n]*)/i);
  const value=clean(match?.[1]||'',320);
  if(!value||/^(none|no|n\/?a|yok|gerekmiyor|none required)$/i.test(value))return '';
  return value;
}
function stripSkillNeeds(answer){return String(answer??'').replace(/(?:^|\n)\s*SKILL_NEEDS\s*:[^\r\n]*/gi,'').trim();}
function buildSkillExpansionPrompt(task,mainTask,previousAnswer,skillContext,discoveryText){
  return [
    'DYNAMIC SKILL EXPANSION: Bu görev için ek uzmanlık talimatları seçildi.',
    'Ana görev: '+clean(mainTask,1800),
    'Alt görev: '+clean(task.objective,1000),
    'Eksik uzmanlık: '+clean(discoveryText,320),
    'Önceki taslak: '+clean(previousAnswer,4200),
    'Yeni Skill talimatlarını uygula. Doğru kısımları koru, yalnızca ilgili eksikleri geliştir. Dosya değiştirdiğini veya test çalıştırdığını iddia etme.',
    skillContext,
    'Tamamlanmış sonucu döndür. Bu görev için başka Skill genişletmesi isteme; son satırda SKILL_NEEDS: none yaz.'
  ].filter(Boolean).join('\n\n');
}
function buildSynthesisPrompt(task,plan,results,board,skillContext=''){
  return [
    'AI Studio Swarm koordinatörüsün. Ajan çıktılarını birleştir; çelişkileri ve kanıtlanmamış iddiaları açıkça belirt.',
    'Ana görev: '+clean(task,2500),
    'Plan: '+plan.map(item=>item.title).join(' | '),
    'Ajan katkıları:\n'+results.map(item=>'### '+item.title+' ('+item.providerId+')\n'+(item.error?'HATA: '+item.error:item.answer)).join('\n\n'),
    'Ortak pano:\n'+board.map(item=>'['+item.from+'] '+item.text).join('\n'),
    'Sonuç, önerilen adımlar, ayrışan görüşler, doğrulama durumu ve kalan riskleri yaz. Öneri; dosya değişikliği veya test başarısı kanıtı değildir.',
    skillContext
  ].filter(Boolean).join('\n\n');
}
export async function runAgentSwarm({providerIds,task,history=[],maxAgents=3,maxConcurrency=2,maxProviderCalls, isNative=false,deviceInfo=null,callProvider,onEvent=async()=>{},assignProviders=null,skills=[],preferredSkillIds=[],pinnedSkillIds=[],excludedSkillIds=[]}){
  if(!Array.isArray(providerIds)||typeof callProvider!=='function')throw new TypeError('Swarm için providerIds ve callProvider gerekir.');
  const providers=[...new Set(providerIds.filter(item=>typeof item==='string'&&item.trim()))];
  const mainTask=clean(task,3000),workerCount=clamp(maxAgents,2,MAX_AGENTS,3);
  if(!mainTask)throw new Error('Swarm görevi boş olamaz.');
  if(providers.length<2)throw new Error('Swarm için en az iki hazır AI motoru gerekir.');
  const maxProviderCallLimit=resolveSwarmProviderCallLimit(maxProviderCalls,workerCount);
  const concurrency=resolveSwarmConcurrency({requested:maxConcurrency,isNative,deviceInfo});
  const started=Date.now(),board=[],results=[],lockedFiles=new Set(),fileOwners=new Map();
  let retryCount=0,dynamicSkillCalls=0,skillExpansionCount=0,modelCallCount=0,budgetExhausted=false,budgetExhaustedRequests=0;
  const emit=async(type,data={})=>{try{await onEvent({type,at:Date.now(),...data});}catch{}};
  const requestProvider=async(phase,...args)=>{
    const workerRequest=phase==='worker'||phase==='skill-expansion';
    const allowedCalls=workerRequest?maxProviderCallLimit-1:maxProviderCallLimit;
    if(modelCallCount>=allowedCalls){
      budgetExhausted=true;budgetExhaustedRequests++;
      const error=new Error('Agent Swarm istek sınırına ulaşıldı ('+maxProviderCallLimit+'). Planlama ve son sentez için ayrılan çağrı korunur.');
      error.code='SWARM_BUDGET_EXHAUSTED';
      await emit('budget_exhausted',{phase,maxProviderCalls:maxProviderCallLimit,modelCallCount,reservedSynthesisCalls:phase==='synthesis'?0:1,blockedRequests:budgetExhaustedRequests});
      throw error;
    }
    modelCallCount++;
    if(phase==='skill-expansion')dynamicSkillCalls++;
    return callProvider(...args);
  };
  await emit('swarm_started',{coordinatorId:providers[0],workerCount,concurrency});
  const planningSkills=buildTaskSkillContext({task:mainTask,role:'architect',stage:'plan',skills,preferredSkillIds,pinnedSkillIds,excludedSkillIds,maxSkills:4,maxChars:7600});
  await emit('skills_selected',{taskId:'coordinator-plan',role:'architect',stage:planningSkills.stage,skillIds:planningSkills.includedIds,skillNames:planningSkills.skills.map(item=>item.name),skillTrace:planningSkills.skillTrace,omittedSkills:planningSkills.omittedSkills,pinnedSkillIds:planningSkills.pinnedSkillIds,excludedSkillIds:planningSkills.excludedSkillIds});
  let plan;
  try{const raw=await requestProvider('planning',providers[0],buildSwarmPlanPrompt(mainTask,workerCount,planningSkills.promptText),history);plan=parseSwarmPlan(raw,{task:mainTask,maxTasks:workerCount});}
  catch(error){plan={tasks:fallbackSwarmTasks(mainTask,workerCount),usedFallback:true,reason:clean(error?.message||'Koordinatör yanıt vermedi.',300)};}
  if(plan.usedFallback)await emit('plan_fallback',{reason:plan.reason});
  const tasks=plan.tasks.slice(0,workerCount);
  const taskIndex=new Map(tasks.map((item,index)=>[item.id,index]));
  const taskSkillContexts=new Map();
  const taskStages=(plan.stages?.length?plan.stages:[tasks]).map(stage=>stage.filter(item=>taskIndex.has(item.id))).filter(stage=>stage.length);
  let assignments=[];
  if(typeof assignProviders==='function'){
    try{assignments=assignProviders(tasks,providers)||[];}catch(error){await emit('assignment_fallback',{reason:clean(error?.message||'Uzman ataması başarısız.',240)});}
  }
  const assignmentMap=new Map((Array.isArray(assignments)?assignments:[]).filter(item=>item&&tasks.some(taskItem=>taskItem.id===item.taskId)&&providers.includes(item.providerId)).map(item=>[item.taskId,item]));
  assignments=tasks.map((item,index)=>assignmentMap.get(item.id)||({taskId:item.id,providerId:providers[1+(index%(providers.length-1))],roleGroup:'general',reason:'Dengeli varsayılan atama'}));
  for(const assignment of assignments)await emit('assignment_made',{taskId:assignment.taskId,providerId:assignment.providerId,roleGroup:assignment.roleGroup,reason:assignment.reason});
  for(const item of tasks)for(const file of item.files){const previous=fileOwners.get(file);if(previous)await emit('file_conflict',{file,firstTask:previous,secondTask:item.id});else fileOwners.set(file,item.id);}
  const execute=async(item,index)=>{
    const assigned=assignmentMap.get(item.id)||assignments[index];
    const providerId=providers.includes(assigned?.providerId)?assigned.providerId:providers[1+(index%(providers.length-1))],agentId='agent-'+(index+1);
    const failedDependencies=(item.dependsOn||[]).filter(id=>{const dependencyIndex=taskIndex.get(id);return dependencyIndex!==undefined&&results[dependencyIndex]?.error;});
    if(failedDependencies.length){
      const error='Bağımlı görev başarısız olduğu için atlandı: '+failedDependencies.join(', ');
      results[index]={agentId,providerId,title:item.title,role:item.role,answer:'',error,skipped:true,retried:false,confidence:null};
      await emit('agent_skipped',{agentId,title:item.title,failedDependencies});
      await emit('agent_completed',{agentId,title:item.title,status:'skipped',error});
      return;
    }
    const completedPrerequisites=(item.dependsOn||[]).map(id=>results[taskIndex.get(id)]).filter(Boolean);
    await emit('agent_started',{agentId,title:item.title,role:item.role,providerId,roleGroup:assigned?.roleGroup||item.roleGroup||'general',stage:item.stage??0});
    const dependencyContext=completedPrerequisites.map(result=>'### '+result.title+'\n'+(result.error?'HATA: '+result.error:clean(result.answer,2200))).join('\n\n');
    const liveTeamContext=board.map(entry=>'['+entry.from+'] '+entry.text).join('\n');
    const evolvingTask=[mainTask,'Güncel alt görev: '+item.title,item.objective,dependencyContext?'Ön koşul ajan çıktıları:\n'+dependencyContext:'',liveTeamContext?'Güncel takım bulguları:\n'+liveTeamContext:''].filter(Boolean).join('\n\n').slice(0,7200);
    const previousSkillIds=completedPrerequisites.flatMap(result=>Array.isArray(result.skillIds)?result.skillIds:[]);
    const role=item.roleGroup||classifyAgentRole(item);
    let skillSelection=refreshTaskSkillContext({task:evolvingTask,role,skills,preferredSkillIds,pinnedSkillIds,excludedSkillIds,previousSkillIds,maxSkills:MAX_SELECTED_SKILLS,maxChars:7600});
    taskSkillContexts.set(item.id,skillSelection);
    await emit('skills_refreshed',{taskId:item.id,role,stage:skillSelection.stage,refreshed:skillSelection.refreshed,previousSkillCount:previousSkillIds.length,skillIds:skillSelection.includedIds,addedSkillIds:skillSelection.addedSkillIds,addedSkillNames:skillSelection.skills.filter(skill=>skillSelection.addedSkillIds.includes(skill.id)).map(skill=>skill.name),skillTrace:skillSelection.skillTrace,omittedSkills:skillSelection.omittedSkills,pinnedSkillIds:skillSelection.pinnedSkillIds,excludedSkillIds:skillSelection.excludedSkillIds});
    let answer='',error='',retried=false,skillExpansionError='',dynamicSkillIds=[];
    const prompt=buildWorkerPrompt(item,mainTask,board,completedPrerequisites,skillSelection.promptText);
    for(let attempt=0;attempt<2;attempt++){
      try{answer=String(await requestProvider('worker',providerId,prompt,history)||'').trim();if(!answer)throw new Error('Ajan boş yanıt verdi.');error='';break;}
      catch(err){error=clean(err?.message||'Ajan çağrısı başarısız.',500);if(attempt===0&&isRetryableSwarmError(err)){retried=true;retryCount++;await emit('agent_retry',{agentId,reason:error});continue;}break;}
    }
    if(!error){
      const needs=parseSkillNeeds(answer),previousAnswer=stripSkillNeeds(answer);
      if(needs){
        const expanded=refreshTaskSkillContext({
          task:evolvingTask+'\nYeni uzmanlık ihtiyacı: '+needs,
          role:'general',stage:'all',skills,preferredSkillIds,pinnedSkillIds,excludedSkillIds,
          previousSkillIds:skillSelection.includedIds,maxSkills:MAX_SELECTED_SKILLS,maxChars:7600
        });
        if(expanded.addedSkillIds.length){
          let revised='',revisionError='';
          await emit('skills_expansion_started',{agentId,taskId:item.id,needs,addedSkillIds:expanded.addedSkillIds});
          for(let attempt=0;attempt<2;attempt++){
            try{
              revised=String(await requestProvider('skill-expansion',providerId,buildSkillExpansionPrompt(item,mainTask,previousAnswer,expanded.promptText,needs),history)||'').trim();
              if(!revised)throw new Error('Ek Skill talimatlarıyla gelen yanıt boş.');
              revisionError='';break;
            }catch(err){
              revisionError=clean(err?.message||'Dinamik Skill genişletmesi başarısız.',500);
              if(attempt===0&&isRetryableSwarmError(err)){retried=true;retryCount++;await emit('agent_retry',{agentId,reason:revisionError,phase:'skill-expansion'});continue;}
              break;
            }
          }
          if(revised&&!revisionError){
            answer=stripSkillNeeds(revised);skillSelection=expanded;taskSkillContexts.set(item.id,expanded);
            dynamicSkillIds=[...expanded.addedSkillIds];skillExpansionCount++;
            await emit('skills_expanded',{agentId,taskId:item.id,needs,skillIds:dynamicSkillIds,skillNames:expanded.skills.filter(skill=>dynamicSkillIds.includes(skill.id)).map(skill=>skill.name),skillTrace:expanded.skillTrace.filter(skill=>dynamicSkillIds.includes(skill.id))});
          }else{
            skillExpansionError=revisionError;answer=previousAnswer;
            await emit('skills_expansion_failed',{agentId,taskId:item.id,reason:skillExpansionError,retainedInitialAnswer:true});
          }
        }else answer=previousAnswer;
      }else answer=previousAnswer;
    }
    const confidenceMatch=answer.match(/(?:CONFIDENCE|GÜVEN):\s*(\d{1,3})/i);
    const result={agentId,providerId,title:item.title,role:item.role,answer,error,skillIds:skillSelection.includedIds,skillNames:skillSelection.skills.filter(skill=>skillSelection.includedIds.includes(skill.id)).map(skill=>skill.name),addedSkillIds:[...new Set([...(skillSelection.addedSkillIds||[]),...dynamicSkillIds])],dynamicSkillIds,skillExpansionError,confidence:confidenceMatch?clamp(confidenceMatch[1],0,100,null):null,retried};
    results[index]=result;
    const excerpt=clean(error||answer,320);
    board.push({from:agentId,text:excerpt});if(board.length>MAX_BOARD_MESSAGES)board.splice(0,board.length-MAX_BOARD_MESSAGES);
    await emit('agent_broadcast',{from:agentId,text:excerpt});
    await emit('agent_completed',{agentId,title:item.title,status:error?'failed':'completed',error,retried,dynamicSkillIds,skillExpansionError});
  };
  for(const stage of taskStages){
    let nextIndex=0;
    const worker=async()=>{
      while(nextIndex<stage.length){
        const item=stage[nextIndex++],index=taskIndex.get(item.id);
        while(item.files.some(file=>lockedFiles.has(file)))await new Promise(resolve=>setTimeout(resolve,15));
        item.files.forEach(file=>lockedFiles.add(file));
        try{await execute(item,index);}finally{item.files.forEach(file=>lockedFiles.delete(file));}
      }
    };
    await Promise.all(Array.from({length:Math.min(concurrency,stage.length)},()=>worker()));
  }
  await emit('swarm_completed',{completed:results.filter(item=>item&&!item.error).length,failed:results.filter(item=>item?.error&&!item.skipped).length,skipped:results.filter(item=>item?.skipped).length,workerCount:tasks.length,stageCount:taskStages.length});
  const completedSkillIds=results.flatMap(item=>Array.isArray(item?.skillIds)?item.skillIds:[]);
  const synthesisContext=[mainTask,...results.map(item=>item.title+'\n'+clean(item.error||item.answer,900))].join('\n\n').slice(0,7200);
  const synthesisSkills=refreshTaskSkillContext({task:synthesisContext,role:'reviewer',stage:'review',skills,preferredSkillIds,pinnedSkillIds,excludedSkillIds,previousSkillIds:[...new Set(completedSkillIds)].slice(0,4),maxSkills:MAX_SELECTED_SKILLS,maxChars:7600});
  await emit('skills_refreshed',{taskId:'coordinator-synthesis',role:'reviewer',stage:synthesisSkills.stage,refreshed:synthesisSkills.refreshed,previousSkillCount:completedSkillIds.length,skillIds:synthesisSkills.includedIds,addedSkillIds:synthesisSkills.addedSkillIds,addedSkillNames:synthesisSkills.skills.filter(item=>synthesisSkills.addedSkillIds.includes(item.id)).map(item=>item.name),skillTrace:synthesisSkills.skillTrace,omittedSkills:synthesisSkills.omittedSkills,pinnedSkillIds:synthesisSkills.pinnedSkillIds,excludedSkillIds:synthesisSkills.excludedSkillIds});
  let summary='',summaryError='';
  try{summary=String(await requestProvider('synthesis',providers[0],buildSynthesisPrompt(mainTask,tasks,results,board,synthesisSkills.promptText),history)||'').trim();if(!summary)throw new Error('Koordinatör sentezi boş yanıt verdi.');}
  catch(error){summaryError=clean(error?.message||'Sentez başarısız.',400);summary='## Birleştirilmiş sonuç\n'+results.map(item=>'### '+item.title+'\n'+(item.error?'Hata: '+item.error:item.answer)).join('\n\n')+'\n\nKoordinatör sentezi alınamadı; ajan katkıları ayrı ayrı incelenmeli.';}
  if(budgetExhausted)summary='## Kısmi sonuç · İstek sınırı doldu\n\n'+summary+'\n\nAgent Swarm '+maxProviderCallLimit+' gerçek sağlayıcı isteği sınırına ulaştı. Tamamlanan ajan çıktıları korundu; sınır nedeniyle tamamlanamayan alt görevler ayrı işaretlendi.';
  const completed=results.filter(item=>item&&!item.error).length,failed=results.filter(item=>item?.error&&!item.skipped).length,skipped=results.filter(item=>item?.skipped).length;
  const status=budgetExhausted||failed>0||skipped>0?'partial':'completed';
  return {status,coordinatorId:providers[0],plan:tasks,planStages:taskStages.length,planWarnings:plan.warnings||[],planFallback:plan.usedFallback,results,summary,summaryError,assignments,budget:{maxProviderCalls:maxProviderCallLimit,usedCalls:modelCallCount,remainingCalls:Math.max(0,maxProviderCallLimit-modelCallCount),exhausted:budgetExhausted,blockedRequests:budgetExhaustedRequests,synthesisReserved:1},skillSelections:[{taskId:'coordinator-plan',role:'architect',stage:planningSkills.stage,skillIds:planningSkills.includedIds,skillNames:planningSkills.skills.map(item=>item.name)},{taskId:'coordinator-synthesis',role:'reviewer',stage:synthesisSkills.stage,skillIds:synthesisSkills.includedIds,skillNames:synthesisSkills.skills.map(item=>item.name)},...tasks.map(item=>({taskId:item.id,role:item.roleGroup||item.role,stage:taskSkillContexts.get(item.id)?.stage,skillIds:taskSkillContexts.get(item.id)?.includedIds||[],skillNames:taskSkillContexts.get(item.id)?.skills.map(skill=>skill.name)||[],addedSkillIds:taskSkillContexts.get(item.id)?.addedSkillIds||[]}))],metrics:{
    workerCount:tasks.length,completed,failed,skipped,
    retryCount,dynamicSkillCalls,skillExpansionCount,modelCallCount,maxProviderCalls:maxProviderCallLimit,budgetExhausted,budgetExhaustedRequests,callsRemaining:Math.max(0,maxProviderCallLimit-modelCallCount),elapsedMs:Date.now()-started,fileConflictCount:tasks.reduce((sum,item)=>sum+item.files.length,0)-new Set(tasks.flatMap(item=>item.files)).size,
    selectedSkillCount:planningSkills.includedIds.length+synthesisSkills.includedIds.length+[...taskSkillContexts.values()].reduce((sum,item)=>sum+item.includedIds.length,0),
    dynamicallyAddedSkillCount:synthesisSkills.addedSkillIds.length+[...taskSkillContexts.values()].reduce((sum,item)=>sum+item.addedSkillIds.length,0),
    expectedCalls:tasks.length+2,maxCallsWithRetries:tasks.length*4+2,stageCount:taskStages.length
  }};
}
export const SWARM_LIMITS=Object.freeze({maxAgents:MAX_AGENTS,defaultAgents:3,defaultConcurrency:2});
