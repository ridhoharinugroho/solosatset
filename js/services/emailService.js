const DEFAULT_FROM_EMAIL = 'solosatset.soloraya@gmail.com';

export const DEFAULT_SMTP_CONFIG = { host: 'smtp.gmail.com', port: 465, secure: true, user: DEFAULT_FROM_EMAIL, pass: '', fromName: 'Pusat Jual Beli Solo Raya', from: DEFAULT_FROM_EMAIL, hasPassword: false };

export async function fetchCloudSmtpConfig() {
  try { const response = await fetch('/api/admin/smtp-config', { credentials: 'include', headers: { Accept: 'application/json' } }); if (!response.ok) return null; const result = await response.json(); return result?.config || null; } catch { return null; }
}
export function getSmtpConfig() { try { const raw = window.__smtpConfigCache; if (raw) return { ...DEFAULT_SMTP_CONFIG, ...raw, pass: '' }; } catch (e) {} return { ...DEFAULT_SMTP_CONFIG }; }
export async function loadSmtpConfig() { const config = await fetchCloudSmtpConfig(); if (!config) return getSmtpConfig(); const safeConfig = { ...DEFAULT_SMTP_CONFIG, ...config, pass: '' }; try { window.__smtpConfigCache = safeConfig; } catch (e) {} return safeConfig; }
export async function saveSmtpConfig(config = {}) {
  const response = await fetch('/api/admin/smtp-config', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ config }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) throw new Error(result?.error || 'Gagal menyimpan konfigurasi SMTP server.');
  const safeConfig = { ...DEFAULT_SMTP_CONFIG, ...(result.config || {}), pass: '' }; try { window.__smtpConfigCache = safeConfig; } catch (e) {} return safeConfig;
}
export async function sendEmail({ to, subject, html, text, type = 'general', metadata = {} }) {
  if (!to || !to.includes('@')) throw new Error('Alamat email penerima tidak valid.');
  const payload = { to: to.trim().toLowerCase(), subject, html, text: text || '', type, metadata };
  try { const response = await fetch('/api/send-email', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) }); if (response.ok) { const result = await response.json(); return { success: true, result }; } const errJson = await response.json().catch(() => ({ error: 'HTTP Error ' + response.status })); return { success: false, error: errJson.error || 'Gagal mengirim email via SMTP server.' }; } catch (err) { return { success: false, error: err.message || 'Gagal terhubung ke gateway SMTP server backend.' }; }
}
export async function sendWelcomeRegistrationEmail(user) { if (!user || !user.email) return; const subject = `🎉 Selamat Datang di Pusat Jual Beli Solo Raya - Akun Toko Anda Aktif!`; const html = `<!DOCTYPE html><html><body><h1>Sugeng Rawuh, Lur! 🎉</h1><p>Halo, ${user.name || user.storeName}!</p><p>Selamat! Akun Anda telah berhasil terdaftar dan aktif di <b>Pusat Jual Beli Solo Raya</b>.</p><p>Nama Toko: ${user.storeName || user.name}</p><p>Nama Pemilik: ${user.name || '-'}</p><p>Nomor WhatsApp: ${user.phone || '-'}</p><p>Wilayah: ${user.district ? user.district + ', ' : ''}${user.region ? user.region.toUpperCase() : 'SOLO'}</p><p>Status Akun: ✅ Aktif & Siap Jualan</p><p>🛡️ Platform kami 100% bebas biaya komisi.</p><p><a href="https://solosatset.vercel.app/">Buka Web & Mulai Pasang Iklan 🚀</a></p></body></html>`; return sendEmail({ to: user.email, subject, html, type: 'registration_welcome', metadata: { userId: user.id, userName: user.name } }); }
export async function sendPasswordResetEmail({ email, userName, resetCode }) { if (!email || !resetCode) return; const subject = `🔐 Kode Pemulihan Password Akun: [${resetCode}] - Pusat Jual Beli Solo Raya`; const html = `<p>Halo <b>${userName || 'Pengguna'}</b>,</p><p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Pusat Jual Beli Solo Raya.</p><div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:20px;padding:20px;margin:24px 0;text-align:center"><b>KODE VERIFIKASI RESET ANDA:</b><div style="font-size:38px;font-weight:900;letter-spacing:8px;color:#881337">${resetCode}</div><div>⏳ Berlaku selama 15 menit</div></div><p>⚠️ <b>Keamanan Akun:</b> Jangan pernah memberikan kode ini kepada orang lain.</p>`; return sendEmail({ to: email, subject, html, type: 'password_reset', metadata: { resetCode } }); }
export async function sendTestEmail({ toEmail } = {}) { const target = (toEmail || DEFAULT_FROM_EMAIL).trim(); return sendEmail({ to: target, subject: 'Uji Coba Pengiriman Email SMTP - Pusat Jual Beli Solo Raya', html: '<p>SMTP test.</p>', type: 'test_smtp', metadata: { testedAt: new Date().toISOString() } }); }

// Compatibility bridge: the legacy admin controller still owns the visible form, but authentication is now server-side.
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admin-login-form');
    if (form) form.addEventListener('submit', async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const username = document.getElementById('admin-username')?.value.trim() || '';
      const password = document.getElementById('admin-password')?.value || '';
      const alertBox = document.getElementById('login-error-alert');
      const errorMsg = document.getElementById('login-error-msg');
      try {
        const response = await fetch('/api/admin-auth?action=login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ username, password }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.authenticated) throw new Error(result.error || 'Username atau Password salah.');
        sessionStorage.setItem('pusat_barkas_admin_auth', 'true');
        window.location.reload();
      } catch (error) { if (alertBox) alertBox.classList.remove('hidden'); if (errorMsg) errorMsg.textContent = error.message || 'Username atau Password salah!'; }
    }, true);
  });
}
