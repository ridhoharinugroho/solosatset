import { getCurrentUser, setCurrentUser } from "./auth.js";
const API = "/api/auth-otp";
let installed = false;
let pendingPasswordChange = null;
async function callApi(body) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || !data.success) throw new Error(data.error || "Proses ganti password gagal.");
  return data;
}
function openModal() {
  if (document.getElementById("otp-password-change-modal")) return document.getElementById("otp-password-change-modal");
  const wrap = document.createElement("div");
  wrap.id = "otp-password-change-modal";
  wrap.className = "fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm";
  wrap.innerHTML = `<div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3"><div class="flex items-center justify-between"><h3 class="font-black text-slate-900">Ganti Password</h3><button type="button" data-close-otp-password class="text-slate-400 text-xl">×</button></div><p class="text-xs text-slate-500">OTP akan dikirim ke email akun yang sedang login.</p><input id="otp-change-current" type="password" autocomplete="current-password" placeholder="Password saat ini" class="w-full px-3 py-2.5 border rounded-xl text-sm"><input id="otp-change-new" type="password" autocomplete="new-password" placeholder="Password baru (min. 5 karakter)" class="w-full px-3 py-2.5 border rounded-xl text-sm"><button id="otp-change-request" type="button" class="w-full py-2.5 rounded-xl bg-rose-900 text-white font-black text-sm">Kirim OTP</button><div id="otp-change-step" class="hidden space-y-2"><input id="otp-change-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 digit OTP" class="w-full px-3 py-2.5 border rounded-xl text-sm font-mono"><button id="otp-change-verify" type="button" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm">Verifikasi & Ganti Password</button></div><div id="otp-change-error" class="text-xs font-bold text-rose-600"></div></div>`;
  document.body.appendChild(wrap);
  wrap.querySelector("[data-close-otp-password]").onclick = () => {
    pendingPasswordChange = null;
    wrap.remove();
  };
  return wrap;
}
async function requestOtp(modal) {
  const user = getCurrentUser();
  if (!user?.email) throw new Error("Sesi pengguna tidak ditemukan. Silakan login kembali.");
  const currentPassword = modal.querySelector("#otp-change-current").value;
  const newPassword = modal.querySelector("#otp-change-new").value;
  if (!currentPassword) throw new Error("Password saat ini wajib diisi.");
  if (newPassword.length < 5 || newPassword.length > 128) throw new Error("Password baru harus 5-128 karakter.");
  await callApi({ action: "request", purpose: "password_change", email: user.email });
  pendingPasswordChange = { email: user.email, currentPassword, newPassword };
  modal.querySelector("#otp-change-step").classList.remove("hidden");
  modal.querySelector("#otp-change-code").focus();
}
async function complete(modal) {
  const pending = pendingPasswordChange;
  if (!pending) throw new Error("Permintaan ganti password sudah tidak tersedia.");
  const code = modal.querySelector("#otp-change-code").value.trim();
  if (!/^\d{6}$/.test(code)) throw new Error("OTP harus 6 digit.");
  const v = await callApi({ action: "verify", purpose: "password_change", email: pending.email, code });
  await callApi({
    action: "change_password",
    purpose: "password_change",
    email: pending.email,
    verificationToken: v.verificationToken,
    currentPassword: pending.currentPassword,
    newPassword: pending.newPassword,
  });
  const user = getCurrentUser();
  if (user) {
    const updated = { ...user };
    delete updated.password;
    setCurrentUser(updated);
  }
  pendingPasswordChange = null;
  modal.remove();
  window.dispatchEvent(new CustomEvent("auth:otp-password-change-complete"));
}
function install() {
  if (installed) return;
  installed = true;
  document.addEventListener(
    "click",
    async (event) => {
      const target = event.target instanceof Element ? event.target.closest('button,a,[role="button"]') : null;
      if (!target) return;
      const text = (target.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      const id = (target.id || "").toLowerCase();
      if (!(
        text.includes("ganti password") ||
        text.includes("ubah password") ||
        id.includes("change-password") ||
        id.includes("ganti-password")
      ))
        return;
      if (target.closest("#otp-password-change-modal")) return;
      event.preventDefault();
      event.stopPropagation();
      const user = getCurrentUser();
      if (!user?.email) {
        window.dispatchEvent(new CustomEvent("auth:login-required"));
        return;
      }
      const modal = openModal();
      modal.querySelector("#otp-change-request").onclick = async () => {
        try {
          modal.querySelector("#otp-change-error").textContent = "";
          await requestOtp(modal);
          modal.querySelector("#otp-change-request").textContent = "OTP Terkirim";
          modal.querySelector("#otp-change-request").disabled = true;
        } catch (e) {
          modal.querySelector("#otp-change-error").textContent = e.message;
        }
      };
      modal.querySelector("#otp-change-verify").onclick = async () => {
        try {
          modal.querySelector("#otp-change-error").textContent = "";
          await complete(modal);
        } catch (e) {
          modal.querySelector("#otp-change-error").textContent = e.message;
        }
      };
    },
    true,
  );
}
install();
