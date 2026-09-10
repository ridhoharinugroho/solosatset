import { createClient } from '@supabase/supabase-js';
import { getUserSessionFromRequest } from '../server/user-session.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
function clean(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function normalizeEmail(value) { const email = clean(value, 254).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''; }
function publicFields() { return 'id,name,store_name,email,phone,region,district,avatar,bio,status,deleted_at,is_demo,created_at'; }

export default async function handler(req, res) {
  if (!['GET', 'PATCH', 'POST'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  const session = getUserSessionFromRequest(req);
  if (!session?.sub) return res.status(401).json({ success: false, error: 'Authentication required.' });
  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'Profile service is not configured on the server.' });

  try {
    const userId = clean(session.sub, 128);
    
    // Security: Verify user status in DB for all actions
    const { data: authUser, error: authErr } = await supabase.from('users').select('status, deleted_at').eq('id', userId).maybeSingle();
    if (authErr || !authUser) return res.status(401).json({ success: false, error: 'Authentication failed. User account not found.' });
    const statusStr = String(authUser.status || 'active').toLowerCase();
    if (authUser.deleted_at || statusStr === 'deleted' || statusStr === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account is suspended or deleted.' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('users').select(publicFields()).eq('id', userId).maybeSingle();
      if (error) throw error;
      return res.status(200).json({ success: true, user: data });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const action = clean(body?.action, 32).toLowerCase();
    if (action === 'deactivate') {
      const { error } = await supabase.from('users').update({ status: 'deleted', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (action === 'update_interests') {
      const interests = Array.isArray(body?.interests)
        ? body.interests.map((item) => clean(item, 80).toLowerCase()).filter(Boolean).slice(-3)
        : [];
      const { error } = await supabase.from('users').update({ interests, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
      return res.status(200).json({ success: true, interests });
    }

    const updates = {};
    if (body?.name !== undefined) updates.name = clean(body.name, 120);
    if (body?.storeName !== undefined) updates.store_name = clean(body.storeName, 160);
    if (body?.email !== undefined) { const email = normalizeEmail(body.email); if (!email) return res.status(400).json({ success: false, error: 'Alamat email tidak valid.' }); updates.email = email; }
    if (body?.phone !== undefined) updates.phone = clean(body.phone, 32);
    if (body?.region !== undefined) updates.region = clean(body.region, 80).toLowerCase();
    if (body?.district !== undefined) updates.district = clean(body.district, 100);
    if (body?.bio !== undefined) updates.bio = clean(body.bio, 1000);
    if (body?.avatar !== undefined) updates.avatar = body.avatar ? clean(body.avatar, 2000) : null;
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: 'Tidak ada perubahan profil.' });
    updates.updated_at = new Date().toISOString();

    if (updates.email) {
      const { data, error } = await supabase.from('users').select('id').eq('email', updates.email).neq('id', userId).limit(1);
      if (error) throw error;
      if (data?.length) return res.status(409).json({ success: false, error: 'Email sudah digunakan akun lain.' });
    }
    if (updates.phone) {
      const { data, error } = await supabase.from('users').select('id').eq('phone', updates.phone).neq('id', userId).limit(1);
      if (error) throw error;
      if (data?.length) return res.status(409).json({ success: false, error: 'Nomor WhatsApp sudah digunakan akun lain.' });
    }

    const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select(publicFields()).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Profil pengguna tidak ditemukan.' });
    return res.status(200).json({ success: true, user: data });
  } catch (error) {
    console.error('[User Profile Error]', { name: error?.name, code: error?.code, message: error?.message });
    if (String(error?.code || '') === '23505') return res.status(409).json({ success: false, error: 'Email atau nomor WhatsApp sudah digunakan akun lain.' });
    return res.status(500).json({ success: false, error: 'Profil pengguna gagal diproses.' });
  }
}