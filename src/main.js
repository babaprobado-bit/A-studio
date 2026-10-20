import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import './style.css';

const $ = (id) => document.getElementById(id);
const DB = {
  settings: 'ai-studio-settings-v2',
  projects: 'ai-studio-projects-v2',
  chat: 'ai-studio-chat-v2',
  plugins: 'ai-studio-prompt-plugins-v2'
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
  systemPrompt: 'Yanıtlarını açık ve uygulanabilir yaz. Bilmediğin şeyi uydurma. Kod istenince küçük, test edilebilir adımlar öner.'
};
let settings = structuredClone(defaultSettings);
let chatHistory = [];
let projectList = [];
let userPlugins = [];
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
function systemFor(id){return settings.systemPrompt+'\nSağlayıcı rolü: '+providers[id].name+'. Yanıtları Türkçe ve uygulanabilir yaz; var olmayan test sonuçlarını iddia etme.';}
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
  if(busy)return; const text=prompt.trim(); if(!text)return;
  busy=true; $('chatInput').disabled=true; $('chatForm').querySelector('[type=submit]').disabled=true;
  pushMessage('user',text,{mode:settings.demoMode?'demo':'live'});
  const out=$('chatMessages'); const loading=document.createElement('article'); loading.className='result-card';loading.innerHTML='<div class="result-label">YANIT HAZIRLANIYOR</div><p>Seçili sağlayıcıdan yanıt bekleniyor…</p>';out.append(loading);
  try{
    let answer,mode;
    if(settings.demoMode){answer=demoAnswer(providerId,text,roleOverride);mode='demo';}
    else {answer=await callProvider(providerId,text,chatContext().slice(0,-1));mode='live';}
    loading.remove();pushMessage('assistant',answer,{provider:providers[providerId].name,mode});
  }catch(err){loading.remove();pushMessage('assistant','Hata: '+(err?.message||'Bilinmeyen hata')+'\n\nGerçek yanıt alınmadı. Model, anahtar, kota ve bağlantıyı kontrol et.',{provider:providers[providerId].name,mode:'error'});}
  finally{busy=false;$('chatInput').disabled=false;$('chatForm').querySelector('[type=submit]').disabled=false;$('chatInput').focus();syncModeUI();}
}
async function runTeam(prompt){
  if(busy)return;const selected=settings.team.slice(0,4); if(!selected.length){showToast('Önce Modeller ekranında takım ajanı seç.');return;}
  if(!settings.demoMode&&!confirm('Takım turu en fazla '+selected.length+' gerçek API isteği gönderebilir; ücret oluşabilir. Devam edilsin mi?'))return;
  if(settings.demoMode){pushMessage('user',prompt,{mode:'demo'}); selected.forEach(id=>pushMessage('assistant',demoAnswer(id,prompt),{provider:providers[id].name,mode:'demo'}));return;}
  busy=true;pushMessage('user',prompt,{mode:'live'});
  const out=$('chatMessages'),load=document.createElement('article');load.className='result-card';load.innerHTML='<div class="result-label">TAKIM TURU</div><p>Seçili ajanlar çalışıyor…</p>';out.append(load);
  const history=chatContext().slice(0,-1);
  const results=await Promise.all(selected.map(async id=>{try{return {id,answer:await callProvider(id,prompt,history)};}catch(e){return {id,error:e?.message||'Hata'};}}));
  load.remove(); results.forEach(r=>pushMessage('assistant',r.error?'Hata: '+r.error:r.answer,{provider:providers[r.id].name,mode:r.error?'error':'live'}));
  busy=false;
}
async function runPipeline(prompt){
  if(busy)return;
  const task=prompt.trim();
  const selected=settings.team.slice(0,4);
  if(!task){showToast('Önce iş akışının görevini yaz.');return;}
  if(selected.length<2){showToast('Sıralı zincir için en az iki ajan seç.');go('models');return;}
  if(!settings.demoMode&&!confirm('Sıralı ajan zinciri '+selected.length+' gerçek API isteği gönderebilir ve ücret oluşturabilir. Her ajan bir öncekinin çıktısını görür. Devam?'))return;
  busy=true;
  $('chatInput').disabled=true;
  $('chatForm').querySelector('[type=submit]').disabled=true;
  $('teamRun').disabled=true;
  $('pipelineRun').disabled=true;
  pushMessage('user',task,{mode:settings.demoMode?'demo':'live'});
  const out=$('chatMessages');
  const loading=document.createElement('article');
  loading.className='result-card';
  loading.innerHTML='<div class="result-label">SIRALI AJAN ZİNCİRİ</div><p>Planla → geliştir → eleştir → test et aşamaları çalışıyor…</p>';
  out.append(loading);
  let previous='';
  const stageRoles=['Mimar / planlayıcı','Uygulayıcı','Bağımsız gözden geçirici','Testçi / son kontrol'];
  try{
    for(let i=0;i<selected.length;i++){
      const id=selected[i];
      const stagePrompt='İş akışı aşaması '+(i+1)+'/'+selected.length+'. Rolün: '+stageRoles[Math.min(i,stageRoles.length-1)]+'.\nAsıl görev: '+task+'\n'+(previous?'Önceki ajanın çıktısı:\n'+previous+'\n':'')+'Görev: '+(i===0?'Uygulanabilir bir plan ve riskleri çıkar.':i===1?'Planı somut, modüler ve test edilebilir sonuca dönüştür.':i===2?'Önceki çıktıyı bağımsız değerlendir; hataları ve eksikleri düzelt.':'Son çıktıyı kontrol et; test senaryolarını, kalan işleri ve kabul ölçütlerini listele.')+'\nBilmediğin şeyi uydurma, kodu gerçekten çalıştırmadıysan çalıştırdığını iddia etme.';
      const answer=settings.demoMode
        ? demoAnswer(id,stagePrompt,stageRoles[Math.min(i,stageRoles.length-1)])
        : await callProvider(id,stagePrompt,chatContext().slice(0,-1));
      previous=answer;
      pushMessage('assistant','AŞAMA '+(i+1)+'/'+selected.length+'\n'+answer,{provider:providers[id].name,mode:settings.demoMode?'demo':'live'});
      loading.querySelector('p').textContent='Tamamlanan aşama: '+(i+1)+'/'+selected.length+' · '+providers[id].name;
    }
    loading.remove();
    showToast('Sıralı ajan zinciri tamamlandı.');
  }catch(err){
    loading.remove();
    pushMessage('assistant','Zincir durdu: '+(err?.message||'Bilinmeyen hata')+'\nÖnceki aşamalar sohbet geçmişinde duruyor; kalan aşamaları kontrol edip yeniden deneyebilirsin.',{provider:'AI STUDIO',mode:'error'});
  }finally{
    busy=false;
    $('chatInput').disabled=false;
    $('chatForm').querySelector('[type=submit]').disabled=false;
    $('teamRun').disabled=false;
    $('pipelineRun').disabled=false;
  }
}
function renderCompareResults(results){$('compareResults').innerHTML=results.map(r=>'<article class="result-card"><div class="result-label">'+esc(providers[r.id].name)+' · '+(r.error?'HATA':r.mode==='live'?'GERÇEK MODEL':'DEMO ŞABLONU')+'</div><p>'+esc(r.error||r.answer)+'</p></article>').join('');}
async function runCompare(){
  const prompt=$('comparePrompt').value.trim();if(!prompt){showToast('Önce karşılaştırılacak görevi yaz.');return;}
  const selected=settings.team.slice(0,4);if(selected.length<2){showToast('Karşılaştırmak için en az iki ajan seç.');go('models');return;}
  if(!settings.demoMode&&!confirm('Karşılaştırma '+selected.length+' gerçek API isteği gönderebilir; ücret oluşabilir. Devam?'))return;
  $('compareRun').disabled=true;$('compareRun').textContent='Çalışıyor…';$('compareResults').innerHTML='<div class="panel"><p>Sonuçlar bekleniyor…</p></div>';
  const results=await Promise.all(selected.map(async id=>{try{return {id,answer:settings.demoMode?demoAnswer(id,prompt):await callProvider(id,prompt,[]),mode:settings.demoMode?'demo':'live'};}catch(e){return {id,error:e?.message||'Hata',mode:'error'};}}));
  renderCompareResults(results);$('compareRun').disabled=false;$('compareRun').textContent='Karşılaştırmayı başlat';
}
function renderProjects(){const out=$('projectList');$('projectCount').textContent=projectList.length;if(!projectList.length){out.innerHTML='<div class="panel"><p class="muted">Henüz proje yok. İlk fikrini yukarıdan kaydet.</p></div>';return;}
  out.innerHTML=projectList.map((p,i)=>'<article class="project-card"><div class="project-head"><h3>'+esc(p.name)+'</h3><time>'+esc(new Date(p.updated||Date.now()).toLocaleDateString('tr-TR'))+'</time></div><p>'+esc(p.notes)+'</p><div class="row-actions"><button class="btn secondary small" data-project-export="'+i+'">Markdown indir</button><button class="btn ghost small" data-project-open="'+i+'">Sohbette kullan</button><span class="grow"></span><button class="btn danger small" data-project-delete="'+i+'">Sil</button></div></article>').join('');
}
async function saveProject(e){e.preventDefault();const name=$('projectName').value.trim(),notes=$('projectNotes').value.trim();if(!name||!notes)return;projectList.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,notes,updated:new Date().toISOString()});try{await setPref(DB.projects,projectList);$('projectForm').reset();renderProjects();updateDashboard();showToast('Proje bu cihaza kaydedildi.');}catch(_){showToast('Proje kaydedilemedi. Cihaz depolamasını kontrol et.');}}
function projectMarkdown(p){return '# '+p.name+'\n\n'+p.notes+'\n\n---\nAI Studio Alpha 1 · '+new Date(p.updated||Date.now()).toLocaleString('tr-TR')+'\n';}
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
function exportWorkspace(){
  const snapshot={format:'ai-studio-workspace-v1',exportedAt:new Date().toISOString(),settings:{demoMode:settings.demoMode,models:settings.models,team:settings.team,ollamaUrl:settings.ollamaUrl,ollamaModel:settings.ollamaModel,systemPrompt:settings.systemPrompt},projects:projectList,chat:chatHistory,plugins:userPlugins.filter(p=>p.kind!=='builtin').map(p=>({name:p.name,prompt:p.prompt}))};
  downloadText('ai-studio-workspace-backup.json',JSON.stringify(snapshot,null,2),'application/json;charset=utf-8');
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
    const nextProjects=(Array.isArray(data.projects)?data.projects:[]).filter(p=>typeof p?.name==='string'&&typeof p?.notes==='string').slice(0,300).map(p=>({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name:p.name.slice(0,100),notes:p.notes.slice(0,20000),updated:typeof p.updated==='string'?p.updated:new Date().toISOString()}));
    const nextChat=(Array.isArray(data.chat)?data.chat:[]).filter(m=>(m?.role==='user'||m?.role==='assistant')&&typeof m.content==='string').slice(-80).map(m=>({role:m.role,content:m.content.slice(0,20000),provider:typeof m.provider==='string'?m.provider.slice(0,100):'',mode:['demo','live','error'].includes(m.mode)?m.mode:'demo',time:typeof m.time==='string'?m.time:new Date().toISOString()}));
    const nextPlugins=(Array.isArray(data.plugins)?data.plugins:[]).filter(p=>typeof p?.name==='string'&&typeof p?.prompt==='string'&&p.name.trim()&&p.prompt.trim()).slice(-100).map((p,i)=>({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i),name:p.name.trim().slice(0,80),prompt:p.prompt.trim().slice(0,6000),kind:'custom'}));
    if(!confirm('Bu yedek mevcut proje, sohbet, ayar ve özel prompt kayıtlarını değiştirecek. API anahtarları yedeğe dahil değildir ve bu cihazdaki anahtarlar silinmeyecek. Devam?'))return;
    await Promise.all([setPref(DB.settings,nextSettings),setPref(DB.projects,nextProjects),setPref(DB.chat,nextChat),setPref(DB.plugins,nextPlugins)]);
    settings=nextSettings;projectList=nextProjects;chatHistory=nextChat;userPlugins=nextPlugins;
    renderProviderCards();renderProjects();renderChat();renderPlugins();syncModeUI();updateDashboard();
    $('compareSelectionCount').textContent=settings.team.length+' ajan seçili';
    showToast('Tam çalışma alanı geri yüklendi. API anahtarları ayrı güvenli depoda kaldı.');
  }catch(err){showToast('Yedek geri yüklenemedi: '+(err.message||'JSON dosyasını kontrol et.'));}
}
async function importProjects(file){try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.projects;if(!Array.isArray(incoming))throw new Error('JSON içinde projects dizisi bulunamadı.');for(const p of incoming){if(typeof p?.name==='string'&&typeof p?.notes==='string'){projectList.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name:p.name.slice(0,100),notes:p.notes.slice(0,20000),updated:p.updated||new Date().toISOString()});}}await setPref(DB.projects,projectList);renderProjects();updateDashboard();showToast('Proje yedeği içe aktarıldı.');}catch(e){showToast('İçe aktarma başarısız: '+(e.message||'JSON dosyasını kontrol et.'));}}
async function saveOllama(){settings.ollamaUrl=$('ollamaUrl').value.trim();settings.ollamaModel=$('ollamaModel').value.trim()||providers.ollama.model;settings.models.ollama=settings.ollamaModel;await setPref(DB.settings,settings);renderProviderCards();updateDashboard();showToast('Ollama ayarları kaydedildi.');}
async function testProvider(id){if(settings.demoMode){showToast('Önce Demo modunu kapat; bu test tek gerçek API isteği gönderebilir.');return;}try{const result=await callProvider(id,'Yanıt olarak sadece OK yaz.',[]);showToast('Bağlantı yanıt verdi: '+result.slice(0,70));}catch(e){showToast('Bağlantı testi başarısız: '+(e.message||'Hata'));}}
async function testOllama(){await saveOllama();if(settings.demoMode){showToast('Demo modu açık. Gerçek yerel test için Demo modunu kapat.');return;}try{const result=await callProvider('ollama','Yanıt olarak sadece OK yaz.',[]);showToast('Ollama yanıt verdi: '+result.slice(0,70));}catch(e){showToast('Ollama testi başarısız: '+(e.message||'Hata'));}}
async function saveProviderCard(id){
  settings.models[id]=$('model-'+id).value.trim()||providers[id].model;
  const field=$('key-'+id),key=field?.value.trim();
  try{if(key){await saveSecret(id,key);field.value='';}await setPref(DB.settings,settings);renderProviderCards();updateDashboard();showToast(key?'Model ayarı ve anahtar kaydedildi.':'Model ayarı kaydedildi.');}
  catch(e){showToast('Kaydedilemedi: '+(e.message||'Güvenli depoya erişilemiyor.'));}}
async function clearAllLocal(){if(!confirm('Proje notları, sohbet geçmişi ve özel prompt eklentileri bu cihazdan silinsin mi? API anahtarlarını silmek için Modeller ekranını kullan.'))return;projectList=[];chatHistory=[];userPlugins=[];await Promise.all([removePref(DB.projects),removePref(DB.chat),removePref(DB.plugins)]);renderProjects();renderChat();renderPlugins();updateDashboard();showToast('Yerel notlar ve geçmiş silindi.');}
function copyText(text){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>showToast('Kopyalandı.')).catch(()=>fallbackCopy(text));}else fallbackCopy(text);}
function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();try{document.execCommand('copy');showToast('Kopyalandı.');}catch(_){showToast('Kopyalanamadı; dosya olarak dışa aktarabilirsin.');}t.remove();}
document.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-go],[data-tab]');if(nav){go(nav.dataset.go||nav.dataset.tab);return;}
  const save=e.target.closest('[data-save-key]');if(save){await saveProviderCard(save.dataset.saveKey);return;}
  const test=e.target.closest('[data-test-provider]');if(test){await testProvider(test.dataset.testProvider);return;}
  const del=e.target.closest('[data-delete-key]');if(del){const id=del.dataset.deleteKey;if(confirm(providers[id].name+' anahtarı bu uygulamadan silinsin mi?')){await deleteSecret(id);renderProviderCards();updateDashboard();showToast('Anahtar silindi.');}return;}
  const projectDel=e.target.closest('[data-project-delete]');if(projectDel){projectList.splice(Number(projectDel.dataset.projectDelete),1);await setPref(DB.projects,projectList);renderProjects();updateDashboard();return;}
  const projectExport=e.target.closest('[data-project-export]');if(projectExport){const p=projectList[Number(projectExport.dataset.projectExport)];downloadText((p.name||'proje').replace(/[^a-z0-9-_]+/gi,'_')+'.md',projectMarkdown(p));return;}
  const projectOpen=e.target.closest('[data-project-open]');if(projectOpen){const p=projectList[Number(projectOpen.dataset.projectOpen)];go('chat');$('chatInput').value='Proje bağlamı:\n'+p.name+'\n\n'+p.notes+'\n\nBundan sonraki en iyi adımları öner.';$('chatInput').focus();return;}
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
$('exportCode').addEventListener('click',()=>downloadText('ai-studio-code.'+({javascript:'js',python:'py',markdown:'md',text:'txt'}[$('codeLanguage').value]||$('codeLanguage').value),$('codePad').value));
$('importCode').addEventListener('click',()=>$('codeFile').click());
$('codeFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(f){if(f.size>1_000_000){showToast('Dosya 1 MB limitini aşıyor.');return;}$('codePad').value=await f.text();const ext=f.name.split('.').pop();const mapping={js:'javascript',ts:'javascript',py:'python',md:'markdown',txt:'text',json:'json',html:'html',css:'css'};$('codeLanguage').value=mapping[ext]||'text';showToast('Dosya içe aktarıldı.');}e.target.value='';});
$('exportWorkspace').addEventListener('click',exportWorkspace);
$('importWorkspaceBtn').addEventListener('click',()=> $('importWorkspaceFile').click());
$('importWorkspaceFile').addEventListener('change',async e=>{if(e.target.files?.[0])await importWorkspace(e.target.files[0]);e.target.value='';});
$('resetLocal').addEventListener('click',clearAllLocal);

async function init(){
  try{settings={...clone(defaultSettings),...(await getPref(DB.settings,{}))};settings.models={...clone(defaultSettings.models),...(settings.models||{})};settings.team=(settings.team||defaultSettings.team).filter(id=>providers[id]).slice(0,4);if(settings.ollamaUrl==='http://192.168.1.100:11434')settings.ollamaUrl='';}catch(_){}
  if(!nativeApp){showToast('Tarayıcı önizlemesi: API anahtarları kalıcı saklanmaz; Android sürümü güvenli depo kullanır.');}
  await initKeys(); projectList=await getPref(DB.projects,[]);chatHistory=await getPref(DB.chat,[]);userPlugins=await getPref(DB.plugins,[]);
  if(!Array.isArray(projectList))projectList=[];if(!Array.isArray(chatHistory))chatHistory=[];if(!Array.isArray(userPlugins))userPlugins=[];
  renderProviderCards();renderProjects();renderChat();renderBuiltinTools();renderPlugins();syncModeUI();updateDashboard();$('compareSelectionCount').textContent=settings.team.length+' ajan seçili';
}
init().catch(()=>showToast('Başlangıç ayarları okunamadı; sayfayı yenileyebilirsin.'));
