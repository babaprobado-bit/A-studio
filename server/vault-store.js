import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}
function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}
function equalHash(leftHex, rightHex) {
  if (typeof leftHex !== 'string' || typeof rightHex !== 'string' || !/^[a-f0-9]{64}$/i.test(leftHex) || !/^[a-f0-9]{64}$/i.test(rightHex)) return false;
  return crypto.timingSafeEqual(Buffer.from(leftHex, 'hex'), Buffer.from(rightHex, 'hex'));
}
function safeTags(raw) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw httpError('tags bir metin dizisi olmalı.');
  return [...new Set(raw.filter(tag => typeof tag === 'string').map(tag => tag.trim().slice(0, 40)).filter(Boolean))].slice(0, 12);
}
function cleanCopy(item) {
  return { ...item, tags: [...item.tags] };
}

export function createVaultStore({ filePath, encryptionSecret }) {
  if (typeof filePath !== 'string' || !filePath) throw new Error('Vault filePath is required.');
  if (typeof encryptionSecret !== 'string' || encryptionSecret.length < 32) throw new Error('Vault encryption secret must be at least 32 characters.');
  const key = crypto.createHash('sha256').update('AI-Studio-Shared-Vault-v1:' + encryptionSecret).digest();
  let state = null;
  let loading = null;
  let saveQueue = Promise.resolve();

  async function load() {
    if (state) return state;
    if (loading) return loading;
    loading = (async () => {
      try {
        const text = await fs.readFile(filePath, 'utf8');
        const envelope = JSON.parse(text);
        if (envelope?.format !== 'ai-studio-vault-encrypted-v1' || envelope?.cipher !== 'AES-256-GCM') {
          throw httpError('Kasa dosyasının biçimi tanınmıyor; veri korunmak için açılmadı.', 500);
        }
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64url'));
        decipher.setAuthTag(Buffer.from(envelope.tag, 'base64url'));
        const clear = Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64url')), decipher.final()]).toString('utf8');
        const parsed = JSON.parse(clear);
        if (parsed?.version !== 1 || !Array.isArray(parsed.items) || !Array.isArray(parsed.agents)) {
          throw httpError('Şifre çözülmüş kasa verisi geçersiz; var olan dosya değiştirilmeyecek.', 500);
        }
        state = parsed;
      } catch (error) {
        if (error?.code === 'ENOENT') state = { version: 1, items: [], agents: [] };
        else throw error;
      }
      return state;
    })();
    try { return await loading; }
    finally { loading = null; }
  }

  async function persist() {
    const snapshot = JSON.stringify(state);
    const write = async () => {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(Buffer.from(snapshot, 'utf8')), cipher.final()]);
      const envelope = JSON.stringify({
        format: 'ai-studio-vault-encrypted-v1',
        cipher: 'AES-256-GCM',
        iv: iv.toString('base64url'),
        tag: cipher.getAuthTag().toString('base64url'),
        data: encrypted.toString('base64url')
      });
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const tempPath = filePath + '.tmp-' + crypto.randomBytes(6).toString('hex');
      await fs.writeFile(tempPath, envelope, { encoding: 'utf8', mode: 0o600 });
      await fs.chmod(tempPath, 0o600);
      await fs.rename(tempPath, filePath);
    };
    const task = saveQueue.then(write, write);
    saveQueue = task.catch(() => {});
    await task;
  }

  function normalizeItem(input, previous = null) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const title = source.title === undefined && previous ? previous.title : (typeof source.title === 'string' ? source.title.trim().slice(0, 120) : '');
    const content = source.content === undefined && previous ? previous.content : (typeof source.content === 'string' ? source.content.trim() : '');
    if (!title) throw httpError('Kayıt başlığı zorunlu (en fazla 120 karakter).');
    if (!content) throw httpError('Kayıt içeriği boş olamaz.');
    if (content.length > 20000) throw httpError('Kayıt içeriği 20.000 karakter sınırını aşıyor.');
    return { title, content, tags: source.tags === undefined && previous ? [...previous.tags] : safeTags(source.tags) };
  }

  return {
    async listItems({ q = '', limit = 30 } = {}) {
      await load();
      const query = typeof q === 'string' ? q.trim().slice(0, 120).toLocaleLowerCase('tr-TR') : '';
      const cap = Math.min(50, Math.max(1, Number.isInteger(limit) ? limit : 30));
      return state.items
        .filter(item => !query || [item.title, item.content, ...(item.tags || [])].join(' ').toLocaleLowerCase('tr-TR').includes(query))
        .slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .slice(0, cap).map(cleanCopy);
    },
    async getItem(id) {
      await load();
      const item = state.items.find(entry => entry.id === id);
      return item ? cleanCopy(item) : null;
    },
    async createItem(input, actor = 'site-admin') {
      await load();
      const clean = normalizeItem(input);
      const now = new Date().toISOString();
      const item = { id: crypto.randomUUID(), ...clean, createdAt: now, updatedAt: now, createdBy: String(actor || 'agent').slice(0, 80), updatedBy: String(actor || 'agent').slice(0, 80) };
      state.items.unshift(item);
      await persist();
      return cleanCopy(item);
    },
    async updateItem(id, input, actor = 'site-admin') {
      await load();
      const index = state.items.findIndex(entry => entry.id === id);
      if (index < 0) throw httpError('Kayıt bulunamadı.', 404);
      const item = state.items[index];
      const clean = normalizeItem(input, item);
      state.items[index] = { ...item, ...clean, updatedAt: new Date().toISOString(), updatedBy: String(actor || 'agent').slice(0, 80) };
      await persist();
      return cleanCopy(state.items[index]);
    },
    async deleteItem(id) {
      await load();
      const index = state.items.findIndex(entry => entry.id === id);
      if (index < 0) throw httpError('Kayıt bulunamadı.', 404);
      state.items.splice(index, 1);
      await persist();
      return true;
    },
    async createAgent(input = {}) {
      await load();
      const name = typeof input.name === 'string' ? input.name.trim().slice(0, 80) : '';
      if (!name) throw httpError('Agent adı zorunlu (en fazla 80 karakter).');
      const scope = input.scope === 'readwrite' ? 'readwrite' : 'readonly';
      const token = 'aiav_' + crypto.randomBytes(32).toString('base64url');
      const agent = { id: crypto.randomUUID(), name, scope, tokenHash: tokenHash(token), createdAt: new Date().toISOString() };
      state.agents.push(agent);
      await persist();
      return { agent: { id: agent.id, name: agent.name, scope: agent.scope, createdAt: agent.createdAt }, token };
    },
    async listAgents() {
      await load();
      return state.agents.map(({ id, name, scope, createdAt }) => ({ id, name, scope, createdAt }));
    },
    async revokeAgent(id) {
      await load();
      const index = state.agents.findIndex(agent => agent.id === id);
      if (index < 0) throw httpError('Agent bulunamadı.', 404);
      state.agents.splice(index, 1);
      await persist();
      return true;
    },
    async getAgentForToken(token) {
      await load();
      const candidate = tokenHash(token);
      const agent = state.agents.find(entry => equalHash(entry.tokenHash, candidate));
      return agent ? { id: agent.id, name: agent.name, scope: agent.scope } : null;
    }
  };
}
