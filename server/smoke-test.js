import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 18765;
const origin = 'http://127.0.0.1:' + port;
const env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: String(port),
  SITE_PASSWORD: 'ci-test-passphrase-5678',
  SESSION_SECRET: 'ci-only-session-secret-0123456789abcdef-0123456789'
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
  await new Promise(resolve => setTimeout(resolve, 100));
  if (child.exitCode === null) child.kill('SIGKILL');
}
