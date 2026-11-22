import { Capacitor } from '@capacitor/core';
import { APINEX_CHAT_ENDPOINT, APINEX_DEFAULT_FREE_MODEL, APINEX_MODELS_ENDPOINT, extractApinexFreeModels, isFreeApinexModelId } from './apinex-provider.js';
import { GEMINI_FREE_MODELS, GROQ_FREE_MODELS, ZAI_FREE_MODELS, MERKIUM_FREE_MODELS, NVIDIA_NIM_DEVELOPER_MODELS, REQUESTY_FREE_MODELS, isFreeApiProviderModel } from './free-api-providers.js';
import { connectOpenShorts, callOpenShortsTool, validateOpenShortsSourceUrl } from './openshorts-mcp.js';
import { mountSocialStudio } from './social-studio.js';
import { mountAiPowerHub } from './ai-power-hub.js';
import './ai-power-hub.css';
import { runApiLocalCoderSequence } from './local-coder-api.js';
import { normalizeTeamSelection, normalizeOpenAiEndpoint, normalizeOllamaEndpoint, selectConfiguredTeam, confirmTeamLiveCalls, runParallelTeamCalls, runSequentialTeamCalls } from './ai-team.js';
import { DeviceLocalCoder, DEVICE_MODEL_CATALOG, assessDeviceModel, chooseRecommendedDeviceModel, formatModelBytes } from './device-local-coder.js';
import { Preferences } from '@capacitor/preferences';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import './style.css';
import { reuseCatalog, buildLocalCoderStages, extractCodeArtifact, normalizeSnippet } from './workshop-data.js';
import { buildSharedProjectContext } from './project-context.js';
import { buildSharedVaultContext } from './shared-vault-context.js';
import { fitModelContext } from './model-context.js';
import { encryptWorkspaceBackup, decryptWorkspaceBackup } from './encrypted-backup.js';
import { SKILL_CATALOG, SKILL_PROFILES, parseSkillMarkdown, normalizeSkill, prepareSkillImportQueue, buildStageSkillContext, getProfileSkillIds, createSkillBackupState, restoreSkillBackupState, MAX_SELECTED_SKILLS, MAX_CUSTOM_SKILLS, MAX_STAGE_SKILL_CHARS } from './skill-library.js';
import { buildTaskSkillContext, resolveSkillOverrideIds } from './skill-selector.js';
import { PLUGIN_REPOSITORY_CATALOG, getPluginRepositoryArchiveUrl, getPluginRepositoryById, isAllowedPluginRepositoryDownload } from './plugin-marketplace.js';
import { runAgentSwarm, estimateSwarmCallBudget } from './agent-swarm.js';
import { shouldAutoDelegate, assignAgentProviders } from './agent-orchestrator.js';
import { createAgentHookBus } from './agent-hooks.js';
import { createProjectMemoryRecord, normalizeProjectMemoryRecords, getProjectMemories, buildProjectMemoryContext, createProjectMemoryBackup, restoreProjectMemoryBackup } from './agent-memory.js';
import { scanAgentContent } from './agent-shield.js';

const $ = (id) => document.getElementById(id);
const DB = {
  settings: 'ai-studio-settings-v2',
  projects: 'ai-studio-projects-v2',
  activeProject: 'ai-studio-active-project-v1',
  chat: 'ai-studio-chat-v2',
  threads: 'ai-studio-chat-threads-v1',
  plugins: 'ai-studio-prompt-plugins-v2',
  snippets: 'ai-studio-snippet-v1',
  activity: 'ai-studio-agent-activity-v1',
  agentMemory: 'ai-studio-agent-memory-v1',
  codeFiles: 'ai-studio-code-files-v1',
  skills: 'ai-studio-skills-v1',
  pluginDownloads: 'ai-studio-plugin-repo-downloads-v1'
};
const nativeApp = Capacitor.isNativePlatform();
const MAX_OPENROUTER_CHAT_MODELS = 4;
const deviceLocalCoder = new DeviceLocalCoder(nativeApp);
let deviceLocalState = null;
let openShortsToolNames = new Set();
let openShortsJobId = '';
let openShortsPendingSource = '';
let openShortsBusy = false;
const providers = {
  openai: { name:'OpenAI', icon:'O', kind:'openai', endpoint:'https://api.openai.com/v1/chat/completions', model:'', keyUrl:'https://platform.openai.com/api-keys', desc:'GPT modelleri · Chat Completions API' },
  anthropic: { name:'Anthropic / Claude', icon:'A', kind:'anthropic', endpoint:'https://api.anthropic.com/v1/messages', model:'', keyUrl:'https://console.anthropic.com/settings/keys', desc:'Claude modelleri · Messages API' },
  gemini: { name:'Google Gemini', icon:'G', kind:'gemini', endpoint:'https://generativelanguage.googleapis.com/v1beta/models/', model:'gemini-3.8-flash', freeModels:GEMINI_FREE_MODELS, keyUrl:'https://aistudio.google.com/apikey', desc:'Yalnızca Free Tier modelleri. Kota sınırlıdır; ücretsiz katmandaki içerikler Google ürünlerini iyileştirmek için kullanılabilir.' },
  deepseek: { name:'DeepSeek', icon:'D', kind:'openai', endpoint:'https://api.deepseek.com/chat/completions', model:'', keyUrl:'https://platform.deepseek.com/api_keys', desc:'OpenAI uyumlu API · model kimliğini düzenleyebilirsin' },
  groq: { name:'Groq', icon:'Q', kind:'openai', endpoint:'https://api.groq.com/openai/v1/chat/completions', model:'openai/gpt-oss-120b', freeModels:GROQ_FREE_MODELS, keyUrl:'https://console.groq.com/keys', desc:'Yalnızca doğrulanmış Developer Free Plan modelleri. Kota model bazında değişir.' },
  openrouter: { name:'OpenRouter', icon:'R', kind:'openai', endpoint:'https://openrouter.ai/api/v1/chat/completions', model:'openrouter/free', keyUrl:'https://openrouter.ai/keys', desc:'Birçok sağlayıcı için tek uyumlu API' },
  apinex: { name:'APInex · Ücretsiz Modeller', icon:'Apx', kind:'openai', endpoint:APINEX_CHAT_ENDPOINT, model:APINEX_DEFAULT_FREE_MODEL, keyUrl:'https://apinex.bond/for-ai', desc:'İsteğe bağlı üçüncü taraf API geçidi. Yalnızca free/* model kimlikleri kabul edilir; istekler APInex ve üst sağlayıcı üzerinden iletilir.' },
  nvidia: { name:'NVIDIA NIM Developer', icon:'N', kind:'openai', endpoint:'https://integrate.api.nvidia.com/v1/chat/completions', model:NVIDIA_NIM_DEVELOPER_MODELS[0], freeModels:NVIDIA_NIM_DEVELOPER_MODELS, keyUrl:'https://build.nvidia.com/', desc:'NVIDIA Developer Program · yalnızca ücretsiz hosted endpoint erişimiyle prototip, araştırma ve test; üretim için değildir.' },
  zai: { name:'Z.ai / GLM Flash', icon:'Z', kind:'openai', endpoint:'https://api.z.ai/api/paas/v4/chat/completions', model:ZAI_FREE_MODELS[0], freeModels:ZAI_FREE_MODELS, keyUrl:'https://z.ai/manage-apikey/apikey-list', desc:'Yalnızca doğrulanmış ücretsiz GLM Flash modelleri seçilebilir.' },
  merkium: { name:'Merkium · Kalıcı Ücretsiz', icon:'M', kind:'openai', endpoint:'https://chat.merkium.nl/api/v1/chat/completions', model:MERKIUM_FREE_MODELS[0], freeModels:MERKIUM_FREE_MODELS, keyUrl:'https://chat.merkium.nl/', desc:'Yedi kalıcı ücretsiz API modeli · 30 istek/dakika.' },
  requesty: { name:'Requesty · Ücretsiz Modeller', icon:'Rq', kind:'openai', endpoint:'https://router.requesty.ai/v1/chat/completions', model:REQUESTY_FREE_MODELS[1], freeModels:REQUESTY_FREE_MODELS, keyUrl:'https://app.requesty.ai/api-keys', desc:'Yalnızca 8 sıfır ücretli model · günde 200 istek · kart gerektirmeyen Free plan.' },
  huggingface: { name:'Hugging Face Inference', icon:'H', kind:'openai', endpoint:'https://router.huggingface.co/v1/chat/completions', model:'', keyUrl:'https://huggingface.co/settings/tokens', desc:'Inference Providers · yüzlerce model için tek API' },
  custom: { name:'Özel OpenAI uyumlu API', icon:'+', kind:'openai', endpoint:'', model:'', keyUrl:'', desc:'Kendi API adresin ve model kimliğin; OpenAI chat completions uyumlu servisler' },
  ollama: { name:'LocalCoder / Ollama (PC)', icon:'⌘', kind:'ollama', endpoint:'', model:'qwen2.5-coder:1.5b', keyUrl:'https://ollama.com/', desc:'Ağdaki bilgisayarda çalışan yerel model; telefona gömülü değil' },
  device: { name:'Telefon içi GGUF', icon:'▣', kind:'device', endpoint:'', model:'', keyUrl:'', desc:'Android belleğine yüklenmiş GGUF modeli; API anahtarı ve internet gerekmez' }
};
const defaultSettings = {
  demoMode: false,
  models: Object.fromEntries(Object.entries(providers).map(([id,p]) => [id,p.model])),
  team: ['openai','anthropic','gemini','deepseek','groq','openrouter','huggingface','custom','ollama','device'],
  customEndpoint: '',
  ollamaUrl: '',
  ollamaModel: 'qwen2.5-coder:1.5b',
  localCoderEngine: 'ollama',
  localCoderApiProvider: 'openai',
  shareReusableContext: false,
  shareVaultContext: false,
  autoAgentAssignment: true,
  autoAgentMinComplexity: 55,
  autoAgentMaxWorkers: 3,
  autoAgentMaxProviderCalls: 14,
  agentMemoryEnabled: true,
  shareAgentMemory: false,
  agentHooksEnabled: true,
  agentShieldEnabled: true,
  vaultBaseUrl: '',
  systemPrompt: 'Yanıtlarını açık ve uygulanabilir yaz. Bilmediğin şeyi uydurma. Kod istenince küçük, test edilebilir adımlar öner.'
};
let settings = structuredClone(defaultSettings);
let chatHistory = [];
let chatThreads = [];
let activeChatThreadId = '';
let deepThinkNext = false;
let projectList = [];
let activeProjectId = '';
let userPlugins = [];
let downloadedPluginRepoIds = [];
let activePluginLibraryTab = 'store';
let reusableSnippets = [];
let agentActivity = [];
let agentMemoryRecords = [];
let sharedVaultItems = [];
let sharedVaultAgents = [];
let codeFiles = [];
let activeCodeFileId = '';
let customSkills = [];
let skillLibrary = [...SKILL_CATALOG];
let selectedSkillIds = getProfileSkillIds('karpathy');
let skillProfileId = 'karpathy';
let pendingSkillImports = [];
let skillImportFailures = [];
let codeFileSaveTimer = null;
let codeFileLoadLock = false;
let busy = false;
let toastTimer;
const runtimeKeys = Object.create(null);
const agentHooks = createAgentHookBus({ isEnabled: () => settings.agentHooksEnabled !== false });
agentHooks.on('*', async event => {
  await logAgentActivity('Hook · ' + event.event, 'Tetiklendi', String(event.detail || event.taskId || event.projectId || '').slice(0, 180));
});
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
function go(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id)); document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===id)); if(id==='tools'&&typeof renderAgentSystems==='function')renderAgentSystems(); window.scrollTo({top:0,behavior:'smooth'}); }
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

function providerModel(id){if(id==='device')return deviceLocalCoder.loadedFileName||'GGUF model';return id==='ollama' ? (settings.ollamaModel||settings.models.ollama||providers.ollama.model) : (settings.models[id]||providers[id].model);}
function isFreeOpenRouterModel(model){const id=String(model||'').trim().toLowerCase();return id==='openrouter/free'||id.endsWith(':free');}
function selectedTeam(){return normalizeTeamSelection(settings.team,Object.keys(providers));}
function providerIsReady(id){
  if(!providers[id])return false;
  if(id==='device')return Boolean(nativeApp&&deviceLocalCoder.loadedFileName);
  if(id==='ollama')return Boolean(String(settings.ollamaUrl||'').trim()&&String(settings.ollamaModel||settings.models.ollama||providers.ollama.model||'').trim());
  const model=String(settings.models[id]||providers[id].model||'').trim();
  if(!model)return false;
  if(!isFreeApiProviderModel(id,model))return false;
  if(providers[id].freeModels&&!providers[id].freeModels.includes(model))return false;
  if(id==='openrouter'&&!isFreeOpenRouterModel(model))return false;
  if(id==='apinex'&&!isFreeApinexModelId(model))return false;
  if(id==='custom')return Boolean(String(settings.customEndpoint||'').trim()&&runtimeKeys[id]);
  return Boolean(runtimeKeys[id]);
}
function configuredTeam(){return selectConfiguredTeam(selectedTeam(),Object.keys(providers),providerIsReady).selected;}
function syncModeUI(){
  settings.demoMode=false;
  $('modePill').textContent='GERÇEK MODEL';
  $('modePill').className='pill live';
  $('connectedCount').textContent=Object.keys(providers).filter(providerIsReady).length;
  const current=$('chatProvider')?.value||'gemini';
  const status=current==='device'?(deviceLocalCoder.loadedFileName?'Telefon GGUF modeli hazır':'Telefon GGUF modeli yüklenmeli')
    :current==='ollama'?(providerIsReady('ollama')?'Ollama bağlantısı ayarlı':'Ollama adresi gerekli')
    :(providerIsReady(current)?'Bağlantı hazır':'API anahtarı gerekli');
  $('providerState').textContent=status;
  const ready=Object.keys(providers).some(providerIsReady);
  $('firstRunSetup')?.classList.toggle('hidden',ready);
  const setupStatus=$('firstRunSetupStatus');
  if(setupStatus)setupStatus.textContent=ready?'AI bağlantısı hazır. Sohbette modelini seçebilirsin.':'Başlamak için bir model sağlayıcısı veya yerel motor bağla.';
}
async function getSecret(id){ if(!nativeApp)return runtimeKeys[id]||''; try{const r=await SecureStoragePlugin.get({key:'ai-studio-provider-'+id}); return r?.value||'';}catch(_){return '';} }
async function saveSecret(id,key){ if(!key.trim())return; if(!nativeApp){runtimeKeys[id]=key.trim(); showToast('Önizleme: anahtar yalnızca bu açık oturumda tutulur, güvenli şekilde kaydedilmez.');return;} await SecureStoragePlugin.set({key:'ai-studio-provider-'+id,value:key.trim()}); runtimeKeys[id]=key.trim(); }
async function deleteSecret(id){ if(!nativeApp){delete runtimeKeys[id];return;} try{await SecureStoragePlugin.remove({key:'ai-studio-provider-'+id});}catch(_){} delete runtimeKeys[id]; }
async function initKeys(){ for(const id of Object.keys(providers)){runtimeKeys[id]=(id==='device'||id==='ollama')?'':(nativeApp?await getSecret(id):'');} }
async function initOpenShortsKey(){runtimeKeys.openshorts=nativeApp?await getSecret('openshorts'):'';}
function setOpenShortsStatus(message,tone='info'){
  const node=$('openshortsStatus');if(!node)return;
  node.textContent=String(message||'');node.dataset.tone=tone;
}
function renderOpenShortsPanel(){
  const connected=Boolean(runtimeKeys.openshorts);
  $('openshortsConnectionBadge').textContent=connected?'Anahtar kayıtlı':'Bağlı değil';
  $('openshortsConnectionBadge').className='pill '+(connected?'safe':'');
  $('openshortsProcess').disabled=!openShortsToolNames.has('process_video')||openShortsBusy;
  $('openshortsQuotaRefresh').disabled=!openShortsToolNames.has('get_quota')||openShortsBusy;
  $('openshortsCheckStatus').disabled=!openShortsJobId||!openShortsToolNames.has('get_job_status')||openShortsBusy;
  $('openshortsJobId').textContent=openShortsJobId||'Henüz iş yok';
  $('openshortsClips')?.querySelectorAll('[data-openshorts-publish]').forEach(button=>{button.disabled=!openShortsToolNames.has('publish_clip')||openShortsBusy;});
  if(!connected)setOpenShortsStatus('Bağlanmak için API anahtarını gir.','info');
  else if(!openShortsToolNames.size)setOpenShortsStatus('Anahtar bu cihazda kayıtlı. OpenShorts bağlantısını doğrula.','info');
}
async function requireOpenShortsTool(name,args={}){
  const key=runtimeKeys.openshorts||'';
  if(!key)throw new Error('Önce OpenShorts API anahtarını kaydedip bağlan.');
  if(!openShortsToolNames.has(name))throw new Error('OpenShorts bağlantısını doğrula; gerekli araç henüz hazır değil.');
  return callOpenShortsTool({apiKey:key,name,arguments:args});
}
function renderOpenShortsClips(clips){
  const out=$('openshortsClips');
  if(!Array.isArray(clips)||!clips.length){out.innerHTML='<p class="fineprint">Henüz klip bağlantısı dönmedi.</p>';return;}
  out.innerHTML=clips.map((clip,index)=>{
    const title=esc(clip?.title||clip?.youtube_title||('Klip '+(index+1)));
    const duration=Number.isFinite(Number(clip?.duration_seconds))?Math.max(0,Number(clip.duration_seconds))+' sn':'Süre bilgisi yok';
    let link='';
    try{const url=new URL(String(clip?.video_url||clip?.download_url||''));if(url.protocol==='https:')link='<a class="btn ghost small" href="'+esc(url.toString())+'" target="_blank" rel="noopener noreferrer">Klibi aç / indir ↗</a>';}catch(_){}
    return '<article class="openshorts-clip"><div><strong>'+title+'</strong><small>'+esc(duration)+'</small></div><div class="row-actions">'+link+'<button class="btn secondary small" type="button" data-openshorts-publish="'+index+'" '+(!openShortsToolNames.has('publish_clip')||openShortsBusy?'disabled':'')+'>Gönder / zamanla</button></div></article>';
  }).join('');
}
async function publishOpenShortsClip(clipIndex){
  if(openShortsBusy)return;
  if(!openShortsJobId)throw new Error('Önce bir OpenShorts videosu işle ve kliplerini hazırla.');
  const platforms=[
    ['openshortsPlatformYoutube','youtube','YouTube Shorts'],
    ['openshortsPlatformTiktok','tiktok','TikTok'],
    ['openshortsPlatformInstagram','instagram','Instagram Reels']
  ].filter(([id])=>$(id)?.checked);
  if(!platforms.length)throw new Error('En az bir yayın platformu seç.');
  const selected=platforms.map(item=>item[1]);
  const title=$('openshortsPublishTitle').value.trim();
  const description=$('openshortsPublishCaption').value.trim();
  const scheduleRaw=$('openshortsPublishAt').value;
  let scheduledDate='';
  if(scheduleRaw){
    const schedule=new Date(scheduleRaw);
    if(Number.isNaN(schedule.getTime())||schedule.getTime()<=Date.now())throw new Error('Zamanlama gelecekte bir tarih ve saat olmalı.');
    scheduledDate=schedule.toISOString();
  }
  const when=scheduledDate?'Zaman: '+new Date(scheduledDate).toLocaleString():'Şimdi gönderilecek';
  const confirmation='Klip '+(clipIndex+1)+' şu platformlara gönderilecek: '+platforms.map(item=>item[2]).join(', ')+'.\n'+when+'\n'+(title?'Başlık: '+title+'\n':'')+(description?'Açıklama: '+description+'\n':'')+'Bu işlem herkese açık paylaşım başlatabilir. Onaylıyor musun?';
  if(!confirm(confirmation))return;
  openShortsBusy=true;renderOpenShortsPanel();
  setOpenShortsStatus('Klip seçilen sosyal hesaplara gönderiliyor / zamanlanıyor…');
  try{
    const args={job_id:openShortsJobId,clip_index:clipIndex,platforms:selected};
    if(title)args.title=title;
    if(description)args.description=description;
    if(scheduledDate){
      args.scheduled_date=scheduledDate;
      args.timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Istanbul';
    }
    const result=await requireOpenShortsTool('publish_clip',args);
    const state=String(result?.status||result?.state||'istek alındı');
    const requestId=result?.request_id||result?.requestId||'';
    setOpenShortsStatus('OpenShorts yayınlama yanıtı: '+state+(requestId?' · İstek: '+String(requestId):'')+'. Platform hesaplarındaki son durumu kontrol et.','success');
    showToast('OpenShorts yayınlama isteğini aldı.');
  }catch(error){
    setOpenShortsStatus(error.message||'Klip yayınlama isteği başarısız.','error');
  }finally{
    openShortsBusy=false;
    renderOpenShortsPanel();
  }
}
async function connectOpenShortsUi(){
  if(openShortsBusy)return;
  openShortsBusy=true;renderOpenShortsPanel();setOpenShortsStatus('OpenShorts MCP bağlantısı ve araç listesi doğrulanıyor…');
  try{
    const entered=$('openshortsApiKey').value.trim();
    if(entered){await saveSecret('openshorts',entered);runtimeKeys.openshorts=entered;}
    const key=runtimeKeys.openshorts||'';
    if(!key)throw new Error('OpenShorts API anahtarını gir.');
    const result=await connectOpenShorts({apiKey:key});
    openShortsToolNames=new Set(result.tools.map(tool=>tool.name));
    const ready=['process_video','get_job_status','list_clips','get_quota','add_subtitles','publish_clip'].filter(name=>openShortsToolNames.has(name));
    $('openshortsApiKey').value='';
    setOpenShortsStatus('Bağlandı: '+(result.serverInfo.title||result.serverInfo.name)+' · '+ready.length+' araç doğrulandı.','success');
    showToast('OpenShorts bağlantısı doğrulandı.');
    await refreshOpenShortsQuota(true);
  }catch(error){openShortsToolNames.clear();setOpenShortsStatus(error.message||'OpenShorts bağlantısı doğrulanamadı.','error');}
  finally{openShortsBusy=false;renderOpenShortsPanel();}
}
async function disconnectOpenShortsUi(){
  if(openShortsBusy)return;
  try{
    await deleteSecret('openshorts');openShortsToolNames.clear();openShortsPendingSource='';openShortsJobId='';
    $('openshortsApiKey').value='';$('openshortsClips').innerHTML='';$('openshortsQuota').textContent='Kota henüz kontrol edilmedi.';
    setOpenShortsStatus('Anahtar bu cihazdan silindi. OpenShorts hesabındaki anahtarı ayrıca iptal etmek için OpenShorts hesap ayarlarını kullan.','info');
    renderOpenShortsPanel();
  }catch(error){setOpenShortsStatus('Anahtar silinemedi: '+(error.message||'Güvenli depolama hatası.'),'error');}
}
async function refreshOpenShortsQuota(quiet=false){
  try{
    const data=await requireOpenShortsTool('get_quota');
    const minutes=data.minutes,plan=data.plan||'OpenShorts hesabı';
    $('openshortsQuota').textContent=minutes&&typeof minutes==='object'
      ?plan+' · '+(minutes.remaining??minutes.left??'Kalan dakika bilgisi yok')+' dakika'
      :plan+' · '+(minutes==null?'Kota bilgisi dönmedi':String(minutes)+' dakika');
    if(!quiet)showToast('OpenShorts kotası güncellendi.');
  }catch(error){
    $('openshortsQuota').textContent=error.message||'Kota alınamadı.';
    if(!quiet)setOpenShortsStatus('Kota kontrolü başarısız: '+(error.message||'Bilinmeyen hata.'),'error');
  }
}
async function startOpenShortsJob(forceLowQuality=false){
  if(openShortsBusy)return;
  try{
    const source=validateOpenShortsSourceUrl(forceLowQuality?openShortsPendingSource:$('openshortsVideoUrl').value);
    if(!$('openshortsConfirmRights').checked)throw new Error('Devam etmek için videonun sahibi olduğunu veya işleme iznin bulunduğunu onayla.');
    openShortsBusy=true;renderOpenShortsPanel();
    setOpenShortsStatus('Video OpenShorts kuyruğuna gönderiliyor. Bu işlem hesabının dakika kotasını kullanabilir…');
    const data=await requireOpenShortsTool('process_video',{
      source_url:source,confirm_rights:true,output_format:'vertical',layouts:['auto'],
      ...(forceLowQuality?{force_low_quality:true}:{})
    });
    if(data.needs_confirmation){
      openShortsPendingSource=source;
      $('openshortsForceLowQuality').hidden=false;$('openshortsForceLowQuality').disabled=false;
      setOpenShortsStatus(data.hint||'Kaynak çözünürlüğü düşük. Devam etmek için ayrı onay gerekiyor.','warning');
      return;
    }
    const jobId=String(data.job_id||data.id||'').trim();
    if(!jobId)throw new Error(data.error||'OpenShorts yanıtında iş kimliği bulunamadı.');
    openShortsJobId=jobId;openShortsPendingSource='';
    $('openshortsForceLowQuality').hidden=true;$('openshortsForceLowQuality').disabled=true;
    $('openshortsJobId').textContent=jobId;
    setOpenShortsStatus('İş oluşturuldu. İşleme birkaç dakika sürebilir; durumu düğmeyle kontrol et.','success');
    showToast('OpenShorts video işini başlattı.');
    await refreshOpenShortsQuota(true);
  }catch(error){setOpenShortsStatus(error.message||'Video işi başlatılamadı.','error');}
  finally{openShortsBusy=false;renderOpenShortsPanel();}
}
async function checkOpenShortsJob(){
  if(openShortsBusy||!openShortsJobId)return;
  openShortsBusy=true;renderOpenShortsPanel();
  try{
    const status=await requireOpenShortsTool('get_job_status',{job_id:openShortsJobId});
    if(status.status==='completed'){
      const clips=await requireOpenShortsTool('list_clips',{job_id:openShortsJobId});
      renderOpenShortsClips(clips.clips||status.clips||[]);
      setOpenShortsStatus('İş tamamlandı. Klipleri inceleyebilir ve bağlantılarından açabilirsin.','success');
    }else if(status.status==='failed'){
      const logs=Array.isArray(status.recent_logs)?status.recent_logs.join('\n'):'';
      setOpenShortsStatus('Video işleme başarısız oldu. '+logs.slice(-900),'error');
    }else setOpenShortsStatus('İş durumu: '+(status.status||'bilinmiyor')+'. Biraz sonra yeniden kontrol et.','info');
  }catch(error){setOpenShortsStatus(error.message||'İş durumu alınamadı.','error');}
  finally{openShortsBusy=false;renderOpenShortsPanel();}
}

function applyProviderFilter(){
  const query=String($('providerSearch')?.value||'').trim().toLocaleLowerCase('tr');
  const filter=$('providerFilter')?.value||'all';
  const cards=[...($('providerGrid')?.querySelectorAll('[data-provider-card]')||[])];
  let visible=0;
  cards.forEach(card=>{
    const id=card.dataset.providerCard,provider=providers[id],model=providerModel(id);
    const searchable=[id,provider?.name,provider?.desc,model].join(' ').toLocaleLowerCase('tr');
    const ready=providerIsReady(id),local=id==='ollama'||id==='device';
    const show=(!query||searchable.includes(query))&&
      (filter==='all'||(filter==='ready'&&ready)||(filter==='setup'&&!ready)||(filter==='local'&&local));
    card.classList.toggle('hidden',!show);
    if(show)visible++;
  });
  const summary=$('providerFilterSummary');
  if(summary)summary.textContent=visible+' / '+cards.length+' sağlayıcı gösteriliyor.';
  $('providerNoResults')?.classList.toggle('hidden',visible>0);
}
function renderProviderCards(){
  const currentChatProvider=$('chatProvider')?.value||'gemini';
  $('providerGrid').innerHTML=Object.entries(providers).map(([id,p])=>{
    const configured=providerIsReady(id),isTeam=settings.team.includes(id),model=providerModel(id);
    if(id==='device'){
      const loaded=Boolean(deviceLocalCoder.loadedFileName);
      const detail=loaded?'Bellekte yüklü model: '+deviceLocalCoder.loadedFileName:(nativeApp?'Henüz GGUF modeli belleğe yüklenmedi.':'Telefon içi GGUF, native Android APK üzerinde kullanılabilir.');
      return '<article class="provider-card" data-provider-card="device"><div class="provider-head"><span class="provider-icon">'+esc(p.icon)+'</span><div class="provider-title"><h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p></div><span id="state-device" class="provider-state '+(loaded?'connected':'')+'">'+(loaded?'Hazır':(nativeApp?'Model yüklenmedi':'Android gerekli'))+'</span></div><p class="fineprint">'+esc(detail)+'</p><div class="provider-help"><label class="team-check"><input type="checkbox" data-team="device" '+(isTeam?'checked':'')+'> Takım turuna ekle</label><button class="btn ghost small" type="button" data-go="tools">GGUF model yöneticisini aç</button></div></article>';
    }
    return '<article class="provider-card" data-provider-card="'+id+'"><div class="provider-head"><span class="provider-icon">'+esc(p.icon)+'</span><div class="provider-title"><h3>'+esc(p.name)+'</h3><p>'+esc(p.desc)+'</p></div><span id="state-'+id+'" class="provider-state '+(configured?'connected':'')+'">'+(configured?'Ayarlı':'Bağlı değil')+'</span></div>'+
      '<details class="provider-settings"><summary>Bağlantı ve model ayarlarını aç</summary>'+
      '<label class="field-label" for="model-'+id+'">Model kimliği</label><input class="input" id="model-'+id+'" value="'+esc(model)+'" maxlength="140" autocomplete="off"'+(p.freeModels?' list="free-models-'+id+'"':'')+'>'+(p.freeModels?'<datalist id="free-models-'+id+'">'+p.freeModels.map(item=>'<option value="'+esc(item)+'"></option>').join('')+'</datalist><p class="fineprint">Yalnızca doğrulanmış ücretsiz model kimlikleri kullanılabilir.</p>':'')+
      (id==='ollama'?'':'<label class="field-label" for="key-'+id+'">API anahtarı</label><input class="input provider-key" type="password" id="key-'+id+'" placeholder="'+(configured?'Kayıtlı anahtar gizli':'Anahtarı buraya yapıştır')+'" autocomplete="new-password" autocapitalize="off" spellcheck="false">'+
        (id==='custom'?'<label class="field-label" for="endpoint-custom">API endpoint (temel adres veya tam chat/completions)</label><input class="input" id="endpoint-custom" value="'+esc(settings.customEndpoint||'')+'" maxlength="500" placeholder="https://api.ornek.com/v1" autocomplete="url">':'')+
        '<div class="provider-help">'+(id==='custom'?'<span class="fineprint">OpenAI uyumlu servisler için. Endpoint HTTPS olmalı; anahtar yalnızca güvenli depoda tutulur.</span>':'<a href="'+esc(p.keyUrl)+'" target="_blank" rel="noopener noreferrer">Resmî anahtar sayfasını aç ↗</a>')+'<label class="team-check"><input type="checkbox" data-team="'+id+'" '+(isTeam?'checked':'')+'> Takım turuna ekle</label></div>'+
        '<div class="provider-actions"><button class="btn secondary small" data-save-key="'+id+'">Model / anahtarı kaydet</button><button class="btn ghost small" data-test-provider="'+id+'">Bağlantıyı test et</button><button class="btn ghost small danger-text" data-delete-key="'+id+'">Anahtarı sil</button></div>')+
      (id==='ollama'?'<div class="provider-help"><span class="fineprint">Adres ve model aşağıdaki yerel bağlantı bölümünde ayarlanır.</span><label class="team-check"><input type="checkbox" data-team="ollama" '+(isTeam?'checked':'')+'> Takım turuna ekle</label></div>':'')+
      (id==='apinex'?'<div class="provider-help apinex-model-tools"><button class="btn ghost small" type="button" data-load-apinex-models>Ücretsiz modelleri getir</button><select class="input" id="apinexFreeModels" aria-label="APInex ücretsiz model listesi"><option value="">Listeyi yükle</option></select><span class="fineprint">Yalnızca free/ ile başlayan model kimlikleri listelenir.</span></div>':'')+
    '</details></article>';
  }).join('');
  $('teamChips').innerHTML=Object.entries(providers).map(([id,p])=>'<label class="chip"><input type="checkbox" data-team="'+id+'" '+(settings.team.includes(id)?'checked':'')+'>'+esc(p.name)+'</label>').join('');
  const teamSummary=$('teamSelectionSummary');
  if(teamSummary)teamSummary.textContent=settings.team.length+' / '+Object.keys(providers).length+' motor seçili';
  applyProviderFilter();
  $('ollamaUrl').value=settings.ollamaUrl||''; $('ollamaModel').value=settings.ollamaModel||providers.ollama.model;
  $('chatProvider').innerHTML=Object.entries(providers).map(([id,p])=>'<option value="'+id+'">'+esc(p.name)+'</option>').join('');
  $('chatProvider').value=providers[currentChatProvider]?currentChatProvider:'gemini';
  syncModeUI();
}
function pushMessage(role,content,meta){ chatHistory.push({role,content,provider:meta?.provider||'',mode:meta?.mode||'live',time:new Date().toISOString()}); if(chatHistory.length>80)chatHistory=chatHistory.slice(-80); renderChat(); persistChat(); }
function renderChat(){const out=$('chatMessages');if(!out)return;if(!chatHistory.length){out.innerHTML='<div class="chat-empty"><div class="chat-empty-icon">✳</div><h2>Bugün ne yapmak istiyorsun?</h2><p>Bir soru sor, dosya ekle, kod geliştir veya bir plugin seç. Yanıtlar seçtiğin gerçek AI motorundan gelir.</p></div>';}else{out.innerHTML=chatHistory.map(m=>'<article class="chat-bubble '+(m.role==='user'?'user':'assistant')+'"><div class="chat-meta">'+(m.role==='user'?'SEN':esc(m.provider||'AI STUDIO'))+' · '+(m.mode==='error'?'HATA':m.mode==='live'?'GERÇEK MODEL':'DEMO')+'</div><div class="chat-text '+(m.mode==='error'?'error':'')+'">'+esc(m.content)+'</div></article>').join('');}out.scrollTop=out.scrollHeight;renderSidebarChats();}
function fitChatInput(){const input=$('chatInput');if(!input)return;input.style.height='auto';input.style.height=Math.min(input.scrollHeight,180)+'px';}
let chatPersistTimer;
function chatThreadTitle(messages){
  const first=messages.find(message=>message.role==='user')?.content||'Yeni sohbet';
  const clean=String(first).replace(/\s+/g,' ').trim();
  return clean.length>38?clean.slice(0,37)+'…':(clean||'Yeni sohbet');
}
function makeChatThread(messages=[]){
  const now=new Date().toISOString();
  return {id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2,8),title:chatThreadTitle(messages),updatedAt:now,messages:messages.slice(-80)};
}
function updateActiveChatThread(){
  const thread=chatThreads.find(item=>item.id===activeChatThreadId);if(!thread)return;
  thread.messages=chatHistory.slice(-80);thread.title=chatThreadTitle(thread.messages);thread.updatedAt=new Date().toISOString();
}
async function persistChatThreads(){updateActiveChatThread();chatThreads=chatThreads.slice(0,80);await setPref(DB.threads,{activeId:activeChatThreadId,items:chatThreads});}
async function persistActiveChatNow(){await setPref(DB.chat,chatHistory);await persistChatThreads();renderSidebarChats();}
async function ensureChatThreads(){
  if(!Array.isArray(chatThreads))chatThreads=[];
  if(!chatThreads.length&&chatHistory.length){const migrated=makeChatThread(chatHistory);chatThreads=[migrated];activeChatThreadId=migrated.id;}
  if(!chatThreads.some(item=>item.id===activeChatThreadId)){
    const latest=chatThreads[0];
    if(latest){activeChatThreadId=latest.id;chatHistory=Array.isArray(latest.messages)?latest.messages:[];}
    else{const fresh=makeChatThread([]);chatThreads=[fresh];activeChatThreadId=fresh.id;chatHistory=[];}
  }else{const active=chatThreads.find(item=>item.id===activeChatThreadId);if(active&&Array.isArray(active.messages))chatHistory=active.messages;}
  await setPref(DB.chat,chatHistory);await persistChatThreads();renderSidebarChats();
}
function renderSidebarChats(){
  const list=$('chatThreadList');if(!list)return;
  const query=($('chatSearchInput')?.value||'').trim().toLocaleLowerCase('tr-TR');
  const visible=[...chatThreads].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).filter(item=>!query||String(item.title||'Yeni sohbet').toLocaleLowerCase('tr-TR').includes(query));
  if(!visible.length){list.innerHTML='<p class="sidebar-empty">'+(query?'Eşleşen sohbet yok.':'Henüz sohbet yok. Yeni sohbet başlat.')+'</p>';return;}
  list.innerHTML=visible.map(item=>'<button type="button" class="chat-thread-item '+(item.id===activeChatThreadId?'active':'')+'" data-chat-thread="'+esc(item.id)+'"><span class="thread-title">'+esc(item.title||'Yeni sohbet')+'</span><small>'+esc(new Date(item.updatedAt||Date.now()).toLocaleDateString('tr-TR',{day:'2-digit',month:'short'}))+'</small></button>').join('');
}
function persistChat(){clearTimeout(chatPersistTimer);chatPersistTimer=setTimeout(()=>persistActiveChatNow().catch(()=>showToast('Sohbet kaydı başarısız oldu.')),250);}
async function createNewChat(){
  await persistActiveChatNow();
  if(!chatHistory.length){closeSidebar();$('chatInput').focus();return;}
  const fresh=makeChatThread([]);chatThreads.unshift(fresh);activeChatThreadId=fresh.id;chatHistory=[];
  await persistActiveChatNow();renderChat();renderSidebarChats();closeSidebar();go('chat');$('chatInput').focus();
}
async function switchChatThread(id){
  await persistActiveChatNow();const thread=chatThreads.find(item=>item.id===id);if(!thread)return;
  activeChatThreadId=id;chatHistory=Array.isArray(thread.messages)?thread.messages.slice(-80):[];
  await persistActiveChatNow();renderChat();renderSidebarChats();closeSidebar();go('chat');
}

function openSidebar(){
  $('appSidebar')?.classList.add('open');$('sidebarScrim')?.classList.remove('hidden');$('appSidebar')?.setAttribute('aria-hidden','false');$('sidebarToggleBtn')?.setAttribute('aria-expanded','true');renderSidebarChats();
}
function closeSidebar(){
  $('appSidebar')?.classList.remove('open');$('sidebarScrim')?.classList.add('hidden');$('appSidebar')?.setAttribute('aria-hidden','true');$('sidebarToggleBtn')?.setAttribute('aria-expanded','false');
}
function closeChatMoreMenu(){$('chatMoreMenu')?.classList.add('hidden');$('chatMoreToggle')?.setAttribute('aria-expanded','false');}
function renderComposerPlugins(){
  const out=$('composerPluginList');if(!out)return;
  if(!userPlugins.length){out.innerHTML='<div class="composer-plugin-empty">Henüz kişisel prompt eklentin yok. Repo Mağazası sekmesinde 32 kaynak bulunuyor.</div>';return;}
  out.innerHTML=userPlugins.map((plugin,index)=>'<button type="button" class="composer-plugin-option" data-compose-plugin="'+index+'"><span class="composer-plugin-symbol">◇</span><span><strong>'+esc(plugin.name)+'</strong><small>'+esc(plugin.prompt.slice(0,110))+'</small></span><span class="composer-plugin-arrow">›</span></button>').join('');
}
function setPluginLibraryTab(tab){
  activePluginLibraryTab=tab==='saved'?'saved':'store';
  const store=$('pluginMarketplacePanel'),saved=$('promptPluginPanel');
  store?.classList.toggle('hidden',activePluginLibraryTab!=='store');
  saved?.classList.toggle('hidden',activePluginLibraryTab!=='saved');
  document.querySelectorAll('[data-plugin-tab]').forEach(button=>{
    const selected=button.dataset.pluginTab===activePluginLibraryTab;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-selected',String(selected));
  });
}
function renderPluginMarketplace(){
  const list=$('pluginMarketplaceList');if(!list)return;
  const query=($('pluginMarketplaceSearch')?.value||'').trim().toLocaleLowerCase('tr');
  const type=$('pluginMarketplaceType')?.value||'all';
  const entries=PLUGIN_REPOSITORY_CATALOG.filter(item=>item.repository)
    .filter(item=>type==='all'||item.group===type)
    .filter(item=>!query||[item.name,item.repository,item.description,item.kind].join(' ').toLocaleLowerCase('tr').includes(query));
  const rea=getPluginRepositoryById('rea-companion');
  const featured=$('pluginMarketplaceFeatured');
  if(featured&&rea){
    featured.innerHTML='<article class="plugin-store-featured"><div class="plugin-store-featured-top"><span class="plugin-store-priority">ÖNCELİKLİ · REA</span><span class="plugin-store-state">Masaüstü companion</span></div><h3>'+esc(rea.name)+'</h3><p>'+esc(rea.description)+'</p><p class="plugin-store-warning">Durum: henüz bağlanmadı. Bu kart gerçek bir REA bağlantısı veya Android içinde REA çalıştırıldığı anlamına gelmez.</p><div class="plugin-store-actions"><a class="plugin-store-download" href="'+esc(rea.docsUrl)+'" target="_blank" rel="noopener noreferrer">REA kurulum rehberi</a><a class="plugin-store-source" href="'+esc(rea.packageUrl)+'" target="_blank" rel="noopener noreferrer">npm paketi</a></div></article>';
  }
  if(!entries.length){
    list.innerHTML='<div class="composer-plugin-empty">Bu aramada eşleşen repo bulunamadı.</div>';
  }else{
    list.innerHTML=entries.map(item=>{
      const archive=getPluginRepositoryArchiveUrl(item.id);
      const opened=downloadedPluginRepoIds.includes(item.id);
      const kindLabel=({skill:'Skill',plugin:'Plugin / Agent',mcp:'MCP Sunucusu',cli:'CLI',desktop:'Masaüstü Uygulaması',memory:'Hafıza / Bağlam',collection:'Kaynak Koleksiyonu',router:'Model Router'})[item.kind]||'Araç';
      const note=item.community?'Topluluk kaynağı':(item.desktopRequired?'PC / masaüstü gerekir':'Kaynak ZIP olarak indirilebilir');
      return '<article class="plugin-store-card"><div class="plugin-store-card-head"><div><h3>'+esc(item.name)+'</h3><small>'+esc(item.repository)+'</small></div><span class="plugin-store-kind">'+esc(kindLabel)+'</span></div><p>'+esc(item.description)+'</p><div class="plugin-store-card-meta"><span>'+esc(note)+'</span>'+(opened?'<span class="plugin-store-opened">İndirme bağlantısı açıldı</span>':'')+'</div><div class="plugin-store-actions"><a class="plugin-store-download" data-plugin-download="'+esc(item.id)+'" href="'+esc(archive)+'" target="_blank" rel="noopener noreferrer">ZIP indir</a><a class="plugin-store-source" href="'+esc(item.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Kaynak</a>'+(item.kind==='skill'?'<button class="plugin-store-import" type="button" data-plugin-import-skill="'+esc(item.id)+'">SKILL.md içe aktar</button>':'')+'</div></article>';
    }).join('');
  }
  const notice=$('pluginStoreNotice');
  if(notice)notice.textContent=entries.length+' / 32 GitHub kaynağı gösteriliyor. ZIP dosyaları bu mağazanın sabit izin listesinden açılır; indirilen araçların kodu AI Studio içinde otomatik çalıştırılmaz.';
}
function openFirstRunSetup(mode='cloud'){
  const selectedMode=mode==='openrouter'?'openrouter':mode==='ollama'?'ollama':mode==='device'?'device':'cloud';
  if(selectedMode==='device'){
    if(!nativeApp){showToast('Telefon içi GGUF yalnızca Android APK’da kullanılabilir.');go('tools');return;}
    go('tools');
    const engine=$('localCoderEngine');
    if(engine){engine.value='device';engine.dispatchEvent(new Event('change',{bubbles:true}));}
    const panel=$('deviceLocalModelsPanel');
    panel?.classList.remove('hidden');
    setTimeout(()=>panel?.scrollIntoView({behavior:'smooth',block:'start'}),80);
    return;
  }
  go('models');
  if(selectedMode==='ollama'){
    $('chatProvider').value='ollama';syncModeUI();
    const panel=$('ollamaSettingsPanel');
    panel?.scrollIntoView({behavior:'smooth',block:'start'});
    $('ollamaUrl')?.focus({preventScroll:true});
    return;
  }
  const providerId=selectedMode==='openrouter'?'openrouter':'gemini';
  $('chatProvider').value=providerId;
  $('providerSearch').value=providerId;
  $('providerFilter').value='all';
  applyProviderFilter();syncModeUI();
  const card=$('providerGrid')?.querySelector('[data-provider-card="'+providerId+'"]');
  card?.querySelector('details.provider-settings')?.setAttribute('open','');
  card?.scrollIntoView({behavior:'smooth',block:'start'});
  $('key-'+providerId)?.focus({preventScroll:true});
}
function openComposerPluginDialog(){
  $('composerPlusMenu')?.classList.add('hidden');$('plusMenuToggle')?.setAttribute('aria-expanded','false');
  renderComposerPlugins();renderPluginMarketplace();setPluginLibraryTab('store');
  const dialog=$('composerPluginDialog');if(dialog&&!dialog.open)dialog.showModal();
}
function chatContext(){return chatHistory.slice(-10).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content}));}
function getActiveProject(){return projectList.find(p=>p&&p.id===activeProjectId)||null;}
function getSharedProjectContext(){
  const liveFiles=codeFiles.map(file=>file.id===activeCodeFileId?{
    ...file,
    name:$('savedCodeFileName')?.value.trim()||file.name,
    language:$('codeLanguage')?.value||file.language,
    content:$('codePad')?.value??file.content,
    updated:new Date().toISOString()
  }:file);
  return buildSharedProjectContext({project:getActiveProject(),files:liveFiles,activeFileId:activeCodeFileId,includeReusable:settings.shareReusableContext===true,snippets:reusableSnippets});
}
function renderProjectContextStatus(){
  const toggle=$('shareReusableContext');if(toggle)toggle.checked=settings.shareReusableContext===true;
  const status=$('projectContextStatus');if(!status)return;
  const project=getActiveProject();
  if(!project){status.textContent='Aktif proje seçilmedi. Ajanlar ortak bir proje notu almayacak.';return;}
  const fileCount=settings.shareReusableContext===true?Math.min(3,codeFiles.length):0;
  const snippetCount=settings.shareReusableContext===true?Math.min(2,reusableSnippets.length):0;
  status.textContent='Aktif bağlam: '+project.name+' · '+(settings.shareReusableContext===true?fileCount+' kod dosyası ve en fazla '+snippetCount+' kasa parçası paylaşılabilir.':'yalnızca proje notları paylaşılır.');
}
function currentGeneralSkillContext(maxChars=6000){
  const generalSkills=getSelectedSkills().filter(skill=>skill.stage==='all');
  return buildStageSkillContext(generalSkills,'all',{maxSkills:MAX_SELECTED_SKILLS,maxChars});
}
function systemFor(id,task='',options={}){
  const context=getSharedProjectContext();
  const vaultContext=buildSharedVaultContext({items:sharedVaultItems,task,enabled:settings.shareVaultContext===true});
  const skillContext=options.includeGeneralSkills===false?'':currentGeneralSkillContext(6000).promptText;
  const taskSkillContext=options.includeTaskSkills===false?'':buildTaskSkillContext({task,role:options.skillRole||'general',stage:options.skillStage||'',skills:skillLibrary,preferredSkillIds:selectedSkillIds,maxSkills:4,maxChars:8000}).promptText;
  const memoryContext=settings.agentMemoryEnabled!==false&&settings.shareAgentMemory===true?buildProjectMemoryContext(agentMemoryRecords,activeProjectId,task,{maxRecords:3,maxChars:2600}):'';
  return settings.systemPrompt+'\nSağlayıcı rolü: '+providers[id].name+'. Yanıtları Türkçe ve uygulanabilir yaz; var olmayan test sonuçlarını iddia etme.'
    +(context?'\n\n'+context:'')
    +(vaultContext?'\n\n'+vaultContext:'')
    +(skillContext?'\n\n'+skillContext:'')
    +(taskSkillContext?'\n\n'+taskSkillContext:'')
    +(memoryContext?'\n\n'+memoryContext:'');
}
async function fetchJson(url,options,timeoutMs=50000){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const response=await fetch(url,{...options,signal:controller.signal}); const text=await response.text(); let data={}; try{data=text?JSON.parse(text):{};}catch(_){data={message:text.slice(0,1000)};}
    if(!response.ok){const message=data?.error?.message||data?.message||('HTTP '+response.status);throw new Error(String(message).slice(0,500));}
    return data;
  }catch(err){if(err?.name==='AbortError')throw new Error('İstek zaman aşımına uğradı. İnterneti, model adını ve sağlayıcı durumunu kontrol et.'); if(err instanceof TypeError)throw new Error('Ağa erişilemedi veya sağlayıcı isteği engelledi (CORS/bağlantı). İnterneti, uç noktayı ve API anahtarını kontrol et.'); throw err;}
  finally{clearTimeout(timer);}
}
async function callProvider(id,prompt,history,options={}){
  if(id!=='device'&&id!=='ollama'){
    const requestedModel=String(options?.modelOverride||providerModel(id)||'').trim();
    if(!isFreeApiProviderModel(id,requestedModel))throw new Error('Güvenlik engeli: Bu modelin ücretsiz erişimi doğrulanmadı. API isteği gönderilmedi.');
  }
  if(id==='device'){
    if(!nativeApp)throw new Error('Telefon içi GGUF ajanı yalnızca native Android uygulamasında çalışır.');
    if(!deviceLocalCoder.loadedFileName)throw new Error('Önce Telefon içi GGUF modelini belleğe yükle.');
    const recent=(Array.isArray(history)?history:[]).slice(-4).filter(item=>item&&(item.role==='user'||item.role==='assistant'))
      .map(item=>(item.role==='assistant'?'Asistan':'Kullanıcı')+': '+String(item.content||'').slice(0,500)).join('\n');
    const devicePrompt='Yeni görev:\n'+String(prompt||'').slice(0,3500)+(recent?'\n\nYakın sohbet bağlamı:\n'+recent:'');
    const generated=await generateWithDeviceModel(devicePrompt,384,'all');
    const answer=String(generated.text||'').trim();
    if(!answer)throw new Error('Telefon içi GGUF modeli boş yanıt verdi. Modeli yeniden yüklemeyi dene.');
    return answer;
  }
  const modelForContext=id==='ollama'?(settings.ollamaModel||providerModel(id)):String(options?.modelOverride||providerModel(id)||'');
  const configuredContextWindow=Number(options?.contextWindowTokens||settings.modelContextWindows?.[id]?.[modelForContext]||settings.modelContextWindows?.[id]||providers[id]?.contextWindowTokens||(id==='ollama'?settings.ollamaContextWindowTokens:0));
  const fittedContext=fitModelContext({providerId:id,modelId:modelForContext,systemPrompt:systemFor(id,prompt,options),history,prompt,contextWindowTokens:configuredContextWindow,maxOutputTokens:2048});
  const systemPrompt=fittedContext.systemPrompt;
  const requestHistory=fittedContext.history;
  if(id==='ollama'){
    const model=(settings.ollamaModel||providerModel(id)).trim();
    if(!String(settings.ollamaUrl||'').trim()||!model)throw new Error('Ollama adresi ve model adı eksik.');
    const url=normalizeOllamaEndpoint(settings.ollamaUrl);
    const messages=[{role:'system',content:systemPrompt}].concat(requestHistory.map(m=>({role:m.role,content:m.content}))).concat([{role:'user',content:prompt}]);
    const d=await fetchJson(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},redirect:'error',body:JSON.stringify({model,messages,stream:false,options:{temperature:0.4}})});
    const answer=d?.message?.content;if(!answer)throw new Error('Ollama yanıtında mesaj yok. Model adını ve sunucuyu kontrol et.');return answer;
  }
  const p=providers[id]; if(!p)throw new Error('Bilinmeyen AI sağlayıcısı.'); const model=String(options?.modelOverride||providerModel(id)||'').trim(); if(!model)throw new Error(p.name+' için model kimliği seçilmemiş. Ücretsiz olduğu doğrulanmış bir model kimliği gir.'); if(id==='openrouter'&&!isFreeOpenRouterModel(model))throw new Error('OpenRouter için yalnızca openrouter/free veya :free ile biten ücretsiz model kimlikleri kullanılabilir.'); if(id==='apinex'&&!isFreeApinexModelId(model))throw new Error('APInex güvenlik kontrolü: Yalnızca free/ ile başlayan model kimlikleri kullanılabilir. Ücretli model çağrısı engellendi.'); if(p.freeModels&&!p.freeModels.includes(model))throw new Error('Bu sağlayıcıda yalnızca doğrulanmış ücretsiz model kimlikleri kullanılabilir.'); const key=await getSecret(id); if(!key)throw new Error(p.name+' için API anahtarı ayarlanmamış. Modeller ekranından ekle.');
  const msgs=requestHistory.filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content})); msgs.push({role:'user',content:prompt});
  if(p.kind==='anthropic'){
    const d=await fetchJson(p.endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model,max_tokens:2048,system:systemPrompt,messages:msgs.filter(m=>m.role==='user'||m.role==='assistant')})});
    const text=(d.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');if(!text)throw new Error('Claude yanıtında metin bulunamadı.');return text;
  }
  if(p.kind==='gemini'){
    const contents=msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
    const url=p.endpoint+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key);
    const d=await fetchJson(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:systemPrompt}]},contents,generationConfig:{temperature:0.4,maxOutputTokens:2048}})});
    const text=(d.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n');if(!text)throw new Error(d.promptFeedback?.blockReason||'Gemini yanıtında metin bulunamadı.');return text;
  }
  const openAiBody={model,messages:[{role:'system',content:systemPrompt},...msgs]};
  if(id==='openai'){openAiBody.max_completion_tokens=2048;}
  else {openAiBody.temperature=0.4;openAiBody.max_tokens=2048;}
  const endpoint=id==='custom'?normalizeOpenAiEndpoint(settings.customEndpoint):p.endpoint;
  const d=await fetchJson(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify(openAiBody)});
  const message=d.choices?.[0]?.message?.content;
  const text=Array.isArray(message)?message.map(x=>x.text||'').join('\n'):message;
  if(!text)throw new Error('Yanıtta metin bulunamadı. Model kimliğinin bu API üzerinde kullanılabildiğini doğrula.');return text;
}
function scanPromptBeforeSend(text,source='user-prompt'){
  if(settings.agentShieldEnabled===false)return true;
  const report=scanAgentContent(text,{source});
  if(report.blocked){
    showToast('AgentShield isteği engelledi: '+report.findings.filter(item=>item.severity==='critical'||item.severity==='high').map(item=>item.message).slice(0,2).join(' '));
    logAgentActivity('AgentShield','Engellendi',report.summary).catch(()=>{});
    return false;
  }
  if(report.findings.length)logAgentActivity('AgentShield','Uyarı',report.summary).catch(()=>{});
  return true;
}
async function submitChat(prompt,providerId){
  if(busy)return;
  const text=String(prompt||'').trim();
  if(!text)return;
  if(!scanPromptBeforeSend(text,'user-prompt'))return;
  if(!providerIsReady(providerId)){
    showToast(providers[providerId].name+' bağlantısı hazır değil. Önce kurulumunu tamamla; mesaj gönderilmedi.');
    openFirstRunSetup(providerId==='ollama'?'ollama':providerId==='device'?'device':providerId==='openrouter'?'openrouter':'cloud');
    return;
  }
  busy=true;$('chatInput').disabled=true;$('chatForm').querySelector('[type=submit]').disabled=true;
  pushMessage('user',text,{mode:'live'});
  const out=$('chatMessages'),loading=document.createElement('article');
  loading.className='result-card';loading.innerHTML='<div class="result-label">GERÇEK MODEL YANITI</div><p>Seçili sağlayıcıdan yanıt bekleniyor…</p>';out.append(loading);
  await logAgentActivity('Tekli sohbet · '+providers[providerId].name,'Başladı','Görev uzunluğu: '+text.length);
  try{
    await agentHooks.emit('beforeAgentRun',{providerId,source:'chat',taskLength:text.length});
    const pool=[...new Set([providerId,...configuredTeam().filter(id=>id!==providerId)])];
    const decision=shouldAutoDelegate({task:text,enabled:settings.autoAgentAssignment!==false,providerCount:pool.length,minScore:settings.autoAgentMinComplexity});
    let answer='',answerProvider=providers[providerId].name;
    if(decision.eligible){
      const workerCount=Math.max(2,Math.min(5,Number(settings.autoAgentMaxWorkers)||3));
      const budget=estimateSwarmCallBudget(workerCount);
      const maxProviderCalls=Math.max(3,Math.min(100,Math.floor(Number(settings.autoAgentMaxProviderCalls)||budget.maximumWithRetries)));
      const pinResolution=resolveSkillOverrideIds(($('agentSkillPins')?.value||'').split(','),skillLibrary);
      const excludeResolution=resolveSkillOverrideIds(($('agentSkillExcludes')?.value||'').split(','),skillLibrary);
      const pinnedSkillIds=pinResolution.validIds,excludedSkillIds=excludeResolution.validIds;
      const invalidSkillNames=[...pinResolution.invalidValues,...excludeResolution.invalidValues];
      if(invalidSkillNames.length)showToast('Tanımadığım Skill adları yok sayıldı: '+invalidSkillNames.slice(0,3).join(', '));
      const skillOverrideSummary=(pinnedSkillIds.length?'\nSabitlenecek Skill: '+pinnedSkillIds.length:'')+(excludedSkillIds.length?'\nHariç tutulacak Skill: '+excludedSkillIds.length:'');
      const approved=confirm('Otomatik uzman ataması: '+decision.score+'/100. Motorlar: '+pool.map(id=>providers[id].name).join(', ')+'.\n\nBeklenen istek: '+budget.expected+'. Önerilen en yüksek istek: '+budget.maximumWithRetries+'. Bu görev için kesin sınır: '+maxProviderCalls+' gerçek istek. Planlama ve son sentez çağrıları korunur; sınır aşılmaz.'+skillOverrideSummary+'\n\nBaşlatılsın mı?');
      if(approved){
        loading.querySelector('p').textContent='Görev uzman ajanlara dağıtılıyor…';
        const result=await runAgentSwarm({
          providerIds:pool,task:text,history:chatContext().slice(0,-1),maxAgents:workerCount,maxProviderCalls,
          skills:skillLibrary,preferredSkillIds:selectedSkillIds,pinnedSkillIds,excludedSkillIds,
          maxConcurrency:nativeApp?2:3,isNative:nativeApp,deviceInfo:deviceLocalState?.device||null,
          shieldEnabled:settings.agentShieldEnabled!==false,suggestedRoles:decision.roles,
          callProvider:(id,prompt,history)=>callProvider(id,prompt,history,{includeTaskSkills:false}),assignProviders:assignAgentProviders,
          onEvent:async event=>{
            if(event.type==='assignment_made')await logAgentActivity('Uzman ataması · '+event.taskId,'Atandı',event.providerId+' · '+event.roleGroup);
            if(event.type==='skills_selected')await logAgentActivity('Otomatik Skill seçimi · '+event.taskId,'Seçildi',(event.skillTrace||[]).map(item=>item.name+' ['+item.source+']: '+item.reasons.join(', ')).join(' · ')+' | Atlanan: '+(event.omittedSkills||[]).map(item=>item.name+' ('+item.reason+')').join(', '));
            if(event.type==='skills_expanded')await logAgentActivity('Ajan ek Skill istedi · '+event.taskId,'Eklendi',(event.skillTrace||[]).map(item=>item.name+' ['+item.source+']: '+item.reasons.join(', ')).join(' · ')||event.skillNames.join(' · '));
            if(event.type==='skills_expansion_failed')await logAgentActivity('Ajan ek Skill istedi · '+event.taskId,'Başarısız',event.reason);
            if(event.type==='skills_refreshed')await logAgentActivity('Dinamik Skill yenileme · '+event.taskId,event.addedSkillNames?.length?'Yeni Skill eklendi':'Skill bağlamı güncellendi',(event.skillTrace||[]).map(item=>item.name+' ['+item.source+']: '+item.reasons.join(', ')).join(' · ')+' | Atlanan: '+(event.omittedSkills||[]).map(item=>item.name+' ('+item.reason+')').join(', '));
            if(event.type==='agent_started')await agentHooks.emit('beforeAgentRun',{taskId:event.agentId,providerId:event.providerId,role:event.role,source:'swarm'});
            if(event.type==='agent_completed')await agentHooks.emit('afterAgentRun',{taskId:event.agentId,providerId:event.providerId,status:event.status,source:'swarm'});
            if(event.type==='agent_retry')await logAgentActivity('Uzman ajan yeniden deniyor','Tekrar',event.reason);
            if(event.type==='budget_exhausted')await logAgentActivity('Agent Swarm istek bütçesi','Sınır doldu',event.phase+' · '+event.modelCallCount+'/'+event.maxProviderCalls+' gerçek istek');
            if(event.type==='shield_blocked')await logAgentActivity('AgentShield · '+event.phase,'Engellendi',(event.findings||[]).map(item=>item.message+' ('+item.severity+')').join(' · ')||'Güvenlik taraması yüksek riskli içerik buldu.');
          }
        });
        answer=result.summary;answerProvider='AI Studio Agent Swarm';
        if($('agentSkillPins'))$('agentSkillPins').value='';if($('agentSkillExcludes'))$('agentSkillExcludes').value='';
        await logAgentActivity('Otomatik Agent Atama',result.status==='partial'?'Kısmi başarı':'Tamamlandı',result.metrics.completed+'/'+result.metrics.workerCount+' uzman · '+result.budget.usedCalls+'/'+result.budget.maxProviderCalls+' gerçek istek · '+result.metrics.retryCount+' tekrar');
      }else{
        await logAgentActivity('Otomatik Agent Atama','Atlandı','Onay verilmedi; tek model yanıtı kullanılacak.');
      }
    }else if(settings.autoAgentAssignment!==false){
      await logAgentActivity('Otomatik Agent Atama','Tekli sohbet',decision.score+'/100 · '+decision.reason);
    }
    if(!answer)answer=await callProvider(providerId,text,chatContext().slice(0,-1));
    await agentHooks.emit('afterAgentRun',{providerId,source:'chat',status:'completed'});
    loading.remove();pushMessage('assistant',answer,{provider:answerProvider,mode:'live'});
    await logAgentActivity('Tekli sohbet · '+answerProvider,'Tamamlandı','Model yanıtı alındı. '+answer.slice(0,160));
  }catch(err){
    await agentHooks.emit('afterAgentRun',{providerId,source:'chat',status:'failed',detail:err?.message||'error'});
    loading.remove();pushMessage('assistant','Hata: '+(err?.message||'Bilinmeyen hata')+'\n\nGerçek yanıt alınmadı. Modeli, anahtarı, kotayı ve bağlantıyı kontrol et.',{provider:providers[providerId].name,mode:'error'});
    await logAgentActivity('Tekli sohbet · '+providers[providerId].name,'Hata',err?.message||'Bilinmeyen hata');
  }finally{
    busy=false;$('chatInput').disabled=false;$('chatForm').querySelector('[type=submit]').disabled=false;$('chatInput').focus();syncModeUI();
  }
}

async function runTeam(prompt){
  if(busy)return;
  const task=String(prompt||'').trim(),chosen=selectedTeam();
  if(!task){showToast('Önce takımın görevini yaz.');return;}
  if(!scanPromptBeforeSend(task,'team-prompt'))return;
  if(!chosen.length){showToast('Önce Modeller ekranından takım ajanı seç.');return;}
  const selected=configuredTeam();
  const skipped=chosen.length-selected.length;
  if(!selected.length){showToast('Seçili sağlayıcılarda API anahtarı veya Ollama bağlantısı ayarlı değil. Modeller ekranını kontrol et.');return;}
  if(skipped)showToast(skipped+' ayarsız sağlayıcı atlandı; yalnızca bağlantısı hazır olanlar çağrılacak.');
  if(!confirmTeamLiveCalls(selected,count=>confirm('Seçili '+count+' ayarlı AI sağlayıcısına paralel gerçek istek gönderilecek. Ücret veya kota kullanımı oluşabilir. Devam edilsin mi?')))return;
  busy=true;
  await logAgentActivity('Paralel takım','Başladı',selected.map(id=>providers[id].name).join(', ')+': '+task);
  pushMessage('user',task,{mode:'live'});
  const out=$('chatMessages'),load=document.createElement('article');
  load.className='result-card';load.innerHTML='<div class="result-label">TAKIM TURU</div><p>Seçili ajanlar çalışıyor…</p>';out.append(load);
  const history=chatContext().slice(0,-1);
  try{
    const results=await runParallelTeamCalls({providerIds:selected,task,history,callProvider:async(id,prompt,priorHistory)=>{
      await agentHooks.emit('beforeAgentRun',{providerId:id,source:'team',taskLength:String(prompt||'').length});
      try{const answer=await callProvider(id,prompt,priorHistory,{skillRole:'general',skillStage:'all'});await agentHooks.emit('afterAgentRun',{providerId:id,source:'team',status:'completed'});return answer;}
      catch(error){await agentHooks.emit('afterAgentRun',{providerId:id,source:'team',status:'failed',detail:error?.message||'error'});throw error;}
    }});
    load.remove();
    results.forEach(r=>pushMessage('assistant',r.error?'Hata: '+r.error:r.answer,{provider:providers[r.id].name,mode:r.error?'error':'live'}));
    for(const r of results)await logAgentActivity('Paralel ajan · '+providers[r.id].name,r.error?'Hata':'Tamamlandı',r.error||String(r.answer||'').slice(0,180));
    await logAgentActivity('Paralel takım',results.some(r=>r.error)?'Kısmi başarı':'Tamamlandı',results.filter(r=>!r.error).length+'/'+results.length+' ajan başarılı.');
  }catch(error){
    load.remove();await logAgentActivity('Paralel takım','Hata',error?.message||'Bilinmeyen hata');showToast('Takım çalışması tamamlanamadı.');
  }finally{busy=false;syncModeUI();}
}
async function runPipeline(prompt){
  if(busy)return;
  const task=String(prompt||'').trim(),chosen=selectedTeam();
  if(!task){showToast('Önce iş akışının görevini yaz.');return;}
  if(!scanPromptBeforeSend(task,'pipeline-prompt'))return;
  if(chosen.length<2){showToast('Sıralı zincir için en az iki ajan seç.');go('models');return;}
  const selected=configuredTeam();
  const skipped=chosen.length-selected.length;
  if(skipped)showToast(skipped+' ayarsız sağlayıcı sıralı zincirden atlandı.');
  if(selected.length<2){showToast('Sıralı zincir için en az iki seçili sağlayıcının anahtarı veya bağlantısı hazır olmalı.');go('models');return;}
  if(!confirmTeamLiveCalls(selected,count=>confirm('Sıralı ajan zinciri '+count+' gerçek API isteği gönderebilir ve sağlayıcı kotası kullanabilir. Her ajan bir öncekinin çıktısını görür. Devam?')))return;
  busy=true;$('chatInput').disabled=true;$('chatForm').querySelector('[type=submit]').disabled=true;$('teamRun').disabled=true;$('pipelineRun').disabled=true;
  await logAgentActivity('Sıralı ajan zinciri','Başladı',selected.length+' aşama: '+task);
  pushMessage('user',task,{mode:'live'});
  const out=$('chatMessages'),loading=document.createElement('article');
  loading.className='result-card';loading.innerHTML='<div class="result-label">SIRALI AJAN ZİNCİRİ</div><p>Planla → geliştir → eleştir → test et aşamaları çalışıyor…</p>';out.append(loading);
  try{
    await runSequentialTeamCalls({
      providerIds:selected,
      task,
      getHistory:()=>chatContext().slice(0,-1),
      runStage:async({id,prompt,index},history)=>{
        const skillStage=index===0?'plan':index===1?'code':index===2||index===3?'review':'all';
        const skillRole=index===0?'architect':index===1?'builder':index===2||index===3?'reviewer':'general';
        await agentHooks.emit('beforeAgentRun',{providerId:id,source:'pipeline',taskLength:String(prompt||'').length});
        try{const answer=await callProvider(id,prompt,history,{skillRole,skillStage});await agentHooks.emit('afterAgentRun',{providerId:id,source:'pipeline',status:'completed'});return answer;}
        catch(error){await agentHooks.emit('afterAgentRun',{providerId:id,source:'pipeline',status:'failed',detail:error?.message||'error'});throw error;}
      },
      onStageStart:async({id,index,stage})=>{
        const title='Aşama '+(index+1)+' · '+providers[id].name;
        await logAgentActivity('Sıralı zincir · '+title,'Çalışıyor',stage.role);
      },
      onStageComplete:async({id,index,total,answer})=>{
        const title='Aşama '+(index+1)+' · '+providers[id].name;
        pushMessage('assistant','AŞAMA '+(index+1)+'/'+total+'\n'+answer,{provider:providers[id].name,mode:'live'});
        await logAgentActivity('Sıralı zincir · '+title,'Tamamlandı',answer.slice(0,180));
        loading.querySelector('p').textContent='Tamamlanan aşama: '+(index+1)+'/'+total+' · '+providers[id].name;
      }
    });
    loading.remove();
    await logAgentActivity('Sıralı ajan zinciri','Tamamlandı',selected.length+' aşama tamamlandı. Testler otomatik çalıştırılmadı.');
    showToast('Sıralı ajan zinciri tamamlandı.');
  }catch(err){
    loading.remove();
    pushMessage('assistant','Zincir durdu: '+(err?.message||'Bilinmeyen hata')+'\nÖnceki aşamalar sohbet geçmişinde duruyor; kalan aşamaları kontrol edip yeniden deneyebilirsin.',{provider:'AI STUDIO',mode:'error'});
    await logAgentActivity('Sıralı ajan zinciri','Hata',err?.message||'Bilinmeyen hata');
  }finally{
    busy=false;$('chatInput').disabled=false;$('chatForm').querySelector('[type=submit]').disabled=false;$('teamRun').disabled=false;$('pipelineRun').disabled=false;syncModeUI();
  }
}
function renderCompareResults(results){$('compareResults').innerHTML=results.map(r=>'<article class="result-card"><div class="result-label">'+esc(providers[r.id].name)+' · '+(r.error?'HATA':r.mode==='live'?'GERÇEK MODEL':'YANIT')+'</div><p>'+esc(r.error||r.answer)+'</p></article>').join('');}
async function runCompare(){
  if(busy){showToast('Başka bir ajan işi çalışıyor.');return;}
  const prompt=$('comparePrompt').value.trim();
  if(!prompt){showToast('Önce karşılaştırılacak görevi yaz.');return;}
  const chosen=selectedTeam();
  if(chosen.length<2){showToast('Karşılaştırmak için en az iki ajan seç.');go('models');return;}
  const selected=configuredTeam();
  const skipped=chosen.length-selected.length;
  if(skipped)showToast(skipped+' ayarsız sağlayıcı karşılaştırmadan atlandı.');
  if(selected.length<2){showToast('Karşılaştırmak için en az iki sağlayıcının anahtarı veya bağlantısı hazır olmalı.');go('models');return;}
  if(!confirmTeamLiveCalls(selected,count=>confirm('Karşılaştırma '+count+' gerçek API isteği gönderebilir ve sağlayıcı kotası kullanabilir. Devam?')))return;
  busy=true;$('compareRun').disabled=true;$('compareRun').textContent='Çalışıyor…';
  $('compareResults').innerHTML='<div class="panel"><p>Sonuçlar bekleniyor…</p></div>';
  await logAgentActivity('Model karşılaştırma','Başladı',selected.map(id=>providers[id].name).join(', ')+': '+prompt);
  try{
    const rawResults=await runParallelTeamCalls({
      providerIds:selected,task:prompt,history:[],
      callProvider
    });
    const results=rawResults.map(result=>result.error
      ? {...result,mode:'error'}
      : {...result,mode:'live'});
    renderCompareResults(results);
    for(const r of results)await logAgentActivity('Karşılaştırma · '+providers[r.id].name,r.error?'Hata':'Tamamlandı',r.error||String(r.answer||'').slice(0,180));
    await logAgentActivity('Model karşılaştırma',results.some(r=>r.error)?'Kısmi başarı':'Tamamlandı',results.filter(r=>!r.error).length+'/'+results.length+' yanıt başarılı.');
  }catch(error){
    await logAgentActivity('Model karşılaştırma','Hata',error?.message||'Bilinmeyen hata');showToast('Karşılaştırma başarısız oldu.');
  }finally{
    $('compareRun').disabled=false;$('compareRun').textContent='Karşılaştırmayı başlat';busy=false;syncModeUI();
  }
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
function renderAgentSystems(){
  const project=getActiveProject(),status=$('agentSystemsStatus');
  if(status)status.textContent=project?'Aktif proje: '+project.name+' · Hafıza bu projeye özel.':'Hafıza için önce Projeler ekranından bir proje seç.';
  const enabled=$('agentMemoryEnabled');if(enabled)enabled.checked=settings.agentMemoryEnabled!==false;
  const share=$('shareAgentMemory');if(share){share.checked=settings.shareAgentMemory===true;share.disabled=settings.agentMemoryEnabled===false;}
  const auto=$('autoAgentAssignment');if(auto)auto.checked=settings.autoAgentAssignment!==false;
  const threshold=$('autoAgentMinComplexity');if(threshold)threshold.value=String(settings.autoAgentMinComplexity??55);
  const workers=$('autoAgentMaxWorkers');if(workers)workers.value=String(settings.autoAgentMaxWorkers??3);
  const providerCalls=$('autoAgentMaxProviderCalls');if(providerCalls)providerCalls.value=String(Math.max(3,Math.min(100,Number(settings.autoAgentMaxProviderCalls)||14)));
  const hooks=$('agentHooksEnabled');if(hooks)hooks.checked=settings.agentHooksEnabled!==false;
  const shield=$('agentShieldEnabled');if(shield)shield.checked=settings.agentShieldEnabled!==false;
  const save=$('agentMemorySave');if(save)save.disabled=!project||settings.agentMemoryEnabled===false;
  const list=$('agentMemoryList');if(!list)return;
  const records=getProjectMemories(agentMemoryRecords,activeProjectId);
  if(!records.length){list.innerHTML='<p class="fineprint">Bu projede henüz hafıza kaydı yok.</p>';return;}
  list.innerHTML=records.slice(0,12).map(item=>'<article class="activity-card"><div class="reuse-top"><strong>'+esc(item.title)+'</strong><button class="btn danger small" type="button" data-memory-delete="'+esc(item.id)+'">Sil</button></div><p>'+esc(item.content)+'</p><time>'+esc(new Date(item.createdAt||Date.now()).toLocaleString('tr-TR'))+'</time></article>').join('');
}
async function saveAgentSystemSetting(key,value){settings[key]=value;await setPref(DB.settings,settings);renderAgentSystems();}
async function saveAgentMemory(){
  if(settings.agentMemoryEnabled===false){showToast('Önce yerel proje hafızasını etkinleştir.');return;}
  const project=getActiveProject();if(!project){showToast('Hafıza kaydı için önce bir proje seç.');return;}
  const result=createProjectMemoryRecord({projectId:project.id,title:$('agentMemoryTitle').value,content:$('agentMemoryContent').value,tags:$('agentMemoryTags').value.split(','),source:'user'});
  if(!result.ok){showToast(result.reason);return;}
  if(getProjectMemories(agentMemoryRecords,project.id).length>=40){showToast('Bu proje için 40 kayıt sınırı dolu. Önce eski kayıt sil.');return;}
  await agentHooks.emit('beforeMemoryWrite',{projectId:project.id,chars:result.record.content.length,detail:'Kullanıcı proje hafızasına kayıt ekliyor.'});
  agentMemoryRecords=normalizeProjectMemoryRecords([result.record,...agentMemoryRecords]);await setPref(DB.agentMemory,agentMemoryRecords);
  await agentHooks.emit('afterMemoryWrite',{projectId:project.id,memoryId:result.record.id,detail:'Proje hafızası cihazda saklandı.'});
  $('agentMemoryTitle').value='';$('agentMemoryContent').value='';$('agentMemoryTags').value='';renderAgentSystems();showToast('Proje hafızası cihaza kaydedildi.');
}
function exportAgentMemory(){downloadText('ai-studio-agent-memory.json',JSON.stringify(createProjectMemoryBackup(agentMemoryRecords),null,2),'application/json;charset=utf-8');}
async function importAgentMemory(file){
  if(!file||file.size>1000000)throw new Error('Hafıza yedeği 1 MB sınırını aşamaz.');
  const parsed=JSON.parse(await file.text()),restored=restoreProjectMemoryBackup(parsed,agentMemoryRecords);
  agentMemoryRecords=restored.records;await setPref(DB.agentMemory,agentMemoryRecords);renderAgentSystems();
  showToast(restored.imported+' kayıt içe aktarıldı; '+restored.rejected+' kayıt atlandı.');
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
function syncLocalCoderEngineUI(){
  const select=$('localCoderEngine'); if(!select)return;
  const option=[...select.options].find(item=>item.value==='device');
  const supported=Boolean(nativeApp&&deviceLocalState?.device?.supported);
  if(option)option.disabled=!supported;
  const engine=settings.localCoderEngine==='api'?'api':(settings.localCoderEngine==='device'&&supported?'device':'ollama');
  if(settings.localCoderEngine==='device'&&!supported)settings.localCoderEngine='ollama';
  select.value=engine;
  const providerSelect=$('localCoderApiProvider');
  if(providerSelect){
    const available=Object.entries(providers).filter(([id])=>id!=='ollama');
    const current=settings.localCoderApiProvider||'openai';
    providerSelect.innerHTML=available.map(([id,p])=>'<option value="'+esc(id)+'">'+esc(p.name)+'</option>').join('');
    providerSelect.value=available.some(([id])=>id===current)?current:'openai';
    settings.localCoderApiProvider=providerSelect.value;
  }
  $('localCoderApiSettings')?.classList.toggle('hidden',engine!=='api');
}
function renderDeviceModelDescription(){
  const select=$('onDeviceModelCatalog'), description=$('onDeviceModelDescription');
  const licenseLink=$('onDeviceModelLicense');
  if(!select||!description)return;
  const model=DEVICE_MODEL_CATALOG.find(item=>item.id===select.value)||DEVICE_MODEL_CATALOG[0];
  const info=deviceLocalState?.device;
  const assessment=info?assessDeviceModel(model,info):null;
  let fit='Telefon bilgileri okunuyor.';
  if(info&&!info.supported)fit='Bu cihaz yerel motoru desteklemiyor.';
  else if(assessment){
    if(assessment.fitsRecommended)fit='Bu telefon için uygun görünüyor.';
    else fit='Uyarı: '+assessment.warnings.join('; ')+'.';
  }
  description.textContent=model.name+' · yaklaşık '+formatModelBytes(model.sizeBytes)+' indirme · '+model.minRamGb+' GB+ RAM · '+model.minCpuCores+'+ CPU çekirdeği önerisi (kaba tahmin). '+fit+' '+model.summary+(model.licenseNotice?' '+model.licenseNotice:'');
  if(licenseLink){
    licenseLink.href=model.licenseUrl||'#';
    licenseLink.textContent='Lisans: '+(model.licenseName||'Belirtilmemiş')+' · Koşulları görüntüle';
    licenseLink.hidden=!model.licenseUrl;
  }
}
function renderDeviceLocalModelManager(){
  const panel=$('deviceLocalModelsPanel'); if(!panel)return;
  if(!nativeApp){panel.classList.add('hidden');syncLocalCoderEngineUI();return;}
  panel.classList.remove('hidden');
  const info=deviceLocalState?.device;
  const recommendation=deviceLocalState?.recommendation;
  const summary=$('deviceLocalProfile');
  if(summary){
    if(!info)summary.textContent='Telefon bilgileri alınamadı.';
    else {
      const deviceName=[info.manufacturer,info.deviceModel].filter(value=>value&&value!=='unknown').join(' ');
      summary.innerHTML='<strong>'+(info.supported?'Bu telefon yerel model motorunu destekliyor':'Bu telefon için yerel model motoru desteklenmiyor')+'</strong>'
        +(deviceName?'<span>Cihaz: '+esc(deviceName)+'</span>':'')
        +'<span>Güç profili: '+esc(recommendation?.capabilityTier||'Belirlenemedi')+'</span>'
        +'<span>Android '+esc(info.androidSdk)+' · '+esc(info.abi)+' · '+esc(info.processorCount)+' CPU çekirdeği</span>'
        +'<span>RAM: '+formatModelBytes(info.totalMemoryBytes)+' · Kullanılabilir: '+formatModelBytes(info.availableMemoryBytes)+'</span>'
        +'<span>Boş alan: '+formatModelBytes(info.freeStorageBytes)+'</span>';
    }
  }
  const catalog=$('onDeviceModelCatalog');
  if(catalog){
    const previous=catalog.value;
    catalog.innerHTML=DEVICE_MODEL_CATALOG.map(model=>{
      const assessment=info?assessDeviceModel(model,info):null;
      const tags=[];
      if(recommendation?.id===model.id&&!recommendation.isUnderpowered)tags.push('telefon için önerilen');
      if(assessment&&!assessment.memoryOk)tags.push('RAM sınırı');
      else if(assessment&&!assessment.cpuOk)tags.push('daha yavaş olabilir');
      if(assessment&&!assessment.storageOk)tags.push('depolama yetersiz');
      return '<option value="'+esc(model.id)+'">'+esc(model.name)+' · '+formatModelBytes(model.sizeBytes)+(tags.length?' · '+esc(tags.join(', ')):'')+'</option>';
    }).join('');
    if(DEVICE_MODEL_CATALOG.some(item=>item.id===previous))catalog.value=previous;
    else if(recommendation?.id)catalog.value=recommendation.id;
  }
  const installed=$('installedLocalModel');
  if(installed){
    const previous=installed.value||deviceLocalCoder.loadedFileName;
    const models=deviceLocalState?.models||[];
    installed.innerHTML=models.length?models.map(model=>'<option value="'+esc(model.fileName)+'">'+esc(model.fileName)+' · '+formatModelBytes(model.sizeBytes)+(model.loaded?' · Bellekte':'')+'</option>').join(''):'<option value="">Henüz model yok</option>';
    if(models.some(model=>model.fileName===previous))installed.value=previous;
    else if(models.length)installed.value=models[0].fileName;
  }
  const activeDownload=deviceLocalCoder.activeDownloadId!==null;
  const selectedCatalogueModel=DEVICE_MODEL_CATALOG.find(item=>item.id===catalog?.value);
  const canResumeSelected=activeDownload&&deviceLocalCoder.activeDownloadFileName===selectedCatalogueModel?.fileName;
  if($('onDeviceModelCatalog'))$('onDeviceModelCatalog').disabled=!Boolean(info?.supported);
  if(catalog&&!catalog.dataset.resumeChangeBound){
    catalog.addEventListener('change',()=>renderDeviceLocalModelManager());
    catalog.dataset.resumeChangeBound='true';
  }
  if($('downloadOnDeviceModel')){
    $('downloadOnDeviceModel').disabled=activeDownload
      ?!canResumeSelected
      :!Boolean(info?.supported);
    $('downloadOnDeviceModel').textContent=activeDownload
      ?(canResumeSelected?'İndirmeyi sürdür':'Başka model indiriliyor')
      :'Modeli indir';
  }
  if($('cancelOnDeviceDownload')){
    $('cancelOnDeviceDownload').hidden=!activeDownload;
    $('cancelOnDeviceDownload').disabled=!activeDownload;
  }
  if($('importOnDeviceModel'))$('importOnDeviceModel').disabled=!Boolean(info?.supported);
  if($('loadOnDeviceModel'))$('loadOnDeviceModel').disabled=!Boolean(info?.supported&&deviceLocalState?.models?.length);
  if($('deleteOnDeviceModel'))$('deleteOnDeviceModel').disabled=!Boolean(deviceLocalState?.models?.length);
  if($('unloadOnDeviceModel'))$('unloadOnDeviceModel').disabled=!Boolean(deviceLocalCoder.loadedFileName);
  renderDeviceModelDescription();syncLocalCoderEngineUI();
}
function syncAiTeamProviderUI(){
  if($('providerGrid'))renderProviderCards();
  if($('dashboard'))updateDashboard();
}
async function refreshDeviceLocalModels(quiet=false){
  if(!nativeApp){deviceLocalState=null;if(settings.localCoderEngine==='device'){settings.localCoderEngine='ollama';await setPref(DB.settings,settings);}renderDeviceLocalModelManager();syncAiTeamProviderUI();return null;}
  try{
    deviceLocalState=await deviceLocalCoder.refresh();
    if(!deviceLocalState.device?.supported&&settings.localCoderEngine==='device'){settings.localCoderEngine='ollama';await setPref(DB.settings,settings);}
    renderDeviceLocalModelManager();syncAiTeamProviderUI();
    const recommendation=deviceLocalState.recommendation;
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent=deviceLocalCoder.activeDownloadId!==null
      ?(deviceLocalCoder.activeDownloadFileName+' indirmesi devam ediyor. Aynı modeli seçip "İndirmeyi sürdür" düğmesiyle kaldığı yerden takip edebilir veya iptal edebilirsin.')
      :deviceLocalState.device?.supported
        ?(recommendation.isUnderpowered
          ?'Telefon profili: '+recommendation.capabilityTier+'. '+recommendation.recommendationReason+' En küçük modeli denemeden önce boş RAM ve depolamayı kontrol et.'
          :'Telefon profili: '+recommendation.capabilityTier+'. Önerilen model: '+recommendation.name+'. '+recommendation.recommendationReason+' Modeli indirdikten sonra internet olmadan çalıştırabilirsin.')
        :'Bu Android sürümü veya işlemci mimarisi yerel modeli desteklemiyor. PC / Ollama ve API sağlayıcıları çalışmaya devam eder.';
    return deviceLocalState;
  }catch(error){
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Telefon bilgileri okunamadı: '+(error.message||'Native LocalLlm köprüsünü kontrol et.');
    if(!quiet)showToast('Yerel model yöneticisi açılamadı. Android APK sürümünü ve cihaz uyumluluğunu kontrol et.');
    deviceLocalState=null;renderDeviceLocalModelManager();syncAiTeamProviderUI();return null;
  }
}
async function downloadSelectedDeviceModel(){
  const model=DEVICE_MODEL_CATALOG.find(item=>item.id===$('onDeviceModelCatalog')?.value);
  if(!model)return;
  const assessment=deviceLocalState?.device?assessDeviceModel(model,deviceLocalState.device):null;
  const warning=assessment&&!assessment.fitsRecommended?'\n\nCihaz uyarısı: '+assessment.warnings.join('; ')+'. Modeli elle seçtin; indirmek yine de mümkün olabilir, ancak yükleme veya hız sorunları yaşanabilir.':'';
  const isResuming=deviceLocalCoder.activeDownloadId!==null&&deviceLocalCoder.activeDownloadFileName===model.fileName;
  if(!confirm(model.name+(isResuming?' indirmesi kaldığı yerden takip edilsin mi?':' indirilsin mi?')+' Yaklaşık '+formatModelBytes(model.sizeBytes*1.15)+' boş alan bırak. İlk indirme internet ister; model indirildikten sonra çıkarım çevrimdışı yapılır. İndirme varsayılan olarak ücretli/mobil veri kullanmaz.'+warning))return;
  const button=$('downloadOnDeviceModel');button.disabled=true;
  const cancelButton=$('cancelOnDeviceDownload');if(cancelButton){cancelButton.hidden=false;cancelButton.disabled=true;}
  if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='İndirme başlatılıyor…';
  try{
    await deviceLocalCoder.download(model,status=>{
      if(cancelButton)cancelButton.disabled=false;
      const percent=Number(status.progress||0);
      if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Model indiriliyor: %'+percent+' · '+formatModelBytes(status.downloadedBytes||0)+' / '+(Number(status.totalBytes)>0?formatModelBytes(status.totalBytes):'hesaplanıyor');
    });
    await refreshDeviceLocalModels(true);
    const fileName=model.fileName;
    if($('installedLocalModel'))$('installedLocalModel').value=fileName;
    showToast('Model indirildi. Şimdi belleğe yükleyebilirsin.');
  }catch(error){
    const cancelled=error.message==='İndirme kullanıcı tarafından iptal edildi.';
    const canRetryCancel=deviceLocalCoder.activeDownloadId!==null;
    const detail=error.message||'Wi-Fi bağlantısını ve depolama alanını kontrol et.';
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent=cancelled
      ?'Model indirmesi iptal edildi. Yarım kalan dosya temizlendi.'
      :'İndirme tamamlanamadı: '+detail+(canRetryCancel?' İndirme görevi hâlâ etkin olabilir; aşağıdaki iptal düğmesiyle tekrar deneyebilirsin.':'');
    if(cancelled)await refreshDeviceLocalModels(true);
    showToast(cancelled?'Model indirmesi iptal edildi.':'Model indirilemedi.');
  }finally{
    button.disabled=false;
    if(cancelButton){
      const canRetryCancel=deviceLocalCoder.activeDownloadId!==null;
      cancelButton.hidden=!canRetryCancel;
      cancelButton.disabled=!canRetryCancel;
    }
  }
}
async function cancelSelectedDeviceModel(){
  const button=$('cancelOnDeviceDownload');if(button)button.disabled=true;
  try{
    const result=await deviceLocalCoder.cancelDownload();
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent=result.completed
      ?'İndirme zaten tamamlanmış.'
      :result.cancelled
        ?'İptal isteği gönderildi; yarım kalan dosya temizleniyor…'
        :'İptal edilecek etkin bir indirme bulunamadı.';
  }catch(error){
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='İndirme iptal edilemedi: '+(error.message||'Tekrar dene.');
    if(button)button.disabled=false;
  }
}
async function cancelDeviceModelImport(){
  const button=$('cancelOnDeviceImport');
  if(button)button.disabled=true;
  try{
    const result=await deviceLocalCoder.cancelImport();
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent=result.cancelRequested
      ?'GGUF aktarımı durduruluyor; yarım dosya temizleniyor…'
      :'İptal edilecek etkin bir dosya aktarımı yok.';
  }catch(error){
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Aktarım iptal edilemedi: '+(error.message||'Tekrar dene.');
    if(button)button.disabled=false;
  }
}
async function importDeviceModelFile(){
  const button=$('importOnDeviceModel');
  const cancelButton=$('cancelOnDeviceImport');
  if(button)button.disabled=true;
  if(cancelButton){cancelButton.hidden=true;cancelButton.disabled=true;}
  if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='GGUF dosyasını seç…';
  try{
    const result=await deviceLocalCoder.importModel(progress=>{
      if(!$('onDeviceModelStatus'))return;
      const copied=formatModelBytes(progress.copiedBytes||0);
      const total=Number(progress.totalBytes||0);
      const progressLabel=Number(progress.progress)>=0?' · %'+Number(progress.progress):'';
      if(cancelButton&&!progress.complete){
        cancelButton.hidden=false;
        cancelButton.disabled=deviceLocalCoder.cancelImportRequested;
      }
      if(cancelButton&&progress.complete){cancelButton.hidden=true;cancelButton.disabled=true;}
      $('onDeviceModelStatus').textContent=progress.complete
        ?'GGUF dosyası doğrulandı ve telefona kaydedildi; model listesi yenileniyor…'
        :'Model telefona kopyalanıyor: '+copied+' / '+(total>0?formatModelBytes(total):'boyut hesaplanıyor')+progressLabel;
    });
    if(result.cancelled){
      if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Dosya aktarımı iptal edildi veya dosya seçimi kapatıldı.';
      return;
    }
    await refreshDeviceLocalModels(true);
    if($('installedLocalModel'))$('installedLocalModel').value=result.fileName;
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent=result.fileName+' içe aktarıldı ('+formatModelBytes(result.sizeBytes)+'). Belleğe yükleyebilirsin.';
    showToast('GGUF modeli telefona aktarıldı.');
  }catch(error){
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Model içe aktarılamadı: '+(error.message||'Dosyanın GGUF biçimini ve boş depolamayı kontrol et.');
    showToast('GGUF modeli içe aktarılamadı.');
  }finally{
    if(button)button.disabled=!Boolean(deviceLocalState?.device?.supported);
    if(cancelButton){cancelButton.hidden=true;cancelButton.disabled=true;}
  }
}

async function loadSelectedDeviceModel(){
  const fileName=$('installedLocalModel')?.value;
  if(!fileName){showToast('Önce bir GGUF modeli indir.');return;}
  const button=$('loadOnDeviceModel');button.disabled=true;
  if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Model belleğe yükleniyor… Büyük modelde birkaç dakika sürebilir.';
  try{
    const contextSize=Number($('onDeviceContextSize')?.value||2048);
    await deviceLocalCoder.load(fileName,contextSize,event=>{
      if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Model belleğe yükleniyor: %'+Number(event.progress||0);
    });
    settings.localCoderEngine='device';await setPref(DB.settings,settings);syncLocalCoderEngineUI();
    await refreshDeviceLocalModels(true);
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent=fileName+' belleğe yüklendi. Local Coder artık bu telefonda internet olmadan çalışabilir.';
    showToast('Telefon içi model hazır.');
  }catch(error){
    if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Model yüklenemedi: '+(error.message||'Boş RAM ve model dosyasını kontrol et.');
    showToast('Model belleğe yüklenemedi.');
  }finally{button.disabled=false;await refreshDeviceLocalModels(true);}
}
async function unloadDeviceModel(){
  try{await deviceLocalCoder.unload();await refreshDeviceLocalModels(true);if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Model bellekten kapatıldı. İndirilmiş dosya telefonda duruyor.';showToast('Model kapatıldı; indirme dosyası silinmedi.');}
  catch(error){showToast('Model kapatılamadı: '+(error.message||'Hata'));}
}
async function deleteSelectedDeviceModel(){
  const fileName=$('installedLocalModel')?.value;if(!fileName)return;
  if(!confirm(fileName+' telefondan silinsin mi?'))return;
  try{await deviceLocalCoder.delete(fileName);await refreshDeviceLocalModels(true);if($('onDeviceModelStatus'))$('onDeviceModelStatus').textContent='Model dosyası telefondan silindi.';showToast('Model silindi.');}
  catch(error){showToast('Model silinemedi: '+(error.message||'Hata'));}
}
async function generateWithDeviceModel(basePrompt,maxTokens,stageId='all'){
  const contextSize=Number($('onDeviceContextSize')?.value||2048);
  const totalCharBudget=Math.max(1200,Math.floor((contextSize-maxTokens-128)*3.1));
  const systemFull=systemFor('device',basePrompt,{includeGeneralSkills:false,includeTaskSkills:false});
  const systemBudget=Math.min(systemFull.length,Math.floor(totalCharBudget*0.25));
  const systemText=systemFull.slice(0,systemBudget);
  const userBudget=Math.max(500,totalCharBudget-systemText.length-80);
  const skillBudget=Math.max(0,userBudget-basePrompt.length-100);
  const skills=currentSkillContext(stageId,skillBudget,basePrompt);
  let userText=basePrompt+(skills.promptText?'\n\n'+skills.promptText:'');
  let wasTrimmed=false;
  if(userText.length>userBudget){userText=userText.slice(0,userBudget);wasTrimmed=true;}
  const result=await deviceLocalCoder.generate([{role:'system',content:systemText},{role:'user',content:userText}],{maxTokens,temperature:0.25});
  return {text:result.text,wasTrimmed,skillCount:skills.includedIds.length};
}
async function runDeviceLocalCoderWorkshop(){
  if(busy){showToast('Başka bir ajan zinciri çalışıyor.');return;}
  const task=$('localCoderTask').value.trim();if(!task){showToast('Önce Local Coder görevini yaz.');return;}
  if(!deviceLocalCoder.loadedFileName){showToast('Önce Telefon içi model yöneticisinden bir modeli belleğe yükle.');return;}
  const sourceCode=$('localCoderUseCode').checked?$('codePad').value.slice(0,10000):'';
  const stages=buildLocalCoderStages({task,language:$('codeLanguage').value,sourceCode});
  let previous='';let contextTrimmed=false;busy=true;$('localCoderRun').disabled=true;$('localCoderRun').textContent='Telefon içi ajan çalışıyor…';$('localCoderReview').value='';$('localCoderOutput').value='';
  try{
    await logAgentActivity('Local Coder · Telefon','Başladı',task);
    for(const stage of stages){
      $('localCoderStatus').textContent=stage.title+' · '+deviceLocalCoder.loadedFileName+' çalışıyor…';
      await logAgentActivity('Telefon içi '+stage.title,'Çalışıyor',task);
      const basePrompt=stage.makePrompt?stage.makePrompt(previous):stage.prompt;
      const outputLimit=stage.id==='code'?1000:420;
      const generated=await generateWithDeviceModel(basePrompt,outputLimit,stage.id);
      const answer=generated.text;if(!answer)throw new Error('Yerel model boş yanıt verdi. Modeli yeniden yüklemeyi dene.');
      if(stage.id==='code')$('localCoderOutput').value=extractCodeArtifact(answer);
      if(stage.id==='review')$('localCoderReview').value=answer;
      previous=answer;
      await logAgentActivity('Telefon içi '+stage.title,'Tamamlandı',answer.slice(0,220));
      if(generated.wasTrimmed){contextTrimmed=true;$('localCoderStatus').textContent='Bağlam model penceresine sığmadı; bazı kaynak/Skill metinleri sınırlandı.';}
    }
    $('localCoderStatus').textContent='Telefon içi zincir tamamlandı. '+(contextTrimmed?'Model penceresine sığmayan bazı kaynak/Skill metinleri kısaltıldı. ':'')+'Taslağı kontrol et; kod çalıştırılmadı ve dosyalar otomatik değiştirilmedi.';
    await logAgentActivity('Local Coder · Telefon','Tamamlandı','Offline GGUF taslağı ve inceleme notu hazır; kod çalıştırılmadı.');
    showToast('Telefon içi Local Coder tamamlandı.');
  }catch(error){
    $('localCoderStatus').textContent='Telefon içi model çalışamadı: '+(error.message||'Boş RAM ve model yüklemesini kontrol et.');
    await logAgentActivity('Local Coder · Telefon','Hata',error.message||'Yerel model hatası');
    showToast('Telefon içi Local Coder başarısız.');
  }finally{busy=false;$('localCoderRun').disabled=false;$('localCoderRun').textContent='Yerel ajan zincirini çalıştır';}
}
async function runApiLocalCoderWorkshop(){
  if(busy){showToast('Başka bir ajan zinciri çalışıyor.');return;}
  const task=$('localCoderTask').value.trim();
  if(!task){showToast('Önce Local Coder görevini yaz.');return;}
  const providerId=$('localCoderApiProvider')?.value||settings.localCoderApiProvider||'openai';
  if(!providers[providerId]||providerId==='ollama'){showToast('API sağlayıcısı seçilmedi.');return;}

  // Lock before the first await (including secure-key lookup and consent).
  // This prevents rapid double taps from launching duplicate billable chains.
  busy=true;
  $('localCoderRun').disabled=true;
  $('localCoderRun').textContent='API ajanı hazırlanıyor…';
  try{
    const key=await getSecret(providerId);
    if(!key){
      showToast(providers[providerId].name+' API anahtarı yok. Modeller ekranından ekle.');
      go('models');
      return;
    }
    const sourceCode=$('localCoderUseCode').checked?$('codePad').value.slice(0,10000):'';
    const stages=buildLocalCoderStages({task,language:$('codeLanguage').value,sourceCode});
    const result=await runApiLocalCoderSequence({
      providerId,
      providers,
      modelId:providerModel(providerId),
      hasKey:Boolean(key),
      demoMode:false,
      stages,
      confirmConsent:message=>confirm(message),
      disableDemoMode:async()=>{},
      onApproved:async()=>{
        settings.localCoderApiProvider=providerId;
        await setPref(DB.settings,settings);
        $('localCoderRun').textContent='API ajanı çalışıyor…';
        await logAgentActivity('Local Coder · '+providers[providerId].name,'Başladı',task);
      },
      makePrompt:(stage,previous)=>{
        const basePrompt=stage.makePrompt?stage.makePrompt(previous):stage.prompt;
        const skillContext=currentSkillContext(stage.id,MAX_STAGE_SKILL_CHARS,basePrompt);
        return basePrompt+(skillContext.promptText?'\n\n'+skillContext.promptText:'');
      },
      callProvider:(id,prompt,history)=>callProvider(id,prompt,history,{includeGeneralSkills:false,includeTaskSkills:false}),
      onStageStart:async stage=>{
        $('localCoderStatus').textContent=stage.title+' · '+providers[providerId].name+' çalışıyor…';
        await logAgentActivity('API '+stage.title,'Çalışıyor',providers[providerId].name);
      },
      onStageComplete:async(stage,answer)=>{
        if(stage.id==='code')$('localCoderOutput').value=extractCodeArtifact(answer);
        if(stage.id==='review')$('localCoderReview').value=answer;
        await logAgentActivity('API '+stage.title,'Tamamlandı',answer.slice(0,220));
      }
    });
    if(result.status==='cancelled')return;
    if(result.status==='invalid-provider'){showToast('API sağlayıcısı seçilmedi.');return;}
    if(result.status==='missing-key'){
      showToast(providers[providerId].name+' API anahtarı yok. Modeller ekranından ekle.');
      go('models');
      return;
    }
    $('localCoderStatus').textContent=providers[providerId].name+' ile 3 aşamalı Local Coder zinciri tamamlandı. Kod çalıştırılmadı.';
    await logAgentActivity('Local Coder · API','Tamamlandı','Kod taslağı ve inceleme notu hazır; kod otomatik çalıştırılmadı.');
    showToast('API tabanlı Local Coder tamamlandı. Taslağı incele.');
  }catch(error){
    $('localCoderStatus').textContent='API tabanlı Local Coder durdu: '+(error.message||'Sağlayıcıyı ve anahtarı kontrol et.');
    await logAgentActivity('Local Coder · API','Hata',error.message||'API isteği başarısız');
    showToast('API Local Coder çalışamadı.');
  }finally{
    busy=false;
    $('localCoderRun').disabled=false;
    $('localCoderRun').textContent='Yerel ajan zincirini çalıştır';
  }
}

async function runLocalCoderWorkshop(){
  if(settings.localCoderEngine==='api')return runApiLocalCoderWorkshop();
  if(settings.localCoderEngine==='device')return runDeviceLocalCoderWorkshop();
  return runLocalCoderWorkshopOllama();
}

async function runLocalCoderWorkshopOllama(){
 if(busy){showToast('Başka bir ajan zinciri çalışıyor.');return;}const task=$('localCoderTask').value.trim();if(!task){showToast('Önce Local Coder görevini yaz.');return;}if(!settings.ollamaUrl){showToast('Önce Modeller ekranından Ollama adresini ayarla.');go('models');return;}
 const sourceCode=$('localCoderUseCode').checked?$('codePad').value.slice(0,10000):'';const stages=buildLocalCoderStages({task,language:$('codeLanguage').value,sourceCode});let previous='';busy=true;$('localCoderRun').disabled=true;$('localCoderRun').textContent='Yerel ajan çalışıyor…';$('localCoderStatus').textContent='Ollama modeline bağlanılıyor; küçük bilgisayarda yanıt yavaş gelebilir.';$('localCoderReview').value='';$('localCoderOutput').value='';
 try{await logAgentActivity('Local Coder','Başladı',task);for(const stage of stages){$('localCoderStatus').textContent=stage.title+' çalışıyor…';await logAgentActivity(stage.title,'Çalışıyor',task);const basePrompt=stage.makePrompt?stage.makePrompt(previous):stage.prompt;const skillContext=currentSkillContext(stage.id,MAX_STAGE_SKILL_CHARS,basePrompt);const prompt=basePrompt+(skillContext.promptText?'\n\n'+skillContext.promptText:'');const answer=await callProvider('ollama',prompt,[],{includeGeneralSkills:false,includeTaskSkills:false});if(stage.id==='code')$('localCoderOutput').value=extractCodeArtifact(answer);if(stage.id==='review')$('localCoderReview').value=answer;previous=answer;await logAgentActivity(stage.title,'Tamamlandı',answer.slice(0,220));} $('localCoderStatus').textContent='Zincir bitti. Taslağı gözden geçir; otomatik test çalıştırılmadı.';await logAgentActivity('Local Coder','Tamamlandı','Kod taslağı ve inceleme notları hazır; dosyalar otomatik değiştirilmedi.');showToast('Local Coder tamamlandı. Taslağı inceleyip gerekirse Kod Alanı’na aktar.');}
 catch(error){$('localCoderStatus').textContent='Zincir durdu; ayarları ve Ollama bağlantısını kontrol et.';await logAgentActivity('Local Coder','Hata',error.message||'Bilinmeyen yerel model hatası');showToast('Local Coder çalışamadı: '+(error.message||'Ollama bağlantısını kontrol et.'));}
 finally{busy=false;$('localCoderRun').disabled=false;$('localCoderRun').textContent='Yerel ajan zincirini çalıştır';}
}
async function applyLocalCoderDraft(){
  const draft=$('localCoderOutput').value.trim();
  if(!draft){showToast('Aktarılacak bir kod taslağı yok.');return;}
  if($('codePad').value.trim()&&!confirm('Kod Alanı içeriği yeni taslakla değiştirilsin mi? Önce mevcut dosyanı dışa aktarabilirsin.'))return;
  $('codePad').value=draft;
  clearTimeout(codeFileSaveTimer);
  try{
    await saveCurrentCodeFile(false);
    $('localCoderStatus').textContent='Taslak mevcut çalışma alanı dosyasına kaydedildi. Kod otomatik çalıştırılmadı.';
    showToast('Taslak Kod Alanı’na aktarıldı ve dosyaya kaydedildi; henüz çalıştırılmadı.');
  }catch(error){
    $('localCoderStatus').textContent='Taslak editöre aktarıldı ancak dosyaya kaydedilemedi. Kaydet düğmesiyle tekrar dene.';
    showToast('Taslak editörde kaldı fakat kaydedilemedi: '+(error.message||'Depolamayı kontrol et.'));
  }
}
function downloadLocalCoderDraft(){const draft=$('localCoderOutput').value.trim();if(!draft){showToast('İndirilecek bir taslak yok.');return;}const ext=({javascript:'js',html:'html',css:'css',python:'py',json:'json',markdown:'md',text:'txt'})[$('codeLanguage').value]||'txt';downloadText('local-coder-draft.'+ext,draft);}
async function saveLocalCoderDraft(){const code=$('localCoderOutput').value.trim();if(!code){showToast('Kasaya kaydedilecek bir taslak yok.');return;}try{await persistSnippetRecord({name:'LocalCoder - '+($('localCoderTask').value.trim()||'taslak').slice(0,70),language:$('codeLanguage').value,sourceUrl:'',license:'AI tarafından oluşturulmuş taslak; kullanmadan önce incele ve test et',code});}catch(error){showToast('Taslak kasaya kaydedilemedi: '+(error.message||'Hata'));}}



const NATIVE_VAULT_TOKEN_KEY = 'ai-studio-shared-vault-agent-token';
let nativeVaultToken = '';
let nativeVaultScope = 'readonly';
async function getStoredNativeVaultToken() {
  if (!nativeApp) return '';
  try { const result=await SecureStoragePlugin.get({key:NATIVE_VAULT_TOKEN_KEY});return result?.value||''; }
  catch (_) { return ''; }
}
function normalizeVaultBaseUrl(raw) {
  let parsed;
  try { parsed=new URL(String(raw||'').trim()); } catch (_) { throw new Error('Site adresi geçerli URL olmalı.'); }
  if(parsed.protocol!=='https:')throw new Error('Agent tokenı korumak için site adresi HTTPS olmalı.');
  if(parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('Site adresine kullanıcı adı, parola, sorgu veya # bölümü ekleme.');
  return parsed.origin;
}
async function nativeVaultRequest(pathname,options={}) {
  const base=normalizeVaultBaseUrl(settings.vaultBaseUrl);
  const token=nativeVaultToken||await getStoredNativeVaultToken();
  if(!token)throw new Error('Agent tokenı yok. Web sitesinde token oluşturup buraya gir.');
  const response=await fetch(base+'/api/agent/v1'+pathname,{
    ...options,
    headers:{
      'Accept':'application/json',
      'Authorization':'Bearer '+token,
      ...(options.body?{'Content-Type':'application/json'}:{}),
      ...(options.headers||{})
    }
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||('HTTP '+response.status));
  return data;
}
function renderNativeVaultItems() {
  const out=$('nativeVaultItems');if(!out)return;
  if(!sharedVaultItems.length){out.innerHTML='<div class="panel"><p class="muted">Ortak kasada henüz kayıt yok.</p></div>';return;}
  out.innerHTML=sharedVaultItems.map(item=>'<article class="project-card"><div class="project-head"><h3>'+esc(item.title)+'</h3><time>'+esc(new Date(item.updatedAt||Date.now()).toLocaleString('tr-TR'))+'</time></div><p class="fineprint">Kaydeden: '+esc(item.updatedBy||item.createdBy||'agent')+' · '+(item.tags||[]).map(tag=>'<span class="pill">'+esc(tag)+'</span>').join(' ')+'</p><p>'+esc(String(item.content||'').slice(0,650))+(String(item.content||'').length>650?'…':'')+'</p><div class="row-actions"><button class="btn secondary small" type="button" data-native-vault-to-chat="'+esc(item.id)+'">Sohbete aktar</button>'+(nativeVaultScope==='readwrite'?'<span class="grow"></span><button class="btn danger small" type="button" data-native-vault-delete="'+esc(item.id)+'">Sil</button>':'')+'</div></article>').join('');
}
async function loadNativeVault({quiet=false}={}) {
  if(!nativeApp)return;
  const status=$('nativeVaultStatus');const form=$('nativeVaultForm');
  settings.vaultBaseUrl=typeof settings.vaultBaseUrl==='string'?settings.vaultBaseUrl:'';
  $('nativeVaultBaseUrl').value=settings.vaultBaseUrl;
  $('nativeShareVaultContext').checked=settings.shareVaultContext===true;
  nativeVaultToken=await getStoredNativeVaultToken();
  if(!settings.vaultBaseUrl||!nativeVaultToken){
    if(status)status.textContent='Henüz bağlı değil. Özel sitede bir agent tokenı oluştur ve yukarıya gir.';
    if(form)form.classList.add('hidden');
    sharedVaultItems=[];renderNativeVaultItems();return;
  }
  if(!quiet&&status)status.textContent='Ortak kasa kontrol ediliyor…';
  try{
    const identity=await nativeVaultRequest('/whoami');
    nativeVaultScope=identity.agent?.scope==='readwrite'?'readwrite':'readonly';
    const result=await nativeVaultRequest('/items?limit=30');
    sharedVaultItems=Array.isArray(result.items)?result.items:[];
    if(form)form.classList.toggle('hidden',nativeVaultScope!=='readwrite');
    renderNativeVaultItems();
    if(status)status.textContent='Bağlandı: '+String(identity.agent?.name||'AI agent')+' · '+(nativeVaultScope==='readwrite'?'okuma ve yazma':'salt okunur')+' · '+sharedVaultItems.length+' kayıt.';
  }catch(error){
    if(status)status.textContent='Ortak kasa bağlantısı başarısız: '+(error.message||'Site adresi ve tokenı kontrol et.');
    if(form)form.classList.add('hidden');
    sharedVaultItems=[];renderNativeVaultItems();
  }
}
async function connectNativeVault() {
  const typedToken=$('nativeVaultToken').value.trim();
  try{
    const base=normalizeVaultBaseUrl($('nativeVaultBaseUrl').value);
    if(typedToken&&!/^aiav_[A-Za-z0-9_-]{32,}$/.test(typedToken))throw new Error('Agent token biçimi yanlış. Siteden oluşturulan aiav_ tokenını kullan.');
    settings.vaultBaseUrl=base;
    await setPref(DB.settings,settings);
    if(typedToken){
      await SecureStoragePlugin.set({key:NATIVE_VAULT_TOKEN_KEY,value:typedToken});
      nativeVaultToken=typedToken;
    }
    $('nativeVaultToken').value='';
    await loadNativeVault();
    if(sharedVaultItems.length>=0&&nativeVaultToken)showToast('Ortak kasa bağlantı ayarı kaydedildi. Bağlantı durumunu yukarıda kontrol et.');
  }catch(error){showToast('Bağlantı kaydedilemedi: '+(error.message||'Site adresini ve tokenı kontrol et.'));}
}
async function disconnectNativeVault() {
  if(!confirm('Bu cihazdaki ortak kasa bağlantısı ve saklanan agent tokenı silinsin mi? Web sitesindeki token ayrıca iptal edebilirsin.'))return;
  try{await SecureStoragePlugin.remove({key:NATIVE_VAULT_TOKEN_KEY});}catch(_){}
  nativeVaultToken='';settings.vaultBaseUrl='';settings.shareVaultContext=false;
  await setPref(DB.settings,settings);$('nativeVaultToken').value='';$('nativeVaultBaseUrl').value='';$('nativeShareVaultContext').checked=false;
  sharedVaultItems=[];renderNativeVaultItems();$('nativeVaultForm').classList.add('hidden');
  $('nativeVaultStatus').textContent='Bağlantı kesildi; cihazdaki token silindi.';
}
async function saveNativeVaultItem(event) {
  event.preventDefault();
  const title=$('nativeVaultTitle').value.trim(),content=$('nativeVaultContent').value.trim();
  if(!title||!content)return;
  const tags=$('nativeVaultTags').value.split(',').map(tag=>tag.trim()).filter(Boolean).slice(0,12);
  try{
    await nativeVaultRequest('/items',{method:'POST',body:JSON.stringify({title,content,tags})});
    $('nativeVaultForm').reset();await loadNativeVault({quiet:true});showToast('Kayıt ortak şifreli kasaya kaydedildi.');
  }catch(error){showToast('Ortak kasa kaydedemedi: '+(error.message||'Agent yetkisini kontrol et.'));}
}
async function deleteNativeVaultItem(id) {
  if(!confirm('Bu ortak kasa kaydı silinsin mi?'))return;
  try{await nativeVaultRequest('/items/'+encodeURIComponent(id),{method:'DELETE'});await loadNativeVault({quiet:true});showToast('Ortak kayıt silindi.');}
  catch(error){showToast('Kayıt silinemedi: '+(error.message||'Agent yetkisini kontrol et.'));}
}

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
  const query=($('sharedVaultSearch')?.value||'').trim().toLocaleLowerCase('tr-TR');
  const visible=sharedVaultItems.filter(item=>!query||[item.title,item.content,...(item.tags||[])].join(' ').toLocaleLowerCase('tr-TR').includes(query));
  if (!visible.length) { out.innerHTML='<div class="panel"><p class="muted">Kasa boş veya arama eşleşmedi. İlk notunu yukarıdan kaydedebilirsin.</p></div>'; return; }
  out.innerHTML=visible.map(item=>'<article class="project-card"><div class="project-head"><h3>'+esc(item.title)+'</h3><time>'+esc(new Date(item.updatedAt||Date.now()).toLocaleString('tr-TR'))+'</time></div><p class="fineprint">Kaydeden: '+esc(item.updatedBy||item.createdBy||'agent')+' · '+(item.tags||[]).map(tag=>'<span class="pill">'+esc(tag)+'</span>').join(' ')+'</p><p>'+esc(String(item.content||'').slice(0,650))+(String(item.content||'').length>650?'…':'')+'</p><div class="row-actions"><button class="btn secondary small" type="button" data-vault-to-chat="'+esc(item.id)+'">Sohbete aktar</button><span class="grow"></span><button class="btn danger small" type="button" data-vault-delete="'+esc(item.id)+'">Sil</button></div></article>').join('');
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
    const [itemsResult, agentsResult] = await Promise.all([
      vaultRequest('/api/vault/items?limit=30'),
      vaultRequest('/api/vault/agents')
    ]);
    sharedVaultItems=Array.isArray(itemsResult.items)?itemsResult.items:[];
    sharedVaultAgents=Array.isArray(agentsResult.agents)?agentsResult.agents:[];
    const contextToggle=$('shareVaultContext');if(contextToggle)contextToggle.checked=settings.shareVaultContext===true;
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

function getSelectedSkills(){
  return skillLibrary.filter(skill=>selectedSkillIds.includes(skill.id)).slice(0,MAX_SELECTED_SKILLS);
}
function currentSkillContext(stageId,maxChars=MAX_STAGE_SKILL_CHARS,task=''){
  const budget=Math.min(MAX_STAGE_SKILL_CHARS,Math.max(0,Number(maxChars)||0));
  if(task)return buildTaskSkillContext({task,role:stageId==='plan'?'architect':stageId==='code'?'builder':'reviewer',stage:stageId,skills:skillLibrary,preferredSkillIds:selectedSkillIds,maxSkills:MAX_SELECTED_SKILLS,maxChars:budget});
  return buildStageSkillContext(getSelectedSkills(),stageId,{maxSkills:MAX_SELECTED_SKILLS,maxChars:budget});
}
async function persistSkillState(){
  await setPref(DB.skills,{customSkills,selectedSkillIds:selectedSkillIds.slice(0,MAX_SELECTED_SKILLS),profileId:skillProfileId});
}
function renderSkillLibrary(){
  const list=$('skillLibraryList'); if(!list)return;
  const selected=new Set(selectedSkillIds);
  const groups=['Guidelines','Superpowers','Caveman','Video','Code','Research','Tokens','Design','Writing & Video','ECC Agent Systems','Custom'];
  list.innerHTML=groups.map(group=>{
    const items=skillLibrary.filter(skill=>skill.group===group);
    if(!items.length)return '';
    return '<div class="skill-group"><h3>'+esc(group)+' <small>'+items.length+'</small></h3><div class="skill-grid">'+items.map(skill=>'<label class="skill-item"><input type="checkbox" data-skill-toggle="'+esc(skill.id)+'" '+(selected.has(skill.id)?'checked':'')+'><span><strong>'+esc(skill.name)+'</strong><small>'+esc(skill.description||skill.stage.toUpperCase())+'</small><em>'+esc(skill.stage==='all'?'Tüm aşamalar':skill.stage)+'</em></span></label>').join('')+'</div></div>';
  }).join('');
  const profile=$('skillProfileSelect'); if(profile)profile.value=skillProfileId;
  const count=$('skillSelectedCount');if(count)count.textContent=selectedSkillIds.length+'/'+MAX_SELECTED_SKILLS+' Skill seçili';
  const status=$('skillLibraryStatus');if(status)status.textContent='Tüm aşamalar Skill’leri gerçek sohbet, AI Team, sıralı zincir ve karşılaştırma çağrılarına; Plan/Kod/İnceleme Skill’leri Local Coder’ın ilgili aşamasına eklenir. İçe aktarılan içerik kod olarak çalıştırılmaz.';
}
async function applySkillProfile(profileId){
  if(!SKILL_PROFILES[profileId])return;
  skillProfileId=profileId;selectedSkillIds=getProfileSkillIds(profileId);await persistSkillState();renderSkillLibrary();showToast(SKILL_PROFILES[profileId].name+' profili etkin.');
}
function renderSkillImportPreview() {
  const dialog = $('skillImportDialog');
  if (!dialog) return;
  if (!pendingSkillImports.length) {
    if (dialog.open) dialog.close();
    if (skillImportFailures.length) showToast('Bazı dosyalar atlandı: ' + skillImportFailures.slice(0, 3).join(' · '));
    skillImportFailures = [];
    return;
  }

  const entry = pendingSkillImports[0];
  const item = entry.skill;
  $('skillImportPreviewFile').textContent = entry.fileName;
  $('skillImportPreviewName').textContent = item.name;
  $('skillImportPreviewDescription').textContent = item.description || 'Açıklama belirtilmedi';
  $('skillImportPreviewStage').textContent = item.stage === 'all' ? 'Tüm aşamalar' : item.stage;
  $('skillImportPreviewContent').textContent = item.content;
  const rows = [
    ['Kaynak', item.source || 'Belirtilmedi'],
    ['Kaynak adresi', item.sourceUrl || 'Belirtilmedi'],
    ['Lisans', item.license || 'Belirtilmedi'],
    ['Yazar', item.author || 'Belirtilmedi'],
    ['Sürüm', item.version || 'Belirtilmedi']
  ];
  $('skillImportPreviewMetadata').innerHTML = rows.map(([label, value]) =>
    '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>'
  ).join('');
  const extra = Object.entries(item.metadata || {});
  $('skillImportPreviewExtra').textContent = extra.length
    ? 'Ek alanlar kaybolmaz; kayıtla birlikte saklanır: ' + extra.map(([key, value]) => key + ': ' + value).join(' · ')
    : 'Ek ön bilgi alanı yok.';
  $('skillImportPreviewWarning').textContent = [
    entry.duplicateName ? 'Aynı isimde başka bir Skill var. İkisi ayrı kayıt olarak korunacak.' : '',
    entry.unsupportedStage ? 'Bilinmeyen stage değeri “all” olarak kullanılacak; özgün değer saklandı.' : '',
    'İçerik yalnızca metin talimatı olarak kaydedilir; kod veya komut çalıştırılmaz.'
  ].filter(Boolean).join(' ');
  if (!dialog.open) dialog.showModal();
}

async function importSkillFiles(fileList) {
  await agentHooks.emit('beforeSkillImport',{fileCount:fileList?.length||0,detail:'Skill import kuyruğu hazırlanıyor.'});
  const result = await prepareSkillImportQueue(fileList, customSkills);
  pendingSkillImports = result.queue;
  skillImportFailures = result.errors;
  if (!pendingSkillImports.length) {
    await agentHooks.emit('afterSkillImport',{queued:0,failed:skillImportFailures.length,detail:'Geçerli Skill kuyruğa alınmadı.'});
    if (skillImportFailures.length) showToast('Skill içe aktarılamadı: ' + skillImportFailures.slice(0, 3).join(' · '));
    return;
  }
  await agentHooks.emit('afterSkillImport',{queued:pendingSkillImports.length,failed:skillImportFailures.length,detail:'Skill dosyaları önizlemeye alındı.'});
  renderSkillImportPreview();
}

function nextSkillImportId(item) {
  const base = 'custom-' + String(item.id || item.name).replace(/^custom-/, '');
  const stamp = Date.now().toString(36);
  let candidate = base + '-' + stamp;
  let suffix = 2;
  while (customSkills.some(existing => existing.id === candidate)) candidate = base + '-' + stamp + '-' + suffix++;
  return candidate.slice(0, 100);
}

async function acceptSkillImport() {
  const entry = pendingSkillImports.shift();
  if (!entry) return;
  if (settings.agentShieldEnabled !== false) {
    const report = scanAgentContent(entry.skill.content,{source:'imported-skill'});
    if (report.blocked) {
      skillImportFailures.push(entry.fileName + ': AgentShield güvenlik taramasında durduruldu.');
      await agentHooks.emit('afterSkillImport',{accepted:0,blocked:true,detail:'Güvenlik taraması Skill kaydını engelledi.'});
      showToast('AgentShield bu Skill’i engelledi; kaydedilmedi.');
      renderSkillImportPreview();
      return;
    }
  }
  if (customSkills.length >= MAX_CUSTOM_SKILLS) {
    skillImportFailures.push(entry.fileName + ': özel Skill sınırı dolu');
    renderSkillImportPreview();
    return;
  }
  const saved = { ...entry.skill, id: nextSkillImportId(entry.skill), builtIn: false, group: 'Custom' };
  customSkills = [...customSkills, saved];
  skillLibrary = [...SKILL_CATALOG, ...customSkills];
  skillProfileId = 'custom';
  const selectedNow = selectedSkillIds.filter(id => skillLibrary.some(item => item.id === id));
  const autoSelected = selectedNow.length < MAX_SELECTED_SKILLS;
  selectedSkillIds = (autoSelected ? [...selectedNow, saved.id] : selectedNow).slice(0, MAX_SELECTED_SKILLS);
  await persistSkillState();
  await agentHooks.emit('afterSkillImport',{accepted:1,blocked:false,detail:'Skill güvenlik taramasından sonra metin olarak kaydedildi.'});
  renderSkillLibrary();
  showToast(autoSelected ? 'Skill kaydedildi ve seçildi.' : 'Skill kaydedildi. Sekiz Skill sınırı dolu; seçmek için birini kaldır.');
  renderSkillImportPreview();
}

function skipSkillImport() {
  const entry = pendingSkillImports.shift();
  if (entry) {
    skillImportFailures.push(entry.fileName + ': önizlemede atlandı');
    agentHooks.emit('afterSkillImport',{accepted:0,skipped:true,detail:'Kullanıcı Skill önizlemesini atladı.'}).catch(()=>{});
  }
  renderSkillImportPreview();
}

function exportSkillLibrary(){
  const chosen=getSelectedSkills();downloadText('ai-studio-skills.json',JSON.stringify({format:'ai-studio-skills-v1',profileId:skillProfileId,selectedSkillIds,customSkills,selected:chosen.map(({id,name,group,stage,description,content,source,sourceUrl,license,author,version,metadata})=>({id,name,group,stage,description,content,source,sourceUrl,license,author,version,metadata}))},null,2),'application/json;charset=utf-8');
}

function renderBuiltinTools(){ $('builtinTools').innerHTML=builtinTools.map(t=>'<button class="tool-card" data-tool="'+t.id+'"><span class="tool-symbol">'+esc(t.icon)+'</span><strong>'+esc(t.name)+'</strong><small>'+esc(t.desc)+'</small></button>').join('');}
function renderPlugins(){ const out=$('pluginList'); if(!userPlugins.length){out.innerHTML='<div class="panel"><p class="muted">Henüz özel eklenti yok. Eklentiler yalnızca metin talimatlarıdır; keyfi kod çalıştırmaz.</p></div>';return;}
  out.innerHTML=userPlugins.map((p,i)=>'<article class="plugin-card"><div class="plugin-head"><h3>'+esc(p.name)+'</h3><span class="pill">'+(p.kind==='builtin'?'HAZIR':'ÖZEL')+'</span></div><p>'+esc(p.prompt)+'</p><div class="row-actions"><button class="btn secondary small" data-plugin-run="'+i+'">Sohbette kullan</button><span class="grow"></span>'+(p.kind==='builtin'?'':'<button class="btn danger small" data-plugin-delete="'+i+'">Sil</button>')+'</div></article>').join('');
}
async function addPlugin(e){e.preventDefault();const name=$('pluginName').value.trim(),prompt=$('pluginPrompt').value.trim();if(!name||!prompt)return;userPlugins.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,prompt,kind:'custom'});await setPref(DB.plugins,userPlugins);$('pluginForm').reset();renderPlugins();renderComposerPlugins();showToast('Prompt eklentisi kaydedildi.');}
async function importPlugins(file){try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.plugins;if(!Array.isArray(incoming))throw new Error('JSON içinde plugins dizisi bulunamadı.');let count=0;for(const p of incoming){if(typeof p?.name==='string'&&typeof p?.prompt==='string'&&p.name.trim()&&p.prompt.trim()){userPlugins.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+count),name:p.name.trim().slice(0,80),prompt:p.prompt.trim().slice(0,6000),kind:'custom'});count++;}}userPlugins=userPlugins.slice(-100);await setPref(DB.plugins,userPlugins);renderPlugins();renderComposerPlugins();showToast(count+' prompt eklentisi içe aktarıldı.');}catch(err){showToast('Eklenti içe aktarılamadı: '+(err.message||'JSON dosyasını kontrol et.'));}}
function updateDashboard(){const connected=Object.keys(providers).filter(providerIsReady);$('connectedCount').textContent=connected.length;$('projectCount').textContent=projectList.length;
  $('dashboard').innerHTML='<article class="panel"><div class="row-actions"><strong>Bağlı AI motorları</strong><span class="grow"></span><span class="pill">'+connected.length+' hazır</span></div><p class="muted">'+esc(connected.map(id=>providers[id].name).join(', ')||'Henüz model/bağlantı hazır değil.')+'</p><button class="btn ghost small" data-go="models">Bağlantıları yönet</button></article><article class="panel"><div class="row-actions"><strong>Sohbet geçmişi</strong><span class="grow"></span><span class="pill">'+chatHistory.length+' mesaj</span></div><p class="muted">Bu cihazdaki yerel geçmiş. Gerçek model sohbetleri de dışa aktarılabilir.</p></article>';
}
async function exportProjects(){downloadText('ai-studio-projects.json',JSON.stringify({format:'ai-studio-projects-v2',exportedAt:new Date().toISOString(),projects:projectList},null,2),'application/json;charset=utf-8');}
function buildWorkspaceSnapshot(){
  return {format:'ai-studio-workspace-v1',exportedAt:new Date().toISOString(),settings:{models:settings.models,team:settings.team,customEndpoint:settings.customEndpoint||'',ollamaUrl:settings.ollamaUrl,ollamaModel:settings.ollamaModel,localCoderEngine:['device','api'].includes(settings.localCoderEngine)?settings.localCoderEngine:'ollama',localCoderApiProvider:settings.localCoderApiProvider||'openai',systemPrompt:settings.systemPrompt,shareReusableContext:settings.shareReusableContext===true,shareVaultContext:settings.shareVaultContext===true,vaultBaseUrl:settings.vaultBaseUrl||'',autoAgentAssignment:settings.autoAgentAssignment,autoAgentMinComplexity:settings.autoAgentMinComplexity,autoAgentMaxWorkers:settings.autoAgentMaxWorkers,autoAgentMaxProviderCalls:settings.autoAgentMaxProviderCalls,swarmMaxAgents:settings.swarmMaxAgents,swarmConcurrency:settings.swarmConcurrency,openrouterChatModels:settings.openrouterChatModels,enabledPromptPluginIds:settings.enabledPromptPluginIds,cloudflareAccountId:settings.cloudflareAccountId||'',cloudflareModel:settings.cloudflareModel||''},projects:projectList,activeProjectId,chat:chatHistory,plugins:userPlugins.filter(p=>p.kind!=='builtin').map(p=>({name:p.name,prompt:p.prompt})),skills:createSkillBackupState({customSkills,selectedSkillIds,profileId:skillProfileId}),snippets:reusableSnippets,activity:agentActivity,codeFiles,activeCodeFileId};
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
    for(const [id,paidDefault] of Object.entries({openai:'gpt-5-mini',anthropic:'claude-sonnet-5',deepseek:'deepseek-chat',groq:'llama-3.3-70b-versatile',huggingface:'openai/gpt-oss-120b:fastest'})){if(nextSettings.models[id]===paidDefault)nextSettings.models[id]='';}
    if(nextSettings.models.openrouter==='openai/gpt-5-mini')nextSettings.models.openrouter='openrouter/free';
    if(!isFreeApinexModelId(nextSettings.models.apinex))nextSettings.models.apinex=APINEX_DEFAULT_FREE_MODEL;
    nextSettings.swarmMaxAgents=Number.isFinite(Number(nextSettings.swarmMaxAgents))?Math.max(2,Math.min(10,Math.floor(Number(nextSettings.swarmMaxAgents)))):3;
    nextSettings.swarmConcurrency=Number.isFinite(Number(nextSettings.swarmConcurrency))?Math.max(1,Math.min(4,Math.floor(Number(nextSettings.swarmConcurrency)))):2;
    nextSettings.autoAgentAssignment=nextSettings.autoAgentAssignment!==false;
    nextSettings.autoAgentMinComplexity=Number.isFinite(Number(nextSettings.autoAgentMinComplexity))?Math.max(30,Math.min(90,Math.floor(Number(nextSettings.autoAgentMinComplexity)))):55;
    nextSettings.autoAgentMaxWorkers=Number.isFinite(Number(nextSettings.autoAgentMaxWorkers))?Math.max(2,Math.min(5,Math.floor(Number(nextSettings.autoAgentMaxWorkers)))):3;
    nextSettings.autoAgentMaxProviderCalls=Number.isFinite(Number(nextSettings.autoAgentMaxProviderCalls))?Math.max(3,Math.min(100,Math.floor(Number(nextSettings.autoAgentMaxProviderCalls)))):14;
    nextSettings.openrouterChatModels=Array.isArray(nextSettings.openrouterChatModels)?[...new Set(nextSettings.openrouterChatModels.filter(id=>typeof id==='string'&&(id.trim().toLowerCase()==='openrouter/free'||id.trim().toLowerCase().endsWith(':free'))))].slice(0,MAX_OPENROUTER_CHAT_MODELS):['openrouter/free'];
    if(!nextSettings.openrouterChatModels.length)nextSettings.openrouterChatModels=['openrouter/free'];
    nextSettings.enabledPromptPluginIds=Array.isArray(nextSettings.enabledPromptPluginIds)?[...new Set(nextSettings.enabledPromptPluginIds.filter(id=>typeof id==='string'))].slice(0,34):undefined;
    nextSettings.cloudflareAccountId=typeof nextSettings.cloudflareAccountId==='string'&&/^[a-f0-9]{32}$/i.test(nextSettings.cloudflareAccountId)?nextSettings.cloudflareAccountId:'';
    nextSettings.cloudflareModel=['@cf/zai-org/glm-4.7-flash','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b'].includes(nextSettings.cloudflareModel)?nextSettings.cloudflareModel:'@cf/zai-org/glm-4.7-flash';
    nextSettings.team=normalizeTeamSelection(Array.isArray(nextSettings.team)?nextSettings.team:defaultSettings.team,Object.keys(providers));
    nextSettings.customEndpoint=typeof nextSettings.customEndpoint==='string'?nextSettings.customEndpoint.slice(0,500):'';
    if(nextSettings.customEndpoint){try{nextSettings.customEndpoint=normalizeOpenAiEndpoint(nextSettings.customEndpoint);}catch(_){nextSettings.customEndpoint='';}}
    nextSettings.ollamaUrl=typeof nextSettings.ollamaUrl==='string'?nextSettings.ollamaUrl.slice(0,500):'';
    nextSettings.ollamaModel=typeof nextSettings.ollamaModel==='string'?nextSettings.ollamaModel.slice(0,140):providers.ollama.model;
    nextSettings.localCoderEngine=['device','api'].includes(nextSettings.localCoderEngine)?nextSettings.localCoderEngine:'ollama';
    nextSettings.localCoderApiProvider=providers[nextSettings.localCoderApiProvider]&&nextSettings.localCoderApiProvider!=='ollama'?nextSettings.localCoderApiProvider:'openai';
    nextSettings.vaultBaseUrl=typeof nextSettings.vaultBaseUrl==='string'?nextSettings.vaultBaseUrl.slice(0,500):'';
    nextSettings.shareVaultContext=nextSettings.shareVaultContext===true;
    nextSettings.systemPrompt=typeof nextSettings.systemPrompt==='string'?nextSettings.systemPrompt.slice(0,6000):defaultSettings.systemPrompt;
    nextSettings.demoMode=false;
    const nextProjects=(Array.isArray(data.projects)?data.projects:[]).filter(p=>typeof p?.name==='string'&&typeof p?.notes==='string').slice(0,300).map((p,i)=>({id:typeof p.id==='string'&&p.id.trim()?p.id.slice(0,100):(crypto.randomUUID?crypto.randomUUID():String(Date.now()+i)),name:p.name.slice(0,100),notes:p.notes.slice(0,20000),updated:typeof p.updated==='string'?p.updated:new Date().toISOString()}));
    const nextChat=(Array.isArray(data.chat)?data.chat:[]).filter(m=>(m?.role==='user'||m?.role==='assistant')&&typeof m.content==='string').slice(-80).map(m=>({role:m.role,content:m.content.slice(0,20000),provider:typeof m.provider==='string'?m.provider.slice(0,100):'',mode:['demo','live','error'].includes(m.mode)?m.mode:'demo',time:typeof m.time==='string'?m.time:new Date().toISOString()}));
    const nextPlugins=(Array.isArray(data.plugins)?data.plugins:[]).filter(p=>typeof p?.name==='string'&&typeof p?.prompt==='string'&&p.name.trim()&&p.prompt.trim()).slice(-100).map((p,i)=>({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i),name:p.name.trim().slice(0,80),prompt:p.prompt.trim().slice(0,6000),kind:'custom'}));
    const nextSnippets=(Array.isArray(data.snippets)?data.snippets:[]).map(normalizeSnippet).filter(Boolean).slice(0,100).map((item,i)=>({...item,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i)}));
    const restoredSkillState=restoreSkillBackupState(data.skills);
    const nextCustomSkills=restoredSkillState.customSkills;
    const nextSelectedSkillIds=restoredSkillState.selectedSkillIds;
    const nextSkillProfileId=restoredSkillState.profileId;
    const nextActivity=(Array.isArray(data.activity)?data.activity:[]).slice(0,80).filter(item=>item&&typeof item.event==='string').map((item,i)=>({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i),event:item.event.slice(0,100),status:typeof item.status==='string'?item.status.slice(0,40):'',detail:typeof item.detail==='string'?item.detail.slice(0,260):'',time:typeof item.time==='string'?item.time:new Date().toISOString()}));
    const nextFiles=Array.isArray(data.codeFiles)?normalizeCodeFileList(data.codeFiles,true):codeFiles;
    if(!nextFiles.length)nextFiles.push(makeCodeFile());
    const nextActiveFileId=nextFiles.some(file=>file.id===data.activeCodeFileId)?data.activeCodeFileId:nextFiles[0].id;
    const nextActiveProjectId=nextProjects.some(project=>project.id===data.activeProjectId)?data.activeProjectId:(nextProjects[0]?.id||'');
    if(!confirm('Bu yedek mevcut proje, sohbet, kod dosyaları, ayar ve özel prompt kayıtlarını değiştirecek. API anahtarları yedeğe dahil değildir ve bu cihazdaki anahtarlar silinmeyecek. Devam?'))return;
    await Promise.all([setPref(DB.settings,nextSettings),setPref(DB.projects,nextProjects),setPref(DB.activeProject,nextActiveProjectId),setPref(DB.chat,nextChat),setPref(DB.plugins,nextPlugins),setPref(DB.snippets,nextSnippets),setPref(DB.activity,nextActivity),setPref(DB.codeFiles,nextFiles),setPref(DB.skills,{customSkills:nextCustomSkills,selectedSkillIds:nextSelectedSkillIds,profileId:nextSkillProfileId})]);
    Object.assign(settings,nextSettings);projectList=nextProjects;activeProjectId=nextActiveProjectId;chatHistory=nextChat;userPlugins=nextPlugins;reusableSnippets=nextSnippets;agentActivity=nextActivity;codeFiles=nextFiles;activeCodeFileId=nextActiveFileId;customSkills=nextCustomSkills;skillLibrary=[...SKILL_CATALOG,...customSkills];selectedSkillIds=nextSelectedSkillIds;skillProfileId=nextSkillProfileId;
    renderProviderCards();renderProjects();renderChat();renderPlugins();renderSkillLibrary();renderSnippetVault();renderAgentActivity();renderReuseCatalog();renderCodeFileSelector();loadActiveCodeFile();syncModeUI();updateDashboard();
    $('compareSelectionCount').textContent=settings.team.length+' ajan seçili';
    window.dispatchEvent(new Event('ai-studio-workspace-restored'));showToast('Tam çalışma alanı geri yüklendi. API anahtarları ayrı güvenli depoda kaldı.');
  }catch(err){showToast('Yedek geri yüklenemedi: '+(err.message||'JSON dosyasını kontrol et.'));}
}
async function importProjects(file){try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.projects;if(!Array.isArray(incoming))throw new Error('JSON içinde projects dizisi bulunamadı.');for(const p of incoming){if(typeof p?.name==='string'&&typeof p?.notes==='string'){projectList.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name:p.name.slice(0,100),notes:p.notes.slice(0,20000),updated:p.updated||new Date().toISOString()});}}if(!getActiveProject()&&projectList.length)activeProjectId=projectList[0].id;await Promise.all([setPref(DB.projects,projectList),setPref(DB.activeProject,activeProjectId)]);renderProjects();updateDashboard();showToast('Proje yedeği içe aktarıldı.');}catch(e){showToast('İçe aktarma başarısız: '+(e.message||'JSON dosyasını kontrol et.'));}}
async function saveOllama(){const rawUrl=$('ollamaUrl').value.trim();try{settings.ollamaUrl=rawUrl?normalizeOllamaEndpoint(rawUrl):'';}catch(error){showToast('Ollama adresi güvenlik kontrolünden geçmedi: '+error.message);return false;}settings.ollamaModel=$('ollamaModel').value.trim()||providers.ollama.model;settings.models.ollama=settings.ollamaModel;await setPref(DB.settings,settings);renderProviderCards();updateDashboard();showToast('Ollama ayarları kaydedildi.');return true;}
async function testProvider(id){if(!providerIsReady(id)){showToast(providers[id].name+' bağlantısı hazır değil. Önce anahtarını ve model ayarını kaydet.');openFirstRunSetup(id==='openrouter'?'openrouter':id==='ollama'?'ollama':id==='device'?'device':'cloud');return;}try{const result=await callProvider(id,'Yanıt olarak sadece OK yaz.',[]);showToast('Bağlantı yanıt verdi: '+result.slice(0,70));}catch(e){showToast('Bağlantı testi başarısız: '+(e.message||'Hata'));}}
async function testOllama(){if(!await saveOllama())return;if(!providerIsReady('ollama')){showToast('Önce Ollama sunucu adresini ve modelini doğrula.');return;}try{const result=await callProvider('ollama','Yanıt olarak sadece OK yaz.',[]);showToast('Ollama yanıt verdi: '+result.slice(0,70));}catch(e){showToast('Ollama testi başarısız: '+(e.message||'Hata'));}}
async function saveProviderCard(id){
  const requestedModel=$('model-'+id).value.trim()||providers[id].model;
  if(providers[id].freeModels&&!providers[id].freeModels.includes(requestedModel)){showToast('Bu sağlayıcıda yalnızca listelenen ücretsiz modeller kullanılabilir.');return;}
  settings.models[id]=requestedModel;
  if(id==='custom'){
    const endpointValue=$('endpoint-custom').value.trim();
    try{settings.customEndpoint=endpointValue?normalizeOpenAiEndpoint(endpointValue):'';}
    catch(error){showToast('Özel API adresi geçersiz: '+error.message);return;}
  }
  const field=$('key-'+id),key=field?.value.trim();
  try{if(key){await saveSecret(id,key);field.value='';}await setPref(DB.settings,settings);renderProviderCards();updateDashboard();showToast(key?'Model ayarı ve anahtar kaydedildi.':'Model ayarı kaydedildi.');}
  catch(e){showToast('Kaydedilemedi: '+(e.message||'Güvenli depoya erişilemiyor.'));}}
async function clearAllLocal(){if(!confirm('Proje notları, sohbet, özel eklentiler, kod dosyaları, kod kasası ve ajan etkinlikleri bu cihazdan silinsin mi? API anahtarlarını silmek için Modeller ekranını kullan.'))return;projectList=[];activeProjectId='';chatHistory=[];userPlugins=[];reusableSnippets=[];agentActivity=[];customSkills=[];skillLibrary=[...SKILL_CATALOG];selectedSkillIds=getProfileSkillIds('karpathy');skillProfileId='karpathy';codeFiles=[makeCodeFile()];activeCodeFileId=codeFiles[0].id;await Promise.all([removePref(DB.projects),removePref(DB.activeProject),removePref(DB.chat),removePref(DB.plugins),removePref(DB.snippets),removePref(DB.activity),removePref(DB.skills),setPref(DB.codeFiles,codeFiles)]);renderProjects();renderChat();renderPlugins();renderSkillLibrary();renderSnippetVault();renderAgentActivity();loadActiveCodeFile();updateDashboard();showToast('Yerel notlar, kod dosyaları, kasa ve etkinlik geçmişi silindi.');}
function copyText(text){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>showToast('Kopyalandı.')).catch(()=>fallbackCopy(text));}else fallbackCopy(text);}
function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();try{document.execCommand('copy');showToast('Kopyalandı.');}catch(_){showToast('Kopyalanamadı; dosya olarak dışa aktarabilirsin.');}t.remove();}
document.addEventListener('click',async e=>{
  const firstRunButton=e.target.closest('[data-first-run-setup]');
  if(firstRunButton){openFirstRunSetup(firstRunButton.dataset.firstRunSetup);return;}
  const projectTemplate=e.target.closest('[data-project-template]');
  if(projectTemplate){
    const templates={
      game:{name:'Yeni Oyun Projesi',notes:'## Oyun fikri\nTür, tema ve oyuncunun hedefi:\n\n## Ana oyun döngüsü\nOyuncu ne yapacak?\n\n## Temel sistemler\n- Kontroller\n- Etkileşimler\n- Seviye / harita\n\n## İlk sürüm (MVP)\n- [ ]\n- [ ]\n\n## Açık sorular ve kararlar\n'},
      app:{name:'Yeni Uygulama Projesi',notes:'## Amaç\nUygulama hangi sorunu çözüyor?\n\n## Kullanıcı akışı\n1.\n2.\n3.\n\n## Ana ekranlar ve özellikler\n-\n-\n\n## Veri ve bağlantılar\n-\n\n## İlk sürüm (MVP)\n- [ ]\n- [ ]\n\n## Test ve sonraki adımlar\n'}
    };
    const template=templates[projectTemplate.dataset.projectTemplate];
    if(template){$('projectName').value=template.name;$('projectNotes').value=template.notes;$('projectName').focus();showToast('Şablon forma yerleştirildi. Düzenleyip Projeyi kaydet’e bas.');}
    return;
  }
  const toolsJump=e.target.closest('[data-tools-jump]');
  if(toolsJump){
    const target=document.getElementById(toolsJump.dataset.toolsJump);
    if(!target||target.hidden||target.classList.contains('hidden')){showToast('Bu bölüm bu cihazda şu anda kullanılamıyor.');return;}
    target.scrollIntoView({behavior:'smooth',block:'start'});
    target.classList.add('section-jump-highlight');
    window.setTimeout(()=>target.classList.remove('section-jump-highlight'),1100);
    return;
  }
  const pluginTab=e.target.closest('[data-plugin-tab]');if(pluginTab){setPluginLibraryTab(pluginTab.dataset.pluginTab);return;}
  const repositoryDownload=e.target.closest('[data-plugin-download]');
  if(repositoryDownload){
    const id=repositoryDownload.dataset.pluginDownload,expected=getPluginRepositoryArchiveUrl(id);
    if(!expected||!isAllowedPluginRepositoryDownload(id,repositoryDownload.getAttribute('href'))){e.preventDefault();showToast('Bu kaynak mağazanın izin listesinde değil.');return;}
    if(!downloadedPluginRepoIds.includes(id)){downloadedPluginRepoIds.push(id);void setPref(DB.pluginDownloads,downloadedPluginRepoIds);renderPluginMarketplace();}
    return;
  }
  const skillImportFromStore=e.target.closest('[data-plugin-import-skill]');
  if(skillImportFromStore){const item=getPluginRepositoryById(skillImportFromStore.dataset.pluginImportSkill);if(item?.group==='skill'){$('composerPluginDialog')?.close();go('tools');showToast('İndirdiğin arşivden bir SKILL.md dosyası çıkarıp seç.');$('skillImportFiles')?.click();}return;}
  const focusPlugins=e.target.closest('[data-focus-plugins]');
  if(focusPlugins){closeSidebar();go('chat');openComposerPluginDialog();return;}
  const thread=e.target.closest('[data-chat-thread]');if(thread){await switchChatThread(thread.dataset.chatThread);return;}
  const composerPlugin=e.target.closest('[data-compose-plugin]');
  if(composerPlugin){const plugin=userPlugins[Number(composerPlugin.dataset.composePlugin)];if(plugin){$('chatInput').value=plugin.prompt.replace('{{gorev}}','[Görevini buraya yaz]');$('chatInput').focus();$('composerPluginDialog')?.close();go('chat');showToast(plugin.name+' eklentisi mesaja eklendi.');}return;}
  const composerAction=e.target.closest('[data-composer-action]');
  if(composerAction){
    const action=composerAction.dataset.composerAction;$('composerPlusMenu').classList.add('hidden');$('plusMenuToggle').setAttribute('aria-expanded','false');
    if(action==='files')$('chatFileInput').click();
    else if(action==='plugins')openComposerPluginDialog();
    else if(action==='think'){deepThinkNext=!deepThinkNext;$('deepThinkLabel').textContent=deepThinkNext?'Daha çok düşün ✓':'Daha çok düşün';showToast(deepThinkNext?'Bir sonraki mesaj ajan zinciriyle işlenecek.':'Derin düşünme seçimi kapatıldı.');}
    else if(action==='team'){const prompt=$('chatInput').value.trim();if(!prompt){showToast('Önce AI Team için bir görev yaz.');return;}$('chatInput').value='';fitChatInput();runTeam(prompt);}
    return;
  }
  const nav=e.target.closest('[data-go],[data-tab]');if(nav){go(nav.dataset.go||nav.dataset.tab);closeSidebar();closeChatMoreMenu();$('composerPlusMenu')?.classList.add('hidden');return;}
  const nativeVaultToChat=e.target.closest('[data-native-vault-to-chat]');if(nativeVaultToChat){const item=sharedVaultItems.find(x=>x.id===nativeVaultToChat.dataset.nativeVaultToChat);if(item){go('chat');$('chatInput').value=('Ortak kasadan alınan proje kaydı: '+item.title+'\n\n'+String(item.content||'')).slice(0,12000);$('chatInput').focus();}return;}
  const nativeVaultDelete=e.target.closest('[data-native-vault-delete]');if(nativeVaultDelete){await deleteNativeVaultItem(nativeVaultDelete.dataset.nativeVaultDelete);return;}
  const vaultToChat=e.target.closest('[data-vault-to-chat]');if(vaultToChat){const item=sharedVaultItems.find(x=>x.id===vaultToChat.dataset.vaultToChat);if(item){go('chat');$('chatInput').value=('Ortak kasadan alınan proje kaydı: '+item.title+'\n\n'+String(item.content||'')).slice(0,12000);$('chatInput').focus();}return;}
  const vaultDelete=e.target.closest('[data-vault-delete]');if(vaultDelete){await deleteSharedVaultItem(vaultDelete.dataset.vaultDelete);return;}
  const agentRevoke=e.target.closest('[data-agent-revoke]');if(agentRevoke){await revokeSharedVaultAgent(agentRevoke.dataset.agentRevoke);return;}
  const catalogUse=e.target.closest('[data-catalog-use]');if(catalogUse){const item=reuseCatalog.find(x=>x.id===catalogUse.dataset.catalogUse);if(item){$('localCoderTask').value='Bu kaynağı mevcut projeme uygun şekilde değerlendir: '+item.name+'.\nKaynak: '+item.url+'\nLisans notu: '+item.license+'\nYeniden kullanılabilir kısmı öner; gerekli lisans/atıf şartlarını ayrıca kontrol et.';showToast(item.name+' görev bağlamına eklendi.');}return;}
  const snippetLoad=e.target.closest('[data-snippet-load]');if(snippetLoad){const item=reusableSnippets[Number(snippetLoad.dataset.snippetLoad)];if(item){$('codePad').value=item.code;if([...$('codeLanguage').options].some(o=>o.value===item.language))$('codeLanguage').value=item.language;showToast('Kod parçası Kod Alanı’na yüklendi.');}return;}
  const snippetUse=e.target.closest('[data-snippet-use]');if(snippetUse){const item=reusableSnippets[Number(snippetUse.dataset.snippetUse)];if(item){$('localCoderTask').value='Bu kod parçasını incele, projeye entegrasyon ve test önerilerini ver. Kaynak: '+(item.sourceUrl||'belirtilmedi')+'. Lisans: '+(item.license||'belirtilmedi')+'.\n\nKod:\n'+item.code.slice(0,10000);showToast('Kod parçası Local Coder görevine eklendi.');}return;}
  const snippetDownload=e.target.closest('[data-snippet-download]');if(snippetDownload){const item=reusableSnippets[Number(snippetDownload.dataset.snippetDownload)];if(item){const ext=({javascript:'js',html:'html',css:'css',python:'py',json:'json',markdown:'md',text:'txt'})[item.language]||'txt';downloadText((item.name||'snippet').replace(/[^a-z0-9-_]+/gi,'_')+'.'+ext,item.code);}return;}
  const snippetDelete=e.target.closest('[data-snippet-delete]');if(snippetDelete){reusableSnippets.splice(Number(snippetDelete.dataset.snippetDelete),1);await setPref(DB.snippets,reusableSnippets);renderSnippetVault();showToast('Kod parçası kasadan silindi.');return;}

  const apinexLoad=e.target.closest('[data-load-apinex-models]');if(apinexLoad){
    const key=await getSecret('apinex');
    if(!key){showToast('Önce APInex API anahtarını kaydet.');return;}
    apinexLoad.disabled=true;apinexLoad.textContent='Modeller yükleniyor…';
    try{
      const data=await fetchJson(APINEX_MODELS_ENDPOINT,{method:'GET',headers:{'Authorization':'Bearer '+key,'Accept':'application/json'}});
      const models=extractApinexFreeModels(data),select=$('apinexFreeModels');
      if(!models.length)throw new Error('APInex /models yanıtında free/ model bulunamadı. Model kimliğini elle de girebilirsin.');
      const current=$('model-apinex').value.trim();
      select.innerHTML='<option value="">Ücretsiz model seç…</option>'+models.map(id=>'<option value="'+esc(id)+'">'+esc(id)+'</option>').join('');
      if(models.includes(current))select.value=current;
      showToast(models.length+' ücretsiz APInex modeli bulundu.');
    }catch(error){showToast('APInex model listesi alınamadı: '+(error.message||'API anahtarını ve bağlantıyı kontrol et.'));}
    finally{apinexLoad.disabled=false;apinexLoad.textContent='Ücretsiz modelleri yenile';}
    return;
  }
  const save=e.target.closest('[data-save-key]');if(save){await saveProviderCard(save.dataset.saveKey);return;}
  const test=e.target.closest('[data-test-provider]');if(test){await testProvider(test.dataset.testProvider);return;}
  const del=e.target.closest('[data-delete-key]');if(del){const id=del.dataset.deleteKey;if(confirm(providers[id].name+' anahtarı bu uygulamadan silinsin mi?')){await deleteSecret(id);renderProviderCards();updateDashboard();showToast('Anahtar silindi.');}return;}
  const projectActivate=e.target.closest('[data-project-activate]');if(projectActivate){const project=projectList.find(p=>p.id===projectActivate.dataset.projectActivate);if(project){activeProjectId=project.id;await setPref(DB.activeProject,activeProjectId);renderProjects();showToast('Aktif proje tüm gerçek ajan çağrılarının bağlamına eklendi. ');}return;}
  const projectDel=e.target.closest('[data-project-delete]');if(projectDel){const removed=projectList.splice(Number(projectDel.dataset.projectDelete),1)[0];if(removed?.id===activeProjectId)activeProjectId=projectList[0]?.id||'';await Promise.all([setPref(DB.projects,projectList),setPref(DB.activeProject,activeProjectId)]);renderProjects();updateDashboard();return;}
  const projectExport=e.target.closest('[data-project-export]');if(projectExport){const p=projectList[Number(projectExport.dataset.projectExport)];downloadText((p.name||'proje').replace(/[^a-z0-9-_]+/gi,'_')+'.md',projectMarkdown(p));return;}
  const projectOpen=e.target.closest('[data-project-open]');if(projectOpen){const p=projectList[Number(projectOpen.dataset.projectOpen)];if(p){activeProjectId=p.id;await setPref(DB.activeProject,activeProjectId);renderProjects();go('chat');$('chatInput').value='Aktif projedeki mevcut kararları dikkate alarak en iyi sonraki adımları öner.';$('chatInput').focus();}return;}
  const tool=e.target.closest('[data-tool]');if(tool){const p=builtinTools.find(t=>t.id===tool.dataset.tool);go('chat');$('chatInput').value=p.prompt.replace('{{gorev}}','[Buraya görevi, kodu veya fikri yaz]');$('chatInput').focus();return;}
  const plug=e.target.closest('[data-plugin-run]');if(plug){const p=userPlugins[Number(plug.dataset.pluginRun)];go('chat');$('chatInput').value=p.prompt.replace('{{gorev}}','[Görevini buraya yaz]');$('chatInput').focus();return;}
  const plugDel=e.target.closest('[data-plugin-delete]');if(plugDel){userPlugins.splice(Number(plugDel.dataset.pluginDelete),1);await setPref(DB.plugins,userPlugins);renderPlugins();renderComposerPlugins();return;}
});
document.addEventListener('change',async e=>{
  if(e.target.matches('#apinexFreeModels')){const id=e.target.value;if(isFreeApinexModelId(id)){$('model-apinex').value=id;settings.models.apinex=id;await setPref(DB.settings,settings);renderProviderCards();updateDashboard();showToast('APInex ücretsiz modeli seçildi.');}return;}
  if(e.target.matches('[data-skill-toggle]')){const id=e.target.dataset.skillToggle;if(e.target.checked){if(selectedSkillIds.length>=MAX_SELECTED_SKILLS){e.target.checked=false;showToast('En fazla 8 Skill seçebilirsin.');return;}if(!selectedSkillIds.includes(id))selectedSkillIds.push(id);}else selectedSkillIds=selectedSkillIds.filter(value=>value!==id);skillProfileId='custom';await persistSkillState();renderSkillLibrary();return;}
  if(e.target.matches('[data-team]')){const id=e.target.dataset.team;let group=[...document.querySelectorAll('[data-team="'+id+'"]')];if(e.target.checked){if(!settings.team.includes(id))settings.team.push(id);}else settings.team=settings.team.filter(x=>x!==id);settings.team=selectedTeam();group.forEach(x=>x.checked=e.target.checked);await setPref(DB.settings,settings);renderProviderCards();$('compareSelectionCount').textContent=settings.team.length+' ajan seçili';const teamSummary=$('teamSelectionSummary');if(teamSummary)teamSummary.textContent=settings.team.length+' / '+Object.keys(providers).length+' motor seçili';}
});
$('providerSearch').addEventListener('input',applyProviderFilter);
$('providerFilter').addEventListener('change',applyProviderFilter);
$('sidebarToggleBtn').addEventListener('click',openSidebar);
$('sidebarCloseBtn').addEventListener('click',closeSidebar);
$('sidebarScrim').addEventListener('click',closeSidebar);
$('newChatBtn').addEventListener('click',createNewChat);
$('sidebarNewChatBtn').addEventListener('click',createNewChat);
$('chatSearchInput').addEventListener('input',renderSidebarChats);
$('chatMoreToggle').addEventListener('click',()=>{const menu=$('chatMoreMenu');menu.classList.toggle('hidden');$('chatMoreToggle').setAttribute('aria-expanded',String(!menu.classList.contains('hidden')));});
$('plusMenuToggle').addEventListener('click',()=>{const menu=$('composerPlusMenu');menu.classList.toggle('hidden');$('plusMenuToggle').setAttribute('aria-expanded',String(!menu.classList.contains('hidden')));closeChatMoreMenu();});
$('closeComposerPluginDialog').addEventListener('click',()=>$('composerPluginDialog').close());
$('pluginMarketplaceSearch').addEventListener('input',renderPluginMarketplace);
$('pluginMarketplaceType').addEventListener('change',renderPluginMarketplace);
$('openPluginMarketplaceFromTools')?.addEventListener('click',openComposerPluginDialog);
$('openPluginManagerFromComposer').addEventListener('click',()=>{$('composerPluginDialog').close();go('tools');setTimeout(()=>$('pluginForm')?.scrollIntoView({behavior:'smooth',block:'start'}),120);});
$('chatFileInput').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>100000){showToast('Sohbete eklenecek metin dosyası 100 KB sınırını aşıyor.');e.target.value='';return;}
  try{const content=await file.text();$('chatInput').value=($('chatInput').value+'\n\n[Dosya: '+file.name+']\n'+content.slice(0,18000)).trim().slice(0,12000);fitChatInput();$('chatInput').focus();showToast(file.name+' içeriği mesaj taslağına eklendi.');}
  catch(_){showToast('Dosya okunamadı. Metin tabanlı bir dosya seç.');}
  e.target.value='';
});
$('chatForm').addEventListener('submit',e=>{e.preventDefault();const p=$('chatInput').value.trim();if(!p)return;const providerId=$('chatProvider').value;if(!providerIsReady(providerId)){showToast(providers[providerId].name+' hazır değil. Önce sohbet üstündeki kurulum kartını kullan.');openFirstRunSetup(providerId==='ollama'?'ollama':providerId==='device'?'device':providerId==='openrouter'?'openrouter':'cloud');return;}$('chatInput').value='';fitChatInput();if(deepThinkNext){deepThinkNext=false;$('deepThinkLabel').textContent='Daha çok düşün';runPipeline(p);}else submitChat(p,providerId);});
$('chatInput').addEventListener('input',fitChatInput);
$('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('chatForm').requestSubmit();}});
$('teamRun').addEventListener('click',()=>{const p=$('chatInput').value.trim();if(!p){showToast('Önce takımın görevini yaz.');return;}$('chatInput').value='';fitChatInput();runTeam(p);});
$('pipelineRun').addEventListener('click',()=>{const p=$('chatInput').value.trim();if(!p){showToast('Önce zincirin görevini yaz.');return;}$('chatInput').value='';fitChatInput();runPipeline(p);});
$('compareRun').addEventListener('click',runCompare);
$('selectAllTeam').addEventListener('click',async()=>{settings.team=Object.keys(providers);await setPref(DB.settings,settings);renderProviderCards();$('compareSelectionCount').textContent=settings.team.length+' ajan seçili';showToast('Tüm AI sağlayıcıları takıma eklendi.');});
$('chatProvider').addEventListener('change',syncModeUI);
$('projectForm').addEventListener('submit',saveProject);
$('sharedVaultForm').addEventListener('submit',saveSharedVaultItem);
$('nativeVaultConnect').addEventListener('click',connectNativeVault);
$('nativeVaultDisconnect').addEventListener('click',disconnectNativeVault);
$('nativeVaultRefresh').addEventListener('click',()=>loadNativeVault());
$('nativeVaultForm').addEventListener('submit',saveNativeVaultItem);
$('nativeShareVaultContext').addEventListener('change',async e=>{settings.shareVaultContext=e.target.checked;await setPref(DB.settings,settings);showToast(settings.shareVaultContext?'Ortak kasadan eşleşen notlar gerçek AI isteklerine eklenebilir.':'Ortak kasa notları otomatik gönderilmeyecek.');});
$('shareVaultContext').addEventListener('change',async e=>{settings.shareVaultContext=e.target.checked;await setPref(DB.settings,settings);showToast(settings.shareVaultContext?'Eşleşen kasa notları gerçek model isteklerine eklenecek.':'Kasa notları modele otomatik gönderilmeyecek.');});
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
$('openshortsConnect').addEventListener('click',connectOpenShortsUi);
$('openshortsDisconnect').addEventListener('click',disconnectOpenShortsUi);
$('openshortsQuotaRefresh').addEventListener('click',()=>refreshOpenShortsQuota());
$('openshortsProcess').addEventListener('click',()=>startOpenShortsJob(false));
$('openshortsForceLowQuality').addEventListener('click',()=>startOpenShortsJob(true));
$('openshortsCheckStatus').addEventListener('click',checkOpenShortsJob);
$('openshortsClips').addEventListener('click',event=>{const button=event.target.closest('[data-openshorts-publish]');if(!button)return;const index=Number(button.dataset.openshortsPublish);if(!Number.isInteger(index)||index<0)return;publishOpenShortsClip(index).catch(error=>setOpenShortsStatus(error.message||'Yayınlama başlatılamadı.','error'));});
$('skillProfileSelect').addEventListener('change',e=>applySkillProfile(e.target.value));
$('autoAgentAssignment').addEventListener('change',e=>saveAgentSystemSetting('autoAgentAssignment',e.target.checked));
$('autoAgentMinComplexity').addEventListener('change',e=>saveAgentSystemSetting('autoAgentMinComplexity',Math.max(30,Math.min(90,Number(e.target.value)||55))));
$('autoAgentMaxWorkers').addEventListener('change',e=>saveAgentSystemSetting('autoAgentMaxWorkers',Math.max(2,Math.min(5,Number(e.target.value)||3))));
$('autoAgentMaxProviderCalls').addEventListener('change',e=>{const value=Number(e.target.value);saveAgentSystemSetting('autoAgentMaxProviderCalls',Number.isFinite(value)?Math.max(3,Math.min(100,Math.floor(value))):14);});
$('agentMemoryEnabled').addEventListener('change',e=>saveAgentSystemSetting('agentMemoryEnabled',e.target.checked));
$('shareAgentMemory').addEventListener('change',e=>saveAgentSystemSetting('shareAgentMemory',e.target.checked));
$('agentHooksEnabled').addEventListener('change',e=>saveAgentSystemSetting('agentHooksEnabled',e.target.checked));
$('agentShieldEnabled').addEventListener('change',e=>saveAgentSystemSetting('agentShieldEnabled',e.target.checked));
$('agentMemorySave').addEventListener('click',()=>saveAgentMemory().catch(error=>showToast('Hafıza kaydedilemedi: '+(error.message||'hata'))));
$('agentMemoryExport').addEventListener('click',exportAgentMemory);
$('agentMemoryImportBtn').addEventListener('click',()=>$('agentMemoryImportFile').click());
$('agentMemoryImportFile').addEventListener('change',async e=>{try{if(e.target.files?.[0])await importAgentMemory(e.target.files[0]);}catch(error){showToast('Hafıza yedeği alınamadı: '+(error.message||'dosya biçimini kontrol et.'));}e.target.value='';});
$('agentMemoryList').addEventListener('click',async e=>{const button=e.target.closest('[data-memory-delete]');if(!button)return;agentMemoryRecords=agentMemoryRecords.filter(item=>item.id!==button.dataset.memoryDelete);await setPref(DB.agentMemory,agentMemoryRecords);renderAgentSystems();showToast('Hafıza kaydı silindi.');});
$('skillImportBtn').addEventListener('click',()=>$('skillImportFiles').click());
$('skillImportFiles').addEventListener('change',async e=>{if(e.target.files?.length)await importSkillFiles(e.target.files);e.target.value='';});
$('skillImportAccept').addEventListener('click',acceptSkillImport);
$('skillImportSkip').addEventListener('click',skipSkillImport);
$('skillImportDialog').addEventListener('cancel',event=>{event.preventDefault();skipSkillImport();});
$('skillExportBtn').addEventListener('click',exportSkillLibrary);
$('exportPlugins').addEventListener('click',()=>downloadText('ai-studio-prompt-plugins.json',JSON.stringify({format:'ai-studio-prompts-v1',plugins:userPlugins.filter(p=>p.kind!=='builtin')},null,2),'application/json;charset=utf-8'));
$('importPluginsBtn').addEventListener('click',()=> $('importPluginsFile').click());
$('importPluginsFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importPlugins(e.target.files[0]);e.target.value='';});
$('exportChat').addEventListener('click',()=>downloadText('ai-studio-chat.json',JSON.stringify({exportedAt:new Date().toISOString(),messages:chatHistory},null,2),'application/json;charset=utf-8'));
$('clearChat').addEventListener('click',async()=>{if(confirm('Bu sohbetin mesajları temizlensin mi?')){chatHistory=[];const current=chatThreads.find(item=>item.id===activeChatThreadId);if(current){current.messages=[];current.title='Yeni sohbet';current.updatedAt=new Date().toISOString();}await setPref(DB.chat,[]);await persistChatThreads();renderChat();renderSidebarChats();closeChatMoreMenu();}});
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
$('localCoderEngine').addEventListener('change',async e=>{settings.localCoderEngine=['device','api'].includes(e.target.value)?e.target.value:'ollama';await setPref(DB.settings,settings);syncLocalCoderEngineUI();$('localCoderStatus').textContent=settings.localCoderEngine==='device'?'Telefon içi GGUF motoru seçildi.':(settings.localCoderEngine==='api'?'API sağlayıcılı Local Coder seçildi.':'Mevcut PC / Ollama motoru seçildi.');});
$('localCoderApiProvider').addEventListener('change',async e=>{settings.localCoderApiProvider=e.target.value;await setPref(DB.settings,settings);});
$('onDeviceModelCatalog').addEventListener('change',renderDeviceModelDescription);
$('downloadOnDeviceModel').addEventListener('click',downloadSelectedDeviceModel);
$('cancelOnDeviceDownload').addEventListener('click',cancelSelectedDeviceModel);
$('importOnDeviceModel').addEventListener('click',importDeviceModelFile);
$('cancelOnDeviceImport').addEventListener('click',cancelDeviceModelImport);
$('refreshDeviceLocalModels').addEventListener('click',()=>refreshDeviceLocalModels());
$('loadOnDeviceModel').addEventListener('click',loadSelectedDeviceModel);
$('unloadOnDeviceModel').addEventListener('click',unloadDeviceModel);
$('deleteOnDeviceModel').addEventListener('click',deleteSelectedDeviceModel);
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
  try{settings={...clone(defaultSettings),...(await getPref(DB.settings,{}))};settings.demoMode=false;settings.models={...clone(defaultSettings.models),...(settings.models||{})};
    for(const [id,paidDefault] of Object.entries({openai:'gpt-5-mini',anthropic:'claude-sonnet-5',deepseek:'deepseek-chat',groq:'llama-3.3-70b-versatile',huggingface:'openai/gpt-oss-120b:fastest'})){if(settings.models[id]===paidDefault)settings.models[id]='';}
    if(settings.models.openrouter==='openai/gpt-5-mini')settings.models.openrouter='openrouter/free';if(!isFreeApinexModelId(settings.models.apinex))settings.models.apinex=APINEX_DEFAULT_FREE_MODEL;const savedTeam=Array.isArray(settings.team)?settings.team:null;settings.team=normalizeTeamSelection(settings.team||defaultSettings.team,Object.keys(providers));if(savedTeam&&settings.team.includes('openai')&&settings.team.includes('anthropic')&&settings.team.includes('gemini')&&settings.team.includes('deepseek')&&settings.team.includes('groq')&&settings.team.includes('openrouter')&&settings.team.includes('huggingface')&&settings.team.includes('custom')&&settings.team.includes('ollama')&&!settings.team.includes('device'))settings.team.push('device');settings.customEndpoint=typeof settings.customEndpoint==='string'?settings.customEndpoint.slice(0,500):'';if(settings.customEndpoint){try{settings.customEndpoint=normalizeOpenAiEndpoint(settings.customEndpoint);}catch(_){settings.customEndpoint='';}}settings.vaultBaseUrl=typeof settings.vaultBaseUrl==='string'?settings.vaultBaseUrl.slice(0,500):'';settings.localCoderEngine=['device','api'].includes(settings.localCoderEngine)?settings.localCoderEngine:'ollama';settings.localCoderApiProvider=providers[settings.localCoderApiProvider]&&settings.localCoderApiProvider!=='ollama'?settings.localCoderApiProvider:'openai';if(settings.ollamaUrl==='http://192.168.1.100:11434')settings.ollamaUrl='';}catch(_){}
  settings.demoMode=false;
  try{await setPref(DB.settings,settings);}catch(_){}
  if(!nativeApp){showToast('Tarayıcıda API anahtarları yalnızca açık oturumda tutulur.');}
  await initKeys();await initOpenShortsKey(); projectList=await getPref(DB.projects,[]);activeProjectId=await getPref(DB.activeProject,'');chatHistory=await getPref(DB.chat,[]);const savedThreadState=await getPref(DB.threads,{});chatThreads=Array.isArray(savedThreadState?.items)?savedThreadState.items:[];downloadedPluginRepoIds=(await getPref(DB.pluginDownloads,[])).filter(id=>getPluginRepositoryById(id)?.repository);activeChatThreadId=typeof savedThreadState?.activeId==='string'?savedThreadState.activeId:'';userPlugins=await getPref(DB.plugins,[]);const storedSkills=await getPref(DB.skills,{});customSkills=(Array.isArray(storedSkills?.customSkills)?storedSkills.customSkills:[]).map(skill=>normalizeSkill(skill)).filter(Boolean).slice(-100);skillLibrary=[...SKILL_CATALOG,...customSkills];skillProfileId=storedSkills?.profileId==='custom'?'custom':(SKILL_PROFILES[storedSkills?.profileId]?storedSkills.profileId:'karpathy');const validSkillIds=new Set(skillLibrary.map(skill=>skill.id));selectedSkillIds=(Array.isArray(storedSkills?.selectedSkillIds)?storedSkills.selectedSkillIds:[]).filter(id=>validSkillIds.has(id)).slice(0,MAX_SELECTED_SKILLS);if(!selectedSkillIds.length)selectedSkillIds=getProfileSkillIds(skillProfileId);reusableSnippets=await getPref(DB.snippets,[]);agentActivity=await getPref(DB.activity,[]);agentMemoryRecords=normalizeProjectMemoryRecords(await getPref(DB.agentMemory,[]));codeFiles=normalizeCodeFileList(await getPref(DB.codeFiles,[]),true);if(!codeFiles.length)codeFiles=[makeCodeFile()];activeCodeFileId=codeFiles[0].id;await setPref(DB.codeFiles,codeFiles);
  if(!Array.isArray(projectList))projectList=[];if(!projectList.some(p=>p&&p.id===activeProjectId))activeProjectId=projectList[0]?.id||'';await setPref(DB.activeProject,activeProjectId);if(!Array.isArray(chatHistory))chatHistory=[];if(!Array.isArray(userPlugins))userPlugins=[];if(!Array.isArray(reusableSnippets))reusableSnippets=[];if(!Array.isArray(agentActivity))agentActivity=[];
  await ensureChatThreads();renderProviderCards();renderProjects();renderChat();renderSidebarChats();renderBuiltinTools();renderPlugins();renderComposerPlugins();renderOpenShortsPanel();await mountSocialStudio({
    generateText:async prompt=>{
      const providerId=$('chatProvider').value||'gemini';
      if(!providerIsReady(providerId)){openFirstRunSetup(providerId==='ollama'?'ollama':providerId==='device'?'device':providerId==='openrouter'?'openrouter':'cloud');throw new Error('Önce bir AI bağlantısı kur.');}
      const freeOrLocal=providerId==='gemini'||providerId==='groq'||providerId==='ollama'||providerId==='device'||(providerId==='openrouter'&&isFreeOpenRouterModel(providerModel(providerId)))||(providerId==='apinex'&&isFreeApinexModelId(providerModel(providerId)));
      if(!freeOrLocal)throw new Error('Social Studio yalnızca Gemini, Groq, APInex free/*, OpenRouter :free veya yerel Ollama/GGUF modeliyle çalışır. Ücretli sağlayıcı çağrısı yapılmadı.');
      return callProvider(providerId,prompt,[]);
    },
    openShorts:{available:name=>openShortsToolNames.has(name),call:(name,args)=>requireOpenShortsTool(name,args)},
    videoKeyStore:{isNative:nativeApp,get:()=>getSecret('runway'),save:key=>saveSecret('runway',key),remove:()=>deleteSecret('runway')},
    go,notify:showToast,getAiMode:()=>($('chatProvider').selectedOptions[0]?.textContent||'Seçili AI modeli')
  });
  await mountAiPowerHub({
    root:$('tools'),getSettings:()=>settings,saveSettings:()=>setPref(DB.settings,settings),
    getSkillSelection:()=>({skills:skillLibrary,preferredSkillIds:selectedSkillIds}),
    getConfiguredTeam:()=>configuredTeam(),callProvider:(id,prompt,history,callOptions)=>callProvider(id,prompt,history,callOptions),
    getSecret,saveSecret,deleteSecret,isDemo:()=>false,notify:showToast,
    logActivity:logAgentActivity,go,getDeviceInfo:()=>deviceLocalState?.device||null,nativeApp,getSystemPrompt:()=>settings.systemPrompt
  });
  renderSkillLibrary();renderPluginMarketplace();renderReuseCatalog();renderSnippetVault();renderAgentActivity();renderAgentSystems();loadActiveCodeFile();syncModeUI();updateDashboard();$('compareSelectionCount').textContent=settings.team.length+' ajan seçili';
  syncLocalCoderEngineUI();await refreshDeviceLocalModels(true);
  if(!nativeApp){$('nativeVaultPanel')?.classList.add('hidden');await loadSharedVault({quiet:true});}else{$('sharedVaultPanel')?.classList.add('hidden');$('nativeVaultPanel')?.classList.remove('hidden');await loadNativeVault({quiet:true});}
  await agentHooks.emit('sessionStart',{projectId:activeProjectId,detail:'AI Studio oturumu başladı.'});
}
window.addEventListener('pagehide',()=>{agentHooks.emit('sessionEnd',{projectId:activeProjectId,detail:'AI Studio oturumu kapanıyor.'}).catch(()=>{});});
prepareBrowserFeatures().then(init).catch(()=>showToast('Başlangıç ayarları okunamadı; sayfayı yenileyebilirsin.'));
