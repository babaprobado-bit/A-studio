import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = 18765;
const origin = 'http://127.0.0.1:' + port;
const vaultDir = mkdtempSync(join(tmpdir(), 'ai-studio-vault-test-'));
const env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: String(port),
  SITE_PASSWORD: 'ci-test-passphrase-5678',
  SESSION_SECRET: 'ci-only-session-secret-0123456789abcdef-0123456789',
  VAULT_ENCRYPTION_KEY: 'ci-only-vault-encryption-key-0123456789abcdef',
  VAULT_DATA_DIR: vaultDir
};
const child = spawn(process.execPath, ['server/server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let serverOutput = '';
child.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
child.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

async function request(path, options = {}) {
  return fetch(origin + path, { redirect: 'manual', ...options });
}
async function waitForServer() {
  for (let attempt=0; attempt<40; attempt++) {
    if (child.exitCode !== null) throw new Error('Server exited early. ' + serverOutput);
    try {
      const response = await request('/health');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Server did not start. ' + serverOutput);
}
try {
  await waitForServer();
  const health = await request('/health');
  assert.equal(health.status, 200, 'Health endpoint should be public');

  const guest = await request('/');
  assert.equal(guest.status, 303, 'Guest should be redirected to login');
  assert.equal(guest.headers.get('location'), '/login');

  const loginPage = await request('/login');
  assert.equal(loginPage.status, 200, 'Login page should be visible without auth');
  assert.match(await loginPage.text(), /Site parolası/);

  const badLogin = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'not-the-password' })
  });
  assert.equal(badLogin.status, 401, 'Wrong password must be rejected');

  const goodLogin = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: env.SITE_PASSWORD })
  });
  assert.equal(goodLogin.status, 200, 'Correct password should log in');
  const rawCookie = goodLogin.headers.get('set-cookie');
  assert.ok(rawCookie && rawCookie.includes('HttpOnly') && rawCookie.includes('SameSite=Strict'), 'Session cookie needs security flags');
  const cookie = rawCookie.split(';', 1)[0];

  const session = await request('/api/session', { headers: { Cookie: cookie } });
  assert.equal(session.status, 200, 'Valid session should be recognized');
  assert.equal((await session.json()).privateSite, true);

  const emptyVault = await request('/api/vault/items', { headers: { Cookie: cookie } });
  assert.equal(emptyVault.status, 200, 'Authenticated site can read the encrypted vault');
  assert.deepEqual((await emptyVault.json()).items, []);
  const adminHeaders = { Cookie: cookie, 'Content-Type': 'application/json' };
  const saved = await request('/api/vault/items', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ title: 'Project memory test', content: 'Behind the Door shared decision: keep AI Studio tests green.', tags: ['game', 'shared'] })
  });
  assert.equal(saved.status, 201, 'Site should save a vault note');
  const savedItem = (await saved.json()).item;
  assert.equal(savedItem.title, 'Project memory test');
  assert.equal(savedItem.createdBy, 'site-admin');
  const vaultFile = join(vaultDir, 'vault.enc');
  assert.equal(existsSync(vaultFile), true, 'Encrypted vault file should be persisted');
  const encryptedOnDisk = readFileSync(vaultFile, 'utf8');
  assert.doesNotMatch(encryptedOnDisk, /Project memory test|Behind the Door shared decision/,'Plaintext notes must not appear in the persisted vault');
  const envelope = JSON.parse(encryptedOnDisk);
  assert.equal(envelope.cipher, 'AES-256-GCM');
  assert.ok(envelope.iv && envelope.tag && envelope.data, 'AES-GCM envelope must include nonce, authentication tag, and ciphertext');

  const newAgent = await request('/api/vault/agents', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ name: 'Test coding agent', scope: 'readwrite' })
  });
  assert.equal(newAgent.status, 201, 'Site admin should be able to issue an agent token');
  const agentData = await newAgent.json();
  assert.match(agentData.token, /^aiav_[A-Za-z0-9_-]{32,}$/);
  assert.equal(agentData.agent.scope, 'readwrite');
  const bearer = { Authorization: 'Bearer ' + agentData.token };
  const whoami = await request('/api/agent/v1/whoami', { headers: bearer });
  assert.equal(whoami.status, 200);
  assert.equal((await whoami.json()).agent.name, 'Test coding agent');
  const agentRead = await request('/api/agent/v1/items?q=Project%20memory', { headers: bearer });
  assert.equal(agentRead.status, 200, 'Agent should read shared memory using its token');
  assert.match((await agentRead.json()).items[0].content, /keep AI Studio tests green/);
  const agentWrite = await request('/api/agent/v1/items', {
    method: 'POST', headers: { ...bearer, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Saved by an agent', content: 'This agent note was encrypted at rest.', tags: ['agent'] })
  });
  assert.equal(agentWrite.status, 201, 'Readwrite agent should save a shared note');
  const apiSpec = await request('/api/agent/v1/openapi.json', { headers: bearer });
  assert.equal(apiSpec.status, 200, 'Token-authenticated agent can get the REST API specification');
  assert.equal((await apiSpec.json()).openapi, '3.1.0');

  const readOnlyAgent = await request('/api/vault/agents', {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ name: 'Read-only agent', scope: 'readonly' })
  });
  assert.equal(readOnlyAgent.status, 201);
  const readOnlyData = await readOnlyAgent.json();
  const forbiddenWrite = await request('/api/agent/v1/items', {
    method: 'POST', headers: { Authorization: 'Bearer ' + readOnlyData.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Must not save', content: 'Should be blocked' })
  });
  assert.equal(forbiddenWrite.status, 403, 'Read-only agent must not write');
  const revoked = await request('/api/vault/agents/' + encodeURIComponent(agentData.agent.id), { method: 'DELETE', headers: adminHeaders });
  assert.equal(revoked.status, 200, 'Site admin can revoke an agent token');
  const afterRevoke = await request('/api/agent/v1/whoami', { headers: bearer });
  assert.equal(afterRevoke.status, 401, 'A revoked agent token must no longer authenticate');

  const appPage = await request('/', { headers: { Cookie: cookie } });
  assert.equal(appPage.status, 200, 'Authenticated session should load app');
  assert.match(await appPage.text(), /AI Studio Alpha 1/);

  const logout = await request('/api/logout', {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: '{}'
  });
  assert.equal(logout.status, 200, 'Logout should clear session');

  const afterLogout = await request('/');
  assert.equal(afterLogout.status, 303, 'New browser request without the cleared cookie must be locked');
  assert.ok(logout.headers.get('set-cookie')?.toLowerCase().includes('expires=thu, 01 jan 1970'), 'Logout should expire the session cookie');
  console.log('Private website smoke test passed: guest lock, bad password, login, session, and logout.');
} catch (error) {
  console.error(error);
  console.error(serverOutput);
  process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
  await new Promise(resolve => setTimeout(resolve, 150));
  if (child.exitCode === null) child.kill('SIGKILL');
  await new Promise(resolve => setTimeout(resolve, 100));
  rmSync(vaultDir, { recursive: true, force: true });
}
