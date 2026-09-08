import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function admin() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Server database configuration is unavailable.');
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const derived = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

function verifyPassword(password, encoded) {
  const parts = String(encoded || '').split('$');
  if (parts.length !== 7 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltText, hashText] = parts;
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(hashText, 'base64url');
  const actual = crypto.scryptSync(String(password), salt, expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function clean(v) { return String(v || '').trim(); }
function cleanEmail(v) { return clean(v).toLowerCase(); }

async function findUser(db, identifier) {
  const value = clean(identifier);
  const email = cleanEmail(value);
  const digits = value.replace(/\D/g, '');
  const { data, error } = await db.from('users').select('id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,created_at,password_hash,password,is_verified').or(`email.eq.${email},name.ilike.${value},store_name.ilike.${value}`).maybeSingle();
  if (error && !digits) throw new Error('Data akun tidak dapat dibaca.');
  if (data) return data;
  if (digits.length >= 7) {
    const result = await db.from('users').select('id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,created_at,password_hash,password,is_verified').eq('phone', value).maybeSingle();
    if (result.error) throw new Error('Data akun tidak dapat dibaca.');
    return result.data || null;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const identifier = clean(body.identifier);
    const password = String(body.password || '');
    if (!identifier || !password) return res.status(400).json({ success: false, error: 'Identifier dan password wajib diisi.' });

    const db = admin();
    const user = await findUser(db, identifier);
    if (!user || user.deleted_at || (user.status || 'active').toLowerCase() === 'deleted') throw new Error('Akun tidak ditemukan.');
    if ((user.status || 'active').toLowerCase() === 'suspended') throw new Error('Akun sedang ditangguhkan oleh Admin.');

    let valid = user.password_hash ? verifyPassword(password, user.password_hash) : false;
    let migrated = false;
    if (!valid && user.password && crypto.timingSafeEqual(Buffer.from(String(user.password)), Buffer.from(password))) {
      valid = true;
      const passwordHash = hashPassword(password);
      await db.from('users').update({ password_hash: passwordHash, password: null, updated_at: new Date().toISOString() }).eq('id', user.id);
      migrated = true;
    }
    if (!valid) throw new Error('Password yang Anda masukkan salah.');

    return res.status(200).json({ success: true, migrated, user: {
      id: user.id, name: user.name, storeName: user.store_name || user.name, email: user.email,
      phone: user.phone, region: user.region, district: user.district, avatar: user.avatar,
      bio: user.bio, status: user.status || 'active', deletedAt: user.deleted_at || null,
      isDemo: user.is_demo, createdAt: user.created_at, isVerified: user.is_verified !== false
    }});
  } catch (e) {
    console.error('[Server Login Error]', { name: e.name, message: e.message });
    return res.status(400).json({ success: false, error: e.message || 'Login gagal.' });
  }
}
