/**
 * Server-authoritative admin authentication.
 *
 * Admin credentials live in Supabase table `admin_users`.
 * Only the session-signing secret remains in the server environment.
 *
 * During migration, the existing legacy Vercel admin credential is also accepted
 * when it matches the supplied username/password. A successful legacy login is
 * repaired into Supabase when possible, so a bad/missing migrated row cannot
 * lock out the only administrator.
 */

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

function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      try { cookies[key] = decodeURIComponent(value); } catch { cookies[key] = value; }
    }
  }
  return cookies;
}

function timingSafeEqualText(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPayload(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return null;
  const [body, signature] = String(token).split('.');
  if (!body || !signature) return null;

  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!timingSafeEqualText(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(req) {
  const cookies = parseCookies(req?.headers?.cookie);
  return verifyToken(cookies[SESSION_COOKIE]);
}

export function isAdminRequest(req) {
  return Boolean(getAdminSessionFromRequest(req));
}

function parsePasswordHash(value) {
  const parts = String(value || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return null;
  const [, saltBase64, keyBase64, params] = parts;
  const [N, r, p] = params.split(',').map(Number);
  if (!saltBase64 || !keyBase64 || !N || !r || !p) return null;
  return {
    salt: Buffer.from(saltBase64, 'base64url'),
    key: Buffer.from(keyBase64, 'base64url'),
    N,
    r,
    p
  };
}

function verifyPassword(password, passwordHash) {
  const parsed = parsePasswordHash(passwordHash);
  if (!parsed) return false;
  try {
    const derived = crypto.scryptSync(String(password), parsed.salt, parsed.key.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: 128 * parsed.N * parsed.r + 1024 * 1024
    });
    return crypto.timingSafeEqual(derived, parsed.key);
  } catch {
    return false;
  }
}

function isRateLimited(ip) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || now - current.start > WINDOW_MS) {
    attempts.set(ip, { start: now, count: 0 });
    return false;
  }
  return current.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || now - current.start > WINDOW_MS) {
    attempts.set(ip, { start: now, count: 1 });
    return;
  }
  current.count += 1;
}

function clearAttempts(ip) {
  attempts.delete(ip);
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Strict; Secure`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict; Secure`;
}

function getAdminClient() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getLegacyAdminCredential() {
  const username = String(process.env.ADMIN_USERNAME || '').trim();
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
  if (!username || !passwordHash) return null;
  return { username, passwordHash };
}

async function bootstrapLegacyAdmin(supabase, legacy, password, normalizedUsername) {
  if (!legacy || !timingSafeEqualText(normalizedUsername, legacy.username.toLowerCase())) return null;
  if (!verifyPassword(password, legacy.passwordHash)) return null;

  const { data: existing, error: lookupError } = await supabase
    .from('admin_users')
    .select('id, username, password_hash, role, is_active')
    .ilike('username', normalizedUsername)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error('[Admin Auth Bootstrap Lookup]', lookupError.message);
    return null;
  }

  const values = {
    username: legacy.username.toLowerCase(),
    password_hash: legacy.passwordHash,
    role: 'admin',
    is_active: true,
    updated_at: new Date().toISOString()
  };

  let data;
  let error;
  if (existing?.id) {
    ({ data, error } = await supabase
      .from('admin_users')
      .update(values)
      .eq('id', existing.id)
      .select('id, username, password_hash, role, is_active')
      .single());
  } else {
    ({ data, error } = await supabase
      .from('admin_users')
      .insert(values)
      .select('id, username, password_hash, role, is_active')
      .single());
  }

  if (error) {
    console.error('[Admin Auth Bootstrap]', error.message);
    return null;
  }

  console.info('[Admin Auth] Existing server admin credential migrated/repaired in Supabase.');
  return data;
}

async function authenticateFromSupabase(username, password) {
  const supabase = getAdminClient();
  if (!supabase) return { configured: false, user: null };

  const normalizedUsername = String(username || '').trim().toLowerCase();
  const legacy = getLegacyAdminCredential();

  // The legacy server credential is the recovery authority during migration.
  // Validate it before consulting Supabase so a stale, duplicate, or malformed
  // migrated row cannot turn a valid administrator credential into a 401.
  if (
    legacy &&
    timingSafeEqualText(normalizedUsername, legacy.username.toLowerCase()) &&
    verifyPassword(password, legacy.passwordHash)
  ) {
    try {
      const repaired = await bootstrapLegacyAdmin(supabase, legacy, password, normalizedUsername);
      if (repaired) return { configured: true, user: repaired };
    } catch (error) {
      console.error('[Admin Auth Legacy Repair]', error?.message || 'repair failed');
    }

    return {
      configured: true,
      user: {
        id: 'legacy-admin',
        username: legacy.username.toLowerCase(),
        role: 'admin',
        is_active: true
      }
    };
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, password_hash, role, is_active')
    .ilike('username', normalizedUsername)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Admin Auth DB]', error.message);
    return { configured: true, user: null, databaseError: true };
  }

  if (!data) return { configured: true, user: null };

  if (data.is_active !== true || String(data.role || '').toLowerCase() !== 'admin') {
    return { configured: true, user: null };
  }

  if (!verifyPassword(password, data.password_hash)) {
    return { configured: true, user: null };
  }

  return { configured: true, user: data };
}

async function authenticateAdmin(username, password) {
  if (process.env.ADMIN_AUTH_TEST_MODE === '1') {
    const expectedUsername = String(process.env.ADMIN_USERNAME || '').trim();
    const valid = timingSafeEqualText(username, expectedUsername) && verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
    return { configured: true, user: valid ? { id: 'test-admin', username: expectedUsername, role: 'admin' } : null };
  }
  return authenticateFromSupabase(username, password);
}

export default async function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const action = String(req.query?.action || (method === 'POST' ? 'login' : 'session')).toLowerCase();

  if (!['GET', 'POST'].includes(method)) {
    return json(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'GET, POST' });
  }

  if (!process.env.ADMIN_SESSION_SECRET) {
    return json(res, 503, { ok: false, error: 'Admin session service is not configured on the server.' });
  }

  if (action === 'session' && method === 'GET') {
    const session = getAdminSessionFromRequest(req);
    if (!session) return json(res, 401, { ok: false, authenticated: false });
    return json(res, 200, {
      ok: true,
      authenticated: true,
      user: { id: session.sub, username: session.username, role: session.role, exp: session.exp }
    });
  }

  if (action === 'logout' && method === 'POST') {
    return json(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
  }

  if (action !== 'login' || method !== 'POST') {
    return json(res, 400, { ok: false, error: 'Unsupported admin authentication action.' });
  }

  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return json(res, 429, { ok: false, error: 'Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.' });
  }

  let body = {};
  try {
    if (typeof req.body === 'string') body = JSON.parse(req.body);
    else if (req.body && typeof req.body === 'object') body = req.body;
  } catch {
    body = {};
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!username || !password) {
    recordFailedAttempt(ip);
    return json(res, 401, { ok: false, error: 'Username atau Password salah.' });
  }

  const auth = await authenticateAdmin(username, password);
  if (!auth.configured) {
    return json(res, 503, { ok: false, error: 'Admin authentication database is not configured on the server.' });
  }
  if (auth.databaseError) {
    return json(res, 503, { ok: false, error: 'Database admin belum siap. Jalankan migration admin_users terlebih dahulu.' });
  }
  if (!auth.user) {
    recordFailedAttempt(ip);
    return json(res, 401, { ok: false, error: 'Username atau Password salah.' });
  }

  clearAttempts(ip);
  const now = Math.floor(Date.now() / 1000);
  const token = signPayload({
    sub: auth.user.id,
    role: 'admin',
    username: auth.user.username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(12).toString('hex')
  });

  return json(res, 200, {
    ok: true,
    authenticated: true,
    user: { id: auth.user.id, username: auth.user.username, role: 'admin' }
  }, { 'Set-Cookie': sessionCookie(token) });
}