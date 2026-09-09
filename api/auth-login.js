import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { signUserSession, userSessionCookie } from '../server/user-session.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
const loginLimiter = new Map();

function getAdminClient() { if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null; return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); }
function normalizeIdentifier(value) { return String(value || '').trim(); }
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function normalizePhone(value) { const digits = String(value || '').replace(/\D/g, ''); return digits.startsWith('62') ? `0${digits.slice(2)}` : digits; }
function constantTimeStringEqual(a, b) { const left = Buffer.from(String(a ?? ''), 'utf8'); const right = Buffer.from(String(b ?? ''), 'utf8'); if (left.length !== right.length) return false; return crypto.timingSafeEqual(left, right); }
function parseScryptHash(value) {
  const parts = String(value || '').split('$');
  if (parts.length === 6 && parts[0] === 'scrypt') {
    const [, nRaw, rRaw, pRaw, saltText, hashText] = parts;
    const n = Number(nRaw), r = Number(rRaw), p = Number(pRaw);
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || !saltText || !hashText) return null;
    try { const salt = Buffer.from(saltText, 'base64url'), hash = Buffer.from(hashText, 'base64url'); if (!salt.length || !hash.length) return null; return { n, r, p, salt, hash }; } catch { return null; }
  }
  if (parts.length !== 5 || parts[0] !== 'scrypt') return null;
  const [, nRaw, rRaw, pRaw, payload] = parts;
  const [saltHex, hashHex] = payload.split(':');
  const n = Number(nRaw), r = Number(rRaw), p = Number(pRaw);
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || !saltHex || !hashHex || !/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(hashHex)) return null;
  return { n, r, p, salt: Buffer.from(saltHex, 'hex'), hash: Buffer.from(hashHex, 'hex') };
}
function hashPassword(password) { const salt = crypto.randomBytes(16), n = 16384, r = 8, p = 1; const hash = crypto.scryptSync(String(password), salt, 64, { N: n, r, p, maxmem: 32 * 1024 * 1024 }); return `scrypt$${n}$${r}$${p}$${salt.toString('hex')}:${hash.toString('hex')}`; }
function verifyPassword(password, encoded) { const parsed = parseScryptHash(encoded); if (!parsed) return false; try { const hash = crypto.scryptSync(String(password), parsed.salt, parsed.hash.length, { N: parsed.n, r: parsed.r, p: parsed.p, maxmem: 32 * 1024 * 1024 }); return crypto.timingSafeEqual(hash, parsed.hash); } catch { return false; } }
function getRateKey(req, identifier) { const forwarded = req.headers?.['x-forwarded-for']; const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim(); return `${ip}:${normalizeIdentifier(identifier).toLowerCase()}`; }
function allowLogin(req, identifier) { const key = getRateKey(req, identifier), now = Date.now(); const current = (loginLimiter.get(key) || []).filter((ts) => now - ts < WINDOW_MS); if (current.length >= MAX_ATTEMPTS) return false; current.push(now); loginLimiter.set(key, current); return true; }
const USER_FIELDS = 'id,name,store_name,email,phone,region,district,avatar,bio,status,deleted_at,is_demo,created_at,password_hash,password';
async function findUser(supabase, identifier) { const clean = normalizeIdentifier(identifier), email = normalizeEmail(clean), phone = normalizePhone(clean); const queries = [supabase.from('users').select(USER_FIELDS).eq('email', email).limit(1), supabase.from('users').select(USER_FIELDS).eq('name', clean).limit(1), supabase.from('users').select(USER_FIELDS).eq('store_name', clean).limit(1)]; if (phone.length >= 7) { queries.push(supabase.from('users').select(USER_FIELDS).eq('phone', clean).limit(1)); queries.push(supabase.from('users').select(USER_FIELDS).eq('phone', phone).limit(1)); } const results = await Promise.all(queries), candidates = []; for (const result of results) { if (result.error) throw result.error; if (Array.isArray(result.data) && result.data[0]) candidates.push(result.data[0]); } if (!candidates.length) return null; return candidates.find((user) => !user.deleted_at && String(user.status || 'active').toLowerCase() !== 'deleted') || candidates[0]; }
function publicUser(user) { return { id: user.id, name: user.name, storeName: user.store_name || user.name, email: user.email, phone: user.phone, region: user.region, district: user.district, avatar: user.avatar ?? null, bio: user.bio, status: user.status || 'active', deletedAt: user.deleted_at || null, isDemo: user.is_demo, createdAt: user.created_at }; }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'Authentication service is not configured on the server.' });
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const identifier = normalizeIdentifier(body?.identifier), password = String(body?.password || '');
    if (!identifier) return res.status(400).json({ success: false, error: 'Identifier harus diisi.' });
    if (!password) return res.status(400).json({ success: false, error: 'Password harus diisi.' });
    if (!allowLogin(req, identifier)) return res.status(429).json({ success: false, error: 'Terlalu banyak percobaan login. Silakan coba lagi beberapa menit lagi.' });
    const user = await findUser(supabase, identifier);
    const genericFailure = () => res.status(401).json({ success: false, error: 'Nomor WhatsApp / Email / Nama Toko atau password tidak cocok.' });
    if (!user) return genericFailure();
    const accountStatus = String(user.status || 'active').toLowerCase();
    if (accountStatus === 'deleted' || user.deleted_at) return res.status(403).json({ success: false, error: 'Akun telah dinonaktifkan atau dihapus.' });
    if (accountStatus === 'suspended') return res.status(403).json({ success: false, error: 'Akun sedang ditangguhkan oleh Admin.' });
    let valid = false, needsLegacyMigration = false;
    if (user.password_hash) valid = verifyPassword(password, user.password_hash);
    else if (user.password) { valid = constantTimeStringEqual(user.password, password); needsLegacyMigration = valid; }
    if (!valid) return genericFailure();
    if (needsLegacyMigration) { const upgradedHash = hashPassword(password); const { error: upgradeError } = await supabase.from('users').update({ password_hash: upgradedHash, password: null, updated_at: new Date().toISOString() }).eq('id', user.id); if (upgradeError) console.error('[Auth Migration]', upgradeError.message); }
    const sessionToken = signUserSession(user);
    if (!sessionToken) return res.status(503).json({ success: false, error: 'User session service is not configured on the server.' });
    res.setHeader('Set-Cookie', userSessionCookie(sessionToken));
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) { console.error('[Auth Login Error]', { name: error.name, message: error.message }); return res.status(500).json({ success: false, error: 'Internal Server Error' }); }
}
