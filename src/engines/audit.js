const KEY = 'credipass.audit.v1';
export function getAudit() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function logAudit(action, payload = {}) {
  const items = getAudit();
  items.unshift({ id: crypto.randomUUID?.() || String(Date.now()), at: new Date().toISOString(), action, payload });
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 100)));
}
export function clearAudit() { localStorage.removeItem(KEY); }
