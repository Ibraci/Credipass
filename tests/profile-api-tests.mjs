import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'credipass-profile-'));
const port = 18791;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['scripts/serve.mjs', String(port)], {
  env: { ...process.env, CREDIPASS_TEST_MODE: '1', CREDIPASS_DATA_DIR: dir, CREDIPASS_DEMO_PASSWORD: 'Test-Profil!' },
  stdio: ['ignore', 'pipe', 'pipe']
});

async function wait() {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base + '/api/health')).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw Error('Serveur non démarré');
}
const post = (cookie, path, obj) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(obj) });

try {
  await wait();
  const r = await post(null, '/api/auth/login', { login: 'agent.credit', password: 'Test-Profil!' });
  assert.equal(r.status, 200);
  const cookie = r.headers.get('set-cookie').split(';')[0];

  assert.equal((await post(null, '/api/auth/profile', { name: 'X Y' })).status, 401, 'session requise');
  assert.equal((await post(cookie, '/api/auth/profile', { name: 'A' })).status, 400, 'nom trop court');
  assert.equal((await post(cookie, '/api/auth/profile', { name: 'Agent Test', email: 'pas-un-email' })).status, 400, 'e-mail invalide');
  assert.equal((await post(cookie, '/api/auth/profile', { name: 'Agent Test', phone: 'abc' })).status, 400, 'téléphone invalide');

  const ok = await post(cookie, '/api/auth/profile', { name: 'Agent Test Profil', phone: '+223 70 00 00 00', email: 'agent.test@example.org' });
  assert.equal(ok.status, 200);
  const { user } = await ok.json();
  assert.equal(user.name, 'Agent Test Profil');
  assert.equal(user.phone, '+223 70 00 00 00');
  assert.equal(user.email, 'agent.test@example.org');
  assert.equal(user.role, 'AGENT_CREDIT', 'le rôle ne change pas');

  const me = await (await fetch(base + '/api/auth/me', { headers: { cookie } })).json();
  assert.equal(me.user.name, 'Agent Test Profil', 'le profil est relu par /api/auth/me');
  console.log('PROFILE API: PASS — mise à jour du profil, validations, rôle inchangé');
} finally {
  child.kill();
  rmSync(dir, { recursive: true, force: true });
}
