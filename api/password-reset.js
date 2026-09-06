import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS = 3;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const requestLimiter = new Map();

function getAdminClient() { if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null; return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); }
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function normalizeOtp(value) { return String(value || '').trim().replace(/\D/g, ''); }
function hashOtp(code) { return crypto.createHash('sha256').update(String(code)).digest('hex'); }
function hashPassword(password) { const salt = crypto.randomBytes(16), n = 16384, r = 8, p = 1; const hash = crypto.scryptSync(String(password), salt, 64, { N: n, r, p, maxmem: 32 * 1024 * 1024 }); return `scrypt$${n}$${r}$${p}$${salt.toString('hex')}:${hash.toString('hex')}`; }
function safeEqualHex(left, right) { try { const a = Buffer.from(String(left), 'hex'), b = Buffer.from(String(right), 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); } catch { return false; } }
function getRequestKey(req, email) { const forwarded = req.headers?.['x-forwarded-for']; const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim(); return `${ip}:${email}`; }
function allowRequest(req, email) { const key = getRequestKey(req, email), now = Date.now(); const recent = (requestLimiter.get(key) || []).filter((ts) => now - ts < REQUEST_WINDOW_MS); if (recent.length >= MAX_REQUESTS) return false; recent.push(now); requestLimiter.set(key, recent); return true; }
function getSmtpConfig() { const host = String(process.env.SMTP_HOST || '').trim(); const port = Number(process.env.SMTP_PORT || 465); const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465; const user = String(process.env.SMTP_USER || '').trim(); const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, ''); const fromName = String(process.env.SMTP_FROM_NAME || 'Pusat Jual Beli Solo Raya').trim(); const fromEmail = String(process.env.SMTP_FROM || user).trim(); if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !fromEmail) throw new Error('SMTP configuration is incomplete.'); return { host, port, secure, user, pass, fromName, fromEmail }; }
function buildResetEmail({ userName, email, resetCode }) { const safeName = String(userName || 'Pengguna').replace(/[<>]/g, ''); const safeEmail = String(email).replace(/[<>]/g, ''); const subject = 'Kode Pemulihan Password - Pusat Jual Beli Solo Raya'; const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#1e293b"><div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden"><div style="background:linear-gradient(135deg,#881337,#4c0519);padding:30px 24px;color:#fff;text-align:center"><div style="font-size:30px">🔐</div><h1 style="margin:8px 0 0;font-size:22px">Pemulihan Password</h1><p style="margin:6px 0 0;color:#fecdd3;font-size:13px">Pusat Jual Beli Solo Raya</p></div><div style="padding:30px 26px"><p style="font-size:14px;line-height:1.6">Halo <b>${safeName}</b>, kami menerima permintaan untuk mengatur ulang password akun Anda.</p><div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:16px;padding:18px;text-align:center;margin:22px 0"><div style="font-size:11px;font-weight:800;color:#92400e;text-transform:uppercase">Kode Verifikasi</div><div style="font-family:Courier New,monospace;font-size:36px;font-weight:900;letter-spacing:8px;color:#881337;margin:8px 0">${resetCode}</div><div style="font-size:12px;color:#b45309;font-weight:700">Berlaku selama 15 menit</div></div><p style="font-size:13px;line-height:1.6">Masukkan kode 6 digit tersebut pada halaman pemulihan password. Jangan bagikan kode ini kepada siapa pun.</p><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:13px;font-size:11.5px;color:#991b1b;margin-top:18px">Jika Anda tidak meminta reset password, abaikan email ini.</div></div><div style="background:#f1f5f9;padding:18px;text-align:center;font-size:10.5px;color:#64748b">Email otomatis untuk ${safeEmail}.</div></div></body></html>`; return { subject, html }; }
async function sendResetEmail(params) { const smtp = getSmtpConfig(); const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.pass }, connectionTimeout: 15000 }); const mail = buildResetEmail(params); await transporter.sendMail({ from: `"${smtp.fromName}" <${smtp.fromEmail}>`, to: params.email, subject: mail.subject, html: mail.html, text: `Kode verifikasi reset password Anda: ${params.resetCode}. Berlaku selama 15 menit.` }); }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'Password reset service is not configured on the server.' });
  try {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const action = String(body?.action || '').trim().toLowerCase(), email = normalizeEmail(body?.email);
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: 'Alamat email tidak valid.' });
    if (action === 'request') {
      if (!allowRequest(req, email)) return res.status(429).json({ success: false, error: 'Terlalu banyak permintaan reset. Silakan coba lagi beberapa menit lagi.' });
      const { data: user, error: userError } = await supabase.from('users').select('id, name, store_name, email, status, deleted_at').eq('email', email).maybeSingle();
      if (userError) return res.status(500).json({ success: false, error: 'Gagal memproses permintaan reset password.' });
      if (!user || (user.status || 'active').toLowerCase() === 'deleted' || user.deleted_at) return res.status(200).json({ success: true, message: 'Jika akun ditemukan dan aktif, instruksi pemulihan telah diproses.' });
      const resetCode = String(crypto.randomInt(100000, 1000000)), createdAt = new Date().toISOString(), expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
      const { error: storeError } = await supabase.from('otp_sessions').upsert({ email, code_hash: hashOtp(resetCode), expires_at: expiresAt, attempts: 0, max_attempts: MAX_ATTEMPTS, consumed_at: null, created_at: createdAt, updated_at: createdAt }, { onConflict: 'email' });
      if (storeError) return res.status(500).json({ success: false, error: 'Gagal menyiapkan sesi reset password.' });
      try { await sendResetEmail({ email, userName: user.name || user.store_name, resetCode }); } catch (mailError) { await supabase.from('otp_sessions').update({ consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('email', email).is('consumed_at', null); console.error('[Password Reset SMTP]', mailError.message); return res.status(500).json({ success: false, error: 'Gagal mengirim email verifikasi. Silakan coba lagi.' }); }
      return res.status(200).json({ success: true, message: 'Kode verifikasi berhasil dikirim ke email Anda.', expiresAt });
    }
    if (action === 'reset') {
      const otpCode = normalizeOtp(body?.otpCode), newPassword = String(body?.newPassword || '').trim();
      if (otpCode.length !== 6) return res.status(400).json({ success: false, error: 'Masukkan kode OTP 6 digit.' });
      if (newPassword.length < 5) return res.status(400).json({ success: false, error: 'Password baru minimal 5 karakter.' });
      const { data: session, error: sessionError } = await supabase.from('otp_sessions').select('email, code_hash, expires_at, attempts, max_attempts, consumed_at').eq('email', email).maybeSingle();
      if (sessionError) return res.status(500).json({ success: false, error: 'Gagal memeriksa sesi reset password.' });
      if (!session || session.consumed_at) return res.status(400).json({ success: false, error: 'Kode verifikasi salah, sudah digunakan, atau telah kadaluarsa.' });
      if (Date.now() > new Date(session.expires_at).getTime()) { await supabase.from('otp_sessions').update({ consumed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('email', email).is('consumed_at', null); return res.status(400).json({ success: false, error: 'Kode verifikasi telah kadaluarsa. Silakan minta kode baru.' }); }
      const attempts = Number(session.attempts || 0), maxAttempts = Number(session.max_attempts || MAX_ATTEMPTS);
      if (attempts >= maxAttempts) return res.status(429).json({ success: false, error: 'Batas percobaan kode verifikasi telah tercapai. Silakan minta kode baru.' });
      if (!safeEqualHex(hashOtp(otpCode), session.code_hash)) { const nextAttempts = attempts + 1; await supabase.from('otp_sessions').update({ attempts: nextAttempts, updated_at: new Date().toISOString() }).eq('email', email).is('consumed_at', null); return res.status(nextAttempts >= maxAttempts ? 429 : 400).json({ success: false, error: nextAttempts >= maxAttempts ? 'Batas percobaan kode verifikasi telah tercapai. Silakan minta kode baru.' : 'Kode verifikasi yang Anda masukkan salah atau kadaluarsa.' }); }
      const consumedAt = new Date().toISOString();
      const { data: consumed, error: consumeError } = await supabase.from('otp_sessions').update({ consumed_at: consumedAt, updated_at: consumedAt }).eq('email', email).eq('code_hash', session.code_hash).is('consumed_at', null).select('email');
      if (consumeError || !Array.isArray(consumed) || consumed.length !== 1) return res.status(400).json({ success: false, error: 'Kode verifikasi sudah digunakan atau tidak lagi valid.' });
      const { error: passwordError } = await supabase.from('users').update({ password_hash: hashPassword(newPassword), password: null, updated_at: new Date().toISOString() }).eq('email', email).neq('status', 'deleted');
      if (passwordError) { console.error('[Password Reset Update]', passwordError.message); return res.status(500).json({ success: false, error: 'Password gagal diperbarui. Silakan lakukan reset ulang.' }); }
      return res.status(200).json({ success: true, email });
    }
    return res.status(400).json({ success: false, error: 'Action not supported' });
  } catch (error) { console.error('[Password Reset Error]', { name: error.name, code: error.code, message: error.message }); return res.status(500).json({ success: false, error: 'Internal Server Error' }); }
}
