import { getSmtpConfig, saveSmtpConfig, sendTestEmail } from "../../services/emailService.js";

export function initAdminSmtpControls(showToastFn) {
  const formSmtp = document.getElementById("form-smtp-settings");
  if (!formSmtp) return;

  function updateSmtpStatusPill(status) {
    const textEl = document.getElementById("smtp-live-status-text");
    const pillEl = document.getElementById("smtp-live-status-pill");
    if (!textEl || !pillEl) return;
    if (status === "configured") {
      pillEl.className =
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold shadow-sm";
      textEl.textContent = "Mail Server: Terkonfigurasi (Live)";
    } else if (status === "testing") {
      pillEl.className =
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-700 text-amber-300 text-xs font-bold shadow-sm";
      textEl.textContent = "Sedang Menguji Koneksi...";
    } else {
      pillEl.className =
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs font-bold shadow-sm";
      textEl.textContent = "Mail Server: Belum Ada App Password";
    }
  }

  document.getElementById("btn-preset-gmail")?.addEventListener("click", () => {
    document.getElementById("smtp-host").value = "smtp.gmail.com";
    document.getElementById("smtp-port").value = "465";
    document.getElementById("smtp-secure").value = "true";
    if (typeof showToastFn === "function") showToastFn("Preset Google / Gmail diterapkan (Port 465 SSL)", "info");
  });

  document.getElementById("btn-preset-brevo")?.addEventListener("click", () => {
    document.getElementById("smtp-host").value = "smtp-relay.brevo.com";
    document.getElementById("smtp-port").value = "587";
    document.getElementById("smtp-secure").value = "false";
    if (typeof showToastFn === "function") showToastFn("Preset Brevo / Sendinblue diterapkan (Port 587 TLS)", "info");
  });

  document.getElementById("btn-preset-custom")?.addEventListener("click", () => {
    document.getElementById("smtp-host").value = "mail.domainanda.com";
    document.getElementById("smtp-port").value = "587";
    document.getElementById("smtp-secure").value = "false";
    if (typeof showToastFn === "function") showToastFn("Preset Custom SMTP diterapkan", "info");
  });

  document.getElementById("btn-toggle-smtp-pass")?.addEventListener("click", () => {
    const input = document.getElementById("smtp-pass");
    if (input) input.type = input.type === "password" ? "text" : "password";
  });

  formSmtp.addEventListener("submit", async (e) => {
    e.preventDefault();
    const host = document.getElementById("smtp-host").value.trim();
    const port = Number(document.getElementById("smtp-port").value) || 465;
    const secure = document.getElementById("smtp-secure").value === "true";
    const user = document.getElementById("smtp-user").value.trim();
    const pass = document.getElementById("smtp-pass").value.trim();
    const fromName = document.getElementById("smtp-from-name").value.trim();
    const from = document.getElementById("smtp-from-email").value.trim() || user;
    const fromEmailInput = document.getElementById("smtp-from-email");
    if (fromEmailInput) fromEmailInput.value = from;
    await saveSmtpConfig({ host, port, secure, user, pass, fromName, from });
    updateSmtpStatusPill(pass ? "configured" : "unconfigured");
    if (typeof showToastFn === "function") showToastFn("Konfigurasi SMTP Mail Server berhasil disimpan.", "success");
  });

  document.getElementById("btn-test-send-email")?.addEventListener("click", async () => {
    const targetEmail = document.getElementById("test-email-target")?.value?.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      if (typeof showToastFn === "function") showToastFn("Masukkan alamat email tujuan uji coba yang valid.", "error");
      return;
    }
    const host = document.getElementById("smtp-host").value.trim();
    const port = Number(document.getElementById("smtp-port").value) || 465;
    const secure = document.getElementById("smtp-secure").value === "true";
    const user = document.getElementById("smtp-user").value.trim();
    const pass = document.getElementById("smtp-pass").value.trim();
    const fromName = document.getElementById("smtp-from-name").value.trim();
    const from = document.getElementById("smtp-from-email").value.trim() || user;
    const btn = document.getElementById("btn-test-send-email");
    const resultBox = document.getElementById("test-email-result-box");
    const resultTitle = document.getElementById("test-email-result-title");
    const resultDesc = document.getElementById("test-email-result-desc");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Mengirim email uji coba...';
    }
    updateSmtpStatusPill("testing");
    try {
      saveSmtpConfig({ host, port, secure, user, pass, fromName, from });
      const res = await sendTestEmail({ toEmail: targetEmail });
      resultBox?.classList.remove("hidden");
      if (res.success) {
        resultBox.className =
          "p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 bg-emerald-950/80 border border-emerald-700 text-emerald-200";
        resultTitle.innerHTML =
          '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i><span>Pengiriman Sukses!</span>';
        resultDesc.innerHTML = `Email uji coba berhasil dikirim ke <b>${targetEmail}</b>.<br>Silakan periksa Kotak Masuk (Inbox) atau folder Spam.`;
        updateSmtpStatusPill("configured");
        if (typeof showToastFn === "function")
          showToastFn(`Email uji coba berhasil dikirim ke ${targetEmail}!`, "success");
      } else {
        resultBox.className =
          "p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 bg-rose-950/80 border border-rose-700 text-rose-200";
        resultTitle.innerHTML =
          '<i data-lucide="alert-circle" class="w-4 h-4 text-rose-400"></i><span>Pengiriman Gagal</span>';
        resultDesc.textContent = res.error || "Periksa konfigurasi SMTP.";
        updateSmtpStatusPill("unconfigured");
        if (typeof showToastFn === "function") showToastFn("Pengiriman gagal.", "error");
      }
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      resultBox?.classList.remove("hidden");
      resultBox.className =
        "p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 bg-rose-950/80 border border-rose-700 text-rose-200";
      resultTitle.innerHTML =
        '<i data-lucide="alert-circle" class="w-4 h-4 text-rose-400"></i><span>Kesalahan Jaringan</span>';
      resultDesc.textContent = err.message || "Gagal menghubungi endpoint pengiriman.";
      if (typeof showToastFn === "function") showToastFn(err.message || "Kesalahan pengiriman", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML =
          '<i data-lucide="mail-check" class="w-4 h-4 text-slate-950"></i><span>Kirim Email Percobaan Sekarang</span>';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  });
}

export function loadSmtpForm() {
  const config = getSmtpConfig();
  const hostEl = document.getElementById("smtp-host");
  const portEl = document.getElementById("smtp-port");
  const secureEl = document.getElementById("smtp-secure");
  const userEl = document.getElementById("smtp-user");
  const passEl = document.getElementById("smtp-pass");
  const fromNameEl = document.getElementById("smtp-from-name");
  const fromEmailEl = document.getElementById("smtp-from-email");
  const testTargetEl = document.getElementById("test-email-target");
  if (hostEl) hostEl.value = config.host || "smtp.gmail.com";
  if (portEl) portEl.value = config.port || 465;
  if (secureEl) secureEl.value = String(config.secure !== false);
  if (userEl) userEl.value = config.user || "";
  if (passEl) passEl.value = config.pass || "";
  if (fromNameEl) fromNameEl.value = config.fromName || "Pusat Jual Beli Solo Raya";
  if (fromEmailEl) fromEmailEl.value = config.from || config.user || "";
  if (testTargetEl && !testTargetEl.value) testTargetEl.value = config.user || "";

  const textEl = document.getElementById("smtp-live-status-text");
  const pillEl = document.getElementById("smtp-live-status-pill");
  if (textEl && pillEl) {
    if (config.pass) {
      pillEl.className =
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold shadow-sm";
      textEl.textContent = "Mail Server: Terkonfigurasi (Live)";
    } else {
      pillEl.className =
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs font-bold shadow-sm";
      textEl.textContent = "Mail Server: Belum Ada App Password";
    }
  }
}
