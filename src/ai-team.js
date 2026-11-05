export function normalizeTeamSelection(selection, providerIds) {
  const allowed = new Set(Array.isArray(providerIds) ? providerIds : []);
  if (!Array.isArray(selection)) return [];
  return [...new Set(selection.filter(id => typeof id === 'string' && allowed.has(id)))];
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
