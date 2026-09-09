const DEFAULT_FROM_EMAIL = 'solosatset.soloraya@gmail.com';

/**
 * Client-safe SMTP metadata only.
 * SMTP credentials are never stored in browser storage or returned by the server.
 */
export const DEFAULT_SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: DEFAULT_FROM_EMAIL,
  pass: '',
  fromName: 'Pusat Jual Beli Solo Raya',
  from: DEFAULT_FROM_EMAIL,
  hasPassword: false
};

export async function fetchCloudSmtpConfig() {
  try {
    const response = await fetch('/api/admin/smtp-config', { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const result = await response.json();
    return result?.config || null;
  } catch {
    return null;
  }
}

/** Return only client-safe SMTP metadata. */
export function getSmtpConfig() {
  try {
    const raw = window.__smtpConfigCache;
    if (raw) return { ...DEFAULT_SMTP_CONFIG, ...raw, pass: '' };
  } catch (e) {}
  return { ...DEFAULT_SMTP_CONFIG };
}

/** Load server-side SMTP metadata for the admin UI. */
export async function loadSmtpConfig() {
  const config = await fetchCloudSmtpConfig();
  if (!config) return getSmtpConfig();
  const safeConfig = { ...DEFAULT_SMTP_CONFIG, ...config, pass: '' };
  try { window.__smtpConfigCache = safeConfig; } catch (e) {}
  return safeConfig;
}

/** Persist SMTP settings server-side. The password is sent only over the authenticated HTTPS request. */
export async function saveSmtpConfig(config = {}) {
  const response = await fetch('/api/admin/smtp-config', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ config })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || 'Gagal menyimpan konfigurasi SMTP server.');
  }

  const safeConfig = { ...DEFAULT_SMTP_CONFIG, ...(result.config || {}), pass: '' };
  try { window.__smtpConfigCache = safeConfig; } catch (e) {}
  return safeConfig;
}

/** Email dispatcher. SMTP credentials are resolved exclusively by the server. */
export async function sendEmail({ to, subject, html, text, type = 'general', metadata = {} }) {
  if (!to || !to.includes('@')) throw new Error('Alamat email penerima tidak valid.');

  const payload = { to: to.trim().toLowerCase(), subject, html, text: text || '', type, metadata };
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const result = await response.json();
      console.log('[Email Dispatcher] Transactional email dispatched successfully.');
      return { success: true, result };
    }
    const errJson = await response.json().catch(() => ({ error: 'HTTP Error ' + response.status }));
    console.error('[Email Dispatcher Server Error]', errJson.error || errJson);
    return { success: false, error: errJson.error || 'Gagal mengirim email via SMTP server.' };
  } catch (err) {
    console.error('[Email Dispatcher Network/Gateway Error]', err);
    return { success: false, error: err.message || 'Gagal terhubung ke gateway SMTP server backend.' };
  }
}

/** 1. Kirim Email Notifikasi Registrasi Akun Baru */
export async function sendWelcomeRegistrationEmail(user) {
  if (!user || !user.email) return;
  const subject = `🎉 Selamat Datang di Pusat Jual Beli Solo Raya - Akun Toko Anda Aktif!`;
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Selamat Datang di Pusat Jual Beli Solo Raya</title>
    <style>body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8fafc;margin:0;padding:20px;color:#1e293b}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px rgba(0,0,0,.05)}.header{background:linear-gradient(135deg,#881337 0%,#be123c 100%);padding:36px 24px;text-align:center;color:#fff}.header h1{margin:0;font-size:24px;font-weight:900;letter-spacing:-.5px}.header p{margin:8px 0 0;font-size:13px;color:#fecdd3;font-weight:500}.badge-brand{display:inline-block;background:#fbbf24;color:#4c0519;font-weight:900;font-size:11px;padding:4px 12px;border-radius:999px;text-transform:uppercase;margin-bottom:12px}.content{padding:32px 28px}.greeting{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:16px}.intro-text{font-size:13.5px;line-height:1.6;color:#475569;margin-bottom:24px}.card-details{background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:20px;margin-bottom:24px}.card-title{font-size:12px;font-weight:800;text-transform:uppercase;color:#881337;margin-bottom:14px;letter-spacing:.5px}.btn-action{display:block;width:fit-content;margin:28px auto;background:#881337;color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(136,19,55,.3);text-align:center}.security-box{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:16px;padding:16px;font-size:12px;color:#065f46;line-height:1.5;margin-bottom:24px}.footer{background:#f1f5f9;padding:24px;text-align:center;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0}</style></head>
    <body><div class="container"><div class="header"><span class="badge-brand">Pusat Jual Beli Solo Raya</span><h1>Sugeng Rawuh, Lur! 🎉</h1><p>Platform Jual Beli Barang 7 Wilayah Se-Solo Raya</p></div><div class="content"><div class="greeting">Halo, ${user.name || user.storeName}!</div><p class="intro-text">Selamat! Akun Anda telah berhasil terdaftar dan aktif di <b>Pusat Jual Beli Solo Raya</b>. Anda sekarang dapat langsung memasang iklan barang dengan rasio foto 1:1 (persegi) dan menjangkau ribuan pembeli di seluruh wilayah Solo, Sukoharjo, Karanganyar, Boyolali, Sragen, Klaten, dan Wonogiri.</p><div class="card-details"><div class="card-title">📋 Ringkasan Akun Terdaftar</div><table style="width:100%;border-collapse:collapse"><tr><td style="padding:6px 0;color:#64748b;font-size:13px">Nama Toko:</td><td style="padding:6px 0;color:#0f172a;font-weight:700;font-size:13px;text-align:right">${user.storeName || user.name}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px">Nama Pemilik:</td><td style="padding:6px 0;color:#881337;font-weight:700;font-size:13px;text-align:right">${user.name || '-'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px">Nomor WhatsApp:</td><td style="padding:6px 0;color:#0f172a;font-weight:700;font-size:13px;text-align:right">${user.phone || '-'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px">Wilayah:</td><td style="padding:6px 0;color:#0f172a;font-weight:700;font-size:13px;text-align:right">${user.district ? user.district + ', ' : ''}${user.region ? user.region.toUpperCase() : 'SOLO'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px">Status Akun:</td><td style="padding:6px 0;color:#059669;font-weight:700;font-size:13px;text-align:right">✅ Aktif & Siap Jualan</td></tr></table></div><div class="security-box">🛡️ <b>Jaminan Keamanan:</b> Platform kami 100% bebas biaya komisi, bebas link judi online, pinjaman online, atau iklan mengganggu. Jual beli sat-set, pantau cocok bayar!</div><a href="https://solosatset.vercel.app/" class="btn-action">Buka Web & Mulai Pasang Iklan 🚀</a></div><div class="footer"><p>© 2026 Pusat Jual Beli Solo Raya. Dikembangkan dengan ❤️ untuk masyarakat Solo Raya.</p><p>Email otomatis ini dikirim ke <b>${user.email}</b> saat Anda mendaftar akun.</p></div></div></body></html>`;
  return sendEmail({ to: user.email, subject, html, type: 'registration_welcome', metadata: { userId: user.id, userName: user.name } });
}

/** 2. Kirim Email Kode Reset Password */
export async function sendPasswordResetEmail({ email, userName, resetCode }) {
  if (!email || !resetCode) return;
  const subject = `🔐 Kode Pemulihan Password Akun: [${resetCode}] - Pusat Jual Beli Solo Raya`;
  const html = `<p>Halo <b>${userName || 'Pengguna'}</b>,</p><p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Pusat Jual Beli Solo Raya.</p><div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:20px;padding:20px;margin:24px 0;text-align:center"><div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#92400e">KODE VERIFIKASI RESET ANDA:</div><div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:900;letter-spacing:8px;color:#881337;margin:6px 0">${resetCode}</div><div style="font-size:12px;color:#b45309;font-weight:700">⏳ Berlaku selama 15 menit</div></div><p>Masukkan kode 6 digit di atas pada halaman reset password.</p><p>⚠️ <b>Keamanan Akun:</b> Jangan pernah memberikan kode ini kepada orang lain.</p>`;
  return sendEmail({ to: email, subject, html, type: 'password_reset', metadata: { resetCode } });
}

/** 3. Kirim Email Uji Coba (Test Connection SMTP) */
export async function sendTestEmail({ toEmail } = {}) {
  const target = (toEmail || DEFAULT_FROM_EMAIL).trim();
  return sendEmail({ to: target, subject: 'Uji Coba Pengiriman Email SMTP - Pusat Jual Beli Solo Raya', html: '<p>SMTP test.</p>', type: 'test_smtp', metadata: { testedAt: new Date().toISOString() } });
}
