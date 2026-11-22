export const AGENT_MEMORY_FORMAT='ai-studio-agent-memory-v1',MAX_AGENT_MEMORY_RECORDS=120,MAX_AGENT_MEMORY_PER_PROJECT=40,MAX_AGENT_MEMORY_CHARS=2400;
const clean=(v,n)=>String(v??'').replace(/\u0000/g,'').trim().slice(0,n);
export function containsSensitiveMemoryContent(value){const t=String(value??'');return [/-----BEGIN [A-Z ]*PRIVATE KEY-----/i,/\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,/\b(?:api[_-]?key|access[_-]?token|password|client[_-]?secret)\s*[:=]\s*[^,\s]{8,}/i,/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,/\b(?:medical|diagnosis|medication|prescription|thyroid|health record|tıbbi|ilaç|teşhis)\b/i].some(r=>r.test(t));}
export function createProjectMemoryRecord({projectId,title,content,tags=[],source='user',now=new Date().toISOString()}={}){
 const project=clean(projectId,120),label=clean(title,120),body=clean(content,MAX_AGENT_MEMORY_CHARS);
 if(!project)return {ok:false,reason:'Önce bir proje seç.'};if(!label||!body)return {ok:false,reason:'Başlık ve içerik boş olamaz.'};
 if(containsSensitiveMemoryContent(label+'\n'+body))return {ok:false,reason:'Hassas bilgi içerebilecek kayıt saklanmadı.'};
 const safeTags=[...new Set((Array.isArray(tags)?tags:String(tags).split(',')).map(x=>clean(x,32).toLowerCase()).filter(Boolean))].slice(0,12);
 return {ok:true,record:{id:'mem-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),projectId:project,title:label,content:body,tags:safeTags,source:clean(source,40)||'user',createdAt:clean(now,40)}};
}
export function normalizeProjectMemoryRecords(records){if(!Array.isArray(records))return [];const out=[],ids=new Set(),counts=new Map();
 for(const raw of records.slice(0,500)){if(!raw||typeof raw!=='object')continue;const id=clean(raw.id,100),projectId=clean(raw.projectId,120),title=clean(raw.title,120),content=clean(raw.content,MAX_AGENT_MEMORY_CHARS);
  if(!id||!projectId||!title||!content||ids.has(id)||containsSensitiveMemoryContent(title+'\n'+content))continue;const count=counts.get(projectId)||0;if(count>=MAX_AGENT_MEMORY_PER_PROJECT)continue;
  ids.add(id);counts.set(projectId,count+1);out.push({id,projectId,title,content,tags:[...new Set((Array.isArray(raw.tags)?raw.tags:[]).map(x=>clean(x,32)).filter(Boolean))].slice(0,12),source:clean(raw.source||'restored',40),createdAt:clean(raw.createdAt||new Date().toISOString(),40)});
  if(out.length>=MAX_AGENT_MEMORY_RECORDS)break;
 }return out;}
export function getProjectMemories(records,projectId){const id=clean(projectId,120);return id?normalizeProjectMemoryRecords(records).filter(x=>x.projectId===id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)):[];}
export function findRelevantProjectMemories(records,projectId,query,limit=3){
 const normalizedQuery=clean(query,3000).toLocaleLowerCase('tr-TR');
 const words=[...new Set(normalizedQuery.match(/[\p{L}\p{N}]{3,}/gu)||[])];
 const requestedLimit=Number(limit),maxItems=Number.isFinite(requestedLimit)?Math.max(0,Math.min(5,Math.floor(requestedLimit))):3;
 if(!words.length||maxItems===0)return [];
 return getProjectMemories(records,projectId).map(record=>{
  const title=record.title.toLocaleLowerCase('tr-TR'),all=(record.title+' '+record.tags.join(' ')+' '+record.content).toLocaleLowerCase('tr-TR');
  return {record,score:words.reduce((n,w)=>n+(all.includes(w)?(title.includes(w)?3:1):0),0)};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.record.createdAt.localeCompare(a.record.createdAt)).slice(0,maxItems).map(x=>x.record);
}
export function buildProjectMemoryContext(records,projectId,query,{maxRecords=3,maxChars=3000}={}){
 const requestedChars=Number(maxChars),charLimit=Number.isFinite(requestedChars)?Math.max(0,Math.min(6000,Math.floor(requestedChars))):3000;
 if(charLimit===0)return '';
 const found=findRelevantProjectMemories(records,projectId,query,maxRecords);if(!found.length)return '';
 let remaining=charLimit;const lines=['AI STUDIO PROJECT MEMORY (local records; verify against current files):'];
 for(const item of found){const chunk='\n- '+item.title+': '+item.content;if(chunk.length<=remaining){lines.push(chunk);remaining-=chunk.length;}}
 return lines.length>1?lines.join('').slice(0,charLimit):'';
}
export function createProjectMemoryBackup(records){return {format:AGENT_MEMORY_FORMAT,version:1,exportedAt:new Date().toISOString(),records:normalizeProjectMemoryRecords(records)};}
export function restoreProjectMemoryBackup(backup,existing=[]){if(!backup||backup.format!==AGENT_MEMORY_FORMAT||!Array.isArray(backup.records))throw Error('Hafıza yedeği biçimi tanınmadı.');const current=normalizeProjectMemoryRecords(existing),incoming=normalizeProjectMemoryRecords(backup.records),ids=new Set(current.map(x=>x.id)),merged=[...current];let imported=0;for(const item of incoming){if(ids.has(item.id))continue;ids.add(item.id);merged.push(item);imported++;}return {records:normalizeProjectMemoryRecords(merged.slice(-MAX_AGENT_MEMORY_RECORDS)),imported,rejected:backup.records.length-imported};}
