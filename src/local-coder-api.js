const REQUIRED_STAGE_IDS = Object.freeze(['plan', 'code', 'review']);

/**
 * Execute the three API Local Coder stages through an injected provider.
 * This boundary is intentionally testable without network or paid API calls.
 */
export async function runApiLocalCoderSequence({
  providerId,
  providers,
  hasKey,
  demoMode,
  stages,
  confirmConsent,
  disableDemoMode,
  onApproved,
  makePrompt,
  callProvider,
  onStageStart = async () => {},
  onStageComplete = async () => {}
}) {
  const provider = providers && providers[providerId];
  if (!provider || providerId === 'ollama') {
    return { status: 'invalid-provider', providerId, requestCount: 0, outputs: {} };
  }
  if (hasKey !== true) {
    return { status: 'missing-key', providerId, requestCount: 0, outputs: {} };
  }
  if (!Array.isArray(stages) || stages.map(stage => stage && stage.id).join(',') !== REQUIRED_STAGE_IDS.join(',')) {
    throw new Error('API Local Coder tam olarak Plan, Code ve Review aşamalarını bekliyor.');
  }
  if (typeof confirmConsent !== 'function' || typeof makePrompt !== 'function' || typeof callProvider !== 'function') {
    throw new TypeError('API Local Coder için onay, prompt ve sağlayıcı işlevleri gereklidir.');
  }
  if (demoMode && typeof disableDemoMode !== 'function') {
    throw new TypeError('Gerçek API çağrılarından önce Demo modunu kapatma işlevi gereklidir.');
  }

  const consentMessage = demoMode
    ? 'Local Coder ' + provider.name + ' üzerinden Plan, Kod ve İnceleme için 3 gerçek API isteği gönderecek. Demo modu kapanacak. Sağlayıcının ücretsiz kotası veya ücretleri uygulanabilir. Devam edilsin mi?'
    : 'Local Coder ' + provider.name + ' üzerinden Plan, Kod ve İnceleme için 3 API isteği gönderecek. Kota/ücret oluşabilir. Devam edilsin mi?';
  const approved = await confirmConsent(consentMessage);
  if (!approved) return { status: 'cancelled', providerId, requestCount: 0, outputs: {} };

  if (demoMode) await disableDemoMode();
  if (typeof onApproved === 'function') await onApproved(provider);
  let previous = '';
  let requestCount = 0;
  const outputs = {};
  for (const stage of stages) {
    await onStageStart(stage, provider);
    const prompt = await makePrompt(stage, previous);
    if (typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error(stage.title + ' aşaması için boş prompt oluşturuldu.');
    }
    // One provider call per stage. Errors propagate; no retry or provider fallback.
    const answer = await callProvider(providerId, prompt, []);
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('API sağlayıcısı boş yanıt verdi.');
    requestCount += 1;
    outputs[stage.id] = answer;
    previous = answer;
    await onStageComplete(stage, answer, provider);
  }
  return { status: 'completed', providerId, requestCount, outputs };
}
