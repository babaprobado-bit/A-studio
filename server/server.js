import express from 'express';
import helmet from 'helmet';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createVaultStore } from './vault-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const loginPath = path.join(__dirname, 'login.html');
const loginCssPath = path.join(__dirname, 'login.css');
const loginJsPath = path.join(__dirname, 'login.js');

const SITE_PASSWORD = process.env.SITE_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT || 10000);
const VAULT_ENCRYPTION_KEY = process.env.VAULT_ENCRYPTION_KEY || '';
const VAULT_DATA_DIR = process.env.VAULT_DATA_DIR || path.join(rootDir, 'data');
const SESSION_MS = 8 * 60 * 60 * 1000;
const COOKIE_NAME = 'ai_studio_session';

if (SITE_PASSWORD.length < 12) {
  console.error('Configuration error: SITE_PASSWORD must contain at least 12 characters.');
  process.exit(1);
}
if (SESSION_SECRET.length < 32) {
  console.error('Configuration error: SESSION_SECRET must contain at least 32 random characters.');
  process.exit(1);
}
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('Configuration error: PORT must be a valid port number.');
  process.exit(1);
}
if (VAULT_ENCRYPTION_KEY.length < 32) {
  console.error('Configuration error: VAULT_ENCRYPTION_KEY must contain at least 32 random characters.');
  process.exit(1);
}
const vault = createVaultStore({ filePath: path.join(VAULT_DATA_DIR, 'vault.enc'), encryptionSecret: VAULT_ENCRYPTION_KEY });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: [
        "'self'",
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://generativelanguage.googleapis.com',
        'https://api.deepseek.com',
        'https://api.groq.com',
        'https://openrouter.ai',
        'http:'
      ],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '1mb', strict: true }));

const failedLogins = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

function sameOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get('host');
  } catch {
    return false;
  }
}
function signature(expiresAt) {
  return crypto.createHmac('sha256', SESSION_SECRET)
    .update('ai-studio-alpha-1:' + String(expiresAt))
    .digest('base64url');
}
function safeEqual(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}
function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  for (const part of cookieHeader.split(';')) {
    const pivot = part.indexOf('=');
    if (pivot < 0) continue;
    if (part.slice(0, pivot).trim() === name) return part.slice(pivot + 1).trim();
  }
  return '';
}
function authenticated(req) {
  const token = readCookie(req, COOKIE_NAME);
  const [expiryText, suppliedSignature, ...extra] = token.split('.');
  if (!token || extra.length || !expiryText || !suppliedSignature) return false;
  const expiry = Number(expiryText);
  const now = Date.now();
  if (!Number.isSafeInteger(expiry) || expiry <= now || expiry > now + SESSION_MS + 60_000) return false;
  return safeEqual(suppliedSignature, signature(expiry));
}
function cookieOptions() {
  return {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MS
  };
}
function attemptState(ip) {
  const now = Date.now();
  let state = failedLogins.get(ip);
  if (!state || state.resetAt <= now) {
    state = { count: 0, resetAt: now + WINDOW_MS };
    failedLogins.set(ip, state);
  }
  return state;
}
function recordFailure(ip) {
  const state = attemptState(ip);
  state.count += 1;
}
function authGuard(req, res, next) {
  if (authenticated(req)) return next();
  res.set('Cache-Control', 'no-store');
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Authentication required.' });
  return res.redirect(303, '/login');
}

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.get('/login', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (authenticated(req)) return res.redirect(303, '/');
  return res.sendFile(loginPath);
});
app.get('/login.css', (_req, res) => res.sendFile(loginCssPath));
app.get('/login.js', (_req, res) => res.sendFile(loginJsPath));
app.post('/api/login', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!sameOrigin(req)) return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const state = attemptState(ip);
  if (state.count >= MAX_FAILURES) {
    const waitSeconds = Math.max(1, Math.ceil((state.resetAt - Date.now()) / 1000));
    return res.status(429).json({ error: 'Çok fazla deneme yapıldı. ' + waitSeconds + ' saniye sonra tekrar dene.' });
  }
  const password = typeof req.body?.password === 'string' ? req.body.password.slice(0, 256) : '';
  if (!safeEqual(password, SITE_PASSWORD)) {
    recordFailure(ip);
    return res.status(401).json({ error: 'Parola doğru değil. Tekrar dene.' });
  }
  failedLogins.delete(ip);
  const expiresAt = Date.now() + SESSION_MS;
  const token = String(expiresAt) + '.' + signature(expiresAt);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return res.status(200).json({ ok: true });
});


async function sendVaultError(res, error) {
  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599 ? error.status : 500;
  if (status >= 500) console.error('Shared vault request failed:', error?.message || 'Unknown vault error');
  res.set('Cache-Control', 'no-store');
  return res.status(status).json({ error: status >= 500 ? 'Şifreli kasa isteği tamamlanamadı.' : (error.message || 'İstek geçersiz.') });
}
function bearerFromRequest(req) {
  const value = req.get('authorization') || '';
  const match = /^Bearer\s+([A-Za-z0-9_-]{32,160})$/i.exec(value);
  return match ? match[1] : '';
}
async function agentAuthGuard(req, res, next) {
  const token = bearerFromRequest(req);
  if (!token) return res.status(401).json({ error: 'Agent token gerekli. Authorization: Bearer <token> başlığını kullan.' });
  try {
    const agent = await vault.getAgentForToken(token);
    if (!agent) return res.status(401).json({ error: 'Agent token geçersiz veya iptal edilmiş.' });
    req.vaultAgent = agent;
    return next();
  } catch (error) {
    return sendVaultError(res, error);
  }
}
function agentWriteGuard(req, res, next) {
  if (req.vaultAgent?.scope !== 'readwrite') return res.status(403).json({ error: 'Bu agent salt okunur. Yazmak için readwrite token oluştur.' });
  return next();
}
app.use('/api/agent/v1', agentAuthGuard);
app.get('/api/agent/v1/openapi.json', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const baseUrl = req.protocol + '://' + req.get('host') + '/api/agent/v1';
  res.json({
    openapi: '3.1.0',
    info: { title: 'AI Studio Shared Vault API', version: '1.0.0', description: 'Agentların yetkilendirilmiş biçimde ortak kasa kayıtlarını okuma ve kaydetme API’si.' },
    servers: [{ url: baseUrl }],
    security: [{ BearerAuth: [] }],
    components: { securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'AI Studio agent token' } } },
    paths: {
      '/whoami': { get: { summary: 'Bu tokenın agent kimliğini göster', responses: { '200': { description: 'Agent kimliği' }, '401': { description: 'Token geçersiz' } } } },
      '/items': {
        get: { summary: 'Kayıtları listele/ara', parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 30 } }], responses: { '200': { description: 'Kasa kayıtları' } } },
        post: { summary: 'Kayıt oluştur (readwrite token)', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title','content'], properties: { title: { type: 'string', maxLength: 120 }, content: { type: 'string', maxLength: 20000 }, tags: { type: 'array', items: { type: 'string', maxLength: 40 } } } } } }, responses: { '201': { description: 'Kayıt oluşturuldu' }, '403': { description: 'Salt okunur token' } } }
      },
      '/items/{id}': {
        get: { summary: 'Tek bir kayıt oku', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Kayıt' }, '404': { description: 'Bulunamadı' } } },
        put: { summary: 'Kayıt güncelle (readwrite token)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } } } }, responses: { '200': { description: 'Güncellendi' }, '403': { description: 'Salt okunur token' } } },
        delete: { summary: 'Kayıt sil (readwrite token)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Silindi' }, '403': { description: 'Salt okunur token' } } }
      }
    }
  });
});
app.get('/api/agent/v1/whoami', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ agent: { id: req.vaultAgent.id, name: req.vaultAgent.name, scope: req.vaultAgent.scope } });
});
app.get('/api/agent/v1/items', async (req, res) => {
  try {
    const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const items = await vault.listItems({ q: req.query.q, limit });
    res.set('Cache-Control', 'no-store');
    return res.json({ items });
  } catch (error) { return sendVaultError(res, error); }
});
app.get('/api/agent/v1/items/:id', async (req, res) => {
  try { const item = await vault.getItem(req.params.id); if (!item) return res.status(404).json({ error: 'Kayıt bulunamadı.' }); res.set('Cache-Control', 'no-store'); return res.json({ item }); }
  catch (error) { return sendVaultError(res, error); }
});
app.post('/api/agent/v1/items', agentWriteGuard, async (req, res) => {
  try { const item = await vault.createItem(req.body, req.vaultAgent.name); res.set('Cache-Control', 'no-store'); return res.status(201).json({ item }); }
  catch (error) { return sendVaultError(res, error); }
});
app.put('/api/agent/v1/items/:id', agentWriteGuard, async (req, res) => {
  try { const item = await vault.updateItem(req.params.id, req.body, req.vaultAgent.name); res.set('Cache-Control', 'no-store'); return res.json({ item }); }
  catch (error) { return sendVaultError(res, error); }
});
app.delete('/api/agent/v1/items/:id', agentWriteGuard, async (req, res) => {
  try { await vault.deleteItem(req.params.id); res.set('Cache-Control', 'no-store'); return res.json({ ok: true }); }
  catch (error) { return sendVaultError(res, error); }
});

app.use(authGuard);
app.get('/api/session', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ authenticated: true, privateSite: true, expiresInMs: SESSION_MS });
});

app.get('/api/vault/items', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const items = await vault.listItems({ q: req.query.q, limit });
    res.set('Cache-Control', 'no-store');
    return res.json({ items });
  } catch (error) { return sendVaultError(res, error); }
});
app.post('/api/vault/items', async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  try { const item = await vault.createItem(req.body, 'site-admin'); res.set('Cache-Control', 'no-store'); return res.status(201).json({ item }); }
  catch (error) { return sendVaultError(res, error); }
});
app.put('/api/vault/items/:id', async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  try { const item = await vault.updateItem(req.params.id, req.body, 'site-admin'); res.set('Cache-Control', 'no-store'); return res.json({ item }); }
  catch (error) { return sendVaultError(res, error); }
});
app.delete('/api/vault/items/:id', async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  try { await vault.deleteItem(req.params.id); res.set('Cache-Control', 'no-store'); return res.json({ ok: true }); }
  catch (error) { return sendVaultError(res, error); }
});
app.get('/api/vault/agents', async (_req, res) => {
  try { const agents = await vault.listAgents(); res.set('Cache-Control', 'no-store'); return res.json({ agents }); }
  catch (error) { return sendVaultError(res, error); }
});
app.post('/api/vault/agents', async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  try { const result = await vault.createAgent(req.body); res.set('Cache-Control', 'no-store'); return res.status(201).json(result); }
  catch (error) { return sendVaultError(res, error); }
});
app.delete('/api/vault/agents/:id', async (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  try { await vault.revokeAgent(req.params.id); res.set('Cache-Control', 'no-store'); return res.json({ ok: true }); }
  catch (error) { return sendVaultError(res, error); }
});

app.post('/api/logout', (req, res) => {
  if (!sameOrigin(req)) return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.status(200).json({ ok: true });
});

app.use(express.static(distDir, {
  index: false,
  etag: true,
  maxAge: '1h',
  setHeaders(res, filePath) {
    if (path.basename(filePath) === 'index.html' || path.basename(filePath) === 'sw.js' || path.basename(filePath) === 'manifest.webmanifest') {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store');
    return res.sendFile(indexPath);
  }
  return res.status(404).json({ error: 'Not found.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('AI Studio private web server listening on port ' + PORT);
});
