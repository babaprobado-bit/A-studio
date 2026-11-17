import { Preferences } from '@capacitor/preferences';
import { validateOpenShortsSourceUrl } from './openshorts-mcp.js';
import {
  SOCIAL_PLATFORMS, buildSocialPrompt, normalizeSocialDraft,
  normalizeSocialQueue, normalizeSocialClips, buildSocialPublishArgs
} from './social-studio-core.js';
import './social-studio.css';

const STORAGE_KEY = 'ai-studio-social-studio-v1';
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const makeId = () => globalThis.crypto?.randomUUID?.() || `social-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const platformName = (id) => SOCIAL_PLATFORMS.find((platform) => platform.id === id)?.label || id;
const statusNames = {
  script_ready: 'Senaryo hazır', processing: 'Video işleniyor', review: 'Kontrol bekliyor',
  publish_request_sent: 'Yayın isteği gönderildi', schedule_request_sent: 'Zamanlama isteği gönderildi',
  failed: 'İşlem başarısız'
};

export async function mountSocialStudio({ generateText, openShorts, go, notify = () => {}, getAiMode = () => 'AI sağlayıcısı' }) {
  if ($('social')) return;
  const main = document.querySelector('main');
  const nav = document.querySelector('.bottom-nav');
  if (!main || !nav) return;

  const navButton = document.createElement('button');
  navButton.type = 'button';
  navButton.className = 'nav-btn';
  navButton.dataset.tab = 'social';
  navButton.innerHTML = '<span aria-hidden="true">◈</span>Sosyal';
  const toolsTab = nav.querySelector('[data-tab="tools"]');
  nav.insertBefore(navButton, toolsTab || null);

  const homeGrid = document.querySelector('#home .quick-grid');
  if (homeGrid && !homeGrid.querySelector('[data-go="social"]')) {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'quick-card'; card.dataset.go = 'social';
    card.innerHTML = '<span class="quick-icon">◈</span><strong>Social Media Studio</strong><small>AI senaryo, Shorts, kuyruk ve zamanlama</small>';
    homeGrid.append(card);
  }

  const screen = document.createElement('section');
  screen.className = 'screen social-screen'; screen.id = 'social';
  screen.innerHTML = `
    <div class="page-title social-title"><div class="eyebrow">AI CONTENT WORKFLOW</div><h1>Social Media Studio</h1><p>Fikirden senaryoya, dikey videodan yayın kuyruğuna tek akış. İçeriği önce sen kontrol edersin.</p></div>
    <div class="social-flow-strip" aria-label="İçerik üretim aşamaları"><span>1 · Fikir</span><i>›</i><span>2 · AI senaryo</span><i>›</i><span>3 · Video</span><i>›</i><span>4 · Onay</span><i>›</i><span>5 · Yayın</span></div>
    <div class="social-top-grid">
      <section class="panel social-panel">
        <div class="section-head"><div><div class="eyebrow">01 / CONTENT BRIEF</div><h2>Video fikri</h2></div><span class="pill">AI destekli</span></div>
        <label class="field-label" for="socialTopic">Konu / ürün / hikâye</label>
        <textarea class="input" id="socialTopic" rows="3" maxlength="1200" placeholder="Örn. Bir oyunun geliştirme sürecinde yapılan komik hatalar..."></textarea>
        <div class="social-two-col">
          <div><label class="field-label" for="socialAudience">Hedef izleyici</label><input class="input" id="socialAudience" maxlength="180" placeholder="Örn. oyun meraklıları"></div>
          <div><label class="field-label" for="socialTone">Anlatım tarzı</label><select class="input" id="socialTone"><option value="energetic">Enerjik</option><option value="storytelling">Hikâye anlatımı</option><option value="educational">Eğitici</option><option value="funny">Mizahi</option><option value="calm">Sakin ve açıklayıcı</option></select></div>
        </div>
        <div class="social-two-col">
          <div><label class="field-label" for="socialDuration">Video süresi</label><select class="input" id="socialDuration"><option value="20">20 saniye</option><option value="30" selected>30 saniye</option><option value="45">45 saniye</option><option value="60">60 saniye</option><option value="90">90 saniye</option></select></div>
          <div><label class="field-label" for="socialLanguage">Dil</label><select class="input" id="socialLanguage"><option value="Turkish">Türkçe</option><option value="English">İngilizce</option><option value="Turkish and English">Türkçe + İngilizce</option></select></div>
        </div>
        <div class="field-label">Hedef platformlar</div>
        <div class="social-platforms" id="socialBriefPlatforms">${SOCIAL_PLATFORMS.map((platform) => `<label class="social-check"><input type="checkbox" data-social-brief-platform="${platform.id}" checked><span>${platform.label}</span></label>`).join('')}</div>
        <div class="row-actions"><span id="socialAiMode" class="fineprint">AI sağlayıcısı kontrol ediliyor…</span><span class="grow"></span><button type="button" id="socialGenerate" class="btn primary">AI senaryosu üret ✦</button></div>
        <p class="fineprint">Demo modu açıksa gerçek AI isteği gönderilmez. Üretim, AI Studio'da seçili Gemini/Groq/OpenRouter ücretsiz modeli veya cihazdaki/Ollama yerel modeliyle yapılır.</p>
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
    <section class="panel social-panel social-video-panel">
      <div class="section-head"><div><div class="eyebrow">03 / VIDEO PRODUCTION</div><h2>Dikey videoyu üret</h2></div><span class="pill" id="socialOpenShortsBadge">OpenShorts kontrol ediliyor</span></div>
      <p class="muted">Uzun videonu YouTube bağlantısıyla veya doğrudan video URL'siyle ver. OpenShorts kaynak videodaki iyi anları bulur, 9:16 klipler ve altyazılar oluşturur.</p>
      <label class="field-label" for="socialSourceUrl">Kaynak video HTTPS bağlantısı</label><input class="input" id="socialSourceUrl" type="url" maxlength="2048" placeholder="https://youtu.be/... veya doğrudan .mp4 bağlantısı">
      <label class="openshorts-rights"><input type="checkbox" id="socialRightsConfirm"><span>Bu videonun sahibiyim veya videoyu işleme ve kliplerini yayımlama iznim var.</span></label>
      <div class="social-two-col"><div><label class="field-label" for="socialClipCount">Hedef klip sayısı</label><select class="input" id="socialClipCount"><option value="3" selected>3 klip</option><option value="5">5 klip</option><option value="8">8 klip</option></select></div><div class="social-tool-note"><strong>Otomatik adımlar</strong><span>AI an seçimi · 9:16 kadraj · altyazı · açılış kancası</span></div></div>
      <div class="row-actions"><button type="button" id="socialProcessVideo" class="btn primary">Klipleri üret</button><button type="button" id="socialCheckJob" class="btn ghost small" disabled>İş durumunu kontrol et</button><button type="button" id="socialOpenTools" class="btn ghost small">OpenShorts bağlantı ayarları ↗</button><span class="grow"></span><span id="socialQuota" class="fineprint">Kota henüz kontrol edilmedi.</span></div>
      <div class="openshorts-status" id="socialVideoStatus" role="status" aria-live="polite">Önce AI senaryosunu kaydet, sonra kaynak videonu ekle.</div>
      <div id="socialClipResults" class="social-clip-grid" aria-live="polite"></div>
    </section>
    <section class="panel social-panel" id="socialPublishPanel">
      <div class="section-head"><div><div class="eyebrow">04 / REVIEW & PUBLISH</div><h2>Önizle, onayla, zamanla</h2></div><span class="pill">İnsan onayı gerekli</span></div>
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
      <div class="section-head"><div><div class="eyebrow">05 / CONTENT CALENDAR</div><h2>İçerik kuyruğu</h2></div><span class="pill" id="socialQueueCount">0 taslak</span></div>
      <div id="socialQueueList" class="social-queue-list"><p class="fineprint">Henüz kayıtlı içerik yok.</p></div>
    </section>
    <div class="notice compact"><strong>Üretim sınırı:</strong> Bu sürüm AI ile senaryo/sahne planı hazırlar ve verdiğin kaynak videodan Shorts/Reels klipleri çıkarır. Metinden sıfırdan AI oyunculu UGC video üretimi, OpenShorts'un ayrı AI Shorts servisine ve harici video/voice sağlayıcılarına bağlıdır; bu entegrasyonda o servis varmış gibi gösterilmez. Yayınlama isteği de platform sonucu doğrulanmadan “yayında” sayılmaz.</div>
  `;
  const toolsScreen = $('tools');
  main.insertBefore(screen, toolsScreen || null);

  let drafts = [];
  let activeDraftId = '';
  let activeClipIndex = null;
  let busy = false;

  const activeDraft = () => drafts.find((draft) => draft.id === activeDraftId) || null;
  const setStatus = (message, tone = 'info') => {
    const node = $('socialVideoStatus');
    node.textContent = String(message || ''); node.dataset.tone = tone;
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
    try { await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify({ version: 1, drafts }) }); }
    catch (error) { notify('Sosyal medya kuyruğu kaydedilemedi: ' + (error.message || 'depolama hatası')); }
  };
  const renderQueue = () => {
    $('socialQueueCount').textContent = `${drafts.length} kayıt`;
    if (!drafts.length) { $('socialQueueList').innerHTML = '<p class="fineprint">Henüz kayıtlı içerik yok. Önce bir AI senaryosu üret.</p>'; return; }
    $('socialQueueList').innerHTML = drafts.map((draft) => {
      const state = statusNames[draft.status] || draft.status || 'Taslak';
      const platforms = draft.platforms.map(platformName).join(' · ') || 'Platform seçilmedi';
      return `<article class="social-queue-card ${draft.id === activeDraftId ? 'selected' : ''}"><div class="social-queue-card-main"><strong>${escapeHtml(draft.title)}</strong><small>${escapeHtml(platforms)} · ${escapeHtml(state)}</small><p>${escapeHtml(draft.hook || draft.topic || 'Henüz kısa açıklama yok')}</p></div><div class="social-queue-actions"><button type="button" class="btn secondary small" data-social-select="${escapeHtml(draft.id)}">Aç</button><button type="button" class="btn ghost small danger-text" data-social-delete="${escapeHtml(draft.id)}">Sil</button></div></article>`;
    }).join('');
  };
  const renderAiMode = () => {
    $('socialAiMode').textContent = `Seçili: ${getAiMode()}. Demo kapalı ve ücretsiz/yerel model hazır olmalı.`;
  };
  const fillEditor = (draft) => {
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
    $('socialCheckJob').disabled = !draft?.jobId || busy;
    renderClips(draft?.clips || []);
    renderQueue();
  };
  const updateEditorRecord = () => {
    let draft = activeDraft();
    const now = new Date().toISOString();
    if (!draft) {
      draft = { id: makeId(), createdAt: now, status: 'script_ready', clips: [], publishRequests: [], jobId: '', sourceUrl: '' };
      drafts.unshift(draft); activeDraftId = draft.id;
    }
    draft.title = $('socialDraftTitle').value.trim().slice(0, 100) || 'Yeni kısa video';
    draft.topic = $('socialTopic').value.trim().slice(0, 1200);
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
      return `<article class="social-clip-card"><span class="social-clip-number">KLİP ${clip.index + 1}</span><strong>${escapeHtml(clip.title)}</strong><small>${clip.duration == null ? 'Süre bilinmiyor' : `${clip.duration} sn`}</small><div class="row-actions">${link}<button type="button" class="btn secondary small" data-social-pick-clip="${clip.index}">Yayın için seç</button></div></article>`;
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

  $('socialGenerate').addEventListener('click', async () => {
    if (busy) return;
    try {
      const platforms = selectedBriefPlatforms();
      const prompt = buildSocialPrompt({
        topic: $('socialTopic').value, platforms,
        tone: $('socialTone').value, language: $('socialLanguage').value,
        duration: $('socialDuration').value, audience: $('socialAudience').value
      });
      busy = true; $('socialGenerate').disabled = true;
      $('socialGenerate').textContent = 'Senaryo hazırlanıyor…';
      const raw = await generateText(prompt);
      const generated = normalizeSocialDraft(raw, $('socialTopic').value);
      const now = new Date().toISOString();
      const draft = {
        id: makeId(), ...generated, topic: $('socialTopic').value.trim(), platforms,
        status: 'script_ready', sourceUrl: '', jobId: '', clips: [], publishRequests: [],
        createdAt: now, updatedAt: now
      };
      drafts.unshift(draft); activeDraftId = draft.id;
      fillEditor(draft); await saveState();
      notify('AI senaryosu oluşturuldu. Yayınlamadan önce metni ve sahne planını kontrol et.');
    } catch (error) { notify(error.message || 'AI senaryosu oluşturulamadı.'); }
    finally { busy = false; $('socialGenerate').disabled = false; $('socialGenerate').textContent = 'AI senaryosu üret ✦'; renderAiMode(); }
  });

  $('socialSaveDraft').addEventListener('click', async () => {
    const draft = updateEditorRecord(); await saveState(); fillEditor(draft); notify('Sosyal medya taslağı kaydedildi.');
  });
  $('socialNewDraft').addEventListener('click', () => {
    activeDraftId = ''; activeClipIndex = null;
    ['socialTopic', 'socialAudience', 'socialDraftTitle', 'socialHook', 'socialVoiceover', 'socialScenes', 'socialCaption', 'socialHashtags', 'socialCta', 'socialSourceUrl'].forEach((id) => { $(id).value = ''; });
    selectedDraftPlatforms(['tiktok', 'instagram', 'youtube']);
    $('socialDraftBadge').textContent = 'Yeni taslak'; $('socialClipResults').innerHTML = '';
    $('socialPublishSummary').textContent = 'Yayınlamak için önce işlenmiş kliplerden birini seç.';
    $('socialPublishConfirm').disabled = true; renderQueue(); setStatus('Yeni içerik taslağı hazır.');
  });

  $('socialProcessVideo').addEventListener('click', async () => {
    if (busy) return;
    try {
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
  renderAiMode(); renderQueue();
  if (drafts.length) {
    activeDraftId = drafts[0].id;
    $('socialTopic').value = drafts[0].topic || '';
    fillEditor(drafts[0]);
  } else selectedDraftPlatforms(['tiktok', 'instagram', 'youtube']);
  const available = ['process_video', 'get_job_status', 'list_clips', 'get_quota', 'publish_clip'].filter((name) => openShorts.available(name));
  $('socialOpenShortsBadge').textContent = available.includes('publish_clip') ? 'Klip + yayınlama hazır' : (available.length ? 'Klip üretimi hazır · yayınlama aracı yok' : 'Bağlı değil');
  $('socialOpenShortsBadge').className = 'pill ' + (available.length ? 'safe' : '');
}
