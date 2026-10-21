import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import './style.css';
import { reuseCatalog, buildLocalCoderStages, extractCodeArtifact, normalizeSnippet } from './workshop-data.js';
import { buildSharedProjectContext } from './project-context.js';
import { encryptWorkspaceBackup, decryptWorkspaceBackup } from './encrypted-backup.js';

const $ = (id) => document.getElementById(id);
const DB = {
  settings: 'ai-studio-settings-v2',
  projects: 'ai-studio-projects-v2',
  activeProject: 'ai-studio-active-project-v1',
  chat: 'ai-studio-chat-v2',
  plugins: 'ai-studio-prompt-plugins-v2',
  snippets: 'ai-studio-snippet-v1',
  activity: 'ai-studio-agent-activity-v1',
  codeFiles: 'ai-studio-code-files-v1'
};
const nativeApp = Capacitor.isNativePlatform();
const providers = {
  openai: { name:'OpenAI', icon:'O', kind:'openai', endpoint:'https://api.openai.com/v1/chat/completions', model:'gpt-5-mini', keyUrl:'https://platform.openai.com/api-keys', desc:'GPT modelleri · Chat Completions API' },
  anthropic: { name:'Anthropic / Claude', icon:'A', kind:'anthropic', endpoint:'https://api.anthropic.com/v1/messages', model:'claude-sonnet-5', keyUrl:'https://console.anthropic.com/settings/keys', desc:'Claude modelleri · Messages API' },
  gemini: { name:'Google Gemini', icon:'G', kind:'gemini', endpoint:'https://generativelanguage.googleapis.com/v1beta/models/', model:'gemini-3.8-flash', keyUrl:'https://aistudio.google.com/apikey', desc:'Gemini modelleri · generateContent' },
  deepseek: { name:'DeepSeek', icon:'D', kind:'openai', endpoint:'https://api.deepseek.com/chat/completions', model:'deepseek-chat', keyUrl:'https://platform.deepseek.com/api_keys', desc:'OpenAI uyumlu API · model kimliğini düzenleyebilirsin' },
  groq: { name:'Groq', icon:'Q', kind:'openai', endpoint:'https://api.groq.com/openai/v1/chat/completions', model:'llama-3.3-70b-versatile', keyUrl:'https://console.groq.com/keys', desc:'Hızlı çıkarım · kullanılabilir model listesi değişebilir' },
  openrouter: { name:'OpenRouter', icon:'R', kind:'openai', endpoint:'https://openrouter.ai/api/v1/chat/completions', model:'openai/gpt-5-mini', keyUrl:'https://openrouter.ai/keys', desc:'Birçok sağlayıcı için tek uyumlu API' },
  ollama: { name:'LocalCoder / Ollama (PC)', icon:'⌘', kind:'ollama', endpoint:'', model:'qwen2.5-coder:1.5b', keyUrl:'https://ollama.com/', desc:'Ağdaki bilgisayarda çalışan yerel model; telefona gömülü değil' }
};
const defaultSettings = {
  demoMode: true,
  models: Object.fromEntries(Object.entries(providers).map(([id,p]) => [id,p.model])),
  team: ['openai','gemini','ollama'],
  ollamaUrl: '',
  ollamaModel: 'qwen2.5-coder:1.5b',
  shareReusableContext: false,
  systemPrompt: 'Yanıtlarını açık ve uygulanabilir yaz. Bilmediğin şeyi uydurma. Kod istenince küçük, test edilebilir adımlar öner.'
};
let settings = structuredClone(defaultSettings);
let chatHistory = [];
let projectList = [];
let activeProjectId = '';
let userPlugins = [];
let reusableSnippets = [];
let agentActivity = [];
let sharedVaultItems = [];
let sharedVaultAgents = [];
let codeFiles = [];
let activeCodeFileId = '';
let codeFileSaveTimer = null;
let codeFileLoadLock = false;
let busy = false;
let toastTimer;
const runtimeKeys = Object.create(null);
const builtinTools = [
  { id:'plan', name:'Görevi böl', icon:'✳', desc:'Büyük fikri küçük işlere ayır.', prompt:'Şu görevi net, sıralı ve test edilebilir adımlara böl. Önce MVP ve riskleri belirt.\n\nGörev: {{gorev}}' },
  { id:'debug', name:'Hata ayıkla', icon:'⌁', desc:'Belirti, olası neden ve test.', prompt:'Bu kodu hata ayıklama gözüyle incele. Önce gözlenen sorunu açıklığa kavuştur, olası nedenleri sırala, en küçük düzeltmeyi ve testini ver. Kodu çalıştırmadıysan bunu belirt.\n\nGörev / kod: {{gorev}}' },
  { id:'review', name:'Kod incelemesi', icon:'✓', desc:'Güvenlik, kalite ve bakım.', prompt:'Bu kodu güvenlik, doğruluk, performans ve bakım açısından gözden geçir. En kritik üç sorunu ve önerilen düzeltmeyi yaz. Belirsiz bulguyu kesinmiş gibi sunma.\n\nKod: {{gorev}}' },
  { id:'explain', name:'Kodu açıkla', icon:'≋', desc:'Başlangıç seviyesinde anlatım.', prompt:'Bu kodun ne yaptığını adım adım, yeni başlayan birine anlat. Girdi, çıktı, önemli fonksiyonlar ve muhtemel hata durumlarını belirt.\n\nKod: {{gorev}}' },
  { id:'tests', name:'Test tasarla', icon:'⊞', desc:'Başarı ve hata senaryoları.', prompt:'Bu özellik için manuel ve otomatik test senaryoları hazırla. Normal akış, sınır değer, hata durumu ve regresyon kontrolleri ekle.\n\nÖzellik: {{gorev}}' },
  { id:'game', name:'Oyun mimarisi', icon:'◇', desc:'Modüller ve MVP planı.', prompt:'Bu oyun özelliği için hafif, modüler bir mimari öner. Dosya sınırları, arayüzler, veri akışı, ilk MVP ve test planını belirt. Var olmayan araç veya dosyaları varmış gibi gösterme.\n\nÖzellik: {{gorev}}' }
];
function clone(x){ return JSON.parse(JSON.stringify(x)); }
function esc(x){ return String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showToast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),3200); }
function go(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id)); document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===id)); window.scrollTo({top:0,behavior:'smooth'}); }
function downloadText(name,content,type='text/plain;charset=utf-8'){ const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500); }
async function getPref(key,fallback){try{const r=await Preferences.get({key}); return r.value==null?fallback:JSON.parse(r.value);}catch(_){return fallback;}}
async function setPref(key,value){await Preferences.set({key,value:JSON.stringify(value)});}
async function removePref(key){try{await Preferences.remove({key});}catch(_){}}
const CODE_LANGUAGES = ['javascript','html','css','python','json','markdown','text'];
function makeRecordId(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());}
function safeCodeFileName(value){
  const name=String(value||'untitled.js').trim().replace(/[\\/:*?"<>|]/g,'_').slice(0,120);
  return name||'untitled.js';
}
function uniqueCodeFileName(value,names){
  const existing=new Set(names.map(n=>String(n).toLowerCase()));
  const name=safeCodeFileName(value);
  if(!existing.has(name.toLowerCase()))return name;
  const dot=name.lastIndexOf('.');
  const base=dot>0?name.slice(0,dot):name,ext=dot>0?name.slice(dot):'';
  let n=2,candidate='';
  do{candidate=base+' ('+n+++')'+ext;}while(existing.has(candidate.toLowerCase()));
  return candidate;
}
function inferCodeLanguage(name,fallback='text'){
  const ext=String(name||'').split('.').pop().toLowerCase();
  const map={js:'javascript',mjs:'javascript',cjs:'javascript',ts:'javascript',html:'html',htm:'html',css:'css',py:'python',json:'json',md:'markdown',txt:'text'};
  return map[ext]|| (CODE_LANGUAGES.includes(fallback)?fallback:'text');
}
function makeCodeFile(name='main.js',language='javascript',content=''){
  return {id:makeRecordId(),name:safeCodeFileName(name),language:CODE_LANGUAGES.includes(language)?language:inferCodeLanguage(name),content:String(content||'').slice(0,100000),updated:new Date().toISOString()};
}
function normalizeCodeFileList(rawFiles,preserveIds=true){
  if(!Array.isArray(rawFiles))return [];
  const out=[];
  for(const raw of rawFiles.slice(0,100)){
    if(!raw||typeof raw.name!=='string'||typeof raw.content!=='string')continue;
    const name=uniqueCodeFileName(raw.name,out.map(f=>f.name));
    let id=preserveIds&&typeof raw.id==='string'&&raw.id.trim()?raw.id.slice(0,100):makeRecordId();
    if(out.some(f=>f.id===id))id=makeRecordId();
    out.push({id,name,language:inferCodeLanguage(name,raw.language),content:raw.content.slice(0,100000),updated:typeof raw.updated==='string'?raw.updated.slice(0,50):new Date().toISOString()});
  }
  return out;
}
function renderCodeFileSelector(){
  const select=$('savedCodeFileSelect');if(!select)return;
  select.innerHTML=codeFiles.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>').join('');
  if(!codeFiles.some(f=>f.id===activeCodeFileId))activeCodeFileId=codeFiles[0]?.id||'';
  select.value=activeCodeFileId;
}
function loadActiveCodeFile(){
  const file=codeFiles.find(f=>f.id===activeCodeFileId);
  codeFileLoadLock=true;
  $('savedCodeFileName').value=file?.name||'main.js';
  $('codeLanguage').value=file?.language||'javascript';
  $('codePad').value=file?.content||'';
  renderCodeFileSelector();
  codeFileLoadLock=false;
}
async function saveCurrentCodeFile(notify=false){
  if(codeFileLoadLock)return;
  let file=codeFiles.find(f=>f.id===activeCodeFileId);
  if(!file){file=makeCodeFile($('savedCodeFileName').value||'main.js',$('codeLanguage').value,$('codePad').value);codeFiles.unshift(file);activeCodeFileId=file.id;}
  file.name=uniqueCodeFileName($('savedCodeFileName').value||file.name,codeFiles.filter(f=>f.id!==file.id).map(f=>f.name));
  file.language=CODE_LANGUAGES.includes($('codeLanguage').value)?$('codeLanguage').value:'text';
  file.content=$('codePad').value.slice(0,100000);
  file.updated=new Date().toISOString();
  $('savedCodeFileName').value=file.name;
  await setPref(DB.codeFiles,codeFiles);
  renderCodeFileSelector();
  if(notify)showToast('Dosya bu cihazın çalışma alanına kaydedildi.');
}
function scheduleCodeFileSave(){
  if(codeFileLoadLock)return;
  clearTimeout(codeFileSaveTimer);
  codeFileSaveTimer=setTimeout(()=>saveCurrentCodeFile(false).catch(()=>showToast('Kod dosyası otomatik kaydedilemedi; Kaydet düğmesini dene.')),700);
}
async function createCodeFile(){
  await saveCurrentCodeFile(false);
  const name=uniqueCodeFileName('new-file.js',codeFiles.map(f=>f.name));
  const file=makeCodeFile(name,'javascript','');
  codeFiles.unshift(file);activeCodeFileId=file.id;
  await setPref(DB.codeFiles,codeFiles);loadActiveCodeFile();showToast('Yeni kod dosyası oluşturuldu.');
}
async function selectCodeFile(id){
  if(!id||!codeFiles.some(f=>f.id===id))return;
  await saveCurrentCodeFile(false);activeCodeFileId=id;loadActiveCodeFile();
}
async function deleteActiveCodeFile(){
  const file=codeFiles.find(f=>f.id===activeCodeFileId);
  if(!file)return;
  if(!confirm('"'+file.name+'" dosyası bu cihazın çalışma alanından silinsin mi?'))return;
  codeFiles=codeFiles.filter(f=>f.id!==file.id);
  if(!codeFiles.length)codeFiles=[makeCodeFile()];
  activeCodeFileId=codeFiles[0].id;
  await setPref(DB.codeFiles,codeFiles);loadActiveCodeFile();showToast('Dosya kasadan silindi.');
}
async function exportCodeFiles(){
  await saveCurrentCodeFile(false);
  downloadText('ai-studio-code-files.json',JSON.stringify({format:'ai-studio-code-files-v1',exportedAt:new Date().toISOString(),activeFileId:activeCodeFileId,files:codeFiles},null,2),'application/json;charset=utf-8');
}
async function importCodeFileCollection(file){
  try{
    if(!file||file.size>5_000_000)throw new Error('Dosya eksik veya 5 MB sınırını aşıyor.');
    const data=JSON.parse(await file.text());
    const incoming=Array.isArray(data)?data:(data?.format==='ai-studio-code-files-v1'?data.files:null);
    if(!Array.isArray(incoming))throw new Error('JSON içinde dosya listesi bulunamadı.');
    const normalized=normalizeCodeFileList(incoming,false);
    if(!normalized.length)throw new Error('İçe aktarılabilir dosya bulunamadı.');
    for(const item of normalized){
      item.name=uniqueCodeFileName(item.name,codeFiles.map(f=>f.name));
      item.id=makeRecordId();codeFiles.unshift(item);
    }
    codeFiles=codeFiles.slice(0,100);activeCodeFileId=normalized[0].id;
    await setPref(DB.codeFiles,codeFiles);loadActiveCodeFile();
    showToast(normalized.length+' kod dosyası içe aktarıldı.');
  }catch(error){showToast('Dosya kasası içe aktarılamadı: '+(error.message||'JSON dosyasını kontrol et.'));}
}

function providerModel(id){return id==='ollama' ? (settings.ollamaModel||settings.models.ollama||providers.ollama.model) : (settings.models[id]||providers[id].model);}
function syncModeUI(){ $('demoToggle').checked=!!settings.demoMode; $('settingsDemoToggle').checked=!!settings.demoMode; $('modePill').textContent=settings.demoMode?'DEMO MODU':'GERÇEK MODEL'; $('modePill').className='pill '+(settings.demoMode?'safe':'live'); $('connectedCount').textContent=Object.keys(providers).filter(id=>id==='ollama'?!!settings.ollamaUrl:!!runtimeKeys[id]).length; $('providerState').textContent=settings.demoMode?'Demo yanıtı':(runtimeKeys[$('chatProvider').value]?'Anahtar hazır':($('chatProvider').value==='ollama'?'Yerel uç nokta':'Anahtar gerekli')); }
async function getSecret(id){ if(!nativeApp)return runtimeKeys[id]||''; try{const r=await SecureStoragePlugin.get({key:'ai-studio-provider-'+id}); return r?.value||'';}catch(_){return '';} }
async function saveSecret(id,key){ if(!key.trim())return; if(!nativeApp){runtimeKeys[id]=key.trim(); showToast('Önizleme: anahtar yalnızca bu açık oturumda tutulur, güvenli şekilde kaydedilmez.');return;} await SecureStoragePlugin.set({key:'ai-studio-provider-'+id,value:key.trim()}); runtimeKeys[id]=key.trim(); }
async function deleteSecret(id){ if(!nativeApp){delete runtimeKeys[id];return;} try{await SecureStoragePlugin.remove({key:'ai-studio-provider-'+id});}catch(_){} delete runtimeKeys[id]; }
async function initKeys(){ for(const id of Object.keys(providers)){runtimeKeys[id]=nativeApp?await getSecret(id):'';} }
function renderProviderCards(){
  $('providerGrid').innerHTML=Object.entries(providers).map(([id,p])=>{
    const configured=id==='ollama'?!!settings.ollamaUrl:!!runtimeKeys[id];
    const isTeam=settings.team.includes(id);
    const model=id==='ollama'?(settings.ollamaModel||p.model):providerModel(id);
    return '<article class="provider-card" data-provider-card="'+id+'"><div class="provider-head"><span class="provider-icon">'+esc(p.icon)+'</span><div class="provider-title"><h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p></div><span id="state-'+id+'" class="provider-state '+(configured?'connected':'')+'">'+(configured?'Ayarlı':'Bağlı değil')+'</span></div>'+
      '<label class="field-label" for="model-'+id+'">Model kimliği</label><input class="input" id="model-'+id+'" value="'+esc(model)+'" maxlength="140" autocomplete="off">'+
      (id==='ollama'?'':'<label class="field-label" for="key-'+id+'">API anahtarı</label><input class="input provider-key" type="password" id="key-'+id+'" placeholder="'+(configured?'Kayıtlı anahtar gizli':'Anahtarı buraya yapıştır')+'" autocomplete="new-password" autocapitalize="off" spellcheck="false">'+
        '<div class="provider-help"><a href="'+esc(p.keyUrl)+'" target="_blank" rel="noopener noreferrer">Resmî anahtar sayfasını aç ↗</a><label class="team-check"><input type="checkbox" data-team="'+id+'" '+(isTeam?'checked':'')+'> Takım turuna ekle</label></div>'+
        '<div class="provider-actions"><button class="btn secondary small" data-save-key="'+id+'">Model / anahtarı kaydet</button><button class="btn ghost small" data-test-provider="'+id+'">Bağlantıyı test et</button><button class="btn ghost small danger-text" data-delete-key="'+id+'">Anahtarı sil</button></div>')+
      (id==='ollama'?'<div class="provider-help"><span class="fineprint">Adres ve model aşağıdaki yerel bağlantı bölümünde ayarlanır.</span><label class="team-check"><input type="checkbox" data-team="ollama" '+(isTeam?'checked':'')+'> Takım turuna ekle</label></div>':'')+
    '</article>';
  }).join('');
  $('teamChips').innerHTML=Object.entries(providers).map(([id,p])=>'<label class="chip"><input type="checkbox" data-team="'+id+'" '+(settings.team.includes(id)?'checked':'')+'>'+esc(p.name)+'</label>').join('');
  $('ollamaUrl').value=settings.ollamaUrl||''; $('ollamaModel').value=settings.ollamaModel||providers.ollama.model;
  $('chatProvider').innerHTML=Object.entries(providers).map(([id,p])=>'<option value="'+id+'">'+esc(p.name)+'</option>').join('');
  $('chatProvider').value='openai'; syncModeUI();
}
function demoAnswer(providerId,prompt,roleOverride){
  const name=providers[providerId]?.name||'AI Studio';
  const role=roleOverride || ({openai:'Planlayıcı',anthropic:'Kalite gözden geçirici',gemini:'Fikir üretici',deepseek:'Akıl yürütme',groq:'Hızlı yardımcı',openrouter:'Model yönlendirici',ollama:'LocalCoder taslağı'}[providerId]||'Yardımcı');
  const base={
    openai:'Önce hedefi ve başarı ölçütünü netleştir. Ardından en küçük çalışan sürümü oluştur, alt görevlere böl ve her parçayı test et.',
    anthropic:'Kapsamı sınırla, hata durumlarını düşün ve mevcut dosyalara dokunmadan önce yedek / değişiklik planı belirle.',
    gemini:'Üç yaklaşım düşün: basit prototip, modüler sürüm ve daha sonra genişletilecek tasarım. En ucuz doğrulamayı önce yap.',
    deepseek:'Girdi → işlem → çıktı akışını açıkça tanımla. Kritik varsayımları kontrol et ve tekrarlanabilir bir test ekle.',
    groq:'İlk sürüm için en gerekli özelliği seç. Çalıştığını gösteren tek test kur; sonra sıradaki özelliğe geç.',
    openrouter:'İş için hangi modelin gerektiğini belirle. Hız, maliyet ve kaliteyi karşılaştır; başarısız sağlayıcı için alternatif plan hazırla.',
    ollama:'Yerel kod yardımcısı taslağı: 1) ilgili dosyaları oku, 2) küçük değişiklik öner, 3) test çalıştır, 4) farkları incele. Bu yanıt gerçek yerel model çıktısı değildir.'
  };
  return '['+role+' · DEMO ŞABLONU]\n\n'+(base[providerId]||base.openai)+'\n\nGörev: '+prompt+'\n\nNot: Bu gerçek model çağrısı değildir; Demo modu açıktır.';
}
function pushMessage(role,content,meta){ chatHistory.push({role,content,provider:meta?.provider||'',mode:meta?.mode||'demo',time:new Date().toISOString()}); if(chatHistory.length>80)chatHistory=chatHistory.slice(-80); renderChat(); persistChat(); }
function renderChat(){ const out=$('chatMessages'); if(!chatHistory.length){out.innerHTML='<div class="result-card"><div class="result-label">AI STUDIO</div><p>Selam! Demo modu açık. Bir görev yazabilir ya da Modeller ekranından sağlayıcı bağlayabilirsin.</p></div>';return;} out.innerHTML=chatHistory.map(m=>'<article class="chat-bubble '+(m.role==='user'?'user':'assistant')+'"><div class="chat-meta">'+(m.role==='user'?'SEN':esc(m.provider||'AI STUDIO'))+' · '+(m.mode==='error'?'HATA':m.mode==='live'?'GERÇEK MODEL':'DEMO')+'</div><div class="chat-text '+(m.mode==='error'?'error':'')+'">'+esc(m.content)+'</div></article>').join(''); out.scrollTop=out.scrollHeight; }
let chatPersistTimer;
function persistChat(){clearTimeout(chatPersistTimer);chatPersistTimer=setTimeout(()=>setPref(DB.chat,chatHistory).catch(()=>showToast('Sohbet kaydı başarısız oldu.')),250);}
function chatContext(){return chatHistory.slice(-10).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content}));}
function getActiveProject(){return projectList.find(p=>p&&p.id===activeProjectId)||null;}
function getSharedProjectContext(){return buildSharedProjectContext({project:getActiveProject(),files:codeFiles,activeFileId:activeCodeFileId,includeReusable:settings.shareReusableContext===true,snippets:reusableSnippets});}
function renderProjectContextStatus(){
  const toggle=$('shareReusableContext');if(toggle)toggle.checked=settings.shareReusableContext===true;
  const status=$('projectContextStatus');if(!status)return;
  const project=getActiveProject();
  if(!project){status.textContent='Aktif proje seçilmedi. Ajanlar ortak bir proje notu almayacak.';return;}
  const fileCount=settings.shareReusableContext===true?Math.min(3,codeFiles.length):0;
  const snippetCount=settings.shareReusableContext===true?Math.min(2,reusableSnippets.length):0;
  status.textContent='Aktif bağlam: '+project.name+' · '+(settings.shareReusableContext===true?fileCount+' kod dosyası ve en fazla '+snippetCount+' kasa parçası paylaşılabilir.':'yalnızca proje notları paylaşılır.');
}
function systemFor(id){const context=getSharedProjectContext();return settings.systemPrompt+'\nSağlayıcı rolü: '+providers[id].name+'. Yanıtları Türkçe ve uygulanabilir yaz; var olmayan test sonuçlarını iddia etme.'+(context?'\n\n'+context:'');}
async function fetchJson(url,options,timeoutMs=50000){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const response=await fetch(url,{...options,signal:controller.signal}); const text=await response.text(); let data={}; try{data=text?JSON.parse(text):{};}catch(_){data={message:text.slice(0,1000)};}
    if(!response.ok){const message=data?.error?.message||data?.message||('HTTP '+response.status);throw new Error(String(message).slice(0,500));}
    return data;
  }catch(err){if(err?.name==='AbortError')throw new Error('İstek zaman aşımına uğradı. İnterneti, model adını ve sağlayıcı durumunu kontrol et.'); if(err instanceof TypeError)throw new Error('Ağa erişilemedi veya sağlayıcı isteği engelledi (CORS/bağlantı). İnterneti, uç noktayı ve API anahtarını kontrol et.'); throw err;}
  finally{clearTimeout(timer);}
}
async function callProvider(id,prompt,history){
  if(id==='ollama'){
    const url=(settings.ollamaUrl||'').trim().replace(/\/+$/,''); const model=(settings.ollamaModel||providerModel(id)).trim();
    if(!url||!model)throw new Error('Ollama adresi ve model adı eksik.'); let parsed; try{parsed=new URL(url);}catch(_){throw new Error('Ollama adresi geçerli bir URL olmalı.');}
    if(!['http:','https:'].includes(parsed.protocol))throw new Error('Ollama adresi http:// veya https:// ile başlamalı.');
    const messages=[{role:'system',content:systemFor(id)}].concat(history.slice(-8).map(m=>({role:m.role,content:m.content}))).concat([{role:'user',content:prompt}]);
    const d=await fetchJson(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:false,options:{temperature:0.4}})});
    const answer=d?.message?.content;if(!answer)throw new Error('Ollama yanıtında mesaj yok. Model adını ve sunucuyu kontrol et.');return answer;
  }
  const p=providers[id]; const key=await getSecret(id); if(!key)throw new Error(p.name+' için API anahtarı ayarlanmamış. Modeller ekranından ekle.');
  const msgs=history.slice(-8).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content})); msgs.push({role:'user',content:prompt});
  if(p.kind==='anthropic'){
    const d=await fetchJson(p.endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:providerModel(id),max_tokens:2048,system:systemFor(id),messages:msgs.filter(m=>m.role==='user'||m.role==='assistant')})});
    const text=(d.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');if(!text)throw new Error('Claude yanıtında metin bulunamadı.');return text;
  }
  if(p.kind==='gemini'){
    const contents=msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
    const url=p.endpoint+encodeURIComponent(providerModel(id))+':generateContent?key='+encodeURIComponent(key);
    const d=await fetchJson(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:systemFor(id)}]},contents,generationConfig:{temperature:0.4,maxOutputTokens:2048}})});
    const text=(d.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n');if(!text)throw new Error(d.promptFeedback?.blockReason||'Gemini yanıtında metin bulunamadı.');return text;
  }
  const openAiBody={model:providerModel(id),messages:[{role:'system',content:systemFor(id)},...msgs]};
  if(id==='openai'){openAiBody.max_completion_tokens=2048;}
  else {openAiBody.temperature=0.4;openAiBody.max_tokens=2048;}
  const d=await fetchJson(p.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify(openAiBody)});
  const message=d.choices?.[0]?.message?.content;
  const text=Array.isArray(message)?message.map(x=>x.text||'').join('\n'):message;
  if(!text)throw new Error('Yanıtta metin bulunamadı. Model kimliğinin bu API üzerinde kullanılabildiğini doğrula.');return text;
}
async function submitChat(prompt,providerId,roleOverride){
  if(busy)return;const text=prompt.trim();if(!text)return;busy=true;$('chatInput').disabled=true;$('chatForm').querySelector('[type=submit]').disabled=true;
  pushMessage('user',text,{mode:settings.demoMode?'demo':'live'});const out=$('chatMessages'),loading=document.createElement('article');loading.className='result-card';loading.innerHTML='<div class="result-label">YANIT HAZIRLANIYOR</div><p>Seçili sağlayıcıdan yanıt bekleniyor…</p>';out.append(loading);
  await logAgentActivity('Tekli sohbet · '+providers[providerId].name,'Başladı',text);
  try{let answer,mode;if(settings.demoMode){answer=demoAnswer(providerId,text,roleOverride);mode='demo';}else{answer=await callProvider(providerId,text,chatContext().slice(0,-1));mode='live';}
    loading.remove();pushMessage('assistant',answer,{provider:providers[providerId].name,mode});await logAgentActivity('Tekli sohbet · '+providers[providerId].name,'Tamamlandı',(mode==='demo'?'Demo şablonu üretildi. ':'Gerçek model yanıt verdi. ')+answer.slice(0,180));
  }catch(err){loading.remove();pushMessage('assistant','Hata: '+(err?.message||'Bilinmeyen hata')+'\n\nGerçek yanıt alınmadı. Model, anahtar, kota ve bağlantıyı kontrol et.',{provider:providers[providerId].name,mode:'error'});await logAgentActivity('Tekli sohbet · '+providers[providerId].name,'Hata',err?.message||'Bilinmeyen hata');}
  finally{busy=false;$('chatInput').disabled=false;$('chatForm').querySelector('[type=submit]').disabled=false;$('chatInput').focus();syncModeUI();}
}
async function runTeam(prompt){
  if(busy)return;const task=String(prompt||'').trim(),selected=settings.team.slice(0,4);if(!task){showToast('Önce takımın görevini yaz.');return;}if(!selected.length){showToast('Önce Modeller ekranında takım ajanı seç.');return;}
  if(!settings.demoMode&&!confirm('Takım turu en fazla '+selected.length+' gerçek API isteği gönderebilir; ücret oluşabilir. Devam edilsin mi?'))return;
  busy=true;await logAgentActivity('Paralel takım','Başladı',selected.map(id=>providers[id].name).join(', ')+': '+task);
  if(settings.demoMode){pushMessage('user',task,{mode:'demo'});selected.forEach(id=>pushMessage('assistant',demoAnswer(id,task),{provider:providers[id].name,mode:'demo'}));await logAgentActivity('Paralel takım','Tamamlandı',selected.length+' demo şablonu üretildi; gerçek model çağrısı yapılmadı.');busy=false;return;}
  pushMessage('user',task,{mode:'live'});const out=$('chatMessages'),load=document.createElement('article');load.className='result-card';load.innerHTML='<div class="result-label">TAKIM TURU</div><p>Seçili ajanlar çalışıyor…</p>';out.append(load);
  const history=chatContext().slice(0,-1);
  try{const results=await Promise.all(selected.map(async id=>{try{return{id,answer:await callProvider(id,task,history)};}catch(e){return{id,error:e?.message||'Hata'};}}));load.remove();
    results.forEach(r=>pushMessage('assistant',r.error?'Hata: '+r.error:r.answer,{provider:providers[r.id].name,mode:r.error?'error':'live'}));
    for(const r of results)await logAgentActivity('Paralel ajan · '+providers[r.id].name,r.error?'Hata':'Tamamlandı',r.error||String(r.answer||'').slice(0,180));
    await logAgentActivity('Paralel takım',results.some(r=>r.error)?'Kısmi başarı':'Tamamlandı',results.filter(r=>!r.error).length+'/'+results.length+' ajan başarılı.');
  }catch(error){load.remove();await logAgentActivity('Paralel takım','Hata',error?.message||'Bilinmeyen hata');showToast('Takım çalışması tamamlanamadı.');}finally{busy=false;syncModeUI();}
}
async function runPipeline(prompt){
  if(busy)return;const task=prompt.trim(),selected=settings.team.slice(0,4);if(!task){showToast('Önce iş akışının görevini yaz.');return;}if(selected.length<2){showToast('Sıralı zincir için en az iki ajan seç.');go('models');return;}
  if(!settings.demoMode&&!confirm('Sıralı ajan zinciri '+selected.length+' gerçek API isteği gönderebilir ve ücret oluşturabilir. Her ajan bir öncekinin çıktısını görür. Devam?'))return;
  busy=true;$('chatInput').disabled=true;$('chatForm').querySelector('[type=submit]').disabled=true;$('teamRun').disabled=true;$('pipelineRun').disabled=true;
  await logAgentActivity('Sıralı ajan zinciri','Başladı',selected.length+' aşama: '+task);pushMessage('user',task,{mode:settings.demoMode?'demo':'live'});
  const out=$('chatMessages'),loading=document.createElement('article');loading.className='result-card';loading.innerHTML='<div class="result-label">SIRALI AJAN ZİNCİRİ</div><p>Planla → geliştir → eleştir → test et aşamaları çalışıyor…</p>';out.append(loading);
  let previous='';const stageRoles=['Mimar / planlayıcı','Uygulayıcı','Bağımsız gözden geçirici','Testçi / son kontrol'];
  try{for(let i=0;i<selected.length;i++){const id=selected[i],title='Aşama '+(i+1)+' · '+providers[id].name;
      await logAgentActivity('Sıralı zincir · '+title,'Çalışıyor',stageRoles[Math.min(i,stageRoles.length-1)]);
      const stagePrompt='İş akışı aşaması '+(i+1)+'/'+selected.length+'. Rolün: '+stageRoles[Math.min(i,stageRoles.length-1)]+'.\nAsıl görev: '+task+'\n'+(previous?'Önceki ajanın çıktısı:\n'+previous+'\n':'')+'Görev: '+(i===0?'Uygulanabilir bir plan ve riskleri çıkar.':i===1?'Planı somut, modüler ve test edilebilir sonuca dönüştür.':i===2?'Önceki çıktıyı bağımsız değerlendir; hataları ve eksikleri düzelt.':'Son çıktıyı kontrol et; test senaryolarını, kalan işleri ve kabul ölçütlerini listele.')+'\nBilmediğin şeyi uydurma, kodu gerçekten çalıştırmadıysan çalıştırdığını iddia etme.';
      const answer=settings.demoMode?demoAnswer(id,stagePrompt,stageRoles[Math.min(i,stageRoles.length-1)]):await callProvider(id,stagePrompt,chatContext().slice(0,-1));previous=answer;
      pushMessage('assistant','AŞAMA '+(i+1)+'/'+selected.length+'\n'+answer,{provider:providers[id].name,mode:settings.demoMode?'demo':'live'});
      await logAgentActivity('Sıralı zincir · '+title,'Tamamlandı',answer.slice(0,180));loading.querySelector('p').textContent='Tamamlanan aşama: '+(i+1)+'/'+selected.length+' · '+providers[id].name;
    }
    loading.remove();await logAgentActivity('Sıralı ajan zinciri','Tamamlandı',selected.length+' aşama tamamlandı. Testler otomatik çalıştırılmadı.');showToast('Sıralı ajan zinciri tamamlandı.');
  }catch(err){loading.remove();pushMessage('assistant','Zincir durdu: '+(err?.message||'Bilinmeyen hata')+'\nÖnceki aşamalar sohbet geçmişinde duruyor; kalan aşamaları kontrol edip yeniden deneyebilirsin.',{provider:'AI STUDIO',mode:'error'});await logAgentActivity('Sıralı ajan zinciri','Hata',err?.message||'Bilinmeyen hata');}
  finally{busy=false;$('chatInput').disabled=false;$('chatForm').querySelector('[type=submit]').disabled=false;$('teamRun').disabled=false;$('pipelineRun').disabled=false;syncModeUI();}
}
function renderCompareResults(results){$('compareResults').innerHTML=results.map(r=>'<article class="result-card"><div class="result-label">'+esc(providers[r.id].name)+' · '+(r.error?'HATA':r.mode==='live'?'GERÇEK MODEL':'DEMO ŞABLONU')+'</div><p>'+esc(r.error||r.answer)+'</p></article>').join('');}
async function runCompare(){
  if(busy){showToast('Başka bir ajan işi çalışıyor.');return;}const prompt=$('comparePrompt').value.trim();if(!prompt){showToast('Önce karşılaştırılacak görevi yaz.');return;}
  const selected=settings.team.slice(0,4);if(selected.length<2){showToast('Karşılaştırmak için en az iki ajan seç.');go('models');return;}
  if(!settings.demoMode&&!confirm('Karşılaştırma '+selected.length+' gerçek API isteği gönderebilir; ücret oluşabilir. Devam?'))return;
  busy=true;$('compareRun').disabled=true;$('compareRun').textContent='Çalışıyor…';$('compareResults').innerHTML='<div class="panel"><p>Sonuçlar bekleniyor…</p></div>';
  await logAgentActivity('Model karşılaştırma','Başladı',selected.map(id=>providers[id].name).join(', ')+': '+prompt);
  try{const results=await Promise.all(selected.map(async id=>{try{return{id,answer:settings.demoMode?demoAnswer(id,prompt):await callProvider(id,prompt,[]),mode:settings.demoMode?'demo':'live'};}catch(e){return{id,error:e?.message||'Hata',mode:'error'};}}));
    renderCompareResults(results);for(const r of results)await logAgentActivity('Karşılaştırma · '+providers[r.id].name,r.error?'Hata':'Tamamlandı',r.error||String(r.answer||'').slice(0,180));
    await logAgentActivity('Model karşılaştırma',results.some(r=>r.error)?'Kısmi başarı':'Tamamlandı',results.filter(r=>!r.error).length+'/'+results.length+' yanıt başarılı.');
  }catch(error){await logAgentActivity('Model karşılaştırma','Hata',error?.message||'Bilinmeyen hata');showToast('Karşılaştırma başarısız oldu.');}
  finally{$('compareRun').disabled=false;$('compareRun').textContent='Karşılaştırmayı başlat';busy=false;syncModeUI();}
}
function renderProjects(){
  const out=$('projectList');$('projectCount').textContent=projectList.length;
  if(!projectList.length){out.innerHTML='<div class="panel"><p class="muted">Henüz proje yok. İlk fikrini yukarıdan kaydet.</p></div>';renderProjectContextStatus();return;}
  out.innerHTML=projectList.map((p,i)=>{
    const active=p.id===activeProjectId;
    return '<article class="project-card"><div class="project-head"><h3>'+esc(p.name)+'</h3><div class="row-actions">'+(active?'<span class="pill">AKTİF BAĞLAM</span>':'')+'<time>'+esc(new Date(p.updated||Date.now()).toLocaleDateString('tr-TR'))+'</time></div></div><p>'+esc(p.notes)+'</p><div class="row-actions"><button class="btn '+(active?'primary':'secondary')+' small" data-project-activate="'+esc(p.id)+'">'+(active?'Bağlam seçildi':'Ajan bağlamı yap')+'</button><button class="btn ghost small" data-project-export="'+i+'">Markdown indir</button><button class="btn ghost small" data-project-open="'+i+'">Sohbette kullan</button><span class="grow"></span><button class="btn danger small" data-project-delete="'+i+'">Sil</button></div></article>';
  }).join('');
  renderProjectContextStatus();
}
async function saveProject(e){e.preventDefault();const name=$('projectName').value.trim(),notes=$('projectNotes').value.trim();if(!name||!notes)return;const project={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,notes,updated:new Date().toISOString()};projectList.unshift(project);activeProjectId=project.id;try{await Promise.all([setPref(DB.projects,projectList),setPref(DB.activeProject,activeProjectId)]);$('projectForm').reset();renderProjects();updateDashboard();showToast('Proje kaydedildi ve tüm gerçek ajan çağrıları için aktif bağlam seçildi.');}catch(_){showToast('Proje kaydedilemedi. Cihaz depolamasını kontrol et.');}}
function projectMarkdown(p){return '# '+p.name+'\n\n'+p.notes+'\n\n---\nAI Studio Alpha 1 · '+new Date(p.updated||Date.now()).toLocaleString('tr-TR')+'\n';}
function renderReuseCatalog() {
  const out = $('reuseCatalogGrid'); if (!out) return;
  const query = ($('reuseCatalogSearch')?.value || '').trim().toLowerCase();
  const results = reuseCatalog.filter(item => [item.name,item.group,item.license,item.description,...(item.tags||[])].join(' ').toLowerCase().includes(query));
  if (!results.length) { out.innerHTML='<div class="panel"><p class="muted">Bu aramayla kaynak bulunamadı.</p></div>'; return; }
  out.innerHTML=results.map(item=>'<article class="reuse-card"><div class="reuse-top"><h3>'+esc(item.name)+'</h3><span class="pill">'+esc(item.group)+'</span></div><p>'+esc(item.description)+'</p><p class="reuse-license">'+esc(item.license)+'</p><div class="row-actions"><a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">Kaynağı aç ↗</a><a href="'+esc(item.licenseUrl)+'" target="_blank" rel="noopener noreferrer">Lisans ↗</a><span class="grow"></span><button class="btn secondary small" type="button" data-catalog-use="'+esc(item.id)+'">AI görevine ekle</button></div></article>').join('');
}
function renderSnippetVault() {
  const out=$('snippetList'); if(!out)return;
  if(!reusableSnippets.length){out.innerHTML='<div class="panel"><p class="muted">Kasa boş. Kaydettiğin parçalar bu cihazda kalır; JSON yedeğiyle başka cihaza taşıyabilirsin.</p></div>';return;}
  out.innerHTML=reusableSnippets.map((snippet,i)=>'<article class="snippet-card"><div class="reuse-top"><h3>'+esc(snippet.name)+'</h3><span class="pill">'+esc(snippet.language)+'</span></div><p class="reuse-license">'+esc(snippet.license||'Lisans belirtilmedi')+'</p>'+(snippet.sourceUrl?'<p><a href="'+esc(snippet.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Kaynak ↗</a></p>':'')+'<pre>'+esc(snippet.code.slice(0,500))+(snippet.code.length>500?'\n…':'')+'</pre><div class="row-actions"><button class="btn secondary small" type="button" data-snippet-load="'+i+'">Kod Alanı’na yükle</button><button class="btn ghost small" type="button" data-snippet-use="'+i+'">AI ile incele</button><button class="btn ghost small" type="button" data-snippet-download="'+i+'">İndir</button><span class="grow"></span><button class="btn danger small" type="button" data-snippet-delete="'+i+'">Sil</button></div></article>').join('');
}
async function logAgentActivity(event,status,detail){
  agentActivity.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),event:String(event||'Ajan').slice(0,100),status:String(status||'').slice(0,40),detail:String(detail||'').slice(0,260),time:new Date().toISOString()});
  agentActivity=agentActivity.slice(0,80);renderAgentActivity();try{await setPref(DB.activity,agentActivity);}catch(_){showToast('Ajan etkinliği cihaza kaydedilemedi.');}
}
function exportAgentActivity(){downloadText('ai-studio-agent-activity.json',JSON.stringify({format:'ai-studio-agent-activity-v1',exportedAt:new Date().toISOString(),activity:agentActivity},null,2),'application/json;charset=utf-8');}
async function clearAgentActivity(){if(!confirm('Kayıtlı ajan etkinlik geçmişi bu cihazdan silinsin mi?'))return;agentActivity=[];await removePref(DB.activity);renderAgentActivity();showToast('Ajan geçmişi temizlendi.');}
function renderAgentActivity(){
  const out=$('agentActivityList');if(!out)return;
  if(!agentActivity.length){out.innerHTML='<div class="panel"><p class="muted">Henüz Local Coder çalıştırılmadı. Her aşama burada tarihçeye eklenir.</p></div>';return;}
  out.innerHTML=agentActivity.slice(0,12).map(item=>'<article class="activity-card"><div class="reuse-top"><strong>'+esc(item.event)+'</strong><span class="pill">'+esc(item.status)+'</span></div><time>'+esc(new Date(item.time||Date.now()).toLocaleString('tr-TR'))+'</time><p>'+esc(item.detail||'')+'</p></article>').join('');
}
async function persistSnippetRecord(raw,notify=true){
  const cleaned=normalizeSnippet(raw);if(!cleaned)throw new Error('Ad ve kod/metin boş olamaz; kaynak URL varsa HTTPS olmalı.');
  cleaned.id=crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());cleaned.updated=new Date().toISOString();reusableSnippets.unshift(cleaned);reusableSnippets=reusableSnippets.slice(0,100);await setPref(DB.snippets,reusableSnippets);renderSnippetVault();if(notify)showToast('Kod parçası kasaya kaydedildi.');
}
async function saveSnippetFromForm(event){event.preventDefault();try{await persistSnippetRecord({name:$('snippetName').value,language:$('snippetLanguage').value,sourceUrl:$('snippetSourceUrl').value,license:$('snippetLicense').value||'Lisans belirtilmedi — yeniden kullanmadan önce kontrol et',code:$('snippetCode').value});$('snippetForm').reset();}catch(error){showToast('Parça kaydedilemedi: '+(error.message||'Alanları kontrol et.'));}}
function exportSnippetsAll(){downloadText('ai-studio-snippet-vault.json',JSON.stringify({format:'ai-studio-snippets-v1',exportedAt:new Date().toISOString(),snippets:reusableSnippets},null,2),'application/json;charset=utf-8');}
async function importSnippetFile(file){
 try{if(!file||file.size>5000000)throw new Error('Dosya eksik veya 5 MB sınırını aşıyor.');const parsed=JSON.parse(await file.text());const incoming=Array.isArray(parsed)?parsed:parsed.snippets;if(!Array.isArray(incoming))throw new Error('JSON içinde snippets dizisi bulunamadı.');let count=0;for(const raw of incoming){const item=normalizeSnippet(raw);if(!item)continue;item.id=crypto.randomUUID?crypto.randomUUID():String(Date.now()+count);item.updated=new Date().toISOString();reusableSnippets.unshift(item);count++;}reusableSnippets=reusableSnippets.slice(0,100);await setPref(DB.snippets,reusableSnippets);renderSnippetVault();showToast(count+' kod parçası içe aktarıldı.');}catch(error){showToast('Kasa içe aktarılamadı: '+(error.message||'JSON dosyasını kontrol et.'));}
}
async function runLocalCoderWorkshop(){
 if(busy){showToast('Başka bir ajan zinciri çalışıyor.');return;}const task=$('localCoderTask').value.trim();if(!task){showToast('Önce Local Coder görevini yaz.');return;}if(!settings.ollamaUrl){showToast('Önce Modeller ekranından Ollama adresini ayarla.');go('models');return;}
 const sourceCode=$('localCoderUseCode').checked?$('codePad').value.slice(0,10000):'';const stages=buildLocalCoderStages({task,language:$('codeLanguage').value,sourceCode});let previous='';busy=true;$('localCoderRun').disabled=true;$('localCoderRun').textContent='Yerel ajan çalışıyor…';$('localCoderStatus').textContent='Ollama modeline bağlanılıyor; küçük bilgisayarda yanıt yavaş gelebilir.';$('localCoderReview').value='';$('localCoderOutput').value='';
 try{await logAgentActivity('Local Coder','Başladı',task);for(const stage of stages){$('localCoderStatus').textContent=stage.title+' çalışıyor…';await logAgentActivity(stage.title,'Çalışıyor',task);const prompt=stage.makePrompt?stage.makePrompt(previous):stage.prompt;const answer=await callProvider('ollama',prompt,[]);if(stage.id==='code')$('localCoderOutput').value=extractCodeArtifact(answer);if(stage.id==='review')$('localCoderReview').value=answer;previous=answer;await logAgentActivity(stage.title,'Tamamlandı',answer.slice(0,220));} $('localCoderStatus').textContent='Zincir bitti. Taslağı gözden geçir; otomatik test çalıştırılmadı.';await logAgentActivity('Local Coder','Tamamlandı','Kod taslağı ve inceleme notları hazır; dosyalar otomatik değiştirilmedi.');showToast('Local Coder tamamlandı. Taslağı inceleyip gerekirse Kod Alanı’na aktar.');}
 catch(error){$('localCoderStatus').textContent='Zincir durdu; ayarları ve Ollama bağlantısını kontrol et.';await logAgentActivity('Local Coder','Hata',error.message||'Bilinmeyen yerel model hatası');showToast('Local Coder çalışamadı: '+(error.message||'Ollama bağlantısını kontrol et.'));}
 finally{busy=false;$('localCoderRun').disabled=false;$('localCoderRun').textContent='Yerel ajan zincirini çalıştır';}
}
function applyLocalCoderDraft(){const draft=$('localCoderOutput').value.trim();if(!draft){showToast('Aktarılacak bir kod taslağı yok.');return;}if($('codePad').value.trim()&&!confirm('Kod Alanı içeriği yeni taslakla değiştirilsin mi? Önce mevcut dosyanı dışa aktarabilirsin.'))return;$('codePad').value=draft;showToast('Taslak Kod Alanı’na aktarıldı; henüz çalıştırılmadı.');}
function downloadLocalCoderDraft(){const draft=$('localCoderOutput').value.trim();if(!draft){showToast('İndirilecek bir taslak yok.');return;}const ext=({javascript:'js',html:'html',css:'css',python:'py',json:'json',markdown:'md',text:'txt'})[$('codeLanguage').value]||'txt';downloadText('local-coder-draft.'+ext,draft);}
async function saveLocalCoderDraft(){const code=$('localCoderOutput').value.trim();if(!code){showToast('Kasaya kaydedilecek bir taslak yok.');return;}try{await persistSnippetRecord({name:'LocalCoder - '+($('localCoderTask').value.trim()||'taslak').slice(0,70),language:$('codeLanguage').value,sourceUrl:'',license:'AI tarafından oluşturulmuş taslak; kullanmadan önce incele ve test et',code});}catch(error){showToast('Taslak kasaya kaydedilemedi: '+(error.message||'Hata'));}}


async function vaultRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || ('HTTP ' + response.status));
  return data;
}
function renderSharedVaultItems() {
  const out = $('sharedVaultItems'); if (!out) return;
  if (!sharedVaultItems.length) { out.innerHTML='<div class="panel"><p class="muted">Kasa boş veya arama eşleşmedi. İlk notunu yukarıdan kaydedebilirsin.</p></div>'; return; }
  out.innerHTML=sharedVaultItems.map(item=>'<article class="project-card"><div class="project-head"><h3>'+esc(item.title)+'</h3><time>'+esc(new Date(item.updatedAt||Date.now()).toLocaleString('tr-TR'))+'</time></div><p class="fineprint">Kaydeden: '+esc(item.updatedBy||item.createdBy||'agent')+' · '+(item.tags||[]).map(tag=>'<span class="pill">'+esc(tag)+'</span>').join(' ')+'</p><p>'+esc(String(item.content||'').slice(0,650))+(String(item.content||'').length>650?'…':'')+'</p><div class="row-actions"><button class="btn secondary small" type="button" data-vault-to-chat="'+esc(item.id)+'">Sohbete aktar</button><span class="grow"></span><button class="btn danger small" type="button" data-vault-delete="'+esc(item.id)+'">Sil</button></div></article>').join('');
}
function renderSharedVaultAgents() {
  const out=$('sharedVaultAgents'); if (!out) return;
  if (!sharedVaultAgents.length) { out.innerHTML='<div class="panel"><p class="muted">Henüz AI agent yetkisi verilmedi.</p></div>'; return; }
  out.innerHTML=sharedVaultAgents.map(agent=>'<article class="project-card"><div class="project-head"><h3>'+esc(agent.name)+'</h3><span class="pill">'+(agent.scope==='readwrite'?'OKU + YAZ':'SALT OKU')+'</span></div><p class="fineprint">Oluşturulma: '+esc(new Date(agent.createdAt||Date.now()).toLocaleString('tr-TR'))+' · Token yeniden gösterilmez.</p><div class="row-actions"><span class="grow"></span><button type="button" class="btn danger small" data-agent-revoke="'+esc(agent.id)+'">Erişimi iptal et</button></div></article>').join('');
}
async function loadSharedVault({quiet=false}={}) {
  if (nativeApp || !$('sharedVaultPanel')) return;
  const status=$('sharedVaultStatus');
  if (!quiet && status) status.textContent='Şifreli kasadan kayıtlar okunuyor…';
  try {
    const q=$('sharedVaultSearch')?.value.trim()||'';
    const [itemsResult, agentsResult] = await Promise.all([
      vaultRequest('/api/vault/items?limit=30&q='+encodeURIComponent(q)),
      vaultRequest('/api/vault/agents')
    ]);
    sharedVaultItems=Array.isArray(itemsResult.items)?itemsResult.items:[];
    sharedVaultAgents=Array.isArray(agentsResult.agents)?agentsResult.agents:[];
    renderSharedVaultItems();renderSharedVaultAgents();
    if (status) status.textContent=sharedVaultItems.length+' kayıt yüklendi. Web kasası sunucuda AES-256-GCM ile şifreli saklanır.';
  } catch (error) {
    if (status) status.textContent='Site kasasına ulaşılamadı: '+(error.message||'Özel site sunucusu ve oturumunu kontrol et.');
    const items=$('sharedVaultItems');if(items)items.innerHTML='<div class="panel"><p class="muted">Web kasası API’si henüz erişilebilir değil. Bu bölüm sunucu destekli özel site üzerinde çalışır; yerel/Android APK yalnız başına ortak kasaya bağlanmaz.</p></div>';
  }
}
async function saveSharedVaultItem(event) {
  event.preventDefault();
  const title=$('sharedVaultTitle').value.trim(),content=$('sharedVaultContent').value.trim();
  if (!title||!content) return;
  const tags=$('sharedVaultTags').value.split(',').map(tag=>tag.trim()).filter(Boolean).slice(0,12);
  try {
    await vaultRequest('/api/vault/items',{method:'POST',body:JSON.stringify({title,content,tags})});
    $('sharedVaultForm').reset();await loadSharedVault({quiet:true});showToast('Kayıt ortak şifreli kasaya kaydedildi.');
  } catch(error) { showToast('Kasa kaydı başarısız: '+(error.message||'Sunucu bağlantısını kontrol et.')); }
}
async function createSharedVaultAgent(event) {
  event.preventDefault();
  const name=$('agentTokenName').value.trim(),scope=$('agentTokenScope').value;
  if(!name)return;
  try {
    const data=await vaultRequest('/api/vault/agents',{method:'POST',body:JSON.stringify({name,scope})});
    const token=String(data.token||'');
    if(!token)throw new Error('Sunucu token döndürmedi; agent kaydı kontrol edilmeli.');
    $('agentTokenValue').value=token;
    const base=location.origin+'/api/agent/v1';
    $('agentTokenInstructions').value=[
      'AI STUDIO SHARED VAULT — Agent API',
      'Base URL: '+base,
      'Authentication: Authorization: Bearer '+token,
      'API spec (token gerektirir): GET '+base+'/openapi.json',
      'Kimlik kontrolü: GET '+base+'/whoami',
      'Kayıtları ara: GET '+base+'/items?q='+encodeURIComponent('[aranan kelime]'),
      'Tek kaydı oku: GET '+base+'/items/{id}',
      scope==='readwrite'?'Kayıt ekle: POST '+base+'/items — JSON: {"title":"Başlık","content":"Not","tags":["etiket"]}':'Yetki salt okunur: bu tokenla kayıt ekleme/düzenleme/silme yapılamaz.',
      scope==='readwrite'?'Kayıt güncelle: PUT '+base+'/items/{id} — JSON: {"title":"Başlık","content":"Yeni not","tags":["etiket"]}':'',
      scope==='readwrite'?'Kayıt sil: DELETE '+base+'/items/{id}':'',
      'Kullanıcı talimatı: Görevle ilgili bilgiyi önce ara; yararlı kararları kısa, kaynak ve tarih bilgili başlıklarla kaydet. Aynı kayıt varsa yenisini açmak yerine güncelle. Gizli API anahtarlarını/kişisel verileri kasaya yazma.',
      'Not: Her istek HTTPS ve bu Bearer token ile yapılmalı. Tokenı herkese açık bir sohbet veya koda koyma.'
    ].filter(Boolean).join('\n');
    $('agentTokenResult').classList.remove('hidden');
    $('agentTokenName').value='';
    await loadSharedVault({quiet:true});
    showToast('Agent token üretildi. Ham tokenı güvenli şekilde kopyala; sonra yeniden gösterilemez.');
  } catch(error) { showToast('Agent oluşturulamadı: '+(error.message||'Site API’sini kontrol et.')); }
}
async function deleteSharedVaultItem(id) {
  if(!confirm('Bu kasa kaydı kalıcı olarak silinsin mi?'))return;
  try{await vaultRequest('/api/vault/items/'+encodeURIComponent(id),{method:'DELETE'});await loadSharedVault({quiet:true});showToast('Kasa kaydı silindi.');}
  catch(error){showToast('Kayıt silinemedi: '+(error.message||'Hata'));}
}
async function revokeSharedVaultAgent(id) {
  if(!confirm('Bu agentın tokenı iptal edilsin mi? Bu işlem geri alınamaz; agent artık API’ye bağlanamaz.'))return;
  try{await vaultRequest('/api/vault/agents/'+encodeURIComponent(id),{method:'DELETE'});await loadSharedVault({quiet:true});showToast('Agent erişimi iptal edildi.');}
  catch(error){showToast('Agent iptal edilemedi: '+(error.message||'Hata'));}
}

function renderBuiltinTools(){ $('builtinTools').innerHTML=builtinTools.map(t=>'<button class="tool-card" data-tool="'+t.id+'"><span class="tool-symbol">'+esc(t.icon)+'</span><strong>'+esc(t.name)+'</strong><small>'+esc(t.desc)+'</small></button>').join('');}
function renderPlugins(){ const out=$('pluginList'); if(!userPlugins.length){out.innerHTML='<div class="panel"><p class="muted">Henüz özel eklenti yok. Eklentiler yalnızca metin talimatlarıdır; keyfi kod çalıştırmaz.</p></div>';return;}
  out.innerHTML=userPlugins.map((p,i)=>'<article class="plugin-card"><div class="plugin-head"><h3>'+esc(p.name)+'</h3><span class="pill">'+(p.kind==='builtin'?'HAZIR':'ÖZEL')+'</span></div><p>'+esc(p.prompt)+'</p><div class="row-actions"><button class="btn secondary small" data-plugin-run="'+i+'">Sohbette kullan</button><span class="grow"></span>'+(p.kind==='builtin'?'':'<button class="btn danger small" data-plugin-delete="'+i+'">Sil</button>')+'</div></article>').join('');
}
async function addPlugin(e){e.preventDefault();const name=$('pluginName').value.trim(),prompt=$('pluginPrompt').value.trim();if(!name||!prompt)return;userPlugins.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,prompt,kind:'custom'});await setPref(DB.plugins,userPlugins);$('pluginForm').reset();renderPlugins();showToast('Prompt eklentisi kaydedildi.');}
async function importPlugins(file){try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.plugins;if(!Array.isArray(incoming))throw new Error('JSON içinde plugins dizisi bulunamadı.');let count=0;for(const p of incoming){if(typeof p?.name==='string'&&typeof p?.prompt==='string'&&p.name.trim()&&p.prompt.trim()){userPlugins.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+count),name:p.name.trim().slice(0,80),prompt:p.prompt.trim().slice(0,6000),kind:'custom'});count++;}}userPlugins=userPlugins.slice(-100);await setPref(DB.plugins,userPlugins);renderPlugins();showToast(count+' prompt eklentisi içe aktarıldı.');}catch(err){showToast('Eklenti içe aktarılamadı: '+(err.message||'JSON dosyasını kontrol et.'));}}
function updateDashboard(){const connected=Object.keys(providers).filter(id=>id==='ollama'?!!settings.ollamaUrl:!!runtimeKeys[id]);$('connectedCount').textContent=connected.length;$('projectCount').textContent=projectList.length;
  $('dashboard').innerHTML='<article class="panel"><div class="row-actions"><strong>API sağlayıcıları</strong><span class="grow"></span><span class="pill">'+connected.length+' ayar</span></div><p class="muted">'+esc(connected.map(id=>providers[id].name).join(', ')||'Henüz anahtar ayarlanmadı.')+'</p><button class="btn ghost small" data-go="models">Bağlantıları yönet</button></article><article class="panel"><div class="row-actions"><strong>Sohbet geçmişi</strong><span class="grow"></span><span class="pill">'+chatHistory.length+' mesaj</span></div><p class="muted">Bu cihazdaki yerel geçmiş. Gerçek model sohbetleri de dışa aktarılabilir.</p></article>';
}
async function exportProjects(){downloadText('ai-studio-projects.json',JSON.stringify({format:'ai-studio-projects-v2',exportedAt:new Date().toISOString(),projects:projectList},null,2),'application/json;charset=utf-8');}
function buildWorkspaceSnapshot(){
  return {format:'ai-studio-workspace-v1',exportedAt:new Date().toISOString(),settings:{demoMode:settings.demoMode,models:settings.models,team:settings.team,ollamaUrl:settings.ollamaUrl,ollamaModel:settings.ollamaModel,systemPrompt:settings.systemPrompt,shareReusableContext:settings.shareReusableContext===true},projects:projectList,activeProjectId,chat:chatHistory,plugins:userPlugins.filter(p=>p.kind!=='builtin').map(p=>({name:p.name,prompt:p.prompt})),snippets:reusableSnippets,activity:agentActivity,codeFiles,activeCodeFileId};
}
async function exportWorkspace(){
  await saveCurrentCodeFile(false);
  const snapshot=buildWorkspaceSnapshot();
  downloadText('ai-studio-workspace-backup.json',JSON.stringify(snapshot,null,2),'application/json;charset=utf-8');
}
async function exportEncryptedWorkspace(){
  const password=$('encryptedBackupPassword').value;
  const confirmation=$('encryptedBackupConfirm').value;
  if(password!==confirmation){showToast('Parolalar eşleşmiyor.');return;}
  try{
    await saveCurrentCodeFile(false);
    const envelope=await encryptWorkspaceBackup(buildWorkspaceSnapshot(),password);
    downloadText('ai-studio-workspace-backup.encrypted.json',JSON.stringify(envelope,null,2),'application/json;charset=utf-8');
    $('encryptedBackupPassword').value='';$('encryptedBackupConfirm').value='';
    showToast('Şifreli yedek indirildi. Parolayı güvenli yerde sakla.');
  }catch(error){showToast('Şifreli yedek oluşturulamadı: '+(error.message||'Parolayı ve tarayıcı desteğini kontrol et.'));}
}
async function importEncryptedWorkspace(file){
  const password=$('encryptedBackupPassword').value;
  if(!password){showToast('Şifreli yedeği açmak için yedek parolasını gir.');return;}
  try{
    if(!file||file.size>8_000_000)throw new Error('Dosya eksik veya 8 MB sınırını aşıyor.');
    const envelope=JSON.parse(await file.text());
    const snapshot=await decryptWorkspaceBackup(envelope,password);
    const serialized=JSON.stringify(snapshot);
    const size=new TextEncoder().encode(serialized).byteLength;
    if(size>5*1024*1024)throw new Error('Açılan yedek 5 MB sınırını aşıyor.');
    await importWorkspace({size,text:async()=>serialized});
    $('encryptedBackupPassword').value='';$('encryptedBackupConfirm').value='';
  }catch(error){
    $('encryptedBackupPassword').value='';$('encryptedBackupConfirm').value='';
    showToast('Şifreli yedek açılamadı: '+(error.message||'Dosyayı ve parolayı kontrol et.'));
  }
}
async function importWorkspace(file){
  try{
    if(file.size>5000000)throw new Error('Yedek 5 MB sınırını aşıyor.');
    const data=JSON.parse(await file.text());
    if(data?.format!=='ai-studio-workspace-v1')throw new Error('Bu dosya tam AI Studio yedeği değil.');
    const nextSettings={...clone(defaultSettings),...(data.settings&&typeof data.settings==='object'?data.settings:{})};
    nextSettings.models={...clone(defaultSettings.models),...(nextSettings.models&&typeof nextSettings.models==='object'&&!Array.isArray(nextSettings.models)?nextSettings.models:{})};
    nextSettings.team=(Array.isArray(nextSettings.team)?nextSettings.team:defaultSettings.team).filter(id=>providers[id]).slice(0,4);
    nextSettings.ollamaUrl=typeof nextSettings.ollamaUrl==='string'?nextSettings.ollamaUrl.slice(0,500):'';
    nextSettings.ollamaModel=typeof nextSettings.ollamaModel==='string'?nextSettings.ollamaModel.slice(0,140):providers.ollama.model;
    nextSettings.systemPrompt=typeof nextSettings.systemPrompt==='string'?nextSettings.systemPrompt.slice(0,6000):defaultSettings.systemPrompt;
    nextSettings.demoMode=nextSettings.demoMode!==false;
    const nextProjects=(Array.isArray(data.projects)?data.projects:[]).filter(p=>typeof p?.name==='string'&&typeof p?.notes==='string').slice(0,300).map((p,i)=>({id:typeof p.id==='string'&&p.id.trim()?p.id.slice(0,100):(crypto.randomUUID?crypto.randomUUID():String(Date.now()+i)),name:p.name.slice(0,100),notes:p.notes.slice(0,20000),updated:typeof p.updated==='string'?p.updated:new Date().toISOString()}));
    const nextChat=(Array.isArray(data.chat)?data.chat:[]).filter(m=>(m?.role==='user'||m?.role==='assistant')&&typeof m.content==='string').slice(-80).map(m=>({role:m.role,content:m.content.slice(0,20000),provider:typeof m.provider==='string'?m.provider.slice(0,100):'',mode:['demo','live','error'].includes(m.mode)?m.mode:'demo',time:typeof m.time==='string'?m.time:new Date().toISOString()}));
    const nextPlugins=(Array.isArray(data.plugins)?data.plugins:[]).filter(p=>typeof p?.name==='string'&&typeof p?.prompt==='string'&&p.name.trim()&&p.prompt.trim()).slice(-100).map((p,i)=>({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i),name:p.name.trim().slice(0,80),prompt:p.prompt.trim().slice(0,6000),kind:'custom'}));
    const nextSnippets=(Array.isArray(data.snippets)?data.snippets:[]).map(normalizeSnippet).filter(Boolean).slice(0,100).map((item,i)=>({...item,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i)}));
    const nextActivity=(Array.isArray(data.activity)?data.activity:[]).slice(0,80).filter(item=>item&&typeof item.event==='string').map((item,i)=>({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i),event:item.event.slice(0,100),status:typeof item.status==='string'?item.status.slice(0,40):'',detail:typeof item.detail==='string'?item.detail.slice(0,260):'',time:typeof item.time==='string'?item.time:new Date().toISOString()}));
    const nextFiles=Array.isArray(data.codeFiles)?normalizeCodeFileList(data.codeFiles,true):codeFiles;
    if(!nextFiles.length)nextFiles.push(makeCodeFile());
    const nextActiveFileId=nextFiles.some(file=>file.id===data.activeCodeFileId)?data.activeCodeFileId:nextFiles[0].id;
    const nextActiveProjectId=nextProjects.some(project=>project.id===data.activeProjectId)?data.activeProjectId:(nextProjects[0]?.id||'');
    if(!confirm('Bu yedek mevcut proje, sohbet, kod dosyaları, ayar ve özel prompt kayıtlarını değiştirecek. API anahtarları yedeğe dahil değildir ve bu cihazdaki anahtarlar silinmeyecek. Devam?'))return;
    await Promise.all([setPref(DB.settings,nextSettings),setPref(DB.projects,nextProjects),setPref(DB.activeProject,nextActiveProjectId),setPref(DB.chat,nextChat),setPref(DB.plugins,nextPlugins),setPref(DB.snippets,nextSnippets),setPref(DB.activity,nextActivity),setPref(DB.codeFiles,nextFiles)]);
    settings=nextSettings;projectList=nextProjects;activeProjectId=nextActiveProjectId;chatHistory=nextChat;userPlugins=nextPlugins;reusableSnippets=nextSnippets;agentActivity=nextActivity;codeFiles=nextFiles;activeCodeFileId=nextActiveFileId;
    renderProviderCards();renderProjects();renderChat();renderPlugins();renderSnippetVault();renderAgentActivity();renderReuseCatalog();renderCodeFileSelector();loadActiveCodeFile();syncModeUI();updateDashboard();
    $('compareSelectionCount').textContent=settings.team.length+' ajan seçili';
    showToast('Tam çalışma alanı geri yüklendi. API anahtarları ayrı güvenli depoda kaldı.');
  }catch(err){showToast('Yedek geri yüklenemedi: '+(err.message||'JSON dosyasını kontrol et.'));}
}
async function importProjects(file){try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.projects;if(!Array.isArray(incoming))throw new Error('JSON içinde projects dizisi bulunamadı.');for(const p of incoming){if(typeof p?.name==='string'&&typeof p?.notes==='string'){projectList.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name:p.name.slice(0,100),notes:p.notes.slice(0,20000),updated:p.updated||new Date().toISOString()});}}if(!getActiveProject()&&projectList.length)activeProjectId=projectList[0].id;await Promise.all([setPref(DB.projects,projectList),setPref(DB.activeProject,activeProjectId)]);renderProjects();updateDashboard();showToast('Proje yedeği içe aktarıldı.');}catch(e){showToast('İçe aktarma başarısız: '+(e.message||'JSON dosyasını kontrol et.'));}}
async function saveOllama(){settings.ollamaUrl=$('ollamaUrl').value.trim();settings.ollamaModel=$('ollamaModel').value.trim()||providers.ollama.model;settings.models.ollama=settings.ollamaModel;await setPref(DB.settings,settings);renderProviderCards();updateDashboard();showToast('Ollama ayarları kaydedildi.');}
async function testProvider(id){if(settings.demoMode){showToast('Önce Demo modunu kapat; bu test tek gerçek API isteği gönderebilir.');return;}try{const result=await callProvider(id,'Yanıt olarak sadece OK yaz.',[]);showToast('Bağlantı yanıt verdi: '+result.slice(0,70));}catch(e){showToast('Bağlantı testi başarısız: '+(e.message||'Hata'));}}
async function testOllama(){await saveOllama();if(settings.demoMode){showToast('Demo modu açık. Gerçek yerel test için Demo modunu kapat.');return;}try{const result=await callProvider('ollama','Yanıt olarak sadece OK yaz.',[]);showToast('Ollama yanıt verdi: '+result.slice(0,70));}catch(e){showToast('Ollama testi başarısız: '+(e.message||'Hata'));}}
async function saveProviderCard(id){
  settings.models[id]=$('model-'+id).value.trim()||providers[id].model;
  const field=$('key-'+id),key=field?.value.trim();
  try{if(key){await saveSecret(id,key);field.value='';}await setPref(DB.settings,settings);renderProviderCards();updateDashboard();showToast(key?'Model ayarı ve anahtar kaydedildi.':'Model ayarı kaydedildi.');}
  catch(e){showToast('Kaydedilemedi: '+(e.message||'Güvenli depoya erişilemiyor.'));}}
async function clearAllLocal(){if(!confirm('Proje notları, sohbet, özel eklentiler, kod dosyaları, kod kasası ve ajan etkinlikleri bu cihazdan silinsin mi? API anahtarlarını silmek için Modeller ekranını kullan.'))return;projectList=[];activeProjectId='';chatHistory=[];userPlugins=[];reusableSnippets=[];agentActivity=[];codeFiles=[makeCodeFile()];activeCodeFileId=codeFiles[0].id;await Promise.all([removePref(DB.projects),removePref(DB.activeProject),removePref(DB.chat),removePref(DB.plugins),removePref(DB.snippets),removePref(DB.activity),setPref(DB.codeFiles,codeFiles)]);renderProjects();renderChat();renderPlugins();renderSnippetVault();renderAgentActivity();loadActiveCodeFile();updateDashboard();showToast('Yerel notlar, kod dosyaları, kasa ve etkinlik geçmişi silindi.');}
function copyText(text){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>showToast('Kopyalandı.')).catch(()=>fallbackCopy(text));}else fallbackCopy(text);}
function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();try{document.execCommand('copy');showToast('Kopyalandı.');}catch(_){showToast('Kopyalanamadı; dosya olarak dışa aktarabilirsin.');}t.remove();}
document.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-go],[data-tab]');if(nav){go(nav.dataset.go||nav.dataset.tab);return;}
  const vaultToChat=e.target.closest('[data-vault-to-chat]');if(vaultToChat){const item=sharedVaultItems.find(x=>x.id===vaultToChat.dataset.vaultToChat);if(item){go('chat');$('chatInput').value=('Ortak kasadan alınan proje kaydı: '+item.title+'\n\n'+String(item.content||'')).slice(0,12000);$('chatInput').focus();}return;}
  const vaultDelete=e.target.closest('[data-vault-delete]');if(vaultDelete){await deleteSharedVaultItem(vaultDelete.dataset.vaultDelete);return;}
  const agentRevoke=e.target.closest('[data-agent-revoke]');if(agentRevoke){await revokeSharedVaultAgent(agentRevoke.dataset.agentRevoke);return;}
  const catalogUse=e.target.closest('[data-catalog-use]');if(catalogUse){const item=reuseCatalog.find(x=>x.id===catalogUse.dataset.catalogUse);if(item){$('localCoderTask').value='Bu kaynağı mevcut projeme uygun şekilde değerlendir: '+item.name+'.\nKaynak: '+item.url+'\nLisans notu: '+item.license+'\nYeniden kullanılabilir kısmı öner; gerekli lisans/atıf şartlarını ayrıca kontrol et.';showToast(item.name+' görev bağlamına eklendi.');}return;}
  const snippetLoad=e.target.closest('[data-snippet-load]');if(snippetLoad){const item=reusableSnippets[Number(snippetLoad.dataset.snippetLoad)];if(item){$('codePad').value=item.code;if([...$('codeLanguage').options].some(o=>o.value===item.language))$('codeLanguage').value=item.language;showToast('Kod parçası Kod Alanı’na yüklendi.');}return;}
  const snippetUse=e.target.closest('[data-snippet-use]');if(snippetUse){const item=reusableSnippets[Number(snippetUse.dataset.snippetUse)];if(item){$('localCoderTask').value='Bu kod parçasını incele, projeye entegrasyon ve test önerilerini ver. Kaynak: '+(item.sourceUrl||'belirtilmedi')+'. Lisans: '+(item.license||'belirtilmedi')+'.\n\nKod:\n'+item.code.slice(0,10000);showToast('Kod parçası Local Coder görevine eklendi.');}return;}
  const snippetDownload=e.target.closest('[data-snippet-download]');if(snippetDownload){const item=reusableSnippets[Number(snippetDownload.dataset.snippetDownload)];if(item){const ext=({javascript:'js',html:'html',css:'css',python:'py',json:'json',markdown:'md',text:'txt'})[item.language]||'txt';downloadText((item.name||'snippet').replace(/[^a-z0-9-_]+/gi,'_')+'.'+ext,item.code);}return;}
  const snippetDelete=e.target.closest('[data-snippet-delete]');if(snippetDelete){reusableSnippets.splice(Number(snippetDelete.dataset.snippetDelete),1);await setPref(DB.snippets,reusableSnippets);renderSnippetVault();showToast('Kod parçası kasadan silindi.');return;}

  const save=e.target.closest('[data-save-key]');if(save){await saveProviderCard(save.dataset.saveKey);return;}
  const test=e.target.closest('[data-test-provider]');if(test){await testProvider(test.dataset.testProvider);return;}
  const del=e.target.closest('[data-delete-key]');if(del){const id=del.dataset.deleteKey;if(confirm(providers[id].name+' anahtarı bu uygulamadan silinsin mi?')){await deleteSecret(id);renderProviderCards();updateDashboard();showToast('Anahtar silindi.');}return;}
  const projectActivate=e.target.closest('[data-project-activate]');if(projectActivate){const project=projectList.find(p=>p.id===projectActivate.dataset.projectActivate);if(project){activeProjectId=project.id;await setPref(DB.activeProject,activeProjectId);renderProjects();showToast('Aktif proje tüm gerçek ajan çağrılarının bağlamına eklendi. Demo modu gerçek model çalıştırmaz.');}return;}
  const projectDel=e.target.closest('[data-project-delete]');if(projectDel){const removed=projectList.splice(Number(projectDel.dataset.projectDelete),1)[0];if(removed?.id===activeProjectId)activeProjectId=projectList[0]?.id||'';await Promise.all([setPref(DB.projects,projectList),setPref(DB.activeProject,activeProjectId)]);renderProjects();updateDashboard();return;}
  const projectExport=e.target.closest('[data-project-export]');if(projectExport){const p=projectList[Number(projectExport.dataset.projectExport)];downloadText((p.name||'proje').replace(/[^a-z0-9-_]+/gi,'_')+'.md',projectMarkdown(p));return;}
  const projectOpen=e.target.closest('[data-project-open]');if(projectOpen){const p=projectList[Number(projectOpen.dataset.projectOpen)];if(p){activeProjectId=p.id;await setPref(DB.activeProject,activeProjectId);renderProjects();go('chat');$('chatInput').value='Aktif projedeki mevcut kararları dikkate alarak en iyi sonraki adımları öner.';$('chatInput').focus();}return;}
  const tool=e.target.closest('[data-tool]');if(tool){const p=builtinTools.find(t=>t.id===tool.dataset.tool);go('chat');$('chatInput').value=p.prompt.replace('{{gorev}}','[Buraya görevi, kodu veya fikri yaz]');$('chatInput').focus();return;}
  const plug=e.target.closest('[data-plugin-run]');if(plug){const p=userPlugins[Number(plug.dataset.pluginRun)];go('chat');$('chatInput').value=p.prompt.replace('{{gorev}}','[Görevini buraya yaz]');$('chatInput').focus();return;}
  const plugDel=e.target.closest('[data-plugin-delete]');if(plugDel){userPlugins.splice(Number(plugDel.dataset.pluginDelete),1);await setPref(DB.plugins,userPlugins);renderPlugins();return;}
});
document.addEventListener('change',async e=>{
  if(e.target.matches('[data-team]')){const id=e.target.dataset.team;let group=[...document.querySelectorAll('[data-team="'+id+'"]')];if(e.target.checked){if(!settings.team.includes(id)&&settings.team.length>=4){e.target.checked=false;group.forEach(x=>x.checked=false);showToast('Takım turu en fazla dört sağlayıcı çağırır.');return;}if(!settings.team.includes(id))settings.team.push(id);}else settings.team=settings.team.filter(x=>x!==id);group.forEach(x=>x.checked=e.target.checked);await setPref(DB.settings,settings);renderProviderCards();$('compareSelectionCount').textContent=settings.team.length+' ajan seçili';}
});
$('chatForm').addEventListener('submit',e=>{e.preventDefault();const p=$('chatInput').value.trim();if(!p)return;$('chatInput').value='';submitChat(p,$('chatProvider').value);});
$('teamRun').addEventListener('click',()=>{const p=$('chatInput').value.trim();if(!p){showToast('Önce takımın görevini yaz.');return;}$('chatInput').value='';runTeam(p);});
$('pipelineRun').addEventListener('click',()=>{const p=$('chatInput').value.trim();if(!p){showToast('Önce zincirin görevini yaz.');return;}$('chatInput').value='';runPipeline(p);});
$('compareRun').addEventListener('click',runCompare);
$('demoToggle').addEventListener('change',async e=>{settings.demoMode=e.target.checked;await setPref(DB.settings,settings);syncModeUI();});
$('settingsDemoToggle').addEventListener('change',async e=>{settings.demoMode=e.target.checked;await setPref(DB.settings,settings);syncModeUI();});
$('chatProvider').addEventListener('change',syncModeUI);
$('projectForm').addEventListener('submit',saveProject);
$('sharedVaultForm').addEventListener('submit',saveSharedVaultItem);
$('sharedVaultRefresh').addEventListener('click',()=>loadSharedVault());
$('sharedVaultSearch').addEventListener('input',()=>loadSharedVault({quiet:true}));
$('agentTokenForm').addEventListener('submit',createSharedVaultAgent);
$('copyAgentToken').addEventListener('click',()=>copyText($('agentTokenValue').value));
$('copyAgentInstructions').addEventListener('click',()=>copyText($('agentTokenInstructions').value));
$('hideAgentToken').addEventListener('click',()=>{$('agentTokenValue').value='';$('agentTokenInstructions').value='';$('agentTokenResult').classList.add('hidden');});
$('shareReusableContext').addEventListener('change',async e=>{settings.shareReusableContext=e.target.checked;await setPref(DB.settings,settings);renderProjectContextStatus();showToast(settings.shareReusableContext?'Kod dosyaları ve kasa parçaları gerçek model çağrılarına bağlam olarak eklenebilir.':'Yalnızca seçili projenin notları paylaşılır.');});
$('exportProjects').addEventListener('click',exportProjects);
$('importProjectsBtn').addEventListener('click',()=>$('importProjectsFile').click());
$('importProjectsFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importProjects(e.target.files[0]);e.target.value='';});
$('pluginForm').addEventListener('submit',addPlugin);
$('exportPlugins').addEventListener('click',()=>downloadText('ai-studio-prompt-plugins.json',JSON.stringify({format:'ai-studio-prompts-v1',plugins:userPlugins.filter(p=>p.kind!=='builtin')},null,2),'application/json;charset=utf-8'));
$('importPluginsBtn').addEventListener('click',()=> $('importPluginsFile').click());
$('importPluginsFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importPlugins(e.target.files[0]);e.target.value='';});
$('exportChat').addEventListener('click',()=>downloadText('ai-studio-chat.json',JSON.stringify({exportedAt:new Date().toISOString(),messages:chatHistory},null,2),'application/json;charset=utf-8'));
$('clearChat').addEventListener('click',async()=>{if(confirm('Sohbet geçmişi temizlensin mi?')){chatHistory=[];await removePref(DB.chat);renderChat();}});
$('saveOllama').addEventListener('click',saveOllama);
$('testOllama').addEventListener('click',testOllama);
$('copyCode').addEventListener('click',()=>copyText($('codePad').value));
$('exportCode').addEventListener('click',async()=>{await saveCurrentCodeFile(false);const f=codeFiles.find(x=>x.id===activeCodeFileId);downloadText(f?.name||'ai-studio-code.txt',$('codePad').value);});
$('importCode').addEventListener('click',()=>$('codeFile').click());
$('codeFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(f){if(f.size>100_000){showToast('Tek dosya 100 KB sınırını aşıyor.');e.target.value='';return;}const content=await f.text();const language=inferCodeLanguage(f.name,'text');const name=uniqueCodeFileName(f.name,codeFiles.map(x=>x.name));const imported=makeCodeFile(name,language,content);codeFiles.unshift(imported);codeFiles=codeFiles.slice(0,100);activeCodeFileId=imported.id;await setPref(DB.codeFiles,codeFiles);loadActiveCodeFile();showToast('Dosya çalışma alanına ayrı dosya olarak eklendi.');}e.target.value='';});
$('exportWorkspace').addEventListener('click',exportWorkspace);
$('exportEncryptedWorkspace').addEventListener('click',exportEncryptedWorkspace);
$('importEncryptedWorkspaceBtn').addEventListener('click',()=>$('importEncryptedWorkspaceFile').click());
$('importEncryptedWorkspaceFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importEncryptedWorkspace(e.target.files[0]);e.target.value='';});
$('importWorkspaceBtn').addEventListener('click',()=> $('importWorkspaceFile').click());
$('importWorkspaceFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importWorkspace(e.target.files[0]);e.target.value='';});
$('resetLocal').addEventListener('click',clearAllLocal);
$('localCoderRun').addEventListener('click',runLocalCoderWorkshop);
$('localCoderApply').addEventListener('click',applyLocalCoderDraft);
$('localCoderDownload').addEventListener('click',downloadLocalCoderDraft);
$('localCoderSaveSnippet').addEventListener('click',saveLocalCoderDraft);
$('reuseCatalogSearch').addEventListener('input',renderReuseCatalog);
$('snippetForm').addEventListener('submit',saveSnippetFromForm);
$('snippetExportAll').addEventListener('click',exportSnippetsAll);
$('snippetImportBtn').addEventListener('click',()=>$('snippetImportFile').click());
$('snippetImportFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importSnippetFile(e.target.files[0]);e.target.value='';});
$('activityExport').addEventListener('click',exportAgentActivity);
$('activityClear').addEventListener('click',clearAgentActivity);
$('savedCodeFileSelect').addEventListener('change',async e=>{const id=e.target.value;await selectCodeFile(id);});
$('savedCodeFileName').addEventListener('blur',()=>saveCurrentCodeFile(false).catch(()=>showToast('Dosya adı kaydedilemedi.')));
$('codeLanguage').addEventListener('change',()=>scheduleCodeFileSave());
$('codePad').addEventListener('input',()=>scheduleCodeFileSave());
$('newCodeFile').addEventListener('click',()=>createCodeFile().catch(()=>showToast('Yeni dosya oluşturulamadı.')));
$('saveCodeFile').addEventListener('click',()=>saveCurrentCodeFile(true).catch(()=>showToast('Dosya kaydedilemedi.')));
$('deleteCodeFile').addEventListener('click',()=>deleteActiveCodeFile().catch(()=>showToast('Dosya silinemedi.')));
$('exportCodeFiles').addEventListener('click',()=>exportCodeFiles().catch(()=>showToast('Dosya kasası yedeklenemedi.')));
$('importCodeFilesBtn').addEventListener('click',()=>$('importCodeFilesFile').click());
$('importCodeFilesFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importCodeFileCollection(e.target.files[0]);e.target.value='';});

let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{
  if(nativeApp)return;
  event.preventDefault();
  deferredInstallPrompt=event;
  $('installWebAppBtn')?.classList.remove('hidden');
});
window.addEventListener('appinstalled',()=>{
  deferredInstallPrompt=null;
  $('installWebAppBtn')?.classList.add('hidden');
  showToast('AI Studio ana ekrana eklendi.');
});
$('installWebAppBtn').addEventListener('click',async()=>{
  if(!deferredInstallPrompt){showToast('Tarayıcı menüsünden “Ana ekrana ekle” seçeneğini kullanabilirsin.');return;}
  try{await deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;}catch(_){}
  deferredInstallPrompt=null;
  $('installWebAppBtn').classList.add('hidden');
});
$('webLogoutBtn').addEventListener('click',async()=>{
  if(!confirm('Güvenli oturum kapatılsın mı? Açık API anahtarları da bu sekme kapanınca temizlenir.'))return;
  try{
    const response=await fetch('/api/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});
    if(response.ok){window.location.assign('/login');return;}
    showToast('Oturum kapatılamadı. Tarayıcıyı kapatıp yeniden açabilirsin.');
  }catch(_){showToast('Sunucuya ulaşılamadı; bağlantını kontrol et.');}
});
async function prepareBrowserFeatures(){
  if(nativeApp)return;
  if('serviceWorker' in navigator&&window.isSecureContext){
    navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
  }
  try{
    const response=await fetch('/api/session',{credentials:'same-origin',headers:{'Accept':'application/json'}});
    if(response.ok){
      const data=await response.json();
      if(data?.privateSite)$('webLogoutBtn').classList.remove('hidden');
    }
  }catch(_){}
}
async function init(){
  try{settings={...clone(defaultSettings),...(await getPref(DB.settings,{}))};settings.models={...clone(defaultSettings.models),...(settings.models||{})};settings.team=(settings.team||defaultSettings.team).filter(id=>providers[id]).slice(0,4);if(settings.ollamaUrl==='http://192.168.1.100:11434')settings.ollamaUrl='';}catch(_){}
  if(!nativeApp){showToast('Tarayıcıda API anahtarları yalnızca açık oturumda tutulur.');}
  await initKeys(); projectList=await getPref(DB.projects,[]);activeProjectId=await getPref(DB.activeProject,'');chatHistory=await getPref(DB.chat,[]);userPlugins=await getPref(DB.plugins,[]);reusableSnippets=await getPref(DB.snippets,[]);agentActivity=await getPref(DB.activity,[]);codeFiles=normalizeCodeFileList(await getPref(DB.codeFiles,[]),true);if(!codeFiles.length)codeFiles=[makeCodeFile()];activeCodeFileId=codeFiles[0].id;await setPref(DB.codeFiles,codeFiles);
  if(!Array.isArray(projectList))projectList=[];if(!projectList.some(p=>p&&p.id===activeProjectId))activeProjectId=projectList[0]?.id||'';await setPref(DB.activeProject,activeProjectId);if(!Array.isArray(chatHistory))chatHistory=[];if(!Array.isArray(userPlugins))userPlugins=[];if(!Array.isArray(reusableSnippets))reusableSnippets=[];if(!Array.isArray(agentActivity))agentActivity=[];
  renderProviderCards();renderProjects();renderChat();renderBuiltinTools();renderPlugins();renderReuseCatalog();renderSnippetVault();renderAgentActivity();loadActiveCodeFile();syncModeUI();updateDashboard();$('compareSelectionCount').textContent=settings.team.length+' ajan seçili';
  if(!nativeApp)await loadSharedVault({quiet:true});else $('sharedVaultPanel')?.classList.add('hidden');
}
prepareBrowserFeatures().then(init).catch(()=>showToast('Başlangıç ayarları okunamadı; sayfayı yenileyebilirsin.'));
