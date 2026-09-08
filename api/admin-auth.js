/** Server-authoritative admin authentication. */
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const SESSION_COOKIE = 'solosatset_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map();

function json(res, status, payload, headers = {}) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(payload));
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (!key) continue;
    try { out[key] = decodeURIComponent(value); } catch { out[key] = value; }
  }
  return out;
}

function base64url(value) { return Buffer.from(value).toString('base64url'); }

function signPayload(payload) {
  const secret = String(process.env.ADMIN_SESSION_SECRET || '');
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const secret = String(process.env.ADMIN_SESSION_SECRET || '');
  if (!secret || !token) return null;
  const [body, signature] = String(token).split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!timingSafeEqualText(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload.role === 'admin' ? payload : null;
  } catch { return null; }
}

export function getAdminSessionFromRequest(req) {
  return verifyToken(parseCookies(req?.headers?.cookie)[SESSION_COOKIE]);
}
export function isAdminRequest(req) { return Boolean(getAdminSessionFromRequest(req)); }

function parsePasswordHash(value) {
  const raw = String(value || '').trim();
  const parts = raw.split('$');

  // Current format: scrypt$<salt-base64url>$<key-base64url>$<N>,<r>,<p>
  if (parts.length === 4 && parts[0] === 'scrypt') {
    const [, saltText, keyText, params] = parts;
    const [N, r, p] = params.split(',').map(Number);
    if (!saltText || !keyText || !Number.isSafeInteger(N) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || N <= 1 || r <= 0 || p <= 0) return null;
    const salt = Buffer.from(saltText, 'base64url');
    const key = Buffer.from(keyText, 'base64url');
    if (!salt.length || !key.length) return null;
    return { salt, key, N, r, p };
  }

  // Legacy format used by the normal user-auth code: scrypt$N$r$p$<salt-hex>:<hash-hex>
  if (parts.length === 5 && parts[0] === 'scrypt') {
    const [, nText, rText, pText, payload] = parts;
    const [saltHex, hashHex] = payload.split(':');
    const N = Number(nText), r = Number(rText), p = Number(pText);
    if (!Number.isSafeInteger(N) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || N <= 1 || r <= 0 || p <= 0) return null;
    if (!saltHex || !hashHex || !/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(hashHex)) return null;
    return { salt: Buffer.from(saltHex, 'hex'), key: Buffer.from(hashHex, 'hex'), N, r, p };
  }
  return null;
}

function verifyPassword(password, passwordHash) {
  const parsed = parsePasswordHash(passwordHash);
  if (!parsed) return false;
  try {
    const derived = crypto.scryptSync(String(password), parsed.salt, parsed.key.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: Math.max(32 * 1024 * 1024, 128 * parsed.N * parsed.r + 1024 * 1024)
    });
    return crypto.timingSafeEqual(derived, parsed.key);
  } catch { return false; }
}

function rateLimited(ip) {
  const now = Date.now();
  const item = attempts.get(ip);
  if (!item || now - item.start >= WINDOW_MS) {
    attempts.set(ip, { start: now, count: 0 });
    return false;
  }
  return item.count >= MAX_LOGIN_ATTEMPTS;
}
function failed(ip) {
  const now = Date.now();
  const item = attempts.get(ip);
  if (!item || now - item.start >= WINDOW_MS) attempts.set(ip, { start: now, count: 1 });
  else item.count += 1;
}
function clearRate(ip) { attempts.delete(ip); }

function getAdminClient() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function authenticate(username, password) {
  const normalized = String(username || '').trim().toLowerCase();
  const supabase = getAdminClient();
  if (!supabase) return { configured: false, user: null };

  // Supabase admin_users is the single source of truth for admin login.
  // Do not prefer Vercel ADMIN_USERNAME / ADMIN_PASSWORD_HASH credentials here.
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, password_hash, role, is_active')
    .ilike('username', normalized)
    .limit(1);

  if (error) {
    console.error('[Admin Auth DB]', error.message);
    return { configured: true, user: null, databaseError: true };
  }

  const user = Array.isArray(data) ? data[0] : null;
  if (!user || user.is_active !== true || String(user.role || '').toLowerCase() !== 'admin') {
    return { configured: true, user: null };
  }
  if (!verifyPassword(password, user.password_hash)) return { configured: true, user: null };
  return { configured: true, user };
}

export default async function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const action = String(req.query?.action || (method === 'POST' ? 'login' : 'session')).toLowerCase();
  if (!['GET', 'POST'].includes(method)) return json(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'GET, POST' });
  if (!process.env.ADMIN_SESSION_SECRET) return json(res, 503, { ok: false, error: 'Admin session service is not configured on the server.' });

  if (action === 'session' && method === 'GET') {
    const session = getAdminSessionFromRequest(req);
    if (!session) return json(res, 401, { ok: false, authenticated: false });
    return json(res, 200, { ok: true, authenticated: true, user: { id: session.sub, username: session.username, role: session.role, exp: session.exp } });
  }
  if (action === 'logout' && method === 'POST') {
    return json(res, 200, { ok: true }, { 'Set-Cookie': `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict; Secure` });
  }
  if (action !== 'login' || method !== 'POST') return json(res, 400, { ok: false, error: 'Unsupported admin authentication action.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const username = String(body?.username || '').trim();
  const password = String(body?.password || '');
  if (!username || !password) { failed(ip); return json(res, 401, { ok: false, error: 'Username atau Password salah.' }); }

  const auth = await authenticate(username, password);
  if (!auth.configured) return json(res, 503, { ok: false, error: 'Admin authentication database is not configured on the server.' });
  if (auth.databaseError) return json(res, 503, { ok: false, error: 'Database admin belum siap. Jalankan migration admin_users terlebih dahulu.' });
  if (!auth.user) { failed(ip); return json(res, 401, { ok: false, error: 'Username atau Password salah.' }); }

  clearRate(ip);
  const now = Math.floor(Date.now() / 1000);
  const token = signPayload({ sub: auth.user.id, role: 'admin', username: auth.user.username, iat: now, exp: now + SESSION_TTL_SECONDS, nonce: crypto.randomBytes(12).toString('hex') });
  return json(res, 200, { ok: true, authenticated: true, user: { id: auth.user.id, username: auth.user.username, role: 'admin' } }, { 'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Strict; Secure` });
}
