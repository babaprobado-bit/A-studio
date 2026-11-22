import {normalizeSkill,MAX_SELECTED_SKILLS} from './skill-library.js';

const STOP_WORDS=new Set(['and','the','for','with','from','that','this','then','than','into','your','you','are','was','have','has','will','can','should','must','use','only','when','where','what','which','bir','ve','ile','icin','için','olarak','gibi','daha','sonra','önce','bunu','bunun','şunu','şunun','görev','iş','yap','et','olan','olur','üzerinde','hakkında']);
const boundedInteger=(value,fallback,max)=>{if(value===undefined||value===null||value==='')return fallback;const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):fallback;};
const ROLE_STAGE={architect:'plan',architecture:'plan',planner:'plan',planning:'plan',researcher:'plan',research:'plan',builder:'code',developer:'code',coder:'code',code:'code',implementation:'code',implementer:'code',tester:'review',test:'review',qa:'review',reviewer:'review',review:'review',security:'review',auditor:'review',documenter:'review',docs:'review',ux:'review',optimizer:'review',performance:'review'};
const ROLE_ALIASES=[
 {key:'code',pattern:/\b(code|coding|developer|builder|implement|implementation|program|kod|geliştir|uygula|yazılım)\b/i,ids:['sp-test-first','sp-minimal-diff','sp-api-contract','sp-codebase-map','cv-readable','cv-small-functions','ecc-tdd-workflow','ext-superpowers-development-loop','ext-karpathy-principles'],groups:['Code','Superpowers']},
 {key:'planning',pattern:/\b(plan|planning|architect|architecture|organize|design|planla|mimar|düzenle|tasarla)\b/i,ids:['sp-clarify','sp-codebase-map','sp-incremental-plan','sp-assumption-check','cv-simple-solution','ecc-agent-harness','ecc-architecture-audit','ext-gsd-core-task-slicer','ext-bmad-product-delivery'],groups:['Superpowers','Tokens','ECC Agent Systems']},
 {key:'research',pattern:/\b(research|investigate|search|source|compare|evaluate|araştır|incele|kaynak|karşılaştır)\b/i,ids:['ext-career-ops-research','ext-rea-authorized-inspection','ext-graphify-project-map','ext-understand-anything-explainer','ext-last-30-days-research','ext-agent-reach-source-research'],groups:['Research']},
 {key:'test',pattern:/\b(test|testing|qa|verify|verification|validate|regression|debug|doğrula|denetle)\b/i,ids:['sp-test-first','sp-reproduce','sp-edge-review','cv-honest-tests','ecc-verification-loop','ecc-tdd-workflow','ext-addy-osmani-production-review'],groups:['Superpowers','ECC Agent Systems']},
 {key:'security',pattern:/\b(security|secure|privacy|permission|auth|vulnerability|threat|shield|güvenlik|gizlilik|yetki|zafiyet)\b/i,ids:['sp-secure-defaults','cv-safe-default','ecc-agent-security','ecc-security-scan','ecc-architecture-audit','ecc-verification-loop'],groups:['Superpowers','ECC Agent Systems']},
 {key:'performance',pattern:/\b(performance|optimize|memory|ram|cpu|latency|speed|performans|bellek|hız)\b/i,ids:['sp-performance-budget','cv-context-limit','ext-headroom-context-budget','ext-caveman-token-saver'],groups:['Superpowers','Tokens']},
 {key:'memory',pattern:/\b(memory|remember|recall|learning|hafıza|bellek|hatırla|öğren)\b/i,ids:['ecc-unified-memory','ecc-continuous-learning','ext-claude-mem-project-memory'],groups:['Tokens','ECC Agent Systems']},
 {key:'agent',pattern:/\b(agent|swarm|orchestrat|hook|multi.?agent|ajan|orkestrasyon|kanca)\b/i,ids:['ecc-agent-harness','ecc-team-orchestration','ecc-hooks-lifecycle','ecc-unified-memory','ecc-verification-loop'],groups:['ECC Agent Systems']},
 {key:'api',pattern:/\b(api|endpoint|provider|http|request|response|sağlayıcı|uç nokta)\b/i,ids:['sp-api-contract','sp-secure-defaults','ecc-security-scan'],groups:['Superpowers','ECC Agent Systems']},
 {key:'ux',pattern:/\b(ux|ui|interface|accessibility|usability|layout|arayüz|erişilebilirlik|kullanılabilirlik)\b/i,ids:['ext-impeccable-interface-audit','ext-ui-ux-pro-max-design-system','ext-taste-visual-direction'],groups:['Design']},
 {key:'video',pattern:/\b(video|shorts|clip|reel|youtube|montage|scene|klip|sahne|içerik|sosyal medya)\b/i,ids:['vidiq-discovery','openshorts-workflow','ext-marketing-skills-content','ext-openmontage-video-pipeline','ext-hyperframes-scene-builder'],groups:['Video','Writing & Video']},
 {key:'docs',pattern:/\b(document|documentation|readme|guide|manual|dokümantasyon|belge|kılavuz)\b/i,ids:['sp-docs-sync','ext-anthropic-skills-document-work','cv-final-summary'],groups:['Writing & Video','Superpowers']}
];
const FALLBACK_IDS={plan:['sp-clarify','sp-incremental-plan','sp-assumption-check','ecc-agent-harness'],code:['sp-minimal-diff','sp-test-first','cv-readable','ecc-tdd-workflow'],review:['sp-edge-review','cv-honest-tests','ecc-verification-loop','ecc-agent-security'],all:['karpathy-guidelines','cv-no-guess','ecc-team-orchestration','cv-honest-tests']};
function norm(value){return String(value??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u');}
function tokens(value){return new Set(norm(value).match(/[a-z0-9]{3,}/g)?.filter(word=>!STOP_WORDS.has(word))||[]);}
export function inferSkillStage(task,role='general',requestedStage=''){
 if(['plan','code','review','all'].includes(requestedStage))return requestedStage;
 const roleText=norm(role).replace(/[^a-z]/g,'');if(ROLE_STAGE[roleText])return ROLE_STAGE[roleText];
 const hits=ROLE_ALIASES.filter(item=>item.pattern.test(norm(task))).map(item=>item.key);
 if(hits.length===1){const key=hits[0];if(['research','planning','video'].includes(key))return 'plan';if(['test','security','docs','performance','ux'].includes(key))return 'review';if(['code','api'].includes(key))return 'code';}
 return 'all';
}
function scoreSkill(skill,{taskTokens,role,stage,preferredIds,activeRules}){
 const id=skill.id,group=skill.group||'',nameDescription=norm([skill.name,skill.description,skill.id,skill.metadata?.category].join(' ')),fullText=norm([nameDescription,group,skill.content?.slice(0,5000)].join(' ')),titleTokens=tokens(nameDescription),bodyTokens=tokens(skill.content?.slice(0,5000));
 let score=0;const reasons=[];
 if(preferredIds.has(id)){score+=20;reasons.push('kullanıcının seçtiği Skill');}
 if(stage!=='all'&&skill.stage===stage){score+=2.4;reasons.push(stage+' aşaması');}else if(skill.stage==='all'){score+=0.9;reasons.push('genel kullanım');}
 for(const rule of activeRules){if(rule.ids.includes(id)){score+=7.5;reasons.push(rule.key+' uzmanlığı');}else if(rule.groups.includes(group))score+=2.2;}
 const roleRule=ROLE_ALIASES.find(item=>item.key===role);if(roleRule?.ids.includes(id)){score+=4;reasons.push(role+' rolü');}
 for(const word of taskTokens){if(titleTokens.has(word))score+=1.7;else if(fullText.includes(word))score+=0.35;else if(bodyTokens.has(word))score+=0.2;}
 if(id==='karpathy-guidelines'&&stage!=='review')score+=0.35;
 return {skill,score,reasons:[...new Set(reasons)]};
}
export function resolveSkillOverrideIds(values,skills=[],{maxIds=MAX_SELECTED_SKILLS}={}){
 const limit=boundedInteger(maxIds,MAX_SELECTED_SKILLS,MAX_SELECTED_SKILLS);
 const catalog=(Array.isArray(skills)?skills:[]).map(item=>normalizeSkill(item)).filter(Boolean);
 const byId=new Map(catalog.map(item=>[item.id,item]));
 const byName=new Map(catalog.map(item=>[norm(item.name),item]));
 const entries=(Array.isArray(values)?values:String(values??'').split(',')).flatMap(value=>String(value??'').split(',')).map(value=>value.trim()).filter(Boolean);
 const validIds=[],invalidValues=[];
 for(const entry of entries){const normalizedEntry=norm(entry),matches=catalog.filter(item=>norm(item.name).startsWith(normalizedEntry)),skill=byId.get(entry)||byName.get(normalizedEntry)||(matches.length===1?matches[0]:null);if(!skill){invalidValues.push(entry.slice(0,100));continue;}if(!validIds.includes(skill.id)&&validIds.length<limit)validIds.push(skill.id);}
 return {validIds,invalidValues,limitReached:entries.length>validIds.length+invalidValues.length};
}

function buildSkillTrace({includedIds=[],ranked=[],pinnedSkillIds=[],excludedSkillIds=[],addedSkillIds=[],retainedSkillIds=[],skills=[],stage='',maxSkills=MAX_SELECTED_SKILLS,charExcludedIds=[]}={}){
 const catalog=new Map((Array.isArray(skills)?skills:[]).map(item=>normalizeSkill(item)).filter(Boolean).map(item=>[item.id,item]));
 const rankMap=new Map((Array.isArray(ranked)?ranked:[]).map(item=>[item.id,item]));
 const included=new Set(includedIds),pinned=new Set(pinnedSkillIds),excluded=new Set(excludedSkillIds);
 const added=new Set(addedSkillIds),retained=new Set(retainedSkillIds);
 const trace=includedIds.slice(0,MAX_SELECTED_SKILLS).map(id=>{const skill=catalog.get(id),rank=rankMap.get(id),source=pinned.has(id)?'pinned':added.has(id)?'added':retained.has(id)?'retained':'automatic',reasons=(rank?.reasons||[]).slice(0,3);if(source==='added')reasons.push('yeni görev ihtiyacına göre eklendi');if(source==='retained')reasons.push('önceki aşamadan korundu');return {id,name:skill?.name||rank?.name||id,score:Number(rank?.score)||0,reasons,source};});
 const omitted=[];
 for(const id of excludedSkillIds){const skill=catalog.get(id);omitted.push({id,name:skill?.name||id,reason:'Bu çalıştırmada hariç tutuldu'});}
 for(const id of pinnedSkillIds){if(included.has(id)||excluded.has(id))continue;const skill=catalog.get(id);omitted.push({id,name:skill?.name||id,reason:skill&&stage!=='all'&&skill.stage!=='all'&&skill.stage!==stage?'Aşama uyumsuzluğu nedeniyle sabitlenemedi':'Skill sayısı veya içerik bütçesi sınırı'});}
 for(const id of charExcludedIds){if(omitted.some(item=>item.id===id))continue;const skill=catalog.get(id);omitted.push({id,name:skill?.name||id,reason:'İçerik karakter sınırı'});}
 for(const item of ranked||[]){if(included.has(item.id)||excluded.has(item.id)||omitted.some(row=>row.id===item.id))continue;omitted.push({id:item.id,name:item.name||item.id,reason:includedIds.length>=maxSkills?'Skill sayısı sınırı':'Seçim puanı veya aşama filtresi'});}
 return {skillTrace:trace.slice(0,MAX_SELECTED_SKILLS),omittedSkills:omitted.slice(0,12),pinnedSkillIds:[...pinned].slice(0,MAX_SELECTED_SKILLS),excludedSkillIds:[...excluded].slice(0,MAX_SELECTED_SKILLS)};
}

export function selectSkillsForTask({task='',role='general',stage='',skills=[],preferredSkillIds=[],pinnedSkillIds=[],excludedSkillIds=[],maxSkills=4,minScore=0.8}={}){
 const limit=Math.max(1,Math.min(MAX_SELECTED_SKILLS,Math.floor(Number(maxSkills)||4))),selectedStage=inferSkillStage(task,role,stage),sourceText=norm([task,role].join(' ')),taskTokens=tokens(sourceText),preferredIds=new Set(Array.isArray(preferredSkillIds)?preferredSkillIds:[]),pinnedIds=new Set(Array.isArray(pinnedSkillIds)?pinnedSkillIds:[]),excludedIds=new Set(Array.isArray(excludedSkillIds)?excludedSkillIds:[]),activeRules=ROLE_ALIASES.filter(item=>item.pattern.test(sourceText));
 const normalized=(Array.isArray(skills)?skills:[]).map(item=>normalizeSkill(item)).filter(Boolean),stageCandidates=normalized.filter(item=>selectedStage==='all'||item.stage==='all'||item.stage===selectedStage),candidates=stageCandidates.filter(item=>!excludedIds.has(item.id));
 const roleKey=ROLE_ALIASES.find(item=>item.pattern.test(norm(role)))?.key||'general';
 const ranked=candidates.map(skill=>{const scored=scoreSkill(skill,{taskTokens,role:roleKey,stage:selectedStage,preferredIds,activeRules});if(pinnedIds.has(skill.id)){scored.score+=1000;scored.reasons=['bu çalıştırmada sabitlendi',...scored.reasons];}return scored;}).sort((a,b)=>b.score-a.score||a.skill.name.localeCompare(b.skill.name));
 const selected=ranked.filter(item=>pinnedIds.has(item.skill.id)||item.score>=minScore).slice(0,limit);
 if(selected.length<Math.min(2,limit)){for(const id of (FALLBACK_IDS[selectedStage]||FALLBACK_IDS.all)){if(selected.length>=Math.min(2,limit))break;const item=ranked.find(candidate=>candidate.skill.id===id&&!selected.some(chosen=>chosen.skill.id===id));if(item)selected.push({...item,score:item.score+0.1,reasons:[...item.reasons,'güvenli temel Skill']});}}
 const stageIncompatiblePinned=[...pinnedIds].filter(id=>normalized.some(skill=>skill.id===id)&&!stageCandidates.some(skill=>skill.id===id));
 const missingPinned=[...pinnedIds].filter(id=>!normalized.some(skill=>skill.id===id));
 return {task:String(task??''),role,stage:selectedStage,skills:selected.map(item=>item.skill),selectedIds:selected.map(item=>item.skill.id),ranked:ranked.slice(0,Math.max(limit,12)).map(item=>({id:item.skill.id,name:item.skill.name,score:Number(item.score.toFixed(2)),reasons:item.reasons})),omittedByCount:ranked.length>selected.length,pinnedSkillIds:[...pinnedIds],excludedSkillIds:[...excludedIds],stageIncompatiblePinned,missingPinned};
}
export function buildTaskSkillContext(options={}){
 const selection=selectSkillsForTask(options),maxChars=boundedInteger(options.maxChars,10000,24000);
 const header='\n\n--- AI STUDIO AUTO-SELECTED SKILLS ('+selection.stage.toUpperCase()+'/'+String(selection.role).toUpperCase()+') ---\n',footer='\n--- END AUTO-SELECTED SKILLS ---',budget=Math.max(0,maxChars-header.length-footer.length);
 const blocks=[];let used=0;const includedIds=[],excludedIds=[];
 for(const item of selection.skills){const block='### '+item.name+' ['+item.stage+']\n'+item.content,separator=blocks.length?'\n\n':'';const remaining=budget-used-separator.length;if(remaining<100){excludedIds.push(item.id);continue;}if(block.length>remaining){excludedIds.push(item.id);continue;}blocks.push(block);used+=separator.length+block.length;includedIds.push(item.id);}
 const promptText=blocks.length?header+blocks.join('\n\n')+footer:'';
 const trace=buildSkillTrace({includedIds,ranked:selection.ranked,pinnedSkillIds:selection.pinnedSkillIds,excludedSkillIds:selection.excludedSkillIds,skills:options.skills,stage:selection.stage,maxSkills:Math.min(MAX_SELECTED_SKILLS,Number(options.maxSkills)||4),charExcludedIds:excludedIds});
 return {...selection,promptText,includedIds,excludedIds,charCount:promptText.length,maxChars,omittedByChars:excludedIds.length>0,...trace};
}

export function refreshTaskSkillContext({
  task='',role='general',stage='',skills=[],preferredSkillIds=[],pinnedSkillIds=[],excludedSkillIds=[],previousSkillIds=[],
  maxSkills=MAX_SELECTED_SKILLS,maxChars=10000,minScore=0.8
}={}){
  const limit=Math.max(1,Math.min(MAX_SELECTED_SKILLS,Math.floor(Number(maxSkills)||MAX_SELECTED_SKILLS)));
  const fresh=selectSkillsForTask({task,role,stage,skills,preferredSkillIds,pinnedSkillIds,excludedSkillIds,maxSkills:limit,minScore});
  const catalog=new Map((Array.isArray(skills)?skills:[]).map(item=>normalizeSkill(item)).filter(Boolean).map(item=>[item.id,item]));
  const allowed=skill=>fresh.stage==='all'||skill.stage==='all'||skill.stage===fresh.stage;
  const priorIds=[...new Set(Array.isArray(previousSkillIds)?previousSkillIds:[])];
  const excludedSet=new Set(fresh.excludedSkillIds);
  const previous=priorIds.map(id=>catalog.get(id)).filter(skill=>skill&&allowed(skill)&&!excludedSet.has(skill.id));
  const manualIds=[...new Set(Array.isArray(preferredSkillIds)?preferredSkillIds:[])];
  const manual=manualIds.map(id=>catalog.get(id)).filter(skill=>skill&&allowed(skill)&&!excludedSet.has(skill.id));
  const pinned=[...new Set(fresh.pinnedSkillIds)].map(id=>catalog.get(id)).filter(skill=>skill&&allowed(skill)&&!excludedSet.has(skill.id));
  const merged=[],seen=new Set();
  for(const skill of [...pinned,...manual,...fresh.skills,...previous]){
    if(!seen.has(skill.id)&&merged.length<limit){seen.add(skill.id);merged.push(skill);}
  }
  const charLimit=boundedInteger(maxChars,10000,24000);
  const header='\n\n--- AI STUDIO DYNAMIC SKILLS ('+fresh.stage.toUpperCase()+'/'+String(role).toUpperCase()+') ---\n';
  const footer='\n--- END DYNAMIC SKILLS ---';
  const budget=Math.max(0,charLimit-header.length-footer.length);
  const blocks=[];let used=0;const includedIds=[],excludedIds=[];
  for(const item of merged){
    const block='### '+item.name+' ['+item.stage+']\n'+item.content;
    const separator=blocks.length?'\n\n':'';
    const remaining=budget-used-separator.length;
    if(remaining<100){excludedIds.push(item.id);continue;}
    if(block.length>remaining){excludedIds.push(item.id);continue;}
    blocks.push(block);used+=separator.length+block.length;includedIds.push(item.id);
  }
  const promptText=blocks.length?header+blocks.join('\n\n')+footer:'';
  const previousSet=new Set(priorIds);
  const addedSkillIds=includedIds.filter(id=>!previousSet.has(id));
  const retainedSkillIds=includedIds.filter(id=>previousSet.has(id));
  const trace=buildSkillTrace({includedIds,ranked:fresh.ranked,pinnedSkillIds:fresh.pinnedSkillIds,excludedSkillIds:fresh.excludedSkillIds,addedSkillIds,retainedSkillIds,skills,stage:fresh.stage,maxSkills:limit,charExcludedIds:excludedIds});
  return {
    ...fresh,skills:merged,selectedIds:merged.map(item=>item.id),includedIds,excludedIds,
    promptText,charCount:promptText.length,maxChars:charLimit,omittedByChars:excludedIds.length>0,
    previousSkillIds:priorIds,addedSkillIds,retainedSkillIds,refreshed:priorIds.length>0,...trace
  };
}
