import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || SERVICE_KEY;

function admin() {
  if (!SUPABASE_URL || !SERVICE_KEY || !SESSION_SECRET) throw new Error('Server database configuration is unavailable.');
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
function base64(value) { return Buffer.from(value).toString('base64url'); }
function sign(value) { return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url'); }
function issueSession(userId) {
  const payload = base64(JSON.stringify({ sub: String(userId), exp: Date.now() + SESSION_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}
function verifySession(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data?.sub && Number(data.exp) > Date.now() ? data : null;
  } catch { return null; }
}
function bearer(req) { return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim(); }
function clean(v) { return String(v ?? '').trim(); }
function cleanEmail(v) { return clean(v).toLowerCase(); }

async function currentUser(db, userId) {
  const { data, error } = await db.from('users').select('id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,created_at').eq('id', userId).maybeSingle();
  if (error) throw new Error('Data akun tidak dapat dibaca.');
  if (!data || data.deleted_at || (data.status || 'active').toLowerCase() === 'deleted') throw new Error('Sesi akun tidak valid.');
  if ((data.status || 'active').toLowerCase() === 'suspended') throw new Error('Akun sedang ditangguhkan oleh Admin.');
  return data;
}
function publicUser(user) {
  return { id:user.id, name:user.name, storeName:user.store_name || user.name, email:user.email, phone:user.phone, region:user.region, district:user.district, avatar:user.avatar, bio:user.bio, status:user.status || 'active', deletedAt:user.deleted_at || null, isDemo:user.is_demo, createdAt:user.created_at };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method Not Allowed' });
  try {
    const session = verifySession(bearer(req));
    if (!session) return res.status(401).json({ success:false, error:'Sesi login tidak valid atau sudah kedaluwarsa.' });
    const db = admin();
    const user = await currentUser(db, session.sub);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = String(body.action || '');

    if (action === 'update_profile') {
      const email = cleanEmail(body.email) || user.email;
      const payload = {
        name: clean(body.name) || user.name || null,
        store_name: clean(body.storeName) || user.store_name || null,
        email,
        phone: clean(body.phone) || user.phone || null,
        region: clean(body.region) || user.region || null,
        district: clean(body.district) || user.district || null,
        bio: body.bio !== undefined ? clean(body.bio) : user.bio || null,
        avatar: body.avatar !== undefined ? body.avatar : user.avatar || null,
        updated_at: new Date().toISOString()
      };
      if (payload.name.length < 2 || payload.store_name.length < 2 || payload.phone.replace(/\D/g, '').length < 9 || !payload.region || !payload.district) return res.status(400).json({ success:false, error:'Data profil tidak lengkap.' });
      const { data: duplicate, error: duplicateError } = await db.from('users').select('id').eq('email', email).neq('id', user.id).limit(1);
      if (duplicateError) throw new Error('Data akun tidak dapat divalidasi.');
      if (duplicate?.length) return res.status(400).json({ success:false, error:'Email sudah digunakan akun lain.' });
      const { data, error } = await db.from('users').update(payload).eq('id', user.id).select('id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,created_at').single();
      if (error) throw new Error('Profil gagal diperbarui.');
      return res.status(200).json({ success:true, user:publicUser(data) });
    }

    if (action === 'update_avatar') {
      const avatar = body.avatar ? clean(body.avatar) : null;
      const { data, error } = await db.from('users').update({ avatar, updated_at:new Date().toISOString() }).eq('id', user.id).select('id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,created_at').single();
      if (error) throw new Error('Foto profil gagal diperbarui.');
      return res.status(200).json({ success:true, user:publicUser(data), avatar });
    }

    if (action === 'deactivate') {
      const { error } = await db.from('users').update({ status:'deleted', deleted_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id', user.id);
      if (error) throw new Error('Akun gagal dinonaktifkan.');
      return res.status(200).json({ success:true, message:'Akun berhasil dinonaktifkan.' });
    }

    return res.status(400).json({ success:false, error:'Aksi profil tidak dikenali.' });
  } catch (e) {
    console.error('[Profile Server Error]', { name:e.name, code:e.code, message:e.message });
    const status = /sesi|ditangguhkan|tidak lengkap|sudah digunakan/i.test(e.message) ? 400 : 500;
    return res.status(status).json({ success:false, error: status === 400 ? e.message : 'Profil gagal diproses oleh server.' });
  }
}
