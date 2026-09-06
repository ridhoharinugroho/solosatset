const STORAGE_KEY_SMTP_CONFIG = 'pusat_barkas_smtp_config';

// SMTP secrets are server-only. The browser keeps only non-sensitive display settings.
export const DEFAULT_SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: 'solosatset.soloraya@gmail.com',
  pass: '',
  fromName: 'Pusat Jual Beli Solo Raya',
  from: 'solosatset.soloraya@gmail.com'
};

let cachedClientSmtpConfig = null;

function sanitizeClientConfig(config = {}) {
  const current = cachedClientSmtpConfig || DEFAULT_SMTP_CONFIG;
  const user = String(config.user || current.user || '').trim();
  const host = String(config.host || current.host || 'smtp.gmail.com').trim();
  const port = Number(config.port || current.port || (host === 'smtp.gmail.com' ? 465 : 587));
  const secure = config.secure !== undefined ? Boolean(config.secure) : port === 465;
  const fromName = String(config.fromName || config.senderName || current.fromName || 'Pusat Jual Beli Solo Raya').trim();

  return { host, port, secure, user, pass: '', fromName, from: user };
}

/** Legacy compatibility: SMTP credentials are never fetched into the browser. */
export async function fetchCloudSmtpConfig() {
  return null;
}

export function getSmtpConfig() {
  try {
    const raw = window.__smtpConfigCache;
    if (raw && typeof raw === 'object') return sanitizeClientConfig(raw);
  } catch (e) {}
  return sanitizeClientConfig(cachedClientSmtpConfig || DEFAULT_SMTP_CONFIG);
}

/**
 * Legacy compatibility: never persist SMTP passwords to localStorage, window globals, or Supabase.
 */
export async function saveSmtpConfig(config = {}, syncToCloud = true) {
  const updated = sanitizeClientConfig(config);
  cachedClientSmtpConfig = updated;
  try {
    window.__smtpConfigCache = updated;
    window.localStorage?.removeItem(STORAGE_KEY_SMTP_CONFIG);
  } catch (e) {}
  if (syncToCloud) {
    console.warn('[SMTP Security] Client-side SMTP persistence is disabled. Configure SMTP on the server.');
  }
  return updated;
}

/** Client dispatcher. No SMTP credential is sent to the server. */
export async function sendEmail({ to, subject, html, text, type = 'general' }) {
  if (!to || !to.includes('@')) throw new Error('Alamat email penerima tidak valid.');

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: to.trim().toLowerCase(),
        subject,
        html,
        text: text || '',
        type
      })
    });

    const result = await response.json().catch(() => ({
      success: false,
      error: `HTTP Error ${response.status}`
    }));

    if (!response.ok) {
      console.error('[Email Dispatcher Server Error]', result.error || result);
      return { success: false, error: result.error || 'Gagal mengirim email via SMTP server.' };
    }

    console.log('[Email Dispatcher] Transactional email dispatched successfully.');
    return { success: true, result };
  } catch (err) {
    console.error('[Email Dispatcher Network/Gateway Error]', err);
    return { success: false, error: err.message || 'Gagal terhubung ke gateway SMTP server backend.' };
  }
}

export async function sendWelcomeRegistrationEmail(user) {
  if (!user?.email) return { success: false, error: 'Email pengguna tidak tersedia.' };

  const subject = '🎉 Selamat Datang di Pusat Jual Beli Solo Raya - Akun Toko Anda Aktif!';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selamat Datang di Pusat Jual Beli Solo Raya</title></head><body style="margin:0;padding:20px;background:#f8fafc;font-family:Segoe UI,Tahoma,sans-serif;color:#1e293b"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden"><div style="padding:32px 24px;background:linear-gradient(135deg,#881337,#be123c);color:#fff;text-align:center"><div style="font-size:11px;font-weight:800;text-transform:uppercase">Pusat Jual Beli Solo Raya</div><h1 style="margin:10px 0 0;font-size:24px">Sugeng Rawuh, Lur! 🎉</h1></div><div style="padding:28px"><p>Halo, <b>${user.name || user.storeName || 'Pengguna'}</b>!</p><p>Selamat! Akun Anda telah berhasil terdaftar dan aktif di <b>Pusat Jual Beli Solo Raya</b>.</p><p>Anda sekarang dapat mulai memasang iklan dan menjangkau pembeli di seluruh wilayah Solo Raya.</p><a href="https://solosatset.vercel.app/" style="display:inline-block;margin:18px 0;padding:13px 24px;border-radius:12px;background:#881337;color:#fff;text-decoration:none;font-weight:800">Buka Web & Mulai Pasang Iklan 🚀</a></div><div style="padding:18px 28px;background:#f1f5f9;color:#64748b;font-size:11px;text-align:center">© 2026 Pusat Jual Beli Solo Raya</div></div></body></html>`;

  return sendEmail({ to: user.email, subject, html, type: 'registration_welcome' });
}

export async function sendPasswordResetEmail({ email, userName, resetCode }) {
  if (!email || !resetCode) return { success: false, error: 'Data reset password tidak lengkap.' };

  const subject = '🔐 Kode Pemulihan Password Akun - Pusat Jual Beli Solo Raya';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset Password Akun</title></head><body style="margin:0;padding:20px;background:#f8fafc;font-family:Segoe UI,Tahoma,sans-serif;color:#1e293b"><div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden"><div style="padding:28px 24px;background:linear-gradient(135deg,#881337,#4c0519);color:#fff;text-align:center"><div style="font-size:30px">🔐</div><h1 style="margin:8px 0 0;font-size:22px">Pemulihan Password Akun</h1></div><div style="padding:28px;text-align:center"><p style="text-align:left">Halo <b>${userName || 'Pengguna'}</b>, kami menerima permintaan untuk mengatur ulang password akun Anda.</p><div style="margin:22px 0;padding:20px;border:2px dashed #f59e0b;border-radius:18px;background:#fffbeb"><div style="font-size:11px;font-weight:800;color:#92400e">KODE VERIFIKASI</div><div style="font:900 36px/1.2 Courier New,monospace;letter-spacing:8px;color:#881337">${resetCode}</div><div style="font-size:12px;color:#b45309;font-weight:700">Berlaku selama 15 menit</div></div><p style="text-align:left">Jangan pernah memberikan kode ini kepada orang lain. Bila Anda tidak meminta reset password, abaikan email ini.</p></div><div style="padding:18px 28px;background:#f1f5f9;color:#64748b;font-size:11px;text-align:center">© 2026 Pusat Jual Beli Solo Raya</div></div></body></html>`;

  return sendEmail({ to: email, subject, html, type: 'password_reset' });
}

/** SMTP test requires server-verifiable admin authorization and remains disabled client-side. */
export async function sendTestEmail({ toEmail }) {
  const target = String(toEmail || getSmtpConfig().user || '').trim();
  if (!target) return { success: false, error: 'Email pengujian tidak tersedia.' };

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'test_connection', type: 'test_smtp' })
    });
    const result = await response.json().catch(() => ({ success: false }));
    return response.ok ? result : { success: false, error: result.error || 'SMTP test belum diaktifkan untuk client.' };
  } catch (err) {
    return { success: false, error: err.message || 'Gagal menguji koneksi SMTP.' };
  }
}
