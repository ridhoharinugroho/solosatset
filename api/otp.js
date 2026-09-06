import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_CREATE_ATTEMPTS = 3;
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const activeCreateLimiter = new Map();

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function safeEqualHex(left, right) {
  try {
    const a = Buffer.from(String(left), 'hex');
    const b = Buffer.from(String(right), 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeOtp(value) {
  return String(value || '').trim().replace(/\D/g, '');
}

function normalizePassword(value) {
  return String(value || '').trim();
}

function getClientKey(req, email) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  return `${ip}:${email}`;
}

function allowCreate(req, email) {
  const key = getClientKey(req, email);
  const now = Date.now();
  const current = activeCreateLimiter.get(key) || [];
  const recent = current.filter((ts) => now - ts < CREATE_WINDOW_MS);
  if (recent.length >= MAX_CREATE_ATTEMPTS) return false;
  recent.push(now);
  activeCreateLimiter.set(key, recent);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Pusat Jual Beli Solo Raya - OTP & Password Reset Engine',
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'OTP service is not configured on the server.'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { action, email, otpCode, newPassword } = body || {};
    const cleanEmail = normalizeEmail(email);
    const cleanCode = normalizeOtp(otpCode);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Alamat email tidak valid.' });
    }

    if (action === 'create' || action === 'store') {
      if (!cleanCode || cleanCode.length !== 6) {
        return res.status(400).json({ success: false, error: 'Kode OTP harus 6 digit.' });
      }

      if (!allowCreate(req, cleanEmail)) {
        return res.status(429).json({
          success: false,
          error: 'Terlalu banyak permintaan kode OTP. Silakan coba lagi beberapa menit lagi.'
        });
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, status, deleted_at')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (userError) {
        console.error('[OTP Create User Lookup]', userError.message);
        return res.status(500).json({ success: false, error: 'Gagal memeriksa akun.' });
      }

      if (!user || (user.status || 'active').toLowerCase() === 'deleted' || user.deleted_at) {
        // Keep response generic to reduce account enumeration.
        return res.status(200).json({
          success: true,
          message: 'Jika akun ditemukan dan aktif, kode verifikasi telah diproses.',
          expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString()
        });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString();
      const codeHash = hashOtp(cleanCode);

      const { error: upsertError } = await supabase
        .from('otp_sessions')
        .upsert({
          email: cleanEmail,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
          max_attempts: MAX_ATTEMPTS,
          consumed_at: null,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }, { onConflict: 'email' });

      if (upsertError) {
        console.error('[OTP Create Store]', upsertError.message);
        return res.status(500).json({ success: false, error: 'Gagal menyimpan sesi OTP.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Kode OTP berhasil dicatat di server.',
        expiresAt
      });
    }

    if (action === 'verify' || action === 'reset_password') {
      if (!cleanCode || cleanCode.length !== 6) {
        return res.status(400).json({ success: false, error: 'Masukkan kode OTP 6 digit.' });
      }

      const { data: session, error: sessionError } = await supabase
        .from('otp_sessions')
        .select('email, code_hash, expires_at, attempts, max_attempts, consumed_at')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (sessionError) {
        console.error('[OTP Verify Lookup]', sessionError.message);
        return res.status(500).json({ success: false, error: 'Gagal memeriksa sesi OTP.' });
      }

      if (!session || session.consumed_at) {
        return res.status(400).json({
          success: false,
          error: 'Kode verifikasi salah, sudah digunakan, atau telah kadaluarsa.'
        });
      }

      const expiresAt = session.expires_at ? new Date(session.expires_at).getTime() : 0;
      if (!expiresAt || Date.now() > expiresAt) {
        await supabase
          .from('otp_sessions')
          .update({ consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('email', cleanEmail)
          .is('consumed_at', null);
        return res.status(400).json({
          success: false,
          error: 'Kode verifikasi telah kadaluarsa. Silakan minta kode baru.'
        });
      }

      const attempts = Number.isFinite(Number(session.attempts)) ? Number(session.attempts) : 0;
      const maxAttempts = Number.isFinite(Number(session.max_attempts)) ? Number(session.max_attempts) : MAX_ATTEMPTS;
      if (attempts >= maxAttempts) {
        return res.status(429).json({
          success: false,
          error: 'Batas percobaan kode verifikasi telah tercapai. Silakan minta kode baru.'
        });
      }

      const suppliedHash = hashOtp(cleanCode);
      if (!safeEqualHex(suppliedHash, session.code_hash)) {
        const nextAttempts = attempts + 1;
        await supabase
          .from('otp_sessions')
          .update({ attempts: nextAttempts, updated_at: new Date().toISOString() })
          .eq('email', cleanEmail)
          .is('consumed_at', null);

        return res.status(nextAttempts >= maxAttempts ? 429 : 400).json({
          success: false,
          error: nextAttempts >= maxAttempts
            ? 'Batas percobaan kode verifikasi telah tercapai. Silakan minta kode baru.'
            : 'Kode verifikasi yang Anda masukkan salah atau kadaluarsa.'
        });
      }

      // Atomically consume the OTP before any password write. A second concurrent
      // request must no longer be able to consume the same session.
      const consumedAt = new Date().toISOString();
      const { data: consumedRows, error: consumeError } = await supabase
        .from('otp_sessions')
        .update({ consumed_at: consumedAt, updated_at: consumedAt })
        .eq('email', cleanEmail)
        .eq('code_hash', session.code_hash)
        .is('consumed_at', null)
        .select('email');

      if (consumeError || !Array.isArray(consumedRows) || consumedRows.length !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Kode verifikasi sudah digunakan atau tidak lagi valid.'
        });
      }

      const cleanNewPass = normalizePassword(newPassword);
      if (action === 'reset_password') {
        if (cleanNewPass.length < 5) {
          return res.status(400).json({ success: false, error: 'Password baru minimal 5 karakter.' });
        }

        const { error: passwordError } = await supabase
          .from('users')
          .update({
            password: cleanNewPass,
            updated_at: new Date().toISOString()
          })
          .eq('email', cleanEmail)
          .neq('status', 'deleted');

        if (passwordError) {
          console.error('[OTP Password Update]', passwordError.message);
          return res.status(500).json({
            success: false,
            error: 'Kode benar, tetapi password gagal diperbarui. Silakan minta kode baru.'
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: action === 'reset_password'
          ? 'Kode OTP berhasil diverifikasi dan password berhasil diperbarui.'
          : 'Kode OTP berhasil diverifikasi.'
      });
    }

    if (action === 'clear') {
      await supabase
        .from('otp_sessions')
        .update({ consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('email', cleanEmail)
        .is('consumed_at', null);

      return res.status(200).json({ success: true, message: 'OTP session cleared' });
    }

    return res.status(400).json({ success: false, error: 'Action not supported' });
  } catch (error) {
    console.error('[OTP API Error]', {
      name: error.name,
      code: error.code,
      message: error.message
    });
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
