const FORMAT = 'ai-studio-encrypted-backup-v1';
const AAD_LABEL = 'ai-studio-alpha-1:encrypted-backup:v1';
const ITERATIONS = 250000;
const MIN_ITERATIONS = 100000;
const MAX_ITERATIONS = 500000;
const MAX_CLEAR_BYTES = 5 * 1024 * 1024;
const MAX_CIPHER_CHARS = 7_100_000;

function requireCrypto(cryptoApi) {
  if (!cryptoApi?.subtle || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Bu tarayıcı güvenli şifreleme API’sini desteklemiyor. Güncel HTTPS tarayıcısında dene.');
  }
}
function validatePassword(password) {
  if (typeof password !== 'string' || password.trim().length < 12 || password.length > 256) {
    throw new Error('Yedek parolası en az 12 karakter olmalı; en fazla 256 karakter kullan.');
  }
}
function bytesToBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}
function base64ToBytes(value, maxChars, maxBytes) {
  if (typeof value !== 'string' || !value.length || value.length > maxChars || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error('Şifreli yedek biçimi geçersiz veya fazla büyük.');
  }
  let binary;
  try { binary = atob(value); } catch { throw new Error('Şifreli yedek verisi okunamadı.'); }
  if (binary.length > maxBytes) throw new Error('Şifreli yedek izin verilen boyutu aşıyor.');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function deriveBackupKey(password, salt, iterations, cryptoApi) {
  const material = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return cryptoApi.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWorkspaceBackup(snapshot, password, cryptoApi = globalThis.crypto) {
  requireCrypto(cryptoApi);
  validatePassword(password);
  if (!snapshot || snapshot.format !== 'ai-studio-workspace-v1') {
    throw new Error('Yalnızca geçerli AI Studio çalışma alanı yedeği şifrelenebilir.');
  }
  const clearText = new TextEncoder().encode(JSON.stringify(snapshot));
  if (clearText.byteLength > MAX_CLEAR_BYTES) throw new Error('Çalışma alanı yedeği 5 MB sınırını aşıyor.');
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const key = await deriveBackupKey(password, salt, ITERATIONS, cryptoApi);
  const ciphertext = await cryptoApi.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(AAD_LABEL), tagLength: 128 },
    key,
    clearText
  );
  return {
    format: FORMAT,
    version: 1,
    cipher: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    exportedAt: new Date().toISOString(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptWorkspaceBackup(envelope, password, cryptoApi = globalThis.crypto) {
  requireCrypto(cryptoApi);
  validatePassword(password);
  if (!envelope || typeof envelope !== 'object' || envelope.format !== FORMAT || envelope.version !== 1 ||
      envelope.cipher !== 'AES-256-GCM' || envelope.kdf !== 'PBKDF2-SHA-256') {
    throw new Error('Bu dosya tanınan bir şifreli AI Studio yedeği değil.');
  }
  const iterations = envelope.iterations;
  if (!Number.isSafeInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    throw new Error('Yedekteki şifreleme parametreleri güvenli sınırlar dışında.');
  }
  const salt = base64ToBytes(envelope.salt, 64, 32);
  const iv = base64ToBytes(envelope.iv, 32, 16);
  const ciphertext = base64ToBytes(envelope.ciphertext, MAX_CIPHER_CHARS, MAX_CLEAR_BYTES + 32);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) {
    throw new Error('Şifreli yedek eksik veya bozuk.');
  }
  const key = await deriveBackupKey(password, salt, iterations, cryptoApi);
  let clear;
  try {
    clear = await cryptoApi.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(AAD_LABEL), tagLength: 128 },
      key,
      ciphertext
    );
  } catch {
    throw new Error('Parola yanlış veya yedek dosyası değiştirilmiş.');
  }
  if (clear.byteLength > MAX_CLEAR_BYTES) throw new Error('Açılan yedek 5 MB sınırını aşıyor.');
  let snapshot;
  try { snapshot = JSON.parse(new TextDecoder().decode(clear)); }
  catch { throw new Error('Yedek çözülse de içeriği geçerli JSON değil.'); }
  if (!snapshot || snapshot.format !== 'ai-studio-workspace-v1') {
    throw new Error('Dosyanın içeriği geçerli bir AI Studio çalışma alanı yedeği değil.');
  }
  return snapshot;
}
