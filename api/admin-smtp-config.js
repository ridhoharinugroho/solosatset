import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function isAdminSession(req) {
  const cookie = String(req.headers.cookie || '');
  return cookie.split(';').some((part) => part.trim().startsWith('admin_session='));
}

function safeConfig(settings = {}) {
  return {
    host: settings.host || 'smtp.gmail.com',
    port: Number(settings.port || 465),
    secure: settings.secure !== false,
    user: settings.user || settings.senderEmail || settings.from || '',
    fromName: settings.fromName || settings.senderName || 'Pusat Jual Beli Solo Raya',
    from: settings.from || settings.senderEmail || settings.user || '',
    configured: Boolean(settings.pass)
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!isAdminSession(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const db = supabaseAdmin();
  if (!db) return res.status(500).json({ success: false, error: 'Server Supabase configuration is missing.' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await db.from('app_smtp_config').select('settings_json').eq('id', 'config').maybeSingle();
      if (error) throw error;
      let settings = {};
      if (data?.settings_json) settings = typeof data.settings_json === 'string' ? JSON.parse(data.settings_json) : data.settings_json;
      return res.status(200).json({ success: true, config: safeConfig(settings) });
    }

    if (req.method !== 'POST' && req.method !== 'PUT') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const current = await db.from('app_smtp_config').select('settings_json').eq('id', 'config').maybeSingle();
    if (current.error) throw current.error;
    let previous = {};
    if (current.data?.settings_json) previous = typeof current.data.settings_json === 'string' ? JSON.parse(current.data.settings_json) : current.data.settings_json;

    const next = {
      ...previous,
      host: String(body.host || previous.host || 'smtp.gmail.com').trim(),
      port: Number(body.port || previous.port || 465),
      secure: body.secure !== undefined ? Boolean(body.secure) : (previous.secure !== undefined ? Boolean(previous.secure) : true),
      user: String(body.user || previous.user || '').trim(),
      fromName: String(body.fromName || previous.fromName || previous.senderName || 'Pusat Jual Beli Solo Raya').trim(),
      from: String(body.from || body.user || previous.from || previous.user || '').trim(),
      senderEmail: String(body.from || body.user || previous.senderEmail || previous.from || previous.user || '').trim()
    };

    // Blank password means keep the existing secret; a supplied password is stored server-side only.
    if (typeof body.pass === 'string' && body.pass.trim()) next.pass = body.pass.trim().replace(/\s+/g, '');

    const { error } = await db.from('app_smtp_config').upsert({ id: 'config', settings_json: next }, { onConflict: 'id' });
    if (error) throw error;

    return res.status(200).json({ success: true, config: safeConfig(next) });
  } catch (error) {
    console.error('[Admin SMTP Config Error]', error.message);
    return res.status(500).json({ success: false, error: 'Gagal memproses konfigurasi SMTP.' });
  }
}
