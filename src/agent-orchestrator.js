const clamp=(v,min,max,d)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):d;};
export function scoreTaskComplexity(task){
 const t=String(task??'').trim().toLowerCase();if(!t)return 0;let s=0;
 if(t.length>160)s+=10;if(t.length>360)s+=12;if(t.length>700)s+=10;
 const sentence=(t.match(/[.!?;\n]+/g)||[]).length+1;if(sentence>=3)s+=8;if(sentence>=6)s+=8;
 const actions=(t.match(/\b(?:plan|build|create|add|write|update|verify|run|connect|implement|integrate|review|audit|test|debug|refactor|migrate|compare|automate|document|secure|optimize|design|deploy|uygula|ekle|yaz|güncelle|doğrula|bağla|incele)\b/g)||[]).length;s+=Math.min(24,actions*4);
 const steps=(t.match(/\b(?:first|then|after|before|finally|next|phase|step|aşama|sonra|ardından|önce)\b/g)||[]).length;s+=Math.min(16,steps*4);
 if(/\b(?:agent|multi.?agent|provider|api|database|android|memory|hook|security|architecture|workflow|pipeline)\b/.test(t))s+=10;
 if(/\b(?:also|together|ayrıca|birlikte|bunun yanında)\b/.test(t))s+=6;return clamp(s,0,100,0);
}
export function shouldAutoDelegate({task,enabled=true,providerCount=0,minScore=55}={}){
 const score=scoreTaskComplexity(task),threshold=clamp(minScore,30,90,55);
 if(!enabled)return {eligible:false,score,threshold,reason:'Otomatik atama kapalı.'};
 if(providerCount<2)return {eligible:false,score,threshold,reason:'En az iki hazır ücretsiz/yerel motor gerekli.'};
 if(score<threshold)return {eligible:false,score,threshold,reason:'Görev eşiğin altında.'};
 return {eligible:true,score,threshold,reason:'Uzman ajanlara dağıtım uygun.'};
}
function roleGroup(task){
 const t=[task?.role,task?.title,task?.objective].join(' ').toLowerCase();
 if(/security|secure|audit|risk|privacy|shield|güvenlik|denetim/.test(t))return 'security';
 if(/test|qa|verification|verify|tdd|regression|testçi/.test(t))return 'test';
 if(/research|search|source|araştırma/.test(t))return 'research';
 if(/document|docs|writer|documentation|dokümantasyon/.test(t))return 'docs';
 if(/ux|ui|design|accessibility|arayüz|tasarım/.test(t))return 'ux';
 if(/performance|optimizer|memory|ram|latency|performans/.test(t))return 'performance';
 if(/architect|architecture|planner|plan|integrator|mimar/.test(t))return 'architecture';
 if(/builder|developer|coder|code|implement|kod|uygula/.test(t))return 'code';return 'general';
}
const affinity={security:['groq','gemini','ollama','device','openrouter','apinex'],test:['groq','ollama','device','gemini','openrouter','apinex'],research:['gemini','groq','openrouter','apinex','ollama','device'],docs:['gemini','groq','ollama','openrouter','apinex','device'],ux:['gemini','groq','ollama','device','openrouter','apinex'],performance:['ollama','device','groq','gemini','openrouter','apinex'],architecture:['gemini','groq','ollama','device','openrouter','apinex'],code:['ollama','device','groq','gemini','openrouter','apinex'],general:['groq','gemini','ollama','device','openrouter','apinex']};
export function assignAgentProviders(tasks,providers){
 const pool=[...new Set((Array.isArray(providers)?providers:[]).filter(Boolean))].slice(1);if(!Array.isArray(tasks)||!pool.length)return [];
 const loads=new Map(pool.map(id=>[id,0]));
 return tasks.map((task,index)=>{const group=roleGroup(task),rank=(affinity[group]||affinity.general);
  const best=pool.map((id,order)=>({id,order,fit:rank.indexOf(id)<0?0:rank.length-rank.indexOf(id),load:loads.get(id)||0})).sort((a,b)=>b.fit-a.fit||a.load-b.load||a.order-b.order)[0];
  const load=loads.get(best.id)||0;loads.set(best.id,load+1);return {taskId:String(task?.id||'task-'+(index+1)),providerId:best.id,roleGroup:group,reason:group+' rol uyumu; önceki yük '+load};
 });
}
