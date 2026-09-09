const DEFAULT_FROM_EMAIL = 'solosatset.soloraya@gmail.com';

/**
 * Client-safe SMTP metadata only.
 * SMTP credentials are never stored, fetched, cached, or sent by the browser.
 */
export const DEFAULT_SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: DEFAULT_FROM_EMAIL,
  pass: '',
  fromName: 'Pusat Jual Beli Solo Raya',
  from: DEFAULT_FROM_EMAIL
};

/**
 * Deprecated compatibility helper.
 * SMTP configuration is server-side only; the browser must not read app_smtp_config.
 */
export async function fetchCloudSmtpConfig() {
  return null;
}

/**
 * Return only client-safe SMTP metadata. Never returns a credential.
 */
export function getSmtpConfig() {
  try {
    const raw = window.__smtpConfigCache;
    if (raw) {
      return {
        ...DEFAULT_SMTP_CONFIG,
        host: raw.host || DEFAULT_SMTP_CONFIG.host,
        port: Number(raw.port || DEFAULT_SMTP_CONFIG.port),
        secure: raw.secure !== undefined ? Boolean(raw.secure) : DEFAULT_SMTP_CONFIG.secure,
        user: raw.user || DEFAULT_SMTP_CONFIG.user,
        fromName: raw.fromName || DEFAULT_SMTP_CONFIG.fromName,
        from: raw.from || raw.user || DEFAULT_SMTP_CONFIG.from
      };
    }
  } catch (e) {}
  return { ...DEFAULT_SMTP_CONFIG };
}

/**
 * Save only non-secret SMTP metadata locally for UI compatibility.
 * Secret fields such as pass are deliberately ignored and are never synced to Supabase.
 */
export async function saveSmtpConfig(config = {}) {
  const safeConfig = {
    host: typeof config.host === 'string' ? config.host.trim() : DEFAULT_SMTP_CONFIG.host,
    port: Number(config.port) || DEFAULT_SMTP_CONFIG.port,
    secure: config.secure !== undefined ? Boolean(config.secure) : DEFAULT_SMTP_CONFIG.secure,
    user: typeof config.user === 'string' ? config.user.trim() : DEFAULT_SMTP_CONFIG.user,
    fromName: typeof config.fromName === 'string' ? config.fromName.trim() : DEFAULT_SMTP_CONFIG.fromName,
    from: typeof config.from === 'string' ? config.from.trim() : (typeof config.user === 'string' ? config.user.trim() : DEFAULT_SMTP_CONFIG.from)
  };

  try {
    window.__smtpConfigCache = safeConfig;
  } catch (e) {}

  return { ...DEFAULT_SMTP_CONFIG, ...safeConfig, pass: '' };
}

/**
 * Email dispatcher.
 * The browser sends only application email data; SMTP credentials are resolved by /api/send-email.
 */
export async function sendEmail({ to, subject, html, text, type = 'general', metadata = {} }) {
  if (!to || !to.includes('@')) {
    throw new Error('Alamat email penerima tidak valid.');
  }

  const payload = {
    to: to.trim().toLowerCase(),
    subject,
    html,
    text: text || '',
    type,
    metadata
  };

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
    return {
      success: false,
      error: err.message || 'Gagal terhubung ke gateway SMTP server backend.'
    };
  }
}

/**
 * 1. Kirim Email Notifikasi Registrasi Akun Baru
 */
export async function sendWelcomeRegistrationEmail(user) {
  if (!user || !user.email) return;

  const subject = `🎉 Selamat Datang di Pusat Jual Beli Solo Raya - Akun Toko Anda Aktif!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Selamat Datang di Pusat Jual Beli Solo Raya</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #881337 0%, #be123c 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; font-size: 13px; color: #fecdd3; font-weight: 500; }
        .badge-brand { display: inline-block; background: #fbbf24; color: #4c0519; font-weight: 900; font-size: 11px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 12px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
        .intro-text { font-size: 13.5px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .card-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; margin-bottom: 24px; }
        .card-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #881337; margin-bottom: 14px; letter-spacing: 0.5px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #64748b; font-weight: 600; }
        .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
        .btn-action { display: block; width: fit-content; margin: 28px auto; background: #881337; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 14px rgba(136,19,55,0.3); text-align: center; }
        .security-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 16px; font-size: 12px; color: #065f46; line-height: 1.5; margin-bottom: 24px; }
        .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge-brand">Pusat Jual Beli Solo Raya</span>
          <h1>Sugeng Rawuh, Lur! 🎉</h1>
          <p>Platform Jual Beli Barang 7 Wilayah Se-Solo Raya</p>
        </div>
        <div class="content">
          <div class="greeting">Halo, ${user.name || user.storeName}!</div>
          <p class="intro-text">
            Selamat! Akun Anda telah berhasil terdaftar dan aktif di <b>Pusat Jual Beli Solo Raya</b>. Anda sekarang dapat langsung memasang iklan barang dengan rasio foto 1:1 (persegi) dan menjangkau ribuan pembeli di seluruh wilayah Solo, Sukoharjo, Karanganyar, Boyolali, Sragen, Klaten, dan Wonogiri.
          </p>
          <div class="card-details">
            <div class="card-title">📋 Ringkasan Akun Terdaftar</div>
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:6px 0; color:#64748b; font-size:13px;">Nama Toko:</td><td style="padding:6px 0; color:#0f172a; font-weight:700; font-size:13px; text-align:right;">${user.storeName || user.name}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b; font-size:13px;">Nama Pemilik:</td><td style="padding:6px 0; color:#881337; font-weight:700; font-size:13px; text-align:right;">${user.name || '-'}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b; font-size:13px;">Nomor WhatsApp:</td><td style="padding:6px 0; color:#0f172a; font-weight:700; font-size:13px; text-align:right;">${user.phone || '-'}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b; font-size:13px;">Wilayah:</td><td style="padding:6px 0; color:#0f172a; font-weight:700; font-size:13px; text-align:right;">${user.district ? user.district + ', ' : ''}${user.region ? user.region.toUpperCase() : 'SOLO'}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b; font-size:13px;">Status Akun:</td><td style="padding:6px 0; color:#059669; font-weight:700; font-size:13px; text-align:right;">✅ Aktif & Siap Jualan</td></tr>
            </table>
          </div>
          <div class="security-box">🛡️ <b>Jaminan Keamanan:</b> Platform kami 100% bebas biaya komisi, bebas link judi online, pinjaman online, atau iklan mengganggu. Jual beli sat-set, pantau cocok bayar!</div>
          <a href="https://solosatset.vercel.app/" class="btn-action">Buka Web & Mulai Pasang Iklan 🚀</a>
        </div>
        <div class="footer"><p>© 2026 Pusat Jual Beli Solo Raya. Dikembangkan dengan ❤️ untuk masyarakat Solo Raya.</p><p>Email otomatis ini dikirim ke <b>${user.email}</b> saat Anda mendaftar akun.</p></div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    type: 'registration_welcome',
    metadata: { userId: user.id, userName: user.name }
  });
}

/**
 * 2. Kirim Email Kode Reset Password
 */
export async function sendPasswordResetEmail({ email, userName, resetCode }) {
  if (!email || !resetCode) return;

  const subject = `🔐 Kode Pemulihan Password Akun: [${resetCode}] - Pusat Jual Beli Solo Raya`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password Akun</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #881337 0%, #4c0519 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
        .content { padding: 32px 28px; text-align: center; }
        .code-box { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 20px; padding: 20px; margin: 24px 0; }
        .code-number { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #881337; margin: 6px 0; display: inline-block; }
        .expiry-text { font-size: 12px; color: #b45309; font-weight: 700; }
        .instruction { font-size: 13.5px; color: #475569; line-height: 1.6; text-align: left; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size:32px; margin-bottom:6px;">🔐</div>
          <h1>Pemulihan Password Akun</h1>
          <p style="margin:6px 0 0; color:#fecdd3; font-size:12.5px;">Pusat Jual Beli Solo Raya</p>
        </div>
        <div class="content">
          <p class="instruction">Halo <b>${userName || 'Pengguna'}</b>,<br>Kami menerima permintaan untuk mengatur ulang kata sandi (password) akun Pusat Jual Beli Solo Raya yang terhubung dengan alamat email ini.</p>
          <div class="code-box">
            <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#92400e;">KODE VERIFIKASI RESET ANDA:</div>
            <div class="code-number">${resetCode}</div>
            <div class="expiry-text">⏳ Berlaku selama 15 menit</div>
          </div>
          <p class="instruction">Masukkan kode 6 digit di atas pada halaman reset password untuk membuat kata sandi baru.</p>
          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:14px; padding:14px; font-size:11.5px; color:#991b1b; text-align:left; margin-top:20px;">⚠️ <b>Keamanan Akun:</b> Jangan pernah memberikan kode ini kepada orang lain. Jika Anda tidak meminta pengaturan ulang password, Anda dapat mengabaikan email ini dengan aman.</div>
        </div>
        <div class="footer"><p>© 2026 Pusat Jual Beli Solo Raya • Solo Raya Jawa Tengah</p><p>Email ini dikirim otomatis ke <b>${email}</b>.</p></div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    type: 'password_reset',
    metadata: { resetCode }
  });
}

/**
 * 3. Kirim Email Uji Coba (Test Connection SMTP)
 * Intentionally disabled until server-verifiable admin authorization exists.
 */
export async function sendTestEmail({ toEmail } = {}) {
  const target = (toEmail || DEFAULT_FROM_EMAIL).trim();
  return sendEmail({
    to: target,
    subject: 'Uji Coba Pengiriman Email SMTP - Pusat Jual Beli Solo Raya',
    html: '<p>SMTP test.</p>',
    type: 'test_smtp',
    metadata: { testedAt: new Date().toISOString() }
  });
}
