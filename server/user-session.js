import crypto from 'node:crypto';

export const USER_SESSION_COOKIE = 'solosatset_user_session';
const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function timingSafeEqualText(left, right) {
  const a = Buffer.from(String(left ?? ''));
  const b = Buffer.from(String(right ?? ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getSecret() {
  return process.env.USER_SESSION_SECRET || '';
}

export function signUserSession(user) {
  const secret = getSecret();
  if (!secret || !user?.id) return '';
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: String(user.id), role: 'user', iat: now, exp: now + USER_SESSION_TTL_SECONDS, nonce: crypto.randomBytes(12).toString('hex') };
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function getUserSessionFromRequest(req) {
  const secret = getSecret();
  if (!secret) return null;
  const header = String(req?.headers?.cookie || '');
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${USER_SESSION_COOKIE}=`));
  if (!match) return null;
  const token = match.slice(USER_SESSION_COOKIE.length + 1);
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!timingSafeEqualText(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload?.role !== 'user' || !payload?.sub) return null;
    if (!payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function userSessionCookie(token) {
  return `${USER_SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${USER_SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

export function clearUserSessionCookie() {
  return `${USER_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`;
}
