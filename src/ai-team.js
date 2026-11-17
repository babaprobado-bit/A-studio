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

function parseIpv4Octets(hostname) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return null;
  const octets = hostname.split('.').map(Number);
  return octets.every(value => Number.isInteger(value) && value >= 0 && value <= 255) ? octets : null;
}

function isPrivateIpv4(octets) {
  if (!Array.isArray(octets)) return false;
  const [a, b] = octets;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isDisallowedSpecialIpv4(octets) {
  if (!Array.isArray(octets)) return false;
  const [a, b, c] = octets;
  return a === 0
    || (a === 169 && b === 254) // link-local
    || (a === 100 && b >= 64 && b <= 127) // carrier-grade NAT
    || (a === 192 && b === 0 && (c === 0 || c === 2)) // IETF special / TEST-NET-1
    || (a === 192 && b === 88 && c === 99) // deprecated 6to4 relay
    || (a === 198 && (b === 18 || b === 19)) // benchmarking
    || (a === 198 && b === 51 && c === 100) // TEST-NET-2
    || (a === 203 && b === 0 && c === 113) // TEST-NET-3
    || a >= 224; // multicast and reserved
}

function parseIpv6Words(hostname) {
  if (!hostname.startsWith('[') || !hostname.endsWith(']')) return null;
  let address = hostname.slice(1, -1).toLowerCase();
  if (!address.includes(':') || address.includes('%')) return null;
  if (address.includes('.')) {
    const lastColon = address.lastIndexOf(':');
    const octets = parseIpv4Octets(address.slice(lastColon + 1));
    if (!octets) return null;
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    address = address.slice(0, lastColon) + ':' + high + ':' + low;
  }

  let words;
  if (address.includes('::')) {
    const parts = address.split('::');
    if (parts.length !== 2) return null;
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null;
    words = [...left, ...Array(missing).fill('0'), ...right];
  } else {
    words = address.split(':');
    if (words.length !== 8) return null;
  }
  if (words.length !== 8 || words.some(word => !/^[a-f0-9]{1,4}$/.test(word))) return null;
  return words.map(word => Number.parseInt(word, 16));
}

function isLoopbackIpv6(words) {
  return Array.isArray(words) && words.slice(0, 7).every(word => word === 0) && words[7] === 1;
}

function isDisallowedSpecialIpv6(words) {
  if (!Array.isArray(words) || isLoopbackIpv6(words)) return false;
  const [first, second] = words;
  const uniqueLocal = (first & 0xfe00) === 0xfc00;
  const linkLocal = (first & 0xffc0) === 0xfe80;
  const multicast = (first & 0xff00) === 0xff00;
  const documentation = first === 0x2001 && second === 0x0db8;
  const benchmarking = first === 0x2001 && second === 0x0002;
  const orchid = first === 0x2001 && ((second & 0xfff0) === 0x0010 || (second & 0xfff0) === 0x0020);
  const transition = first === 0x2001 && second === 0x0000 || first === 0x2002;
  const globalUnicast = (first & 0xe000) === 0x2000;
  return uniqueLocal || linkLocal || multicast || documentation || benchmarking || orchid || transition || !globalUnicast;
}

export function normalizeOllamaEndpoint(value) {
  const input = String(value ?? '').trim();
  if (!input) throw new Error('Ollama adresi boş olamaz.');
  let url;
  try { url = new URL(input); } catch { throw new Error('Geçerli bir Ollama URL adresi gir.'); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Ollama yalnızca HTTP veya HTTPS kullanabilir.');
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Ollama adresine kullanıcı bilgisi, query veya hash ekleme.');
  }

  const hostname = url.hostname.toLowerCase();
  const ipv4 = parseIpv4Octets(hostname);
  const ipv6 = parseIpv6Words(hostname);
  if ((ipv4 && isDisallowedSpecialIpv4(ipv4)) || (ipv6 && isDisallowedSpecialIpv6(ipv6))) {
    throw new Error('Ollama adresinde link-local, CGNAT, multicast veya özel amaçlı IP adresleri kullanılamaz.');
  }

  const loopback = hostname === 'localhost'
    || Boolean(ipv4 && ipv4[0] === 127)
    || isLoopbackIpv6(ipv6);
  if (url.protocol === 'http:' && !loopback && !isPrivateIpv4(ipv4)) {
    throw new Error('Şifresiz HTTP yalnızca localhost veya özel yerel ağ IPv4 adreslerinde kullanılabilir. Uzak Ollama sunucusunda HTTPS kullan.');
  }
  return url.origin + url.pathname.replace(/\/+$/, '');
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
