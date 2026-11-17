import { Preferences } from '@capacitor/preferences';
import { validateOpenShortsSourceUrl } from './openshorts-mcp.js';
import {
  SOCIAL_PLATFORMS, normalizeSocialDraft,
  normalizeSocialQueue, normalizeSocialClips, buildSocialPublishArgs
} from './social-studio-core.js';
import { buildSocialMultiShotPrompt, isSocialAutomationPolling, getSocialAutomationPollDelay } from './social-studio-automation.js';
import { buildCreatorPrompt, normalizeCreatorMode } from './creator-studio-core.js';
import { estimateRunwayVideoCost, createRunwayVideo, getRunwayVideoTask, estimateRunwayMultiShotCost, createRunwayMultiShotVideo } from './runway-video.js';
import './social-studio.css';

const STORAGE_KEY = 'ai-studio-social-studio-v1';
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const makeId = () => globalThis.crypto?.randomUUID?.() || `social-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const platformName = (id) => SOCIAL_PLATFORMS.find((platform) => platform.id === id)?.label || id;
const statusNames = {
  script_ready: 'Senaryo hazır', processing: 'Video işleniyor', review: 'Kontrol bekliyor',
  publish_request_sent: 'Yayın isteği gönderildi', schedule_request_sent: 'Zamanlama isteği gönderildi',
  ai_video_generating: 'AI video oluşturuluyor', ai_video_ready: 'AI video hazır',
  failed: 'İşlem başarısız'
};

export async function mountSocialStudio({ generateText, openShorts, videoKeyStore = {}, go, notify = () => {}, getAiMode = () => 'AI sağlayıcısı' }) {
  if ($('social')) return;
  const main = document.querySelector('main');
  const nav = document.querySelector('.bottom-nav');
  if (!main || !nav) return;

  const navButton = document.createElement('button');
  navButton.type = 'button';
  navButton.className = 'nav-btn';
  navButton.dataset.tab = 'social';
  navButton.innerHTML = '<span aria-hidden="true">✦</span>Creator';
  const compareTab = nav.querySelector('[data-tab="compare"]');
  nav.insertBefore(navButton, compareTab || null);

  const homeGrid = document.querySelector('#home .quick-grid');
  if (homeGrid && !homeGrid.querySelector('[data-go="social"]')) {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'quick-card'; card.dataset.go = 'social';
    card.innerHTML = '<span class="quick-icon">✦</span><strong>Creator Studio</strong><small>What If, In My Town ve Clips</small>'; 
    homeGrid.append(card);
  }

  const screen = document.createElement('section');
  screen.className = 'screen social-screen'; screen.id = 'social';
  screen.innerHTML = `
    <div class="page-title social-title"><div class="eyebrow">AI STUDIO · CREATOR</div><h1>Creator Studio</h1><p>Üç ayrı üretim alanı. Her format kendi senaryo akışında çalışır.</p></div>
    <div class="creator-mode-tabs" role="tablist" aria-label="İçerik türü">
      <button type="button" class="creator-mode-tab active" data-creator-mode="what_if" role="tab" aria-selected="true">✦ What If</button>
      <button type="button" class="creator-mode-tab" data-creator-mode="in_my_town" role="tab" aria-selected="false">⌂ In My Town</button>
      <button type="button" class="creator-mode-tab" data-creator-mode="clips" role="tab" aria-selected="false">▣ Clips</button>
    </div>
    <p class="creator-mode-description" id="creatorModeDescription">What If: seçtiğin şey belirlediğin aralıklarla iki katına çıkar.</p>
    <div class="social-flow-strip" aria-label="Üretim aşamaları"><span>1 · Fikir</span><i>›</i><span>2 · AI senaryo</span><i>›</i><span>3 · Çok sahneli video</span></div>
    <div class="social-top-grid" data-creator-story>
      <section class="panel social-panel">
        <div class="section-head"><div><div class="eyebrow">01 / VIDEO BRIEF</div><h2 id="creatorBriefTitle">What If senaryosu</h2></div><span class="pill">AI destekli</span></div>
        <div id="creatorWhatIfFields">
          <label class="field-label" for="creatorWhatIfThing">Neyin iki katına çıkmasını istiyorsun?</label>
          <input class="input" id="creatorWhatIfThing" maxlength="100" value="money" placeholder="money, gravity, population...">
          <label class="field-label" for="creatorWhatIfInterval">Hangi aralıkla iki katına çıksın?</label>
          <select class="input" id="creatorWhatIfInterval"><option value="every second">Every second</option><option value="every minute">Every minute</option><option value="every 10 minutes">Every 10 minutes</option><option value="every hour" selected>Every hour</option><option value="every day">Every day</option><option value="every week">Every week</option></select>
          <p class="fineprint">Örnek: What if money doubled every hour?</p>
        </div>
        <div id="creatorTownFields" hidden>
          <label class="field-label" for="creatorTownName">Kasaba adı (kurgusal)</label>
          <input class="input" id="creatorTownName" maxlength="80" value="My Town" placeholder="My Town">
          <label class="field-label" for="creatorTownEvent">In My Town videosunda ne oluyor?</label>
          <textarea class="input" id="creatorTownEvent" rows="3" maxlength="400" placeholder="Bir olay yaz veya boş bırak, AI özgün bir kasaba fikri bulsun."></textarea>
          <p class="fineprint">Bu, What If formatından ayrıdır. İki katına çıkma kuralı kullanılmaz.</p>
        </div>
        <textarea class="input" id="socialTopic" rows="1" maxlength="1200" hidden></textarea>
        <div class="social-two-col">
          <div><label class="field-label" for="socialAudience">Hedef izleyici</label><input class="input" id="socialAudience" maxlength="180" placeholder="Örn. oyun meraklıları"></div>
          <div><label class="field-label" for="socialTone">Anlatım tarzı</label><select class="input" id="socialTone"><option value="energetic">Enerjik</option><option value="storytelling">Hikâye anlatımı</option><option value="educational">Eğitici</option><option value="funny">Mizahi</option><option value="calm">Sakin ve açıklayıcı</option></select></div>
        </div>
        <div class="social-two-col">
          <div><label class="field-label" for="socialDuration">Video süresi</label><select class="input" id="socialDuration"><option value="20">20 saniye</option><option value="30" selected>30 saniye</option><option value="45">45 saniye</option><option value="60">60 saniye</option><option value="90">90 saniye</option></select></div>
          <div><label class="field-label" for="socialLanguage">Dil</label><select class="input" id="socialLanguage"><option value="Turkish">Türkçe</option><option value="English">İngilizce</option><option value="Turkish and English">Türkçe + İngilizce</option></select></div>
        </div>
        <div hidden><div class="field-label">Hedef platformlar</div>
        <div class="social-platforms" id="socialBriefPlatforms">${SOCIAL_PLATFORMS.map((platform) => `<label class="social-check"><input type="checkbox" data-social-brief-platform="${platform.id}" checked><span>${platform.label}</span></label>`).join('')}</div></div>
        <div class="row-actions"><span id="socialAiMode" class="fineprint">AI sağlayıcısı kontrol ediliyor…</span><span class="grow"></span><button type="button" id="socialGenerate" class="btn primary">AI senaryosu üret ✦</button></div>
        <p class="fineprint">Demo modu açıksa gerçek AI isteği gönderilmez. Üretim, AI Studio'da seçili Gemini/Groq/OpenRouter ücretsiz modeli veya cihazdaki/Ollama yerel modeliyle yapılır.</p>
        <div class="social-automation-launch">
          <div class="social-two-col">
            <div><label class="field-label" for="socialAutomationDuration">Çok sahneli AI video süresi</label><select class="input" id="socialAutomationDuration"><option value="5">5 saniye · 3–5 çekim</option><option value="10" selected>10 saniye · 3–5 çekim</option><option value="15">15 saniye · 3–5 çekim</option></select></div>
            <div><label class="field-label" for="socialAutomationRatio">Tam otomasyon kadrajı</label><select class="input" id="socialAutomationRatio"><option value="720:1280" selected>Dikey 9:16</option><option value="1280:720">Yatay 16:9</option><option value="960:960">Kare 1:1</option></select></div>
          </div>
          <button type="button" id="socialRunAutomation" class="btn primary">Tam otomasyonu başlat ⚡</button>
          <p id="socialAutomationStatus" class="fineprint" role="status" aria-live="polite">Tek akış: ücretsiz/yerel AI senaryosu → çok sahneli AI video. Clips ayrı bir modüldür; burada otomatik başlatılmaz.</p>
        </div>
      </section>
      <section class="panel social-panel">
        <div class="section-head"><div><div class="eyebrow">02 / SCRIPT EDITOR</div><h2>Senaryo ve paylaşım metni</h2></div><span class="pill" id="socialDraftBadge">Yeni taslak</span></div>
        <label class="field-label" for="socialDraftTitle">Başlık</label><input class="input" id="socialDraftTitle" maxlength="100" placeholder="Video başlığı">
        <label class="field-label" for="socialHook">İlk 2-3 saniye · Hook</label><textarea class="input" id="socialHook" rows="2" maxlength="300" placeholder="İzleyiciyi videoda tutacak açılış cümlesi"></textarea>
        <label class="field-label" for="socialVoiceover">Seslendirme metni</label><textarea class="input" id="socialVoiceover" rows="6" maxlength="6000" placeholder="AI senaryosu burada görünecek. Dilersen düzenle."></textarea>
        <label class="field-label" for="socialScenes">Sahne planı / görsel yönergeler</label><textarea class="input" id="socialScenes" rows="4" maxlength="4000" placeholder="Sahne 1: Görsel...&#10;Sahne 2: Görsel..."></textarea>
        <label class="field-label" for="socialCaption">Açıklama</label><textarea class="input" id="socialCaption" rows="3" maxlength="1200" placeholder="Paylaşım açıklaması"></textarea>
        <label class="field-label" for="socialHashtags">Hashtagler</label><input class="input" id="socialHashtags" maxlength="500" placeholder="#oyun #yazılım #shorts">
        <label class="field-label" for="socialCta">Kapanış / çağrı</label><input class="input" id="socialCta" maxlength="240" placeholder="Örn. Devamı için takip et">
        <div class="row-actions"><button type="button" id="socialSaveDraft" class="btn secondary">Taslağı kaydet</button><button type="button" id="socialNewDraft" class="btn ghost small">Yeni taslak</button><span class="grow"></span><span class="fineprint">Her alan düzenlenebilir.</span></div>
      </section>
    </div>
    <section class="panel social-panel social-ai-video-panel" id="socialAIVideoPanel" data-creator-story>
      <div class="section-head"><div><div class="eyebrow">03 / TEXT-TO-VIDEO · IMAGE-TO-VIDEO</div><h2>Sıfırdan AI video üret</h2></div><span class="pill" id="socialRunwayBadge">AI motoru kontrol ediliyor</span></div>
      <p class="muted">Bir sahne tarif et; AI yeni bir video oluştursun. İstersen ilk kare olarak bir görsel de ver. Bu, mevcut videodan klip kesme işleminden ayrıdır.</p>
      <label class="field-label" for="socialRunwayKey">Runway Dev API anahtarı · yalnızca ebeveyn/vasinin yönettiği hesap</label>
      <div class="social-key-row"><input class="input" id="socialRunwayKey" type="password" maxlength="500" autocomplete="new-password" placeholder="Anahtar uygulamada gizli saklanır"><button type="button" id="socialRunwaySaveKey" class="btn secondary small">Güvenli kaydet</button><button type="button" id="socialRunwayDeleteKey" class="btn ghost small danger-text">Anahtarı sil</button></div>
      <p class="fineprint">Anahtar sohbet geçmişine veya Creator taslaklarına yazılmaz. Android'de Secure Storage kullanılır; web önizlemesinde yalnızca açık oturum belleğinde tutulur. Üretim krediyle ücretlendirilir; Runway Dev hesabında önceden var olan promosyon kredisi yoksa ücret doğar.</p>
      <label class="field-label" for="socialAIVideoPrompt">Videoda görmek istediğin sahne</label>
      <textarea class="input" id="socialAIVideoPrompt" rows="4" maxlength="1000" placeholder="Örn. Yağmurlu neon bir şehirde yürüyen sevimli robot, sinematik takip kamerası, gerçekçi ışıklar..."></textarea>
      <div class="social-two-col">
        <div><label class="field-label" for="socialAIVideoImage">İlk kare görseli (isteğe bağlı)</label><input class="input" id="socialAIVideoImage" type="file" accept="image/png,image/jpeg,image/webp"><small class="fineprint">Görselden videoya dönüştürür. PNG/JPG/WebP, en fazla 4 MB. Sadece kullanma hakkın olan ve paylaşımı güvenli bir görsel seç.</small></div>
        <div><label class="field-label" for="socialAIVideoRatio">Kadraj</label><select class="input" id="socialAIVideoRatio"><option value="720:1280" selected>Dikey 9:16 · Shorts / Reels</option><option value="1280:720">Yatay 16:9</option><option value="960:960">Kare 1:1</option></select><label class="field-label" for="socialAIVideoDuration">Süre</label><select class="input" id="socialAIVideoDuration"><option value="5" selected>5 saniye</option><option value="8">8 saniye</option><option value="10">10 saniye</option></select></div>
      </div>
      <div class="social-video-cost" id="socialAIVideoCost">Tahmini ücret: 5 saniye için $0.60 USD</div>
      <label class="social-check social-guardian-consent"><input type="checkbox" id="socialRunwayGuardianApproved"><span>Bu API hesabı ve faturalandırma ebeveynim/vasim tarafından yönetiliyor; bu üretime onay verdi. Referans görseli kullanma hakkım var.</span></label>
      <div class="row-actions"><button type="button" id="socialAIVideoGenerate" class="btn primary" disabled>AI ile videoyu oluştur ✦</button><button type="button" id="socialAIVideoCheck" class="btn ghost small" disabled>Üretim durumunu kontrol et</button><span class="grow"></span><span id="socialAIVideoStatus" class="fineprint" role="status">API bağlantısı kontrol ediliyor…</span></div>
      <div id="socialAIVideoResult" class="social-ai-video-result" aria-live="polite"></div>
    </section>
    <section class="panel social-panel social-video-panel" id="socialVideoProduction" data-creator-clips hidden>
      <div class="section-head"><div><div class="eyebrow">CLIPS / SOURCE VIDEO</div><h2>Clips</h2></div><span class="pill" id="socialOpenShortsBadge">OpenShorts kontrol ediliyor</span></div>
      <p class="muted">Sahibi olduğun veya işleme iznin bulunan bir kaynak video bağlantısı ekle. OpenShorts kısa klipleri ve altyazıları hazırlar.</p>
      <label class="field-label" for="socialSourceUrl">Kaynak video HTTPS bağlantısı</label><input class="input" id="socialSourceUrl" type="url" maxlength="2048" placeholder="https://youtu.be/... veya doğrudan .mp4 bağlantısı">
      <label class="openshorts-rights"><input type="checkbox" id="socialRightsConfirm"><span>Bu videonun sahibiyim veya videoyu işleme ve kliplerini yayımlama iznim var.</span></label>
      <div class="social-two-col"><div><label class="field-label" for="socialClipCount">Hedef klip sayısı</label><select class="input" id="socialClipCount"><option value="3" selected>3 klip</option><option value="5">5 klip</option><option value="8">8 klip</option></select></div><div class="social-tool-note"><strong>Otomatik adımlar</strong><span>AI an seçimi · 9:16 kadraj · altyazı · açılış kancası</span></div></div>
      <div class="row-actions"><button type="button" id="socialAutomationClip" class="btn primary" disabled>Eski otomasyon klip adımına devam</button><button type="button" id="socialProcessVideo" class="btn primary">Klipleri üret</button><button type="button" id="socialCheckJob" class="btn ghost small" disabled>İş durumunu kontrol et</button><button type="button" id="socialOpenTools" class="btn ghost small">OpenShorts bağlantı ayarları ↗</button><span class="grow"></span><span id="socialQuota" class="fineprint">Kota henüz kontrol edilmedi.</span></div>
      <div class="openshorts-status" id="socialVideoStatus" role="status" aria-live="polite">Önce AI senaryosunu kaydet, sonra kaynak videonu ekle.</div>
      <div id="socialClipResults" class="social-clip-grid" aria-live="polite"></div>
    </section>
    <section class="panel social-panel" id="socialPublishPanel" hidden>
      <div class="section-head"><div><div class="eyebrow">05 / REVIEW & PUBLISH</div><h2>Önizle, onayla, zamanla</h2></div><span class="pill">İnsan onayı gerekli</span></div>
      <p class="muted" id="socialPublishSummary">Yayınlamak için önce işlenmiş kliplerden birini seç.</p>
      <div class="field-label">Yayınlanacak platformlar</div>
      <div class="social-platforms">${SOCIAL_PLATFORMS.map((platform) => `<label class="social-check"><input type="checkbox" data-social-publish-platform="${platform.id}"><span>${platform.label}</span></label>`).join('')}</div>
      <label class="field-label" for="socialPublishTitle">Gönderi başlığı</label><input class="input" id="socialPublishTitle" maxlength="100" placeholder="Video başlığı">
      <label class="field-label" for="socialPublishDescription">Gönderi açıklaması</label><textarea class="input" id="socialPublishDescription" rows="3" maxlength="1200" placeholder="Açıklama ve hashtagler"></textarea>
      <label class="field-label" for="socialScheduleAt">Zamanlama (isteğe bağlı, yerel saat)</label><input class="input" id="socialScheduleAt" type="datetime-local">
      <p class="fineprint">Tarihi boş bırakırsan hemen yayınlama isteği gönderilir. Tarih seçersen OpenShorts'a zamanlama isteği iletilir. Hesap bağlantısı ve platform izinleri gerekir.</p>
      <p class="fineprint">Herkese açık paylaşım yapmadan önce özel bilgileri ve konumunu kaldır; platform yaş kurallarına uy ve gerekiyorsa ebeveyn/vasinin onayını al.</p>
      <div class="row-actions"><button type="button" id="socialPublishConfirm" class="btn primary" disabled>Onayla ve yayınla / zamanla</button><span class="grow"></span><span id="socialPublishStatus" class="fineprint" role="status"></span></div>
    </section>
    <section class="panel social-panel">
      <div class="section-head"><div><div class="eyebrow">CREATOR LIBRARY</div><h2>Taslaklar ve çıktılar</h2></div><span class="pill" id="socialQueueCount">0 taslak</span></div>
      <div id="socialQueueList" class="social-queue-list"><p class="fineprint">Henüz kayıtlı içerik yok.</p></div>
    </section>
    <div class="notice compact"><strong>Üretim ve maliyet:</strong> What If ve In My Town tam otomasyonunda Runway Multi-Shot Video 3–5 çekimli 5/10/15 saniyelik sesli sahneler üretir. 720p fiyatı saniyede 13 kredi: yaklaşık $0.65 / $1.30 / $1.95. Ses parçası, yazdığın seslendirme metninin otomatik okunması anlamına gelmez. Tek sahneli Gen-4.5 aracı ayrıca kullanılabilir ve ayrı ücret tarifesine sahiptir. Her ücretli üretim için ayrı onay gerekir. OpenShorts klip/altyazı işlemi de kota kullanabilir ve ayrıca onay ister. Herkese açık yayınlama otomatik yapılmaz.</div>
  `;
  const toolsScreen = $('tools');
  main.insertBefore(screen, toolsScreen || null);

  let drafts = [];
  let activeDraftId = '';
  let activeClipIndex = null;
  let busy = false;
  let runwayKey = '';
  let runwayAvailable = true;
  let automationTimer = null;
  let automationPolling = false;
  const AUTOMATION_MAX_RUNWAY_POLLS = 90;
  const AUTOMATION_MAX_OPENSHORTS_POLLS = 90;
  let activeCreatorMode = 'what_if';
  const creatorModeCopy = {
    what_if: { title: 'What If senaryosu', description: 'What If: seçtiğin şey belirlediğin aralıklarla iki katına çıkar.' },
    in_my_town: { title: 'In My Town senaryosu', description: 'In My Town: kurgusal kasabada geçen bağımsız hikâye. What If formatıyla karıştırılmaz.' },
    clips: { title: 'Clips', description: 'Clips: var olan ve işleme iznin bulunan videodan kısa klipler çıkar.' }
  };
  const getCreatorDraftData = () => {
    const creatorSettings = {
      whatIfThing: String($('creatorWhatIfThing').value || 'money').trim().slice(0, 100) || 'money',
      whatIfInterval: $('creatorWhatIfInterval').value || 'every hour',
      townName: String($('creatorTownName').value || 'My Town').trim().slice(0, 80) || 'My Town',
      townEvent: String($('creatorTownEvent').value || '').trim().slice(0, 400)
    };
    const topic = activeCreatorMode === 'what_if'
      ? 'What if ' + creatorSettings.whatIfThing + ' doubled ' + creatorSettings.whatIfInterval + '?'
      : activeCreatorMode === 'in_my_town'
        ? 'In My Town (' + creatorSettings.townName + '): ' + (creatorSettings.townEvent || 'AI-generated original town scenario')
        : 'Clips: source video processing';
    $('socialTopic').value = topic;
    return { creatorMode: activeCreatorMode, creatorSettings, topic };
  };
  const setCreatorMode = (mode) => {
    activeCreatorMode = normalizeCreatorMode(mode);
    const copy = creatorModeCopy[activeCreatorMode];
    document.querySelectorAll('[data-creator-mode]').forEach((button) => {
      const selected = button.dataset.creatorMode === activeCreatorMode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    $('creatorModeDescription').textContent = copy.description;
    $('creatorBriefTitle').textContent = copy.title;
    $('creatorWhatIfFields').hidden = activeCreatorMode !== 'what_if';
    $('creatorTownFields').hidden = activeCreatorMode !== 'in_my_town';
    document.querySelectorAll('[data-creator-story]').forEach((panel) => { panel.hidden = activeCreatorMode === 'clips'; });
    $('socialVideoProduction').hidden = activeCreatorMode !== 'clips';
    $('socialPublishPanel').hidden = true;
    $('socialGenerate').hidden = activeCreatorMode === 'clips';
    $('socialRunAutomation').hidden = activeCreatorMode === 'clips';
    $('socialGenerate').textContent = activeCreatorMode === 'in_my_town' ? 'In My Town senaryosu üret ✦' : 'What If senaryosu üret ✦';
    $('socialRunAutomation').textContent = activeCreatorMode === 'in_my_town' ? 'In My Town videosunu oluştur ⚡' : 'What If videosunu oluştur ⚡';
    if (activeCreatorMode !== 'clips') getCreatorDraftData();
  };
  document.querySelectorAll('[data-creator-mode]').forEach((button) => button.addEventListener('click', () => setCreatorMode(button.dataset.creatorMode)));

  const activeDraft = () => drafts.find((draft) => draft.id === activeDraftId) || null;
  const setStatus = (message, tone = 'info') => {
    const node = $('socialVideoStatus');
    node.textContent = String(message || ''); node.dataset.tone = tone;
  };
  const setAutomationStatus = (message) => {
    const node = $('socialAutomationStatus');
    if (node) node.textContent = String(message || '');
  };
  const renderAutomationState = () => {
    const activePipelineStages = ['runway_submitting', 'runway_polling', 'openshorts_submitting', 'openshorts_polling'];
    const draft = drafts.find((item) => activePipelineStages.includes(item.pipeline?.stage)) || activeDraft();
    const stage = draft?.pipeline?.stage || '';
    if (['awaiting_clip_approval', 'openshorts_submitting', 'openshorts_polling'].includes(stage) || (stage === 'review' && Boolean(draft?.jobId))) setCreatorMode('clips');
    const labels = {
      runway_submitting: 'Runway isteği gönderiliyor…',
      runway_polling: 'Çok sahneli AI video otomatik takip ediliyor…',
      awaiting_clip_approval: 'Video hazır. Hak ve kota onayından sonra klip/altyazı işleme başlayabilir.',
      openshorts_submitting: 'OpenShorts iş isteği gönderiliyor…',
      openshorts_polling: 'Klip ve altyazılar otomatik hazırlanıyor…',
      review: draft?.jobId ? 'Clips çıktıları hazır. Videoları açıp kontrol et.' : 'AI video hazır. What If / In My Town taslağını gözden geçir.',
      needs_attention: 'Otomasyon güvenli şekilde durdu; işlem sonucu kontrol edilmeli.',
      failed: 'Otomasyon adımı başarısız oldu.',
      cancelled: 'Otomasyon iptal edildi.'
    };
    if (stage) setAutomationStatus(labels[stage] || ('Otomasyon durumu: ' + stage));
    else if (draft) setAutomationStatus('Aktif taslak hazır. Tam otomasyon için yeni içerik başlat.');
    const active = drafts.some((item) => ['runway_submitting','runway_polling','openshorts_submitting','openshorts_polling'].includes(item.pipeline?.stage));
    $('socialRunAutomation').disabled = busy || active;
    $('socialAutomationClip').disabled = busy || stage !== 'awaiting_clip_approval';
  };
  const selectedBriefPlatforms = () => [...document.querySelectorAll('[data-social-brief-platform]:checked')].map((input) => input.dataset.socialBriefPlatform);
  const selectedPublishPlatforms = () => [...document.querySelectorAll('[data-social-publish-platform]:checked')].map((input) => input.dataset.socialPublishPlatform);
  const checkedPublishPlatforms = (values = []) => {
    document.querySelectorAll('[data-social-publish-platform]').forEach((input) => { input.checked = values.includes(input.dataset.socialPublishPlatform); });
  };
  const selectedDraftPlatforms = (values = []) => {
    document.querySelectorAll('[data-social-brief-platform]').forEach((input) => { input.checked = values.includes(input.dataset.socialBriefPlatform); });
  };
  const saveState = async () => {
    try {
      await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify({ version: 1, drafts }) });
      return true;
    } catch (error) {
      notify('Creator çıktıları kaydedilemedi: ' + (error.message || 'depolama hatası'));
      return false;
    }
  };
  const renderQueue = () => {
    $('socialQueueCount').textContent = `${drafts.length} kayıt`;
    if (!drafts.length) { $('socialQueueList').innerHTML = '<p class="fineprint">Henüz kayıtlı içerik yok. Önce bir AI senaryosu üret.</p>'; return; }
    $('socialQueueList').innerHTML = drafts.map((draft) => {
      const state = statusNames[draft.status] || draft.status || 'Taslak';
      const modeLabels = { what_if: 'What If', in_my_town: 'In My Town', clips: 'Clips' };
      const formatLabel = modeLabels[draft.creatorMode] || 'What If';
      return `<article class="social-queue-card ${draft.id === activeDraftId ? 'selected' : ''}"><div class="social-queue-card-main"><strong>${escapeHtml(draft.title)}</strong><small>${escapeHtml(platforms)} · ${escapeHtml(state)}</small><p>${escapeHtml(draft.hook || draft.topic || 'Henüz kısa açıklama yok')}</p></div><div class="social-queue-actions"><button type="button" class="btn secondary small" data-social-select="${escapeHtml(draft.id)}">Aç</button><button type="button" class="btn ghost small danger-text" data-social-delete="${escapeHtml(draft.id)}">Sil</button></div></article>`;
    }).join('');
  };
  const renderAiMode = () => {
    $('socialAiMode').textContent = `Seçili: ${getAiMode()}. Senaryo için ücretsiz/yerel model kullanılır.`;
  };
  const renderRunwayState = () => {
    $('socialRunwayBadge').textContent = runwayAvailable ? (runwayKey ? 'Gen-4.5 hazır · ücretli' : 'Runway motoru hazır · anahtar gerekli') : 'Runway servisi kapalı';
    $('socialRunwayBadge').className = 'pill ' + (runwayAvailable ? 'live' : '');
    const automationBusy = drafts.some((item) => ['runway_submitting','runway_polling','openshorts_submitting','openshorts_polling'].includes(item.pipeline?.stage));
    $('socialAIVideoGenerate').disabled = !runwayAvailable || !runwayKey || busy || automationBusy;
    $('socialAIVideoCheck').disabled = !activeDraft()?.aiVideo?.taskId || busy;
    $('socialRunwaySaveKey').disabled = !runwayAvailable;
    $('socialRunwayDeleteKey').disabled = !runwayKey || busy;
  };
  const renderGeneratedVideo = (video) => {
    const out = $('socialAIVideoResult');
    if (!video) { out.innerHTML = ''; return; }
    const status = String(video.status || 'UNKNOWN').toUpperCase();
    if (status !== 'SUCCEEDED' || !video.videoUrl) {
      out.innerHTML = `<p class="openshorts-status" data-tone="${status === 'FAILED' ? 'error' : 'info'}">AI video: ${escapeHtml(status)}${video.failure ? ` · ${escapeHtml(video.failure)}` : ''}</p>`;
      return;
    }
    let safeUrl = '';
    try { const url = new URL(video.videoUrl); if (url.protocol === 'https:' && /\.mp4(?:$|\?)/i.test(url.href)) safeUrl = url.href; } catch {}
    if (!safeUrl) { out.textContent = 'Runway video bağlantısı geçerli bir HTTPS MP4 bağlantısı değil.'; return; }
    out.innerHTML = `<article class="social-ai-video-card"><video controls playsinline preload="metadata" src="${escapeHtml(safeUrl)}"></video><div class="social-ai-video-actions"><a class="btn secondary small" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">Videoyu indir / aç ↗</a><button type="button" class="btn primary small" data-social-use-ai-video>OpenShorts Clips akışına aktar</button></div><p class="fineprint">Runway video bağlantıları geçicidir (yaklaşık 24–48 saat). Videoyu cihazına indir. Clips adımında ayrıca hak onayı ve kota kontrolü gerekir.</p></article>`;
  };
  const fillEditor = (draft) => {
    if (draft) {
      const settings = draft.creatorSettings || {};
      if (settings.whatIfThing) $('creatorWhatIfThing').value = settings.whatIfThing;
      if (settings.whatIfInterval) $('creatorWhatIfInterval').value = settings.whatIfInterval;
      if (settings.townName) $('creatorTownName').value = settings.townName;
      if (settings.townEvent) $('creatorTownEvent').value = settings.townEvent;
      setCreatorMode(draft.creatorMode || 'what_if');
      $('socialTopic').value = draft.topic || $('socialTopic').value;
    }
    $('socialDraftTitle').value = draft?.title || '';
    $('socialHook').value = draft?.hook || '';
    $('socialVoiceover').value = draft?.voiceover || '';
    $('socialScenes').value = (draft?.scenes || []).map((scene, index) => `${scene.time || `Sahne ${index + 1}`} · ${scene.visual || ''}${scene.narration ? `\nSes: ${scene.narration}` : ''}`).join('\n\n');
    $('socialCaption').value = draft?.caption || '';
    $('socialHashtags').value = (draft?.hashtags || []).join(' ');
    $('socialCta').value = draft?.cta || '';
    selectedDraftPlatforms(draft?.platforms || selectedBriefPlatforms());
    $('socialDraftBadge').textContent = draft ? statusNames[draft.status] || 'Kayıtlı taslak' : 'Yeni taslak';
    $('socialSourceUrl').value = draft?.sourceUrl || '';
    $('socialAIVideoPrompt').value = draft?.aiVideo?.promptText || '';
    $('socialCheckJob').disabled = !draft?.jobId || busy;
    $('socialAIVideoCheck').disabled = !draft?.aiVideo?.taskId || busy;
    renderGeneratedVideo(draft?.aiVideo || null);
    renderClips(draft?.clips || []);
    renderQueue();
    renderAutomationState();
  };
  const updateEditorRecord = () => {
    let draft = activeDraft();
    const now = new Date().toISOString();
    if (!draft) {
      draft = { id: makeId(), createdAt: now, status: 'script_ready', clips: [], aiVideo: null, pipeline: null, publishRequests: [], jobId: '', sourceUrl: '' };
      drafts.unshift(draft); activeDraftId = draft.id;
    }
    draft.title = $('socialDraftTitle').value.trim().slice(0, 100) || 'Yeni kısa video';
    const creatorData = getCreatorDraftData();
    draft.topic = creatorData.topic;
    draft.creatorMode = creatorData.creatorMode;
    draft.creatorSettings = creatorData.creatorSettings;
    draft.hook = $('socialHook').value.trim().slice(0, 300);
    draft.voiceover = $('socialVoiceover').value.trim().slice(0, 6000);
    draft.scenes = $('socialScenes').value.split(/\n\s*\n/).filter(Boolean).slice(0, 10).map((line, index) => ({ time: `Sahne ${index + 1}`, visual: line.slice(0, 500), narration: '' }));
    draft.caption = $('socialCaption').value.trim().slice(0, 1200);
    draft.hashtags = $('socialHashtags').value.split(/\s+/).filter((tag) => tag.startsWith('#')).slice(0, 15);
    draft.cta = $('socialCta').value.trim().slice(0, 240);
    draft.platforms = selectedBriefPlatforms();
    draft.updatedAt = now;
    return draft;
  };
  const renderClips = (clips) => {
    const normalized = normalizeSocialClips(clips);
    if (!normalized.length) { $('socialClipResults').innerHTML = ''; return; }
    $('socialClipResults').innerHTML = normalized.map((clip) => {
      let link = '';
      try { const url = new URL(clip.videoUrl); if (url.protocol === 'https:') link = `<a class="btn ghost small" href="${escapeHtml(url.toString())}" target="_blank" rel="noopener noreferrer">Videoyu aç ↗</a>`; } catch {}
      return `<article class="social-clip-card"><span class="social-clip-number">KLİP ${clip.index + 1}</span><strong>${escapeHtml(clip.title)}</strong><small>${clip.duration == null ? 'Süre bilinmiyor' : `${clip.duration} sn`}</small><div class="row-actions">${link}</div></article>`;
    }).join('');
  };
  const openPublisher = (index) => {
    const draft = activeDraft();
    if (!draft || !draft.jobId || !draft.clips[index]) return;
    activeClipIndex = index;
    $('socialPublishSummary').textContent = `${draft.title} · Klip ${index + 1}: ${draft.clips[index].title}`;
    $('socialPublishTitle').value = draft.title;
    $('socialPublishDescription').value = [draft.caption, draft.hashtags.join(' '), draft.cta].filter(Boolean).join('\n\n');
    checkedPublishPlatforms(draft.platforms);
    $('socialPublishConfirm').disabled = !openShorts.available('publish_clip') || busy;
    $('socialPublishStatus').textContent = openShorts.available('publish_clip') ? 'Platform bağlantılarını OpenShorts hesabında tamamla.' : 'Bu OpenShorts bağlantısında publish_clip aracı görünmüyor.';
    $('socialPublishPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const scheduleAutomationPoll = (draftId, delay = 10000) => {
    if (automationTimer) clearTimeout(automationTimer);
    automationTimer = null;
    if (document.hidden) return;
    automationTimer = setTimeout(() => { pollAutomation(draftId); }, Math.max(1000, delay));
  };

  const pollAutomation = async (draftId) => {
    const draft = drafts.find((item) => item.id === draftId);
    if (!draft || !draft.pipeline || !isSocialAutomationPolling(draft.pipeline.stage)) return;
    if (document.hidden) return;
    if (busy || automationPolling) {
      scheduleAutomationPoll(draftId, 4000);
      return;
    }

    automationPolling = true;
    busy = true;
    const pipeline = draft.pipeline;
    try {
      if (pipeline.stage === 'runway_polling') {
        if (!draft.aiVideo || !draft.aiVideo.taskId) throw new Error('Runway görev kimliği kayıtlı değil.');
        if (pipeline.runwayPollCount >= AUTOMATION_MAX_RUNWAY_POLLS) {
          pipeline.stage = 'needs_attention';
          pipeline.lastError = 'Runway görevi otomatik kontrol sınırına ulaştı. Tekrar üretim başlatılmadı.';
        } else {
          pipeline.runwayPollCount += 1;
          const task = await getRunwayVideoTask({ apiKey: runwayKey, taskId: draft.aiVideo.taskId });
          draft.aiVideo.status = task.status;
          draft.aiVideo.videoUrl = task.videoUrl || '';
          draft.aiVideo.failure = task.failure || '';
          if (task.costCredits != null) draft.aiVideo.actualCostCredits = task.costCredits;

          if (task.status === 'SUCCEEDED' && task.videoUrl) {
            draft.sourceUrl = task.videoUrl;
            draft.status = 'ai_video_ready';
            pipeline.stage = 'review';
            pipeline.lastError = '';
            activeDraftId = draft.id;
            fillEditor(draft);
            $('socialSourceUrl').value = task.videoUrl;
          } else if (['FAILED', 'CANCELED'].includes(task.status)) {
            draft.status = 'failed';
            pipeline.stage = 'failed';
            pipeline.lastError = task.failure || 'Runway video görevi başarısız oldu.';
          }
        }
      } else if (pipeline.stage === 'openshorts_polling') {
        if (!draft.jobId) throw new Error('OpenShorts iş kimliği kayıtlı değil.');
        if (pipeline.openshortsPollCount >= AUTOMATION_MAX_OPENSHORTS_POLLS) {
          pipeline.stage = 'needs_attention';
          pipeline.lastError = 'OpenShorts görevi otomatik kontrol sınırına ulaştı. Yeni iş açılmadı.';
        } else {
          pipeline.openshortsPollCount += 1;
          const status = await openShorts.call('get_job_status', { job_id: draft.jobId });
          const state = String(status?.status || status?.state || 'unknown').toLowerCase();
          if (['completed', 'complete', 'succeeded', 'success'].includes(state)) {
            const listed = await openShorts.call('list_clips', { job_id: draft.jobId });
            draft.clips = normalizeSocialClips(listed?.clips || status?.clips || listed);
            draft.status = draft.clips.length ? 'review' : 'failed';
            pipeline.stage = draft.clips.length ? 'review' : 'needs_attention';
            pipeline.lastError = draft.clips.length ? '' : 'OpenShorts tamamlandı ancak klip listesi boş döndü.';
            if (draft.clips.length) {
              activeDraftId = draft.id;
              fillEditor(draft);
            }
          } else if (['failed', 'canceled', 'cancelled', 'error'].includes(state)) {
            draft.status = 'failed';
            pipeline.stage = 'failed';
            pipeline.lastError = Array.isArray(status?.recent_logs)
              ? status.recent_logs.slice(-3).join(' · ').slice(0, 400)
              : 'OpenShorts video işleme başarısız oldu.';
          }
        }
      }

      pipeline.pollErrors = 0;
      pipeline.lastPolledAt = new Date().toISOString();
      pipeline.updatedAt = new Date().toISOString();
      await saveState();
      renderGeneratedVideo(draft.aiVideo || null);
      renderClips(draft.clips || []);
      renderQueue();
      renderAutomationState();

      if (pipeline.stage === 'awaiting_clip_approval') {
        setStatus('AI video hazır. OpenShorts klip ve altyazı adımı için ayrıca hak/kota onayı gerekiyor.', 'success');
      } else if (pipeline.stage === 'review' && draft.jobId) {
        setAutomationStatus('Clips işlemi tamamlandı. Videolar hazır; bunlar yalnızca Clips modülünün çıktılarıdır.');
        setStatus('Clips videoları hazır. Çıktıları açıp kontrol et.', 'success');
      } else if (pipeline.stage === 'review') {
        setAutomationStatus('What If / In My Town video üretimi tamamlandı. Clips ayrı bir modüldür ve kendiliğinden başlatılmaz.');
        setStatus('AI video hazır. Senaryonu ve videonu gözden geçir.', 'success');
      } else if (pipeline.stage === 'needs_attention') {
        setAutomationStatus('Otomasyon durdu: ' + (pipeline.lastError || 'Sonuç doğrulanamadı.'));
      } else if (pipeline.stage === 'failed') {
        setAutomationStatus('Otomasyon başarısız oldu: ' + (pipeline.lastError || 'Sağlayıcı hata döndürdü.'));
      }
    } catch (error) {
      pipeline.pollErrors = Math.min(5, (pipeline.pollErrors || 0) + 1);
      pipeline.lastError = String(error && error.message || 'Otomatik kontrol başarısız.').slice(0, 400);
      pipeline.updatedAt = new Date().toISOString();
      if (pipeline.pollErrors >= 4) pipeline.stage = 'needs_attention';
      await saveState();
      renderQueue();
      renderAutomationState();
      if (pipeline.stage === 'needs_attention') {
        setAutomationStatus('Otomasyon güvenli şekilde durdu: ' + pipeline.lastError + ' Yeni ücretli iş otomatik başlatılmadı.');
      } else {
        setAutomationStatus('Geçici bağlantı sorunu. Otomatik tekrar kontrol edilecek: ' + pipeline.lastError);
      }
    } finally {
      busy = false;
      automationPolling = false;
      renderRunwayState();
      renderAutomationState();
      if (isSocialAutomationPolling(pipeline.stage) && !document.hidden) {
        const count = pipeline.stage === 'runway_polling' ? pipeline.runwayPollCount : pipeline.openshortsPollCount;
        scheduleAutomationPoll(draftId, getSocialAutomationPollDelay(pipeline.stage, count));
      }
    }
  };

  const continueAutomationToClips = async () => {
    const draft = activeDraft();
    if (busy || !draft || !draft.pipeline || draft.pipeline.stage !== 'awaiting_clip_approval') return;
    try {
      if (!$('socialRightsConfirm').checked) throw new Error('Önce bu videoyu işleme ve paylaşma hakkına sahip olduğunu doğrula.');
      if (!openShorts.available('process_video')) throw new Error('OpenShorts bağlı değil. Önce bağlantı ayarlarından servisi kur.');
      const source = validateOpenShortsSourceUrl(draft.sourceUrl || (draft.aiVideo && draft.aiVideo.videoUrl) || '');
      busy = true;
      setAutomationStatus('OpenShorts kalan dakika kotası kontrol ediliyor…');
      const quota = await openShorts.call('get_quota', {});
      const minutes = quota && quota.minutes;
      const remaining = minutes && typeof minutes === 'object'
        ? Number(minutes.remaining ?? minutes.left)
        : Number(minutes);
      if (!Number.isFinite(remaining) || remaining <= 0) {
        throw new Error('Kullanılabilir OpenShorts dakikası doğrulanamadı veya kota tükenmiş. İş başlatılmadı.');
      }
      $('socialQuota').textContent = 'Kalan kota: ' + remaining + ' dakika';
      const approved = confirm([
        'OpenShorts video işleme ve altyazı adımı başlatılacak.',
        'Kalan hesap kotası: ' + remaining + ' dakika. Bu işlem kotadan dakika kullanabilir; gerçek kullanım servis tarafından belirlenir.',
        'Devam etmek için onaylıyor musun?'
      ].join('\n\n'));
      if (!approved) {
        setAutomationStatus('Klip/altyazı adımı başlatılmadı. AI video taslağı hazır kaldı.');
        return;
      }

      draft.pipeline.stage = 'openshorts_submitting';
      draft.pipeline.updatedAt = new Date().toISOString();
      draft.sourceUrl = source;
      if (!(await saveState())) throw new Error('Kuyruk kaydı başarısız; OpenShorts isteği gönderilmedi.');
      renderAutomationState();

      let result;
      try {
        result = await openShorts.call('process_video', {
          source_url: source,
          confirm_rights: true,
          output_format: 'vertical',
          layouts: ['auto'],
          target_clips: Number($('socialClipCount').value) || 3,
          captions: true,
          auto_hook: true
        });
      } catch (error) {
        draft.pipeline.stage = 'needs_attention';
        draft.pipeline.lastError = String(error && error.message || 'OpenShorts gönderim sonucu belirsiz.').slice(0, 400);
        draft.pipeline.updatedAt = new Date().toISOString();
        await saveState();
        throw new Error('OpenShorts isteğinin sonucu belirsiz olabilir. Çift iş/çift kota kullanımını önlemek için otomatik tekrar yapılmadı. ' + draft.pipeline.lastError);
      }

      const jobId = String(result && (result.job_id || result.id) || '').trim();
      if (!jobId) {
        draft.pipeline.stage = 'needs_attention';
        draft.pipeline.lastError = 'OpenShorts yanıtında iş kimliği yok; olası iş tekrar gönderilmedi.';
        await saveState();
        throw new Error(draft.pipeline.lastError);
      }

      draft.jobId = jobId;
      draft.clips = [];
      draft.status = 'processing';
      draft.pipeline.stage = 'openshorts_polling';
      draft.pipeline.openshortsPollCount = 0;
      draft.pipeline.pollErrors = 0;
      draft.pipeline.updatedAt = new Date().toISOString();
      if (!(await saveState())) {
        draft.pipeline.stage = 'needs_attention';
        draft.pipeline.lastError = 'İş kimliği kuyrukta saklanamadı. Çift iş oluşturmamak için tekrar başlatılmadı.';
        await saveState();
        throw new Error(draft.pipeline.lastError);
      }
      setStatus('OpenShorts işi kuyruğa alındı. Durum ve klipler otomatik takip edilecek.', 'success');
      setAutomationStatus('Klip/altyazı üretimi başladı. AI Studio açıkken otomatik kontrol edilecek.');
      renderQueue();
      scheduleAutomationPoll(draft.id, 12000);
    } catch (error) {
      if (draft.pipeline && draft.pipeline.stage === 'openshorts_submitting') {
        draft.pipeline.stage = 'needs_attention';
        draft.pipeline.lastError = String(error && error.message || 'OpenShorts gönderimi güvenli şekilde durduruldu.').slice(0, 400);
        await saveState();
      }
      setAutomationStatus(error && error.message || 'Klip/altyazı adımı başlatılamadı.');
    } finally {
      busy = false;
      renderAutomationState();
      renderRunwayState();
    }
  };

  $('socialAutomationClip').addEventListener('click', continueAutomationToClips);

  $('socialRunAutomation').addEventListener('click', async () => {
    if (busy) return;
    try {
      if (drafts.some((item) => ['runway_submitting', 'runway_polling', 'openshorts_submitting', 'openshorts_polling'].includes(item.pipeline && item.pipeline.stage))) {
        throw new Error('Önce mevcut tam otomasyon işinin bitmesini veya durumunun netleşmesini bekle.');
      }
      if (!runwayAvailable || !runwayKey) {
        throw new Error('Tam otomasyon için Runway anahtarı gerekir. Anahtarın ebeveyn/vasinin yönettiği güvenli hesapta bulunmalı.');
      }
      if (!$('socialRunwayGuardianApproved').checked) {
        throw new Error('Ücretli video üretimi için ebeveyn/vasinin hesap yönetimi ve onayı gerekir.');
      }
      const creatorData = getCreatorDraftData();
      const platforms = selectedBriefPlatforms();
      const prompt = buildCreatorPrompt({
        ...creatorData,
        tone: $('socialTone').value,
        language: $('socialLanguage').value,
        duration: $('socialDuration').value,
        audience: $('socialAudience').value
      });

      busy = true;
      $('socialRunAutomation').disabled = true;
      setAutomationStatus('1/4 · Ücretsiz/yerel AI ile senaryo hazırlanıyor…');
      const raw = await generateText(prompt);
      const generated = normalizeSocialDraft(raw, creatorData.topic);
      const now = new Date().toISOString();
      const draft = {
        id: makeId(),
        ...generated,
        topic: creatorData.topic,
        creatorMode: creatorData.creatorMode,
        creatorSettings: creatorData.creatorSettings,
        platforms,
        status: 'script_ready',
        sourceUrl: '',
        jobId: '',
        clips: [],
        publishRequests: [],
        pipeline: null,
        createdAt: now,
        updatedAt: now
      };
      drafts.unshift(draft);
      activeDraftId = draft.id;
      fillEditor(draft);
      if (!(await saveState())) throw new Error('Senaryo kuyruğa kaydedilemedi; ücretli video isteği gönderilmedi.');

      const storyPrompt = buildSocialMultiShotPrompt(draft);
      const duration = Number($('socialAutomationDuration').value);
      const ratio = $('socialAutomationRatio').value;
      const estimate = estimateRunwayMultiShotCost(duration, ratio);
      const approved = confirm([
        'AI Studio tam otomasyon · Runway Multi-Shot Video',
        'Senaryo: ' + draft.title,
        'Süre: ' + duration + ' saniye · 3–5 sahne',
        'Kadraj: ' + ratio,
        'Tahmini üretim: ' + estimate.credits + ' kredi · yaklaşık $' + estimate.usd.toFixed(2) + ' USD',
        'Bu üretim ücretsiz değildir. Hesap ve faturalandırma ebeveyn/vasinin kontrolündeyse ve üretime açıkça onay verdiyse devam et.',
        'Kabul edersen video üretilecek; klip işleme aşaması için daha sonra ayrı kota onayı istenecek. Yayınlama otomatik yapılmayacak.'
      ].join('\n\n'));
      if (!approved) {
        setAutomationStatus('Senaryo kaydedildi. Ücretli video üretimi onaylanmadı; hiçbir video API isteği gönderilmedi.');
        return;
      }

      draft.pipeline = {
        mode: 'full',
        stage: 'runway_submitting',
        storyPrompt,
        duration,
        ratio,
        estimatedCostUsd: estimate.usd,
        runwayPollCount: 0,
        openshortsPollCount: 0,
        pollErrors: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: ''
      };
      draft.aiVideo = {
        provider: 'runway',
        generator: 'multi_shot_video',
        model: 'multi_shot_video',
        status: 'SUBMITTING',
        taskId: '',
        promptText: storyPrompt,
        ratio,
        duration,
        audio: true,
        estimatedCostUsd: estimate.usd,
        videoUrl: '',
        createdAt: now
      };
      draft.status = 'ai_video_generating';
      if (!(await saveState())) throw new Error('Üretim öncesi güvenli görev kaydı yapılamadı; API çağrısı gönderilmedi.');

      renderQueue();
      let created;
      try {
        created = await createRunwayMultiShotVideo({ apiKey: runwayKey, storyPrompt, ratio, duration, audio: true });
      } catch (error) {
        draft.pipeline.stage = 'needs_attention';
        draft.pipeline.lastError = String(error && error.message || 'Runway gönderim sonucu belirsiz.').slice(0, 400);
        draft.pipeline.updatedAt = new Date().toISOString();
        await saveState();
        throw new Error('Runway isteğinin sonucu belirsiz olabilir. Çift kredi kullanımını önlemek için otomatik tekrar yapılmadı. ' + draft.pipeline.lastError);
      }

      draft.aiVideo.taskId = created.taskId;
      draft.aiVideo.status = created.status || 'PENDING';
      draft.aiVideo.model = created.model;
      draft.pipeline.stage = 'runway_polling';
      draft.pipeline.updatedAt = new Date().toISOString();
      if (!(await saveState())) {
        draft.pipeline.stage = 'needs_attention';
        draft.pipeline.lastError = 'Runway görev kimliği kaydedilemedi. Çift kredi kullanımını önlemek için tekrar üretilmeyecek.';
        await saveState();
        throw new Error(draft.pipeline.lastError);
      }
      setAutomationStatus('2/4 · Çok sahneli video üretildiği sürece görev otomatik takip edilecek.');
      scheduleAutomationPoll(draft.id, 10000);
      notify('Tam otomasyon başlatıldı. Video hazır olduğunda klip adımı açılacak.');
    } catch (error) {
      setAutomationStatus(error && error.message || 'Tam otomasyon başlatılamadı.');
    } finally {
      busy = false;
      renderAutomationState();
      renderRunwayState();
    }
  });

  $('socialGenerate').addEventListener('click', async () => {
    if (busy) return;
    try {
      const creatorData = getCreatorDraftData();
      const platforms = selectedBriefPlatforms();
      const prompt = buildCreatorPrompt({
        ...creatorData,
        tone: $('socialTone').value,
        language: $('socialLanguage').value,
        duration: $('socialDuration').value,
        audience: $('socialAudience').value
      });
      busy = true; $('socialGenerate').disabled = true;
      $('socialGenerate').textContent = 'Senaryo hazırlanıyor…';
      const raw = await generateText(prompt);
      const generated = normalizeSocialDraft(raw, creatorData.topic);
      const now = new Date().toISOString();
      const draft = {
        id: makeId(), ...generated, topic: creatorData.topic, creatorMode: creatorData.creatorMode, creatorSettings: creatorData.creatorSettings, platforms,
        status: 'script_ready', sourceUrl: '', jobId: '', clips: [], publishRequests: [],
        createdAt: now, updatedAt: now
      };
      drafts.unshift(draft); activeDraftId = draft.id;
      fillEditor(draft); await saveState();
      notify('Senaryo oluşturuldu. Metni ve sahne planını kontrol et.');
    } catch (error) { notify(error.message || 'AI senaryosu oluşturulamadı.'); }
    finally { busy = false; $('socialGenerate').disabled = false; $('socialGenerate').textContent = 'AI senaryosu üret ✦'; renderAiMode(); }
  });

  $('socialSaveDraft').addEventListener('click', async () => {
    const draft = updateEditorRecord(); await saveState(); fillEditor(draft); notify('Creator taslağı kaydedildi.');
  });
  $('socialNewDraft').addEventListener('click', () => {
    activeDraftId = ''; activeClipIndex = null;
    ['socialTopic', 'socialAudience', 'socialDraftTitle', 'socialHook', 'socialVoiceover', 'socialScenes', 'socialCaption', 'socialHashtags', 'socialCta', 'socialSourceUrl', 'socialAIVideoPrompt'].forEach((id) => { $(id).value = ''; });
    $('creatorWhatIfThing').value = 'money'; $('creatorWhatIfInterval').value = 'every hour'; $('creatorTownName').value = 'My Town'; $('creatorTownEvent').value = '';
    selectedDraftPlatforms(['tiktok', 'instagram', 'youtube']);
    setCreatorMode(activeCreatorMode);
    $('socialDraftBadge').textContent = 'Yeni taslak'; $('socialClipResults').innerHTML = ''; $('socialAIVideoImage').value = ''; $('socialAIVideoResult').innerHTML = ''; $('socialAIVideoStatus').textContent = 'Yeni taslak. Üretim için tekrar onay gerekir.';
    $('socialPublishSummary').textContent = 'Yayınlamak için önce işlenmiş kliplerden birini seç.';
    $('socialPublishConfirm').disabled = true; renderQueue(); setStatus('Yeni içerik taslağı hazır.');
  });

  const updateRunwayEstimate = () => {
    try {
      const estimate = estimateRunwayVideoCost(Number($('socialAIVideoDuration').value));
      $('socialAIVideoCost').textContent = `Runway Gen-4.5 · $0.12/sn · tahmini toplam $${estimate.usd.toFixed(2)} USD (${estimate.credits} kredi)`;
    } catch (error) { $('socialAIVideoCost').textContent = error.message; }
  };
  const readImageFile = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return reject(new Error('İlk kare yalnızca PNG, JPG veya WebP olabilir.'));
    if (file.size <= 0 || file.size > 4 * 1024 * 1024) return reject(new Error('İlk kare görseli en fazla 4 MB olabilir.'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Görsel okunamadı.'));
    reader.readAsDataURL(file);
  });

  $('socialRunwaySaveKey').addEventListener('click', async () => {
    const key = $('socialRunwayKey').value.trim();
    if (!key) { notify('Runway API anahtarını gir.'); return; }
    if (!runwayAvailable) { notify('Video üretim sunucusu henüz etkinleştirilmemiş.'); return; }
    try {
      await videoKeyStore.save(key);
      runwayKey = key;
      $('socialRunwayKey').value = '';
      $('socialAIVideoStatus').textContent = videoKeyStore.isNative ? 'API anahtarı Android Secure Storage alanına kaydedildi.' : 'Web önizlemesinde anahtar yalnızca bu sekme açıkken bellekte tutuluyor.';
      renderRunwayState();
      notify('Runway anahtarı kaydedildi.');
    } catch (error) { notify(error.message || 'Runway anahtarı kaydedilemedi.'); }
  });
  $('socialRunwayDeleteKey').addEventListener('click', async () => {
    if (!runwayKey || busy) return;
    if (!confirm('Runway API anahtarı bu cihazın güvenli deposundan silinsin mi?')) return;
    try {
      await videoKeyStore.remove(); runwayKey = '';
      $('socialRunwayKey').value = '';
      $('socialAIVideoStatus').textContent = 'Runway anahtarı bu cihazdan silindi.';
      renderRunwayState();
    } catch (error) { notify(error.message || 'Runway anahtarı silinemedi.'); }
  });
  $('socialAIVideoDuration').addEventListener('change', updateRunwayEstimate);

  $('socialAIVideoGenerate').addEventListener('click', async () => {
    if (busy) return;
    try {
      if (!runwayAvailable) throw new Error('Runway video servisi sunucu tarafında etkin değil.');
      if (!runwayKey) throw new Error('Önce ebeveyn/vasinin yönettiği Runway anahtarını güvenli depoya kaydet.');
      if (!$('socialRunwayGuardianApproved').checked) throw new Error('Ücretli üretim için ebeveyn/vasinin yönetim ve onay koşulu işaretlenmeli.');
      const promptText = $('socialAIVideoPrompt').value.trim();
      if (!promptText) throw new Error('AI videoda görmek istediğin sahneyi tarif et.');
      const duration = Number($('socialAIVideoDuration').value);
      const ratio = $('socialAIVideoRatio').value;
      const imageDataUrl = await readImageFile($('socialAIVideoImage').files?.[0]);
      const estimate = estimateRunwayVideoCost(duration);
      const mode = imageDataUrl ? 'Görselden videoya' : 'Metinden videoya';
      const ok = confirm(`${mode} · Runway Gen-4.5\n\nSüre: ${duration} saniye\nKadraj: ${ratio}\nTahmini ücret: $${estimate.usd.toFixed(2)} USD (${estimate.credits} kredi)\n\nBu ücretsiz değildir. Sağlayıcı son maliyeti belirler. Hesap ve faturalandırma ebeveyn/vasinin yönetimindeyse devam et. Devam edilsin mi?`);
      if (!ok) return;
      busy = true; $('socialAIVideoGenerate').disabled = true; $('socialAIVideoCheck').disabled = true;
      $('socialAIVideoStatus').textContent = 'Runway üretim işi gönderiliyor…';
      const created = await createRunwayVideo({ apiKey: runwayKey, promptText, ratio, duration, imageDataUrl });
      const draft = updateEditorRecord();
      draft.aiVideo = {
        provider: 'runway', model: created.model, taskId: created.taskId,
        status: created.status || 'PENDING', promptText, ratio, duration,
        estimatedCostUsd: estimate.usd, videoUrl: '', createdAt: new Date().toISOString()
      };
      draft.status = 'ai_video_generating'; draft.updatedAt = new Date().toISOString();
      await saveState(); fillEditor(draft);
      $('socialAIVideoStatus').textContent = `Üretim kuyruğa alındı · görev ${created.taskId}. Durumu kontrol etmek için en az 5 saniye bekle.`;
      notify('AI video üretim işi başlatıldı.');
    } catch (error) { $('socialAIVideoStatus').textContent = error.message || 'AI video üretilemedi.'; }
    finally { busy = false; renderRunwayState(); }
  });

  $('socialAIVideoCheck').addEventListener('click', async () => {
    const draft = activeDraft();
    if (busy || !draft?.aiVideo?.taskId) return;
    const lastPolledAt = Date.parse(draft.aiVideo.lastPolledAt || '');
    if (Number.isFinite(lastPolledAt) && Date.now() - lastPolledAt < 5000) {
      $('socialAIVideoStatus').textContent = 'Runway görev durumunu en fazla 5 saniyede bir kontrol et. Biraz bekle.';
      return;
    }
    busy = true; $('socialAIVideoCheck').disabled = true;
    try {
      draft.aiVideo.lastPolledAt = new Date().toISOString();
      await saveState();
      const result = await getRunwayVideoTask({ apiKey: runwayKey, taskId: draft.aiVideo.taskId });
      draft.aiVideo.status = result.status;
      draft.aiVideo.videoUrl = result.videoUrl || '';
      draft.aiVideo.failure = result.failure || '';
      if (result.costCredits != null) draft.aiVideo.actualCostCredits = result.costCredits;
      if (result.status === 'SUCCEEDED' && result.videoUrl) {
        draft.status = 'ai_video_ready';
        $('socialAIVideoStatus').textContent = 'AI video hazır. Önizle ve videoyu indir.';
      } else if (['FAILED', 'CANCELED'].includes(result.status)) {
        draft.status = 'failed';
        $('socialAIVideoStatus').textContent = `AI video üretimi ${result.status.toLowerCase()}: ${result.failure || 'sağlayıcı ayrıntı vermedi.'}`;
      } else {
        $('socialAIVideoStatus').textContent = `Runway durumu: ${result.status}. Yeniden kontrol etmeden önce en az 5 saniye bekle.`;
      }
      draft.updatedAt = new Date().toISOString(); await saveState(); fillEditor(draft);
    } catch (error) { $('socialAIVideoStatus').textContent = error.message || 'AI video durumu alınamadı.'; }
    finally { busy = false; renderRunwayState(); }
  });

  $('socialAIVideoResult').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-social-use-ai-video]');
    if (!button) return;
    const draft = activeDraft();
    if (!draft?.aiVideo?.videoUrl) return;
    $('socialSourceUrl').value = draft.aiVideo.videoUrl;
    draft.sourceUrl = draft.aiVideo.videoUrl; draft.updatedAt = new Date().toISOString();
    await saveState();
    setCreatorMode('clips');
    $('socialVideoProduction').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus('Üretilen AI video kaynak olarak eklendi. Hak onayını verip OpenShorts klip/altyazı adımını başlatabilirsin.', 'success');
  });

  $('socialProcessVideo').addEventListener('click', async () => {
    if (busy) return;
    try {
      const current = activeDraft();
      if (['awaiting_clip_approval', 'openshorts_submitting', 'openshorts_polling'].includes(current?.pipeline?.stage)) {
        throw new Error('Bu içerik tam otomasyon akışında. İkinci OpenShorts işi açmamak için otomatik devam düğmesini kullan.');
      }
      let draft = updateEditorRecord();
      const source = validateOpenShortsSourceUrl($('socialSourceUrl').value);
      if (!$('socialRightsConfirm').checked) throw new Error('Devam etmeden önce videonun sahibi olduğunu veya işleme iznin bulunduğunu onayla.');
      if (!openShorts.available('process_video')) throw new Error('OpenShorts bağlı değil. Önce bağlantı ayarlarından API anahtarını doğrula.');
      busy = true; $('socialProcessVideo').disabled = true; $('socialCheckJob').disabled = true;
      setStatus('Önce OpenShorts kotası kontrol ediliyor…');
      const quota = await openShorts.call('get_quota', {});
      const minutes = quota?.minutes;
      const remaining = minutes && typeof minutes === 'object' ? Number(minutes.remaining ?? minutes.left) : Number(minutes);
      if (!Number.isFinite(remaining)) throw new Error('OpenShorts kalan dakika kotasını doğrulayamadı. Maliyet belirsizken video işi başlatılmadı.');
      $('socialQuota').textContent = `Kalan kota: ${remaining} dakika`;
      if (remaining <= 0) throw new Error('OpenShorts dakika kotası tükenmiş görünüyor. Yeni iş başlatılmadı.');
      draft.sourceUrl = source;
      setStatus('Dikey klip işi OpenShorts kuyruğuna gönderiliyor. İşleme hesabının dakika kotasını kullanabilir…');
      const result = await openShorts.call('process_video', {
        source_url: source, confirm_rights: true, output_format: 'vertical', layouts: ['auto'],
        target_clips: Number($('socialClipCount').value) || 3, captions: true, auto_hook: true
      });
      const jobId = String(result?.job_id || result?.id || '').trim();
      if (!jobId) throw new Error(result?.error || 'OpenShorts yanıtında iş kimliği bulunamadı.');
      draft.jobId = jobId; draft.status = 'processing'; draft.clips = []; draft.updatedAt = new Date().toISOString();
      await saveState(); fillEditor(draft);
      setStatus(`Video işi oluşturuldu: ${jobId}. İşleme sürüyor; tamamlanınca durumu kontrol et.`, 'success');
    } catch (error) { setStatus(error.message || 'Video işi başlatılamadı.', 'error'); }
    finally { busy = false; $('socialProcessVideo').disabled = false; $('socialCheckJob').disabled = !activeDraft()?.jobId; }
  });

  $('socialCheckJob').addEventListener('click', async () => {
    const draft = activeDraft();
    if (busy || !draft?.jobId) return;
    if (draft.pipeline?.stage === 'openshorts_polling') {
      setAutomationStatus('OpenShorts otomatik takip ediliyor; yinelenen kontrol başlatılmadı.');
      scheduleAutomationPoll(draft.id, 1000);
      return;
    }
    busy = true; $('socialCheckJob').disabled = true;
    try {
      const status = await openShorts.call('get_job_status', { job_id: draft.jobId });
      const state = String(status?.status || 'unknown').toLowerCase();
      if (state === 'completed') {
        const listed = await openShorts.call('list_clips', { job_id: draft.jobId });
        draft.clips = normalizeSocialClips(listed?.clips || status?.clips || listed);
        draft.status = draft.clips.length ? 'review' : 'failed';
        setStatus(draft.clips.length ? `${draft.clips.length} klip hazır. Her klibi izle ve paylaşım metnini kontrol et.` : 'İş tamamlandı fakat klip listesi boş döndü.', draft.clips.length ? 'success' : 'warning');
      } else if (state === 'failed') {
        draft.status = 'failed';
        setStatus('Video işleme başarısız oldu. ' + (Array.isArray(status?.recent_logs) ? status.recent_logs.slice(-3).join(' · ') : ''), 'error');
      } else setStatus(`OpenShorts işi: ${state}. Bir süre sonra yeniden kontrol et.`);
      draft.updatedAt = new Date().toISOString(); await saveState(); fillEditor(draft);
    } catch (error) { setStatus(error.message || 'İş durumu alınamadı.', 'error'); }
    finally { busy = false; $('socialCheckJob').disabled = !activeDraft()?.jobId; }
  });

  $('socialClipResults').addEventListener('click', (event) => {
    const button = event.target.closest('[data-social-pick-clip]');
    if (button) openPublisher(Number(button.dataset.socialPickClip));
  });

  $('socialPublishConfirm').addEventListener('click', async () => {
    const draft = activeDraft();
    if (busy || !draft || activeClipIndex === null) return;
    try {
      if (!openShorts.available('publish_clip')) throw new Error('OpenShorts publish_clip aracı etkin değil. Bağlantıyı yeniden doğrula.');
      const args = buildSocialPublishArgs({
        jobId: draft.jobId, clipIndex: activeClipIndex, platforms: selectedPublishPlatforms(),
        title: $('socialPublishTitle').value,
        description: $('socialPublishDescription').value,
        scheduledLocal: $('socialScheduleAt').value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });
      const action = args.scheduled_date ? `Şu zaman için (${new Date(args.scheduled_date).toLocaleString()}) ${args.platforms.map(platformName).join(', ')} platformlarında zamanlama isteği gönderilecek.` : `${args.platforms.map(platformName).join(', ')} platformlarında yayınlama isteği hemen gönderilecek.`;
      if (!confirm(`${action}\n\n${draft.title}\n\nBu işlem bağlı sosyal hesaplarında herkese açık paylaşım oluşturabilir. Devam edilsin mi?`)) return;
      busy = true; $('socialPublishConfirm').disabled = true; $('socialPublishStatus').textContent = 'OpenShorts yayınlama isteğini iletiyor…';
      const result = await openShorts.call('publish_clip', args);
      const isScheduled = Boolean(args.scheduled_date);
      draft.publishRequests.push({
        at: new Date().toISOString(), platforms: args.platforms,
        schedule: args.scheduled_date || '', responseStatus: String(result?.status || result?.state || 'accepted').slice(0, 40),
        responseId: String(result?.post_id || result?.id || result?.job_id || '').slice(0, 160)
      });
      draft.status = isScheduled ? 'schedule_request_sent' : 'publish_request_sent';
      draft.updatedAt = new Date().toISOString(); await saveState(); renderQueue();
      $('socialPublishStatus').textContent = isScheduled ? 'Zamanlama isteği OpenShorts hesabına iletildi. Platformdaki planı ayrıca kontrol et.' : 'Yayınlama isteği OpenShorts hesabına iletildi. Gerçek gönderi durumunu platformda kontrol et.';
      notify(isScheduled ? 'Zamanlama isteği gönderildi.' : 'Yayınlama isteği gönderildi.');
    } catch (error) { $('socialPublishStatus').textContent = error.message || 'Yayınlama isteği başarısız.'; }
    finally { busy = false; $('socialPublishConfirm').disabled = activeClipIndex === null || !openShorts.available('publish_clip'); }
  });

  $('socialQueueList').addEventListener('click', async (event) => {
    const selectButton = event.target.closest('[data-social-select]');
    if (selectButton) {
      activeDraftId = selectButton.dataset.socialSelect;
      const draft = activeDraft();
      if (draft) {
        $('socialTopic').value = draft.topic || '';
        selectedBriefPlatforms(draft.platforms);
        fillEditor(draft);
        activeClipIndex = null;
        $('socialPublishSummary').textContent = 'Yayınlamak için işlenmiş kliplerden birini seç.';
        $('socialPublishConfirm').disabled = true;
      }
      return;
    }
    const deleteButton = event.target.closest('[data-social-delete]');
    if (deleteButton) {
      const id = deleteButton.dataset.socialDelete;
      if (!confirm('Bu içerik taslağı ve yerel kuyruk kaydı silinsin mi?')) return;
      drafts = drafts.filter((draft) => draft.id !== id);
      if (activeDraftId === id) { activeDraftId = ''; activeClipIndex = null; fillEditor(null); }
      await saveState(); renderQueue();
    }
  });

  $('socialOpenTools').addEventListener('click', () => go('tools'));
  navButton.addEventListener('click', () => go('social'));

  try {
    const stored = await Preferences.get({ key: STORAGE_KEY });
    if (stored.value) drafts = normalizeSocialQueue(JSON.parse(stored.value)?.drafts);
  } catch { drafts = []; }
  try { runwayKey = String(await videoKeyStore.get() || ''); } catch { runwayKey = ''; }

  // A persisted *_submitting stage may represent a provider request whose response was lost.
  // Never replay it automatically; the user must inspect the provider/account first.
  for (const item of drafts) {
    if (['runway_submitting', 'openshorts_submitting'].includes(item.pipeline?.stage)) {
      item.pipeline.stage = 'needs_attention';
      item.pipeline.lastError = 'Uygulama servis isteği sırasında kapandı. İş başlamış olabilir; çift ücret/kota kullanımını önlemek için otomatik tekrar yapılmadı.';
    }
  }
  if (drafts.some((item) => item.pipeline?.stage === 'needs_attention')) await saveState();

  $('socialAIVideoStatus').textContent = runwayKey
    ? (videoKeyStore.isNative ? 'Runway Gen-4.5 anahtarı Android Secure Storage alanında. Her üretim ayrıca maliyet onayı ister.' : 'Runway anahtarı bu web oturumunun belleğinde. Sekme kapanınca kaybolur; her üretim ayrıca maliyet onayı ister.')
    : 'Runway Gen-4.5 hazır. Ebeveyn/vasinin yönettiği API anahtarını güvenli şekilde ekle. Web önizlemesinde bağlantı CORS kurallarına bağlı olabilir.';
  setCreatorMode('what_if');
  updateRunwayEstimate();
  renderRunwayState();
  renderAiMode(); renderQueue();
  if (drafts.length) {
    activeDraftId = drafts[0].id;
    $('socialTopic').value = drafts[0].topic || '';
    fillEditor(drafts[0]);
  } else selectedDraftPlatforms(['tiktok', 'instagram', 'youtube']);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (automationTimer) clearTimeout(automationTimer);
      automationTimer = null;
      return;
    }
    const resumable = drafts.find((item) => isSocialAutomationPolling(item.pipeline?.stage));
    if (resumable) scheduleAutomationPoll(resumable.id, 1000);
  });
  const resumableAutomation = drafts.find((item) => isSocialAutomationPolling(item.pipeline?.stage));
  if (resumableAutomation) scheduleAutomationPoll(resumableAutomation.id, 1500);
  renderAutomationState();

  const available = ['process_video', 'get_job_status', 'list_clips', 'get_quota', 'publish_clip'].filter((name) => openShorts.available(name));
  $('socialOpenShortsBadge').textContent = available.includes('publish_clip') ? 'Klip + yayınlama hazır' : (available.length ? 'Klip üretimi hazır · yayınlama aracı yok' : 'Bağlı değil');
  $('socialOpenShortsBadge').className = 'pill ' + (available.length ? 'safe' : '');
}
