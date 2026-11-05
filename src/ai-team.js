export function normalizeTeamSelection(selection, providerIds) {
  const allowed = new Set(Array.isArray(providerIds) ? providerIds : []);
  if (!Array.isArray(selection)) return [];
  return [...new Set(selection.filter(id => typeof id === 'string' && allowed.has(id)))];
}

export function selectConfiguredTeam(selection, providerIds, isConfigured) {
  const normalized = normalizeTeamSelection(selection, providerIds);
  const selected = typeof isConfigured === 'function'
    ? normalized.filter(id => Boolean(isConfigured(id)))
    : normalized;
  return { selected, skipped: normalized.length - selected.length };
}

export function confirmTeamLiveCalls(providerIds, confirmLive) {
  const uniqueIds = Array.isArray(providerIds) ? [...new Set(providerIds)] : [];
  if (!uniqueIds.length || typeof confirmLive !== 'function') return false;
  return confirmLive(uniqueIds.length) === true;
}

export function normalizeOpenAiEndpoint(value) {
  const input = String(value ?? '').trim();
  if (!input) throw new Error('Endpoint adresi boş olamaz.');
  let url;
  try { url = new URL(input); } catch { throw new Error('Geçerli bir URL gir.'); }
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localHosts.has(url.hostname))) {
    throw new Error('Uzak API adresleri HTTPS kullanmalı. HTTP yalnızca localhost için açık.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Endpoint içine kullanıcı bilgisi, query veya hash ekleme.');
  }
  let path = url.pathname.replace(/[/]+$/, '');
  if (!path.endsWith('/chat/completions')) path += '/chat/completions';
  return url.origin + path;
}

export function getTeamStageDetails(index, total) {
  const stages = [
    { role: 'Mimar / planlayıcı', instruction: 'Uygulanabilir bir plan, kapsam ve riskleri çıkar.' },
    { role: 'Uygulayıcı / kodlayıcı', instruction: 'Planı somut, modüler ve test edilebilir sonuca dönüştür.' },
    { role: 'Bağımsız gözden geçirici', instruction: 'Önceki çıktıyı bağımsız değerlendir; hataları ve eksikleri düzelt.' },
    { role: 'Testçi / son kontrol', instruction: 'Test senaryolarını, kabul ölçütlerini ve kalan işleri listele.' }
  ];
  if (index < stages.length) return stages[index];
  return {
    role: 'Ek bağımsız uzman ' + (index - stages.length + 1) + ' / ' + total,
    instruction: 'Önceki aşamaların tüm çıktılarını dikkate alarak yeni bir uzman gözüyle eksik varsayımları, alternatif çözümleri, entegrasyon risklerini ve iyileştirmeleri bul. Önceki yanıtları tekrar etmek yerine yeni katkı sun.'
  };
}

export function buildTeamStagePrompt(task, previous, stage, index, total) {
  return 'İş akışı aşaması ' + (index + 1) + '/' + total + '. Rolün: ' + stage.role + '.\nAsıl görev: ' + task + '\n'
    + (previous ? 'Önceki ajanın çıktısı:\n' + previous + '\n' : '')
    + 'Görev: ' + stage.instruction
    + '\nBilmediğin şeyi uydurma, kodu gerçekten çalıştırmadıysan çalıştırdığını iddia etme.';
}

export async function runParallelTeamCalls({ providerIds, task, history = [], callProvider }) {
  if (!Array.isArray(providerIds) || typeof callProvider !== 'function') {
    throw new TypeError('Parallel team calls require providerIds and callProvider.');
  }
  return Promise.all(providerIds.map(async id => {
    try {
      return { id, answer: await callProvider(id, task, history) };
    } catch (error) {
      return { id, error: error?.message || 'Hata' };
    }
  }));
}

export async function runSequentialTeamCalls({
  providerIds, task, history = [], getHistory, runStage,
  onStageStart = async () => {}, onStageComplete = async () => {}
}) {
  if (!Array.isArray(providerIds) || typeof runStage !== 'function') {
    throw new TypeError('Sequential team calls require providerIds and runStage.');
  }
  const results = [];
  let previous = '';
  for (let index = 0; index < providerIds.length; index += 1) {
    const id = providerIds[index];
    const total = providerIds.length;
    const stage = getTeamStageDetails(index, total);
    const prompt = buildTeamStagePrompt(task, previous, stage, index, total);
    const context = { id, index, total, stage, previous, prompt };
    await onStageStart(context);
    try {
      const stageHistory = typeof getHistory === 'function' ? getHistory(context) : history;
      const answer = await runStage(context, stageHistory);
      previous = answer;
      const result = { ...context, answer };
      results.push(result);
      await onStageComplete(result);
    } catch (error) {
      const failure = new Error(error?.message || 'Ajan aşaması başarısız oldu.');
      failure.cause = error;
      failure.completedStages = [...results];
      throw failure;
    }
  }
  return results;
}
