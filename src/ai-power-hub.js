import { runAgentSwarm, resolveSwarmConcurrency, estimateSwarmCallBudget } from './agent-swarm.js';
import { PROMPT_PLUGIN_CATALOG, EXTERNAL_CONNECTOR_CATALOG, filterPromptPlugins, normalizeEnabledPluginIds } from './plugin-catalog.js';
import { OPENROUTER_CHAT_MODEL_LIMIT, isFreeOpenRouterModelId, isZeroPriceOpenRouterModel, normalizeOpenRouterModelSelection, runOpenRouterMultiModelCalls } from './openrouter-chat.js';
import { FREE_API_PROVIDER_CATALOG, CLOUDFLARE_FREE_MODELS } from './free-api-providers.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback;};
const accessLabel={'free-tier':'Ücretsiz kota','free-models':'Ücretsiz modeller','developer-access':'Ücretsiz geliştirici erişimi','permanent-free':'Kalıcı ücretsiz','free-plan':'Ücretsiz plan'};
const connectorLabel={integrated:'Bağlı',external:'Harici uygulama',planned:'Planlandı',contract:'Sözleşme / mock'};
const OPENROUTER_MODELS_URL='https://openrouter.ai/api/v1/models?output_modalities=text&sort=most-popular&limit=200';
const CF_MODELS=CLOUDFLARE_FREE_MODELS;

async function requestJson(url,options={},timeoutMs=45000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{...options,signal:controller.signal});
    const raw=await response.text();let data={};
    try{data=raw?JSON.parse(raw):{};}catch{data={message:raw.slice(0,600)};}
    if(!response.ok)throw new Error(String(data?.error?.message||data?.message||'HTTP '+response.status).slice(0,500));
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('İstek zaman aşımına uğradı.');
    if(error instanceof TypeError)throw new Error('Ağa erişilemedi veya API CORS isteğini engelledi.');
    throw error;
  }finally{clearTimeout(timer);}
}

export async function mountAiPowerHub(options={}){
  const root=options.root||document.getElementById('tools');
  if(!root||root.dataset.aiPowerHubMounted==='true')return;
  root.dataset.aiPowerHubMounted='true';
  const getSettings=options.getSettings||(()=>({}));
  const saveSettings=options.saveSettings||(()=>Promise.resolve());
  const getConfiguredTeam=options.getConfiguredTeam||(()=>[]);
  const callProvider=options.callProvider||(()=>Promise.reject(new Error('AI sağlayıcısı bağlı değil.')));
  const getSecret=options.getSecret||(()=>Promise.resolve(''));
  const saveSecret=options.saveSecret||(()=>Promise.resolve());
  const deleteSecret=options.deleteSecret||(()=>Promise.resolve());
  const isDemo=options.isDemo||(()=>true);
  const notify=options.notify||(()=>{});
  const logActivity=options.logActivity||(()=>Promise.resolve());
  const go=options.go||(()=>{});
  const getDeviceInfo=options.getDeviceInfo||(()=>null);
  const nativeApp=options.nativeApp===true;
  const getSystemPrompt=options.getSystemPrompt||(()=>'Türkçe ve uygulanabilir yanıt ver.');
  const getSkillSelection=options.getSkillSelection||(()=>({skills:[],preferredSkillIds:[]}));

  const host=document.createElement('section');
  host.id='aiPowerHub';host.className='ai-power-hub';
  host.innerHTML=
    '<div class="ai-power-intro"><div><div class="eyebrow">AI STUDIO · POWER HUB</div><h2>AI Team, ajanlar ve eklenti merkezi</h2><p>Swarm, 34 görev eklentisi, ücretsiz model karşılaştırması ve sağlayıcı/bağlantı kataloğu.</p></div><span class="pill">10 AI Team motoru korunur</span></div>'+
    '<nav class="ai-power-tabs" aria-label="AI Power Hub bölümleri">'+
      '<button type="button" class="ai-power-tab active" data-power-tab="swarm">AI Swarm</button>'+
      '<button type="button" class="ai-power-tab" data-power-tab="plugins">Plugin Library</button>'+
      '<button type="button" class="ai-power-tab" data-power-tab="openrouter">OpenRouter Multi-Chat</button>'+
      '<button type="button" class="ai-power-tab" data-power-tab="providers">9 doğrulanmış ücretsiz sağlayıcı</button>'+
      '<button type="button" class="ai-power-tab" data-power-tab="connectors">Bağlantılar</button></nav>'+
    '<section class="ai-power-panel" data-power-panel="swarm">'+
      '<div class="ai-power-heading"><div><div class="eyebrow">MULTI-AGENT ORCHESTRATOR</div><h3>AI Swarm</h3><p>Görevi uzman ajanlara böl, paralel çalıştır, ortak panoda bulguları paylaş ve sonuçları birleştir.</p></div><span class="pill">En fazla 10 ajan</span></div>'+
      '<label class="field-label" for="swarmTask">Ana görev</label><textarea id="swarmTask" class="input" rows="3" maxlength="3000" placeholder="Ajanların birlikte incelemesini istediğin görevi yaz..."></textarea>'+
      '<div class="ai-power-options"><label class="field-label" for="swarmAgentLimit">Ajan sayısı<select id="swarmAgentLimit" class="input"></select></label><label class="field-label" for="swarmConcurrency">Paralel çalışma<select id="swarmConcurrency" class="input"><option value="1">1 eşzamanlı</option><option value="2">2 eşzamanlı</option><option value="3">3 eşzamanlı</option><option value="4">4 eşzamanlı</option></select></label><div class="ai-power-call-budget"><span>Hesaplanan çağrı bütçesi</span><strong id="swarmCallBudget">5 beklenen · en fazla 8</strong><small id="swarmTeamState">Hazır motorlar kontrol ediliyor…</small></div></div>'+
      '<div class="row-actions"><button type="button" class="btn primary" id="swarmRun">Swarm çalıştır</button><span class="grow"></span><span class="fineprint" id="swarmStatus" role="status">Gerçek model modu ve en az iki hazır AI motoru gerekir.</span></div>'+
      '<div id="swarmBoard" class="ai-power-board" aria-live="polite"><p class="fineprint">Ajan ilerlemesi ve ortak pano notları burada görünür.</p></div><div id="swarmResults" class="stack"></div>'+
      '<p class="fineprint">Swarm plan ve kod önerisi üretir; otomatik dosya yazmaz, komut çalıştırmaz ve test sonucu uydurmaz. API çağrıları model kotası kullanabilir.</p></section>'+
    '<section class="ai-power-panel" data-power-panel="plugins" hidden>'+
      '<div class="ai-power-heading"><div><div class="eyebrow">PROMPT PLUGIN LIBRARY</div><h3>34 hazır görev eklentisi</h3><p>Kategoriye göre ara, eklentileri aç/kapat ve görev metnini sohbet ekranına aktar.</p></div><span class="pill" id="pluginEnabledCount">34 etkin</span></div>'+
      '<label class="field-label" for="pluginCatalogTask">Eklenti görevi<textarea id="pluginCatalogTask" class="input" rows="2" maxlength="6000" placeholder="Eklentinin üzerinde çalışacağı görevi yaz..."></textarea></label>'+
      '<div class="ai-power-options"><label class="field-label" for="pluginCatalogSearch">Eklenti ara<input id="pluginCatalogSearch" class="input" type="search" placeholder="Örn. Blender, Reverse API, güvenlik"></label><label class="field-label" for="pluginCatalogCategory">Kategori<select id="pluginCatalogCategory" class="input"><option value="all">Tüm kategoriler</option></select></label></div>'+
      '<div id="pluginCatalogList" class="ai-plugin-grid"></div><p class="fineprint">Eklentiler prompt şablonlarıdır; kendi başlarına kod veya harici araç çalıştırmaz.</p></section>'+
    '<section class="ai-power-panel" data-power-panel="openrouter" hidden>'+
      '<div class="ai-power-heading"><div><div class="eyebrow">FREE MODEL LAB</div><h3>OpenRouter Multi-Chat</h3><p>Aynı görevi en fazla dört ücretsiz OpenRouter modeline gönder ve yanıtları karşılaştır.</p></div><span class="pill">En fazla 4 model</span></div>'+
      '<div class="row-actions"><button type="button" class="btn secondary" id="loadOpenRouterModels">Ücretsiz modelleri yenile</button><span class="grow"></span><span id="openRouterModelStatus" class="fineprint">Yalnızca :free / sıfır fiyatlı modeller.</span></div>'+
      '<label class="field-label" for="openRouterManualModel">Ücretsiz model kimliği ekle<input id="openRouterManualModel" class="input" maxlength="140" placeholder="sağlayıcı/model:free"></label><div class="row-actions"><button type="button" class="btn ghost small" id="addOpenRouterModel">Model ekle</button><span class="fineprint">openrouter/free veya :free ile biten kimlik kabul edilir.</span></div>'+
      '<div id="openRouterModelList" class="ai-model-grid"></div><label class="field-label" for="openRouterMultiPrompt">Karşılaştırma görevi<textarea id="openRouterMultiPrompt" class="input" rows="3" maxlength="6000" placeholder="Seçili ücretsiz modellere aynı görevi gönder..."></textarea></label>'+
      '<div class="row-actions"><button type="button" class="btn primary" id="runOpenRouterMulti">Seçili modelleri çalıştır</button><span class="grow"></span><span id="openRouterMultiStatus" class="fineprint">En az iki model seç.</span></div><div id="openRouterMultiResults" class="stack"></div>'+
      '<p class="fineprint">Seçilen her model bir API isteği ve kota kullanır. Uygulama ücretli model kimliklerini reddeder; ücretsiz model kotaları yine de sınırlıdır.</p></section>'+
    '<section class="ai-power-panel" data-power-panel="providers" hidden>'+
      '<div class="ai-power-heading"><div><div class="eyebrow">FREE API DIRECTORY</div><h3>9 API sağlayıcısı</h3><p>Yalnızca doğrulanmış ücretsiz katman, sıfır fiyatlı model veya ücretsiz geliştirici erişimi gösterilir. Ücretli ve deneme kredili seçenekler çıkarıldı.</p></div><span class="pill">Ücretli varsayılan yok</span></div>'+
      '<div class="ai-provider-directory" id="freeProviderDirectory"></div>'+
      '<div class="panel ai-provider-setup"><div class="section-head"><div><div class="eyebrow">OPTIONAL FREE ROUTES</div><h3>Cloudflare Workers AI</h3></div><span class="pill">AI Team listesine otomatik eklenmez</span></div>'+
      '<p class="fineprint">İsteğe bağlı bağlantılar. API anahtarları Android güvenli deposunda tutulur. Kota/plan şartlarını sağlayıcı panelinde kontrol et.</p>'+
      '<div class="ai-provider-form"><h4>Cloudflare Workers AI · Free plan</h4><label class="field-label" for="cloudflareAccountId">Cloudflare Account ID<input id="cloudflareAccountId" class="input" maxlength="32" autocomplete="off" placeholder="32 karakterlik Account ID"></label><label class="field-label" for="cloudflareApiKey">API token<input id="cloudflareApiKey" class="input" type="password" maxlength="256" autocomplete="new-password" placeholder="Workers AI token"></label><label class="field-label" for="cloudflareModel">Ücretsiz model<select id="cloudflareModel" class="input"></select></label><label class="ai-consent"><input id="cloudflareFreeConsent" type="checkbox"> Free plan kullanıyorum; günlük kota ve faturalandırma şartlarını kontrol ettim.</label><div class="row-actions"><button type="button" class="btn secondary small" id="saveCloudflare">Workers AI ayarını kaydet</button><button type="button" class="btn ghost small" id="runCloudflare">Tek istek dene</button><button type="button" class="btn ghost small danger-text" id="clearCloudflare">Tokenı sil</button></div><p id="cloudflareStatus" class="fineprint" role="status">Bağlı değil.</p><p class="fineprint">Workers Free için 10.000 Neuron/gün tahsisi vardır. Ücretli planda kota aşımı ücret doğurabilir; uygulama hesap faturalandırmasını denetleyemez.</p></div>'+
      '<label class="field-label" for="freeProviderPrompt">Tek istek görevi<textarea id="freeProviderPrompt" class="input" rows="3" maxlength="5000" placeholder="Cloudflare Workers AI için görev..."></textarea></label><div id="freeProviderResult" class="ai-power-result" aria-live="polite"></div></div></section>'+
    '<section class="ai-power-panel" data-power-panel="connectors" hidden><div class="ai-power-heading"><div><div class="eyebrow">CONNECTOR REGISTRY</div><h3>Plugin ve servis bağlantıları</h3><p>Bağlı, harici, planlanan ve mock sözleşmeli entegrasyonları ayırt et.</p></div><span class="pill">Açık izin sınırları</span></div><div class="ai-provider-directory" id="externalConnectorDirectory"></div></section>';

  const title=root.querySelector('.page-title');
  if(title)title.insertAdjacentElement('afterend',host);else root.prepend(host);
  const $=id=>host.querySelector('#'+id);
  const settings=getSettings();
  settings.swarmMaxAgents=clamp(settings.swarmMaxAgents,2,10,3);
  settings.swarmConcurrency=clamp(settings.swarmConcurrency,1,4,2);
  settings.openrouterChatModels=normalizeOpenRouterModelSelection(settings.openrouterChatModels||['openrouter/free']);
  settings.enabledPromptPluginIds=normalizeEnabledPluginIds(settings.enabledPromptPluginIds);
  settings.cloudflareModel=CF_MODELS.includes(settings.cloudflareModel)?settings.cloudflareModel:CF_MODELS[0];
  settings.cloudflareAccountId=String(settings.cloudflareAccountId||'').slice(0,32);
  await saveSettings();
  function setStatus(id,message,tone){const node=$(id);if(node){node.textContent=String(message||'');node.dataset.tone=tone||'info';}}
  function link(url,label){return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label||'Resmî belge')+' ↗</a>':'';}
  function setTab(active){
    host.querySelectorAll('[data-power-tab]').forEach(button=>button.classList.toggle('active',button.dataset.powerTab===active));
    host.querySelectorAll('[data-power-panel]').forEach(panel=>{panel.hidden=panel.dataset.powerPanel!==active;});
  }
  host.querySelectorAll('[data-power-tab]').forEach(button=>button.addEventListener('click',()=>setTab(button.dataset.powerTab)));
  const save=()=>saveSettings();

  function renderPlugins(){
    const matches=filterPromptPlugins({enabledIds:settings.enabledPromptPluginIds,query:$('pluginCatalogSearch').value,category:$('pluginCatalogCategory').value});
    $('pluginEnabledCount').textContent=settings.enabledPromptPluginIds.length+' / '+PROMPT_PLUGIN_CATALOG.length+' etkin';
    $('pluginCatalogList').innerHTML=matches.map(item=>'<article class="ai-plugin-card"><div class="ai-plugin-head"><strong>'+esc(item.icon)+' '+esc(item.name)+'</strong><label class="ai-consent"><input type="checkbox" data-plugin-toggle="'+esc(item.id)+'" '+(item.enabled?'checked':'')+'> Etkin</label></div><span class="pill">'+esc(item.category)+'</span><p>'+esc(item.desc)+'</p><button type="button" class="btn secondary small" data-plugin-apply="'+esc(item.id)+'">Görevi sohbete aktar</button></article>').join('')||'<p class="fineprint">Bu filtrede eklenti yok.</p>';
  }
  const categories=[...new Set(PROMPT_PLUGIN_CATALOG.map(item=>item.category))].sort((a,b)=>a.localeCompare(b,'tr'));
  $('pluginCatalogCategory').insertAdjacentHTML('beforeend',categories.map(value=>'<option value="'+esc(value)+'">'+esc(value)+'</option>').join(''));
  $('pluginCatalogSearch').addEventListener('input',renderPlugins);
  $('pluginCatalogCategory').addEventListener('change',renderPlugins);
  $('pluginCatalogList').addEventListener('change',async event=>{
    const input=event.target.closest('[data-plugin-toggle]');if(!input)return;
    const id=input.dataset.pluginToggle;
    settings.enabledPromptPluginIds=input.checked?[...new Set([...settings.enabledPromptPluginIds,id])]:settings.enabledPromptPluginIds.filter(value=>value!==id);
    await save();renderPlugins();
  });
  $('pluginCatalogList').addEventListener('click',event=>{
    const button=event.target.closest('[data-plugin-apply]');if(!button)return;
    const item=PROMPT_PLUGIN_CATALOG.find(plugin=>plugin.id===button.dataset.pluginApply);
    if(!item||!settings.enabledPromptPluginIds.includes(item.id)){notify('Önce eklentiyi etkinleştir.');return;}
    const input=document.getElementById('chatInput');
    if(input)input.value=item.prompt.replaceAll('{{gorev}}',$('pluginCatalogTask').value.trim()||'[Görevini buraya yaz]');
    go('chat');if(input)input.focus();notify(item.name+' sohbet taslağına aktarıldı.');
  });
  renderPlugins();

  function renderSwarmBudget(){
    const count=clamp($('swarmAgentLimit').value,2,10,3),budget=estimateSwarmCallBudget(count),ready=getConfiguredTeam();
    $('swarmCallBudget').textContent=budget.expected+' beklenen · en fazla '+budget.maximumWithRetries+' çağrı';
    $('swarmTeamState').textContent=ready.length+' hazır AI Team motoru · '+(isDemo()?'Demo modu açık':'Gerçek model modu');
  }
  $('swarmAgentLimit').innerHTML=Array.from({length:9},(_,index)=>'<option value="'+(index+2)+'">'+(index+2)+' ajan</option>').join('');
  $('swarmAgentLimit').value=String(settings.swarmMaxAgents);
  $('swarmConcurrency').value=String(settings.swarmConcurrency);
  $('swarmAgentLimit').addEventListener('change',async()=>{settings.swarmMaxAgents=clamp($('swarmAgentLimit').value,2,10,3);await save();renderSwarmBudget();});
  $('swarmConcurrency').addEventListener('change',async()=>{settings.swarmConcurrency=clamp($('swarmConcurrency').value,1,4,2);await save();renderSwarmBudget();});
  $('swarmRun').addEventListener('click',async()=>{
    const task=$('swarmTask').value.trim(),team=getConfiguredTeam();
    if(isDemo()){setStatus('swarmStatus','Demo modu açık. Gerçek Swarm için Demo modunu kapat.','error');return;}
    if(!task){setStatus('swarmStatus','Önce ana görevi yaz.','error');return;}
    if(team.length<2){setStatus('swarmStatus','En az iki seçili AI Team motorunun gerçek bağlantısı hazır olmalı.','error');return;}
    const count=clamp($('swarmAgentLimit').value,2,10,3),budget=estimateSwarmCallBudget(count);
    if(!window.confirm('Swarm '+count+' ajan çalıştıracak. Beklenen '+budget.expected+', dinamik Skill genişletmesi ve hata tekrarları dahil en fazla '+budget.maximumWithRetries+' model çağrısı olabilir. Kota kullanılır. Devam?'))return;
    const button=$('swarmRun');button.disabled=true;$('swarmResults').innerHTML='';$('swarmBoard').innerHTML='';setStatus('swarmStatus','Koordinatör görevleri planlıyor…');
    await logActivity('AI Swarm','Başladı',count+' ajan · '+team.join(', '));
    try{
      const skillState=getSkillSelection()||{};
      const result=await runAgentSwarm({providerIds:team,task,history:[],maxAgents:count,maxConcurrency:clamp($('swarmConcurrency').value,1,4,2),isNative,deviceInfo:getDeviceInfo(),callProvider:(id,prompt,history)=>callProvider(id,prompt,history,{includeTaskSkills:false}),skills:skillState.skills||[],preferredSkillIds:skillState.preferredSkillIds||[],
        onEvent:async event=>{
          if(event.type==='agent_started')setStatus('swarmStatus',event.agentId+' başladı: '+event.title);
          if(event.type==='agent_retry')setStatus('swarmStatus',event.agentId+' geçici hatada yeniden deneniyor.');
          if(event.type==='skills_refreshed'&&event.addedSkillNames?.length)setStatus('swarmStatus',event.taskId+' yeni Skill ekledi: '+event.addedSkillNames.join(', '));
          if(event.type==='skills_expanded')setStatus('swarmStatus',event.agentId+' ek Skill ile yanıtını güncelliyor: '+event.skillNames.join(', '));
          if(event.type==='plan_fallback')setStatus('swarmStatus','Yedek plan kullanıldı: '+event.reason);
          if(event.type==='agent_broadcast'){
            const card=document.createElement('article');card.className='ai-power-board-message';
            const strong=document.createElement('strong');strong.textContent=event.from;
            const para=document.createElement('p');para.textContent=event.text;card.append(strong,para);$('swarmBoard').append(card);
          }
          await logActivity('Swarm · '+(event.agentId||event.type),event.type,String(event.title||event.reason||event.text||'').slice(0,240));
        }});
      $('swarmResults').innerHTML=result.results.map(item=>'<article class="ai-power-result"><div class="reuse-top"><strong>'+esc(item.title)+'</strong><span class="pill">'+(item.error?'Hata':'Tamamlandı')+(item.retried?' · tekrarlandı':'')+'</span></div><p class="fineprint">'+esc(item.role)+' · '+esc(item.providerId)+(item.confidence===null?'':' · güven '+item.confidence+'/100')+(item.skillNames?.length?' · Skills: '+esc(item.skillNames.join(', ')):'')+'</p><pre>'+esc(item.error||item.answer)+'</pre></article>').join('');
      const summary=document.createElement('article');summary.className='ai-power-result ai-power-summary';
      const heading=document.createElement('h4');heading.textContent='Koordinatör sentezi';
      const pre=document.createElement('pre');pre.textContent=result.summary;summary.append(heading,pre);$('swarmResults').prepend(summary);
      setStatus('swarmStatus',result.metrics.completed+'/'+result.metrics.workerCount+' ajan · '+result.metrics.retryCount+' tekrar · '+Math.round(result.metrics.elapsedMs/1000)+' sn',result.metrics.failed?'warning':'success');
      await logActivity('AI Swarm','Tamamlandı',result.metrics.completed+'/'+result.metrics.workerCount+' ajan.');
    }catch(error){setStatus('swarmStatus',error.message||'Swarm çalıştırılamadı.','error');await logActivity('AI Swarm','Hata',error.message||'Bilinmeyen hata');}
    finally{button.disabled=false;renderSwarmBudget();}
  });
  renderSwarmBudget();

  let discoveredModels=[];
  function renderOpenRouterModels(){
    const selected=normalizeOpenRouterModelSelection(settings.openrouterChatModels);
    if(!discoveredModels.some(item=>item.id==='openrouter/free'))discoveredModels.unshift({id:'openrouter/free',name:'OpenRouter Free Router',description:'Ücretsiz modellere yönlendirici',pricing:{prompt:'0',completion:'0'}});
    $('openRouterModelList').innerHTML=discoveredModels.slice(0,200).map(item=>'<label class="ai-model-choice"><input type="checkbox" data-openrouter-model="'+esc(item.id)+'" '+(selected.includes(item.id)?'checked':'')+'><span><strong>'+esc(item.name||item.id)+'</strong><small>'+esc(item.id)+' · $0 giriş / $0 çıkış</small></span></label>').join('')||'<p class="fineprint">Ücretsiz model listesi henüz yüklenmedi.</p>';
    $('openRouterMultiStatus').textContent=selected.length+'/'+OPENROUTER_CHAT_MODEL_LIMIT+' model seçili';
  }
  $('openRouterModelList').addEventListener('change',async event=>{
    const input=event.target.closest('[data-openrouter-model]');if(!input)return;
    const old=normalizeOpenRouterModelSelection(settings.openrouterChatModels);
    const selected=input.checked?normalizeOpenRouterModelSelection([...old,input.dataset.openrouterModel]):old.filter(id=>id!==input.dataset.openrouterModel);
    if(input.checked&&!selected.includes(input.dataset.openrouterModel)){input.checked=false;notify('En fazla dört ücretsiz model seçebilirsin.');return;}
    settings.openrouterChatModels=selected;await save();renderOpenRouterModels();
  });
  $('loadOpenRouterModels').addEventListener('click',async()=>{
    setStatus('openRouterModelStatus','Ücretsiz modeller aranıyor…');
    try{
      const data=await requestJson(OPENROUTER_MODELS_URL,{headers:{Accept:'application/json'}});
      discoveredModels=(Array.isArray(data.data)?data.data:[]).filter(isZeroPriceOpenRouterModel).sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id))).slice(0,200);
      renderOpenRouterModels();setStatus('openRouterModelStatus',discoveredModels.length+' sıfır fiyatlı :free model bulundu.','success');
    }catch(error){setStatus('openRouterModelStatus','Liste alınamadı: '+error.message+' Elle model ekleyebilirsin.','error');}
  });
  $('addOpenRouterModel').addEventListener('click',async()=>{
    const id=$('openRouterManualModel').value.trim();
    if(!isFreeOpenRouterModelId(id)){notify('Yalnızca openrouter/free veya :free model kimliği eklenebilir.');return;}
    if(!discoveredModels.some(item=>item.id===id))discoveredModels.push({id,name:id,pricing:{prompt:'0',completion:'0'}});
    settings.openrouterChatModels=normalizeOpenRouterModelSelection([...settings.openrouterChatModels,id]);$('openRouterManualModel').value='';
    await save();renderOpenRouterModels();
  });
  $('runOpenRouterMulti').addEventListener('click',async()=>{
    if(isDemo()){setStatus('openRouterMultiStatus','Demo modu açık. Gerçek model moduna geç.','error');return;}
    const prompt=$('openRouterMultiPrompt').value.trim(),models=normalizeOpenRouterModelSelection(settings.openrouterChatModels);
    if(!prompt){setStatus('openRouterMultiStatus','Görev boş.','error');return;}
    if(models.length<2){setStatus('openRouterMultiStatus','En az iki ücretsiz model seç.','error');return;}
    if(!await getSecret('openrouter')){setStatus('openRouterMultiStatus','OpenRouter anahtarı Modeller ekranında kayıtlı değil.','error');return;}
    if(!window.confirm(models.length+' ücretsiz model için '+models.length+' ayrı API isteği yapılacak. Kotalar kullanılır. Devam?'))return;
    const button=$('runOpenRouterMulti');button.disabled=true;$('openRouterMultiResults').innerHTML='';setStatus('openRouterMultiStatus','Modeller yanıt üretiyor…');
    try{
      const results=await runOpenRouterMultiModelCalls({modelIds:models,prompt,history:[],callModel:(modelId,task,history)=>callProvider('openrouter',task,history,{modelOverride:modelId})});
      $('openRouterMultiResults').innerHTML=results.map(item=>'<article class="ai-power-result"><div class="reuse-top"><strong>'+esc(item.modelId)+'</strong><span class="pill">'+(item.error?'Hata':'Yanıt')+'</span></div><pre>'+esc(item.error||item.answer)+'</pre></article>').join('');
      const ok=results.filter(item=>!item.error).length;setStatus('openRouterMultiStatus',ok+'/'+results.length+' model yanıt verdi.','success');
      await logActivity('OpenRouter Multi-Chat',ok===results.length?'Tamamlandı':'Kısmi başarı',ok+'/'+results.length+' model yanıt verdi.');
    }catch(error){setStatus('openRouterMultiStatus',error.message||'Karşılaştırma başarısız.','error');}
    finally{button.disabled=false;}
  });
  renderOpenRouterModels();

  $('freeProviderDirectory').innerHTML=FREE_API_PROVIDER_CATALOG.map(item=>'<article class="ai-directory-card"><div class="reuse-top"><strong>'+item.rank+'. '+esc(item.name)+'</strong><span class="pill">'+esc(accessLabel[item.access]||item.access)+'</span></div><p>'+esc(item.note)+'</p>'+link(item.url,'Resmî belge')+'</article>').join('');
  $('externalConnectorDirectory').innerHTML=EXTERNAL_CONNECTOR_CATALOG.map(item=>'<article class="ai-directory-card"><div class="reuse-top"><strong>'+esc(item.name)+'</strong><span class="pill">'+esc(connectorLabel[item.status]||item.status)+'</span></div><p>'+esc(item.desc)+'</p>'+link(item.url,'Resmî kaynak')+'</article>').join('');
  $('cloudflareAccountId').value=settings.cloudflareAccountId;
  $('cloudflareModel').innerHTML=CF_MODELS.map(model=>'<option value="'+esc(model)+'">'+esc(model)+'</option>').join('');
  $('cloudflareModel').value=settings.cloudflareModel;
  setStatus('cloudflareStatus',await getSecret('cloudflare')?'Workers AI tokenı kayıtlı.':'Workers AI tokenı bağlı değil.');
  $('saveCloudflare').addEventListener('click',async()=>{
    const account=$('cloudflareAccountId').value.trim(),key=$('cloudflareApiKey').value.trim(),model=$('cloudflareModel').value;
    if(!/^[a-f0-9]{32}$/i.test(account)){setStatus('cloudflareStatus','Account ID 32 karakterlik hex olmalı.','error');return;}
    if(!CF_MODELS.includes(model)){setStatus('cloudflareStatus','Yalnızca ücretsiz model listesi kullanılabilir.','error');return;}
    try{if(key)await saveSecret('cloudflare',key);settings.cloudflareAccountId=account;settings.cloudflareModel=model;await save();$('cloudflareApiKey').value='';setStatus('cloudflareStatus','Workers AI Free ayarları kaydedildi.','success');}
    catch(error){setStatus('cloudflareStatus',error.message||'Ayar kaydedilemedi.','error');}
  });
  $('clearCloudflare').addEventListener('click',async()=>{try{await deleteSecret('cloudflare');setStatus('cloudflareStatus','Cloudflare tokenı silindi.','success');}catch(error){setStatus('cloudflareStatus',error.message||'Token silinemedi.','error');}});

  let freeApiBusy=false;
  async function runFreeApi(){
    if(freeApiBusy)return;
    if(isDemo()){setStatus('cloudflareStatus','Demo modu açık. Gerçek model moduna geç.','error');return;}
    const prompt=$('freeProviderPrompt').value.trim();
    if(!prompt){notify('Önce tek istek görevi yaz.');return;}
    if(!$('cloudflareFreeConsent').checked){setStatus('cloudflareStatus','Workers Free plan onay kutusunu işaretle.','error');return;}
    const confirmText='Workers AI Free kotası kullanılacak. Yalnızca Free plan hesabında devam et; ücretli plan kullanıyorsan dur.';
    if(!window.confirm(confirmText))return;
    freeApiBusy=true;const button=$('runCloudflare');button.disabled=true;$('freeProviderResult').textContent='Yanıt bekleniyor…';
    try{
      const key=await getSecret('cloudflare');if(!key)throw new Error('Önce Cloudflare tokenını kaydet.');
      const account=$('cloudflareAccountId').value.trim(),model=$('cloudflareModel').value;
      if(!/^[a-f0-9]{32}$/i.test(account)||!CF_MODELS.includes(model))throw new Error('Cloudflare Free ayarları geçersiz.');
      const url='https://api.cloudflare.com/client/v4/accounts/'+account+'/ai/v1/chat/completions';
      const data=await requestJson(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model,messages:[{role:'system',content:getSystemPrompt()},{role:'user',content:prompt}],max_tokens:1200,temperature:0.4})});
      const text=data?.choices?.[0]?.message?.content;
      const answer=Array.isArray(text)?text.map(item=>item.text||'').join('\n'):String(text||'');
      if(!answer.trim())throw new Error('Sağlayıcı boş yanıt verdi.');
      $('freeProviderResult').textContent=answer;setStatus('cloudflareStatus','Gerçek model yanıt verdi.','success');
      await logActivity('Cloudflare Workers AI','Tamamlandı',answer.slice(0,220));
    }catch(error){
      $('freeProviderResult').textContent='Hata: '+(error.message||'İstek başarısız.');
      setStatus('cloudflareStatus',error.message||'İstek başarısız.','error');
      await logActivity('Cloudflare Workers AI','Hata',error.message||'Bilinmeyen hata');
    }finally{freeApiBusy=false;button.disabled=false;}
  }
  $('runCloudflare').addEventListener('click',runFreeApi);
  window.addEventListener('ai-studio-workspace-restored',()=>{
    settings.swarmMaxAgents=clamp(settings.swarmMaxAgents,2,10,3);
    settings.swarmConcurrency=clamp(settings.swarmConcurrency,1,4,2);
    settings.openrouterChatModels=normalizeOpenRouterModelSelection(settings.openrouterChatModels||['openrouter/free']);
    settings.enabledPromptPluginIds=normalizeEnabledPluginIds(settings.enabledPromptPluginIds);
    settings.cloudflareModel=CF_MODELS.includes(settings.cloudflareModel)?settings.cloudflareModel:CF_MODELS[0];
    settings.cloudflareAccountId=String(settings.cloudflareAccountId||'').slice(0,32);
    $('swarmAgentLimit').value=String(settings.swarmMaxAgents);
    $('swarmConcurrency').value=String(settings.swarmConcurrency);
    $('cloudflareAccountId').value=settings.cloudflareAccountId;
    $('cloudflareModel').value=settings.cloudflareModel;
    renderSwarmBudget();renderPlugins();renderOpenRouterModels();
  });
  return {refresh:()=>{renderSwarmBudget();renderPlugins();renderOpenRouterModels();},dispose:()=>{root.dataset.aiPowerHubMounted='false';host.remove();}};
}
