import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || SERVICE_KEY;
const loginAttempts = new Map();

function admin() {
  if (!SUPABASE_URL || !SERVICE_KEY || !SESSION_SECRET) throw new Error('Server database configuration is unavailable.');
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
function hashPassword(password, salt = crypto.randomBytes(16)) {
  const derived = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}
function verifyPassword(password, encoded) {
  const parts = String(encoded || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltText, hashText] = parts;
  const N = Number(n), R = Number(r), P = Number(p);
  if (!Number.isSafeInteger(N) || !Number.isSafeInteger(R) || !Number.isSafeInteger(P) || N < 2 || R < 1 || P < 1) return false;
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(hashText, 'base64url');
  if (!salt.length || !expected.length || expected.length > 1024) return false;
  const actual = crypto.scryptSync(String(password), salt, expected.length, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function sameSecret(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function clean(v) { return String(v || '').trim(); }
function cleanEmail(v) { return clean(v).toLowerCase(); }
function clientIp(req) { return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'; }
function rateLimited(ip) {
  const now = Date.now();
  const item = loginAttempts.get(ip);
  if (!item || now - item.start >= LOGIN_WINDOW_MS) { loginAttempts.set(ip, { start: now, count: 0 }); return false; }
  return item.count >= MAX_LOGIN_ATTEMPTS;
}
function failedLogin(ip) {
  const now = Date.now();
  const item = loginAttempts.get(ip);
  if (!item || now - item.start >= LOGIN_WINDOW_MS) loginAttempts.set(ip, { start: now, count: 1 });
  else item.count += 1;
}
function clearLoginRate(ip) { loginAttempts.delete(ip); }
function issueSession(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: String(userId), exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

const USER_FIELDS = 'id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,created_at,password_hash,password';

async function firstUser(query) {
  const { data, error } = await query.select(USER_FIELDS).limit(1);
  if (error) throw new Error('Data akun tidak dapat dibaca.');
  return Array.isArray(data) ? (data[0] || null) : null;
}
async function findUser(db, identifier) {
  const value = clean(identifier);
  const email = cleanEmail(value);
  const digits = value.replace(/\D/g, '');
  const byEmail = await firstUser(db.from('users').eq('email', email));
  if (byEmail) return byEmail;
  if (digits.length >= 7) {
    const byPhone = await firstUser(db.from('users').eq('phone', value));
    if (byPhone) return byPhone;
  }
  const byName = await firstUser(db.from('users').eq('name', value));
  if (byName) return byName;
  return firstUser(db.from('users').eq('store_name', value));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  const ip = clientIp(req);
  if (rateLimited(ip)) return res.status(429).json({ success: false, error: 'Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const identifier = clean(body.identifier);
    const password = String(body.password || '');
    if (!identifier || !password) { failedLogin(ip); return res.status(400).json({ success: false, error: 'Identifier dan password wajib diisi.' }); }
    const db = admin();
    const user = await findUser(db, identifier);
    if (!user || user.deleted_at || (user.status || 'active').toLowerCase() === 'deleted') { failedLogin(ip); throw new Error('Akun tidak ditemukan.'); }
    if ((user.status || 'active').toLowerCase() === 'suspended') { failedLogin(ip); throw new Error('Akun sedang ditangguhkan oleh Admin.'); }

    let valid = user.password_hash ? verifyPassword(password, user.password_hash) : false;
    let migrated = false;
    if (!valid && user.password && sameSecret(user.password, password)) {
      valid = true;
      const passwordHash = hashPassword(password);
      const { error } = await db.from('users').update({ password_hash: passwordHash, password: null, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) throw new Error('Password akun gagal diamankan.');
      migrated = true;
    }
    if (!valid) { failedLogin(ip); throw new Error('Password yang Anda masukkan salah.'); }
    clearLoginRate(ip);

    return res.status(200).json({ success: true, migrated, sessionToken: issueSession(user.id), user: {
      id: user.id, name: user.name, storeName: user.store_name || user.name, email: user.email,
      phone: user.phone, region: user.region, district: user.district, avatar: user.avatar,
      bio: user.bio, status: user.status || 'active', deletedAt: user.deleted_at || null,
      isDemo: user.is_demo, createdAt: user.created_at
    }});
  } catch (e) {
    console.error('[Server Login Error]', { name: e.name, code: e.code, message: e.message });
    const message = e.message || 'Login gagal.';
    const clientError = /wajib diisi|tidak ditemukan|ditangguhkan|salah/i.test(message);
    return res.status(clientError ? 400 : 500).json({ success: false, error: clientError ? message : 'Login gagal diproses oleh server.' });
  }
}
