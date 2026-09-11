const DEFAULT_SMTP_CONFIG = Object.freeze({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  user: "",
  pass: "",
  fromName: "Pusat Jual Beli Solo Raya",
  from: "",
});

let cachedClientMailConfig = null;

/**
 * Client-safe SMTP settings facade.
 * SMTP credentials are intentionally unavailable in browser code.
 */
export async function fetchCloudSmtpConfig() {
  return null;
}

export function getSmtpConfig() {
  return {
    ...DEFAULT_SMTP_CONFIG,
    ...(cachedClientMailConfig || {}),
    user: "",
    pass: "",
  };
}

/**
 * Keep only non-secret presentation settings in memory.
 * The SMTP password is never stored, sent, or persisted from the browser.
 */
export async function saveSmtpConfig(config = {}) {
  cachedClientMailConfig = {
    host: String(config.host || DEFAULT_SMTP_CONFIG.host).trim(),
    port: Number(config.port || DEFAULT_SMTP_CONFIG.port),
    secure: Boolean(config.secure ?? DEFAULT_SMTP_CONFIG.secure),
    fromName: String(config.fromName || DEFAULT_SMTP_CONFIG.fromName).trim(),
    from: String(config.from || "").trim(),
    user: String(config.user || "").trim(),
    pass: String(config.pass || "").trim(),
  };
  return getSmtpConfig();
}

function normalizeRecipient(to) {
  const email = String(to || "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@") || email.length > 254) {
    throw new Error("Alamat email penerima tidak valid.");
  }
  return email;
}

/**
 * Browser -> server email dispatcher.
 * No SMTP credentials are ever included in the request body.
 */
export async function sendEmail({ to, subject, html, text, type = "general", metadata = {} }) {
  const recipient = normalizeRecipient(to);
  if (!html && !text) throw new Error("Isi email tidak boleh kosong.");

  const payload = {
    to: recipient,
    subject: String(subject || "").slice(0, 300),
    html: typeof html === "string" ? html : "",
    text: typeof text === "string" ? text : "",
    type: String(type || "general").slice(0, 80),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  };

  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      const message = result.error || "Gagal mengirim email melalui server.";
      console.error("[Email Dispatcher Server Error]", message);
      return { success: false, error: message };
    }

    console.log("[Email Dispatcher] Email berhasil diteruskan ke server mail gateway.");
    return { success: true, result };
  } catch (error) {
    console.error("[Email Dispatcher Network Error]", error);
    return {
      success: false,
      error: error?.message || "Gagal terhubung ke server email.",
    };
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendWelcomeRegistrationEmail(user) {
  if (!user?.email) return { success: false, error: "Email pengguna tidak tersedia." };

  const name = escapeHtml(user.name || user.storeName || "Pengguna");
  const storeName = escapeHtml(user.storeName || user.name || "-");
  const phone = escapeHtml(user.phone || "-");
  const district = escapeHtml(user.district || "");
  const region = escapeHtml(user.region ? String(user.region).toUpperCase() : "SOLO");
  const email = normalizeRecipient(user.email);

  const subject = "Selamat Datang di Pusat Jual Beli Solo Raya - Akun Anda Aktif";
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selamat Datang</title></head><body style="margin:0;padding:20px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#1e293b"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden"><div style="background:linear-gradient(135deg,#881337,#be123c);padding:36px 24px;text-align:center;color:#fff"><div style="display:inline-block;background:#fbbf24;color:#4c0519;font-weight:900;font-size:11px;padding:4px 12px;border-radius:999px;text-transform:uppercase;margin-bottom:12px">Pusat Jual Beli Solo Raya</div><h1 style="margin:0;font-size:24px">Sugeng Rawuh, Lur! 🎉</h1><p style="margin:8px 0 0;font-size:13px;color:#fecdd3">Platform Jual Beli Barang Se-Solo Raya</p></div><div style="padding:32px 28px"><p style="font-size:16px;font-weight:700">Halo, ${name}!</p><p style="font-size:13.5px;line-height:1.6;color:#475569">Akun Anda berhasil terdaftar dan aktif. Anda sekarang dapat mulai memasang iklan dan menjangkau pembeli di wilayah Solo Raya.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:20px;margin:24px 0"><div style="font-size:12px;font-weight:800;text-transform:uppercase;color:#881337;margin-bottom:12px">Ringkasan Akun</div><p style="font-size:13px;margin:7px 0"><b>Nama Toko:</b> ${storeName}</p><p style="font-size:13px;margin:7px 0"><b>Nomor WhatsApp:</b> ${phone}</p><p style="font-size:13px;margin:7px 0"><b>Wilayah:</b> ${district ? `${district}, ` : ""}${region}</p><p style="font-size:13px;margin:7px 0;color:#059669"><b>Status:</b> Aktif & siap jualan</p></div><a href="https://solosatset.vercel.app/" style="display:block;width:max-content;margin:28px auto;background:#881337;color:#fff;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:800;font-size:14px">Buka Web & Mulai Pasang Iklan 🚀</a></div><div style="background:#f1f5f9;padding:24px;text-align:center;font-size:11px;color:#64748b">© 2026 Pusat Jual Beli Solo Raya</div></div></body></html>`;

  return sendEmail({
    to: email,
    subject,
    html,
    type: "registration_welcome",
    metadata: { userId: user.id, userName: user.name },
  });
}

export async function sendPasswordResetEmail({ email, userName, resetCode }) {
  if (!email || !resetCode) return { success: false, error: "Data reset tidak lengkap." };

  const recipient = normalizeRecipient(email);
  const safeName = escapeHtml(userName || "Pengguna");
  const safeCode = escapeHtml(String(resetCode).replace(/\D/g, "").slice(0, 6));
  const subject = "Kode Pemulihan Password - Pusat Jual Beli Solo Raya";
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#1e293b"><div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden"><div style="background:linear-gradient(135deg,#881337,#4c0519);padding:30px 24px;color:#fff;text-align:center"><div style="font-size:30px">🔐</div><h1 style="margin:8px 0 0;font-size:22px">Pemulihan Password</h1><p style="margin:6px 0 0;color:#fecdd3;font-size:13px">Pusat Jual Beli Solo Raya</p></div><div style="padding:30px 26px"><p style="font-size:14px;line-height:1.6">Halo <b>${safeName}</b>, kami menerima permintaan untuk mengatur ulang password akun Anda.</p><div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:16px;padding:18px;text-align:center;margin:22px 0"><div style="font-size:11px;font-weight:800;color:#92400e;text-transform:uppercase">Kode Verifikasi</div><div style="font-family:Courier New,monospace;font-size:36px;font-weight:900;letter-spacing:8px;color:#881337;margin:8px 0">${safeCode}</div><div style="font-size:12px;color:#b45309;font-weight:700">Berlaku selama 15 menit</div></div><p style="font-size:13px;line-height:1.6">Masukkan kode 6 digit tersebut pada halaman pemulihan password. Jangan bagikan kode ini kepada siapa pun.</p><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:13px;font-size:11.5px;color:#991b1b;margin-top:18px">Jika Anda tidak meminta reset password, abaikan email ini.</div></div><div style="background:#f1f5f9;padding:18px;text-align:center;font-size:10.5px;color:#64748b">Email otomatis untuk ${escapeHtml(recipient)}.</div></div></body></html>`;

  return sendEmail({
    to: recipient,
    subject,
    html,
    type: "password_reset",
    metadata: {},
  });
}

export async function sendTestEmail({ toEmail } = {}) {
  const target = normalizeRecipient(toEmail);
  const subject = "Uji Coba Pengiriman Email - Pusat Jual Beli Solo Raya";
  const html = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:16px;border:1px solid #e2e8f0"><h2 style="color:#881337;margin-top:0">✅ Email Uji Coba Berhasil Dikirim</h2><p style="font-size:13px;color:#475569;line-height:1.6">Pesan ini dikirim melalui mail gateway server Pusat Jual Beli Solo Raya. Credential SMTP tidak diproses di browser.</p><div style="background:#f8fafc;padding:12px;border-radius:12px;font-size:12px;color:#334155"><b>Waktu:</b> ${escapeHtml(new Date().toLocaleString("id-ID"))}<br><b>Penerima:</b> ${escapeHtml(target)}</div><p style="font-size:11px;color:#94a3b8;margin-bottom:0">Pusat Jual Beli Solo Raya</p></div>`;
  return sendEmail({ to: target, subject, html, type: "test_smtp", metadata: { testedAt: new Date().toISOString() } });
}

export { DEFAULT_SMTP_CONFIG };
