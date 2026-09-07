import crypto from 'node:crypto';

const COOKIE_NAME = 'solosatset_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getConfig() {
  const username = String(process.env.ADMIN_USERNAME || '').trim();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const secret = String(process.env.ADMIN_SESSION_SECRET || '');
  if (!username || !password || !secret) return null;
  return { username, password, secret };
}

function sign(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verify(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(extraHeaders).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

function getCookie(req) {
  const raw = String(req.headers.cookie || '');
  const match = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export default async function handler(req, res) {
  const config = getConfig();
  if (!config) return json(res, 503, { authenticated: false, error: 'Admin authentication is not configured.' });

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'GET') {
    const session = verify(getCookie(req), config.secret);
    return json(res, 200, { authenticated: Boolean(session), username: session?.username || null });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  body ||= {};

  if (body.action === 'logout') {
    return json(res, 200, { authenticated: false }, { 'Set-Cookie': cookieHeader('', 0) });
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const validUser = crypto.timingSafeEqual(Buffer.from(username), Buffer.from(config.username));
  const validPassword = crypto.timingSafeEqual(Buffer.from(password), Buffer.from(config.password));
  if (!validUser || !validPassword) return json(res, 401, { authenticated: false, error: 'Invalid credentials.' });

  const payload = {
    username: config.username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const token = sign(payload, config.secret);
  return json(res, 200, { authenticated: true, username: config.username }, { 'Set-Cookie': cookieHeader(token, MAX_AGE_SECONDS) });
}
