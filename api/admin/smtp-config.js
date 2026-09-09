import { createClient } from '@supabase/supabase-js';
import { getAdminSessionFromRequest } from '../admin-auth.js';

const DEFAULT_FROM_EMAIL = 'solosatset.soloraya@gmail.com';

function getSupabaseAdmin() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function safeConfig(config = {}, hasPassword = false) {
  return {
    host: typeof config.host === 'string' && config.host.trim() ? config.host.trim() : 'smtp.gmail.com',
    port: Number(config.port) || 465,
    secure: config.secure !== undefined ? Boolean(config.secure) : true,
    user: typeof config.user === 'string' && config.user.trim() ? config.user.trim() : DEFAULT_FROM_EMAIL,
    fromName: typeof config.fromName === 'string' && config.fromName.trim() ? config.fromName.trim() : 'Pusat Jual Beli Solo Raya',
    from: typeof config.from === 'string' && config.from.trim() ? config.from.trim() : (config.user || DEFAULT_FROM_EMAIL),
    hasPassword
  };
}

function parseSettings(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new Error('Konfigurasi SMTP tersimpan tidak valid.');
  }
}

function adminOnly(req, res) {
  if (!getAdminSessionFromRequest(req)) {
    res.status(401).json({ ok: false, error: 'Sesi admin tidak valid atau sudah berakhir.' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!['GET', 'POST'].includes(String(req.method || '').toUpperCase())) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  if (!adminOnly(req, res)) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase service role belum dikonfigurasi di server.' });

  try {
    const { data: row, error: readError } = await supabase
      .from('app_smtp_config')
      .select('settings_json')
      .eq('id', 'config')
      .maybeSingle();

    if (readError) throw new Error('Gagal membaca konfigurasi SMTP server.');
    const current = parseSettings(row?.settings_json);

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, config: safeConfig(current, Boolean(current.pass)) });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const input = body?.config && typeof body.config === 'object' ? body.config : body;
    const next = {
      host: String(input?.host || current.host || 'smtp.gmail.com').trim(),
      port: Number(input?.port || current.port || 465),
      secure: input?.secure !== undefined ? Boolean(input.secure) : (current.secure !== undefined ? Boolean(current.secure) : true),
      user: String(input?.user || current.user || DEFAULT_FROM_EMAIL).trim(),
      fromName: String(input?.fromName || current.fromName || current.senderName || 'Pusat Jual Beli Solo Raya').trim(),
      from: String(input?.from || current.from || current.senderEmail || input?.user || current.user || DEFAULT_FROM_EMAIL).trim(),
      pass: typeof input?.pass === 'string' && input.pass.trim() ? input.pass.replace(/\s+/g, '') : String(current.pass || '')
    };

    if (!next.user || !next.pass) {
      return res.status(400).json({ ok: false, error: 'Username dan password SMTP wajib tersedia. Password lama tetap dipakai jika kolom password dikosongkan.' });
    }

    const { error: upsertError } = await supabase
      .from('app_smtp_config')
      .upsert({
        id: 'config',
        settings_json: next,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (upsertError) throw new Error('Gagal menyimpan konfigurasi SMTP server.');

    return res.status(200).json({ ok: true, config: safeConfig(next, true), message: 'Konfigurasi SMTP tersimpan di server.' });
  } catch (error) {
    console.error('[Admin SMTP Config Error]', error);
    return res.status(500).json({ ok: false, error: error.message || 'Gagal memproses konfigurasi SMTP.' });
  }
}
