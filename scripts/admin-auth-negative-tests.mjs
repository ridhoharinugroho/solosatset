import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import handler, { SESSION_COOKIE, getAdminSessionFromRequest } from '../api/admin-auth.js';

const username = 'admin-test';
const password = 'TestPassword-123!';
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, 64, {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
});

// Keep this unit-style test isolated from any developer/CI Supabase credentials.
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.ADMIN_USERNAME = username;
process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}$16384,8,1`;
process.env.ADMIN_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(key, value) { this.headers[key] = value; return this; },
    end(body) { this.body = body; return this; },
    json(payload) { this.body = JSON.stringify(payload); return this; }
  };
}

const loginResponse = makeResponse();
await handler({
  method: 'POST',
  query: { action: 'login' },
  headers: { 'x-forwarded-for': '127.0.0.10' },
  body: { username, password },
  socket: { remoteAddress: '127.0.0.10' }
}, loginResponse);

assert.equal(loginResponse.statusCode, 200);
assert.match(String(loginResponse.headers['Set-Cookie']), new RegExp(`^${SESSION_COOKIE}=`));
const cookie = String(loginResponse.headers['Set-Cookie']).split(';')[0];
assert.equal(getAdminSessionFromRequest({ headers: { cookie } })?.role, 'admin');
assert.equal(getAdminSessionFromRequest({ headers: { cookie } })?.username, username);

// Wrong credentials must fail and must not issue a session.
const wrongPasswordResponse = makeResponse();
await handler({
  method: 'POST',
  query: { action: 'login' },
  headers: { 'x-forwarded-for': '127.0.0.11' },
  body: { username, password: 'WrongPassword-123!' },
  socket: { remoteAddress: '127.0.0.11' }
}, wrongPasswordResponse);
assert.equal(wrongPasswordResponse.statusCode, 401);
assert.equal(wrongPasswordResponse.headers['Set-Cookie'], undefined);

// Unrecognized password-hash formats must fail closed rather than acting as plaintext.
process.env.ADMIN_PASSWORD_HASH = 'plaintext-password-should-never-be-accepted';
const malformedHashResponse = makeResponse();
await handler({
  method: 'POST',
  query: { action: 'login' },
  headers: { 'x-forwarded-for': '127.0.0.12' },
  body: { username, password: 'plaintext-password-should-never-be-accepted' },
  socket: { remoteAddress: '127.0.0.12' }
}, malformedHashResponse);
assert.equal(malformedHashResponse.statusCode, 503);
assert.equal(malformedHashResponse.headers['Set-Cookie'], undefined);

process.env.ADMIN_PASSWORD_HASH = `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}$16384,8,1`;

const tampered = cookie.replace(/\.([^;]+)$/, '.tampered');
assert.equal(getAdminSessionFromRequest({ headers: { cookie: tampered } }), null);
assert.equal(getAdminSessionFromRequest({ headers: { cookie: `${SESSION_COOKIE}=not-a-token` } }), null);

const logoutResponse = makeResponse();
await handler({ method: 'POST', query: { action: 'logout' }, headers: {} }, logoutResponse);
assert.equal(logoutResponse.statusCode, 200);
assert.match(String(logoutResponse.headers['Set-Cookie']), /Max-Age=0/);

console.log('Admin authentication negative tests passed.');
