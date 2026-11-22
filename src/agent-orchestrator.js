const clamp=(v,min,max,d)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):d;};
const textOf=v=>typeof v==='string'?v:[v?.title,v?.role,v?.objective,v?.description,v?.goal].filter(Boolean).join(' ').toLowerCase();
const match=(t,re)=>re.test(t);
const TURKISH_SIGNAL_STEMS={
 implementation:['oluştur','geliştir','uygula','kodla','ekle','bağla','güncelle','düzelt','yapılandır','kur'],
 research:['araştır','karşılaştır','incele','değerlendir','keşfet','sorgula'],
 planning:['planla','tasarla','düzenle','sırala','belirle','mimar'],
 testing:['doğrula','sına','denetle','kontrol','test','çalıştır','hataayııkla'],
 security:['güven','gizlilik','gizlili','yetki','izin','şifre','sifre','parola','erişim','kimlikdoğrula','zafiyet'],
 docs:['belge','dokümant','kılavuz'],
 ux:['arayüz','erişilebilir','kullanılabilir'],
 performance:['performans','bellek','hızlandır','iyileştir','optimize','gecikme'],
 data:['veritaban','veri','şema','sorgu','migration','aktar'],
 automation:['otomasyon','otomatik','tetikle','zamanla']
};
function hasTurkishSignal(text,signal){
 const normalized=text.toLocaleLowerCase('tr-TR');
 const tokens=normalized.match(/[\p{L}\p{N}_]+/gu)||[];
 if(signal==='automation'&&/iş\s+akış/u.test(normalized))return true;
 return (TURKISH_SIGNAL_STEMS[signal]||[]).some(stem=>tokens.some(token=>token.startsWith(stem)));
}
const SIGNALS={
 implementation:/\b(build|create|write|implement|integrate|develop|code|fix|refactor|add|update|olu[sş]tur|geli[sş]tir|uygula|kodla|ekle|yaz|ba[gğ]la|g[uü]ncelle)\b/i,
 research:/\b(research|investigate|compare|evaluate|find|search|analyze|ara[sş]t[iı]r|kar[sş][iı]la[sş]t[iı]r|incele|bul|de[gğ]erlendir)\b/i,
 planning:/\b(plan|design|architect|architecture|organize|structure|roadmap|planla|tasarla|mimar|d[uü]zenle|s[iı]rala)\b/i,
 testing:/\b(test|verify|validate|qa|regression|debug|check|do[gğ]rula|s[iı]na|denetle|kontrol|hata ay[iı]kla)\b/i,
 security:/\b(security|secure|privacy|permission|auth|vulnerability|threat|shield)\b|g[uü]venli\w*|gizlilik\w*|yetki\w*|zafiyet\w*/i,
 docs:/\b(document|docs|readme|guide|manual|documentation|dok[uü]mantasyon|belgele)\b/i,
 ux:/\b(ux|ui|interface|accessibility|usability|layout|aray[uü]z|eri[sş]ilebilirlik|tasar[iı]m)\b/i,
 performance:/\b(performance|optimize|memory|ram|cpu|latency|speed|performans|bellek)\b/i,
 data:/\b(database|data|schema|query|migration|veritaban[iı]|veri|[sş]ema)\b/i,
 automation:/\b(automate|automation|workflow|pipeline|schedule|trigger|otomasyon|i[sş] ak[iı][sş][iı])\b/i
};
export function classifyTaskIntent(task){
 const t=textOf(task),signals=Object.keys(SIGNALS).filter(k=>match(t,SIGNALS[k])||hasTurkishSignal(t,k));
 const sensitive=match(t,/\\b(password|secret|token|credential|private key|payment|billing|production|delete|wipe|security|api key|parola|sifre|odeme)\\b|g[uü]venli\\w*|gizlilik\\w*|yetki\\w*|sil\\w*/i)||hasTurkishSignal(t,'security');
 return {signals,primaryIntent:signals[0]||'general',requiresResearch:signals.includes('research'),requiresPlanning:signals.includes('planning')||signals.length>=3,requiresImplementation:signals.includes('implementation'),requiresTesting:signals.includes('implementation')||signals.includes('testing')||signals.includes('security'),requiresSecurityReview:signals.includes('security')||sensitive,requiresDocumentation:signals.includes('docs'),requiresUxReview:signals.includes('ux'),requiresPerformanceReview:signals.includes('performance'),riskLevel:sensitive?'high':signals.includes('data')?'medium':'low'};
}
const ACTION_PREFIX=/^(?:plan|build|create|add|write|update|verify|run|connect|implement|integrate|review|audit|test|debug|refactor|compare|automate|document|secure|optimize|design|deploy|inspect|analyze|research|select|assign|orchestrate|validate|migrate|remove|fix|configure|araştır|karşılaştır|planla|tasarla|mimar|düzenle|sırala|oluştur|geliştir|uygula|kodla|ekle|yaz|bağla|güncelle|doğrula|sına|denetle|kontrol|incele|bul|değerlendir|seç|ata|böl|ayır|yönet|iyileştir|hızlandır|belgele|dokümante|temizle|kaldır|taşı|birleştir|çalıştır|tamamla|kaydet|tara|koru)/u;
const STEP_WORDS=new Set(['first','then','after','before','finally','next','step','phase','sonra','ardından','önce','aşama','öncelikle','sırasıyla','once','finally']);
const DOMAIN_WORDS=new Set(['android','api','provider','model','memory','hook','security','architecture','workflow','pipeline','offline','entegrasyon','mimari','ai','studio','ajan','agent','orchestrator','orkestrasyon','bağımlılık','skill','beceri','otomatik','sistem','görev']);
export function scoreTaskComplexity(task){
 const t=textOf(task);if(!t)return 0;
 const tokens=t.toLowerCase().match(/[\p{L}\p{N}_]+/gu)||[];
 const words=tokens.length,signals=classifyTaskIntent(t);
 const actions=tokens.filter(token=>ACTION_PREFIX.test(token)).length;
 const steps=tokens.filter(token=>STEP_WORDS.has(token)).length;
 const separators=(t.match(/[,;]|\b(?:and|ve|also|ayrıca)\b/giu)||[]).length;
 const domainContext=tokens.some(token=>DOMAIN_WORDS.has(token));
 let score=Math.min(16,Math.floor(words/12)*3)
   +Math.min(35,actions*7)
   +Math.min(36,Math.max(0,signals.signals.length-1)*9)
   +Math.min(16,steps*4+Math.max(0,separators-1)*3);
 if(/[.!?;\n].*[.!?;\n]/s.test(t))score+=6;
 if(signals.riskLevel==='high')score+=8;else if(signals.riskLevel==='medium')score+=4;
 if(domainContext)score+=6;
 return clamp(score,0,100,0);
}
export function selectAgentWorkflow({task,enabled=true,providerCount=0,minScore=55,maxAgents=3}={}){
 const score=scoreTaskComplexity(task),threshold=clamp(minScore,30,90,55),intent=classifyTaskIntent(task),eligible=Boolean(enabled&&providerCount>=2&&score>=threshold),roles=[];
 // Keep the safety-critical reviewer in the suggested team even when the worker cap is small.
 if(intent.requiresSecurityReview)roles.push('security');
 if(intent.requiresImplementation)roles.push('builder');
 if(intent.requiresTesting&&!roles.includes('tester'))roles.push('tester');
 if(intent.requiresResearch)roles.push('researcher');
 if(intent.requiresPlanning)roles.push('architect');
 if(intent.requiresPerformanceReview)roles.push('optimizer');
 if(intent.requiresUxReview)roles.push('ux');
 if(intent.requiresDocumentation)roles.push('documenter');
 if(eligible)roles.push('reviewer');
 return {eligible,score,threshold,mode:!eligible?'single-agent':intent.requiresResearch&&!intent.requiresImplementation?'research-review':'staged-swarm',roles:[...new Set(roles)].slice(0,clamp(maxAgents,2,10,3)),intent,riskLevel:intent.riskLevel,reason:!enabled?'Otomatik atama kapalı.':providerCount<2?'İki uygun ücretsiz/yerel motor gerekli.':score<threshold?'Görev karmaşıklık eşiğinin altında.':'Uzman görev dağıtımı uygun.'};
}
export function shouldAutoDelegate({task,enabled=true,providerCount=0,minScore=55}={}){const r=selectAgentWorkflow({task,enabled,providerCount,minScore});return {eligible:r.eligible,score:r.score,threshold:r.threshold,reason:r.reason,mode:r.mode,roles:r.roles,riskLevel:r.riskLevel};}
export function classifyAgentRole(task){
 const roleGroups=[
  ['security',/^(security|sec|g[uü]venlik)(?:[-_\s].*)?$/i],
  ['test',/^(test|tester|qa|test[çc]i)(?:[-_\s].*)?$/i],
  ['research',/^(research|researcher|investigator|ara[sş]t[iı]rmac[iı])(?:[-_\s].*)?$/i],
  ['docs',/^(docs?|documenter|documentation|dok[uü]mantasyon)(?:[-_\s].*)?$/i],
  ['ux',/^(ux|user experience|ux specialist)(?:[-_\s].*)?$/i],
  ['performance',/^(performance|optimizer|perf|performans|optimizasyon)(?:[-_\s].*)?$/i],
  ['data',/^(data|database|veri)(?:[-_\s].*)?$/i],
  ['automation',/^(automation|automator|workflow|otomasyon|devops|sre|platform engineer|site reliability)(?:[-_\\s].*)?$/i],
  ['architecture',/^(architect|architecture|planner|planning|mimar|mimari)(?:[-_\s].*)?$/i],
  ['code',/^(builder|developer|implementer|coder|programmer|software engineer|backend|frontend|full stack|mobile developer|code|uygulay[iı]c[iı]|geli[sş]tirici)(?:[-_\\s].*)?$/i],
  ['general',/^(general|reviewer|review|auditor)(?:[-_\s].*)?$/i]
 ];
 for(const value of [task?.roleGroup,task?.role]){
  const explicit=String(value||'').trim();
  if(!explicit)continue;
  const match=roleGroups.find(([,pattern])=>pattern.test(explicit));
  if(match)return match[0];
 }
 const t=textOf(task),signals=classifyTaskIntent(t).signals;
 if(signals.includes('security'))return 'security';
 if(signals.includes('testing'))return 'test';
 if(signals.includes('research'))return 'research';
 if(signals.includes('docs'))return 'docs';
 if(signals.includes('ux'))return 'ux';
 if(signals.includes('performance'))return 'performance';
 if(signals.includes('data'))return 'data';
 if(signals.includes('automation'))return 'automation';
 if(signals.includes('planning'))return 'architecture';
 if(signals.includes('implementation'))return 'code';
 return 'general';
}
export function organizeTaskPlan(input,{maxTasks=10}={}){
 const warnings=[],seen=new Set(),tasks=(Array.isArray(input)?input:[]).slice(0,clamp(maxTasks,2,10,10)).map((x,i)=>{if(!x||typeof x!=='object')return null;const id=String(x.id||'task-'+(i+1)).toLowerCase().replace(/[^a-z0-9_-]/g,'-').slice(0,48),objective=String(x.objective||x.description||x.goal||'').trim();if(!id||!objective||seen.has(id)){warnings.push('Geçersiz/yinelenen görev atlandı: '+id);return null;}seen.add(id);return {id,title:String(x.title||'Görev '+(i+1)).slice(0,100),role:String(x.role||'Uzman ajan'),roleGroup:x.roleGroup||classifyAgentRole(x),objective,acceptance:Array.isArray(x.acceptance)?x.acceptance.slice(0,6):['Somut çıktı ve doğrulama adımı ver.'],files:Array.isArray(x.files)?x.files.slice(0,8):[],dependsOn:[...new Set((Array.isArray(x.dependsOn)?x.dependsOn:Array.isArray(x.dependencies)?x.dependencies:[]).map(String))].filter(v=>v!==id),priority:clamp(x.priority,1,5,3),order:i};}).filter(Boolean);
 const ids=new Set(tasks.map(x=>x.id));for(const x of tasks)x.dependsOn=x.dependsOn.filter(id=>{if(ids.has(id))return true;warnings.push(x.id+' bilinmeyen bağımlılığı kaldırdı: '+id);return false;});
 const pending=new Set(ids),byId=new Map(tasks.map(x=>[x.id,x])),stages=[];while(pending.size){let ready=tasks.filter(x=>pending.has(x.id)&&x.dependsOn.every(id=>!pending.has(id)));if(!ready.length){const last=[...pending].at(-1),x=byId.get(last),dep=x.dependsOn.find(id=>pending.has(id));if(dep){x.dependsOn=x.dependsOn.filter(id=>id!==dep);warnings.push('Bağımlılık döngüsü kırıldı: '+last+' → '+dep);continue;}break;}ready.sort((a,b)=>b.priority-a.priority||a.order-b.order);stages.push(ready.map(x=>({...x,stage:stages.length})));for(const x of ready)pending.delete(x.id);}
 return {tasks:stages.flat(),stages,warnings,stageCount:stages.length};
}
export function createDefaultTaskPlan(task,{maxTasks=3}={}){
 const i=classifyTaskIntent(task),raw=[],add=(id,title,role,objective,dependsOn=[],priority=3)=>raw.push({id,title,role,objective,dependsOn,priority,acceptance:['Somut çıktı ver','Varsayım ve riski belirt','Kontrol adımı yaz'],files:[]});
 if(i.requiresResearch)add('research','Araştırma','researcher','Gereksinimleri ve seçenekleri doğrula.');if(i.requiresPlanning)add('design','Mimari plan','architect','Kapsamı ve görev sırasını belirle.',i.requiresResearch?['research']:[],3);
 const prior=raw.length?[raw.at(-1).id]:[];if(i.requiresImplementation)add('implement','Uygulama','builder','En küçük güvenli çözümü hazırla.',prior,5);const impl=raw.find(x=>x.id==='implement');
 if(i.requiresTesting)add('verify','Test ve doğrulama','tester','Normal, sınır ve hata senaryolarını doğrula.',impl?['implement']:prior,5);if(i.requiresSecurityReview)add('security','Güvenlik incelemesi','security','Gizlilik ve güvenlik risklerini denetle.',impl?['implement']:prior,5);if(i.requiresPerformanceReview)add('performance','Performans','optimizer','RAM, CPU ve gecikmeyi değerlendir.',impl?['implement']:prior,3);if(i.requiresUxReview)add('ux','UX incelemesi','ux','Kullanılabilirliği değerlendir.',impl?['implement']:prior,3);if(i.requiresDocumentation)add('docs','Dokümantasyon','documenter','Kullanım ve sınırlamaları belgele.',impl?['implement']:prior,2);if(raw.length<2)add('review','Son inceleme','reviewer','Çıktıyı ve kalan riskleri denetle.',raw.map(x=>x.id),2);
 const limit=clamp(maxTasks,2,10,3),byId=new Map(raw.map(item=>[item.id,item]));
 const selected=raw.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,limit);
 const selectedIds=new Set(selected.map(item=>item.id));
 const collectMissingPrerequisites=(id,visited=new Set())=>{
  if(selectedIds.has(id)||visited.has(id))return [];
  visited.add(id);
  const prerequisite=byId.get(id);if(!prerequisite)return [];
  return [...prerequisite.dependsOn.flatMap(parent=>collectMissingPrerequisites(parent,visited)),prerequisite];
 };
 for(const item of selected){
  const folded=[...new Map(item.dependsOn.flatMap(id=>collectMissingPrerequisites(id)).map(dep=>[dep.id,dep])).values()];
  if(folded.length)item.objective='Ön koşul kapsamı: '+folded.map(dep=>dep.title+': '+dep.objective).join(' | ')+'. '+item.objective;
  item.dependsOn=item.dependsOn.filter(id=>selectedIds.has(id));
 }
 return organizeTaskPlan(selected,{maxTasks:limit}).tasks;
}
const affinity={security:['groq','gemini','ollama','device','openrouter','apinex'],test:['groq','ollama','device','gemini','openrouter','apinex'],research:['gemini','groq','openrouter','apinex','ollama','device'],docs:['gemini','groq','ollama','openrouter','apinex','device'],ux:['gemini','groq','ollama','device','openrouter','apinex'],performance:['ollama','device','groq','gemini','openrouter','apinex'],architecture:['gemini','groq','ollama','device','openrouter','apinex'],code:['ollama','device','groq','gemini','openrouter','apinex'],data:['ollama','device','groq','gemini','openrouter','apinex'],automation:['groq','gemini','ollama','device','openrouter','apinex'],general:['groq','gemini','ollama','device','openrouter','apinex']};
export function assignAgentProviders(tasks,providers){const pool=[...new Set((Array.isArray(providers)?providers:[]).filter(Boolean))].slice(1);if(!Array.isArray(tasks)||!pool.length)return [];const loads=new Map(pool.map(id=>[id,0]));return tasks.map((task,index)=>{const group=task?.roleGroup||classifyAgentRole(task),rank=affinity[group]||affinity.general;const best=pool.map((id,order)=>{const key=id.toLowerCase().replace(/[^a-z0-9]/g,''),alias=key.includes('ollama')?'ollama':key.includes('device')||key.includes('gguf')?'device':key.includes('groq')?'groq':key.includes('gemini')?'gemini':key.includes('openrouter')?'openrouter':key.includes('apinex')?'apinex':key;return {id,order,fit:rank.indexOf(alias)<0?0:rank.length-rank.indexOf(alias),load:loads.get(id)||0};}).sort((a,b)=>b.fit-a.fit||a.load-b.load||a.order-b.order)[0];loads.set(best.id,(loads.get(best.id)||0)+1);return {taskId:String(task?.id||'task-'+(index+1)),providerId:best.id,roleGroup:group,reason:group+' rol uyumu; mevcut yük '+(best.load||0)};});}
