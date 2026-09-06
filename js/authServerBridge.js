// Server-authoritative authentication bridge.
// Keeps legacy profile/modal code isolated while moving login/registration/reset
// authority to server-side API endpoints.

let bound = false;
let resetEmailInFlight = '';

function json(response) {
  return response.json().catch(() => ({}));
}

function busy(button, value, label) {
  if (!button) return;
  button.disabled = value;
  const span = button.querySelector('span');
  if (span && label) span.textContent = value ? label : span.textContent;
}

async function setSession(user) {
  const auth = await import('./services/auth.js');
  if (typeof auth.setCurrentUser !== 'function') throw new Error('Layanan sesi pengguna tidak tersedia.');
  auth.setCurrentUser(user);
}

function show(id, message) {
  const box = document.getElementById(id);
  if (!box) return;
  const text = box.querySelector('div[id$="-text"]');
  if (text) text.textContent = message;
  box.classList.remove('hidden');
}

function hide(id) {
  const box = document.getElementById(id);
  if (box) box.classList.add('hidden');
}

function bind() {
  if (bound) return;
  bound = true;

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === 'form-user-login') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const identifier = String(document.getElementById('login-input-identifier')?.value || '').trim();
      const password = String(document.getElementById('login-input-password')?.value || '');
      const button = form.querySelector('button[type="submit"]');
      hide('login-error-alert');
      hide('login-field-error-msg');
      if (!identifier || !password) {
        show('login-error-alert', !identifier ? 'Nomor WhatsApp, Email, atau Nama Pengguna harus diisi.' : 'Password harus diisi.');
        return;
      }
      busy(button, true, 'Memproses...');
      try {
        const response = await fetch('/api/auth-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const result = await json(response);
        if (!response.ok || !result.success || !result.user) throw new Error(result.error || 'Login gagal.');
        await setSession(result.user);
        form.reset();
        document.querySelector('[data-close-modal="modal-user-auth"]')?.click();
        window.dispatchEvent(new CustomEvent('authLoginSuccess', { detail: result.user }));
      } catch (error) {
        show('login-error-alert', error.message || 'Login gagal.');
      } finally {
        if (button) button.disabled = false;
      }
      return;
    }

    if (form.id === 'form-user-register') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const payload = {
        name: String(document.getElementById('reg-input-name')?.value || '').trim(),
        storeName: String(document.getElementById('reg-input-store')?.value || '').trim(),
        phone: String(document.getElementById('reg-input-phone')?.value || '').trim(),
        email: String(document.getElementById('reg-input-email')?.value || '').trim().toLowerCase(),
        region: String(document.getElementById('reg-select-region')?.value || '').trim(),
        district: String(document.getElementById('reg-select-district')?.value || '').trim(),
        password: String(document.getElementById('reg-input-password')?.value || ''),
        confirmPassword: String(document.getElementById('reg-input-password-confirm')?.value || '')
      };
      const button = form.querySelector('button[type="submit"]');
      hide('register-error-alert');
      if (payload.password !== payload.confirmPassword) {
        show('register-error-alert', 'Konfirmasi password tidak cocok.');
        return;
      }
      busy(button, true, 'Mendaftarkan...');
      try {
        const response = await fetch('/api/auth-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await json(response);
        if (!response.ok || !result.success || !result.user) throw new Error(result.error || 'Pendaftaran gagal.');
        await setSession(result.user);
        form.reset();
        document.querySelector('[data-close-modal="modal-user-auth"]')?.click();
        window.dispatchEvent(new CustomEvent('authRegisterSuccess', { detail: result.user }));
      } catch (error) {
        show('register-error-alert', error.message || 'Pendaftaran gagal.');
      } finally {
        if (button) button.disabled = false;
      }
      return;
    }

    if (form.id === 'forgot-password-form') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const email = String(document.getElementById('forgot-input-email')?.value || '').trim().toLowerCase();
      const button = form.querySelector('button[type="submit"]');
      hide('forgot-error-alert');
      if (!email || !email.includes('@')) {
        show('forgot-error-alert', 'Masukkan alamat email yang valid.');
        return;
      }
      busy(button, true, 'Mengirim kode...');
      try {
        const response = await fetch('/api/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ action: 'request', email })
        });
        const result = await json(response);
        if (!response.ok || !result.success) throw new Error(result.error || 'Gagal memproses reset password.');
        resetEmailInFlight = email;
        document.getElementById('forgot-step-reset')?.classList.remove('hidden');
        document.getElementById('forgot-input-email')?.setAttribute('readonly', 'readonly');
      } catch (error) {
        show('forgot-error-alert', error.message || 'Gagal mengirim kode pemulihan.');
      } finally {
        if (button) button.disabled = false;
      }
      return;
    }

    if (form.id === 'form-forgot-confirm') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const email = resetEmailInFlight || String(document.getElementById('forgot-input-email')?.value || '').trim().toLowerCase();
      const otpCode = String(document.getElementById('forgot-input-code')?.value || '').replace(/\D/g, '').slice(0, 6);
      const newPassword = String(document.getElementById('forgot-input-new-password')?.value || '');
      const button = form.querySelector('button[type="submit"]');
      hide('forgot-confirm-error-alert');
      if (otpCode.length !== 6) { show('forgot-confirm-error-alert', 'Masukkan kode verifikasi 6 digit.'); return; }
      if (newPassword.trim().length < 5) { show('forgot-confirm-error-alert', 'Password baru minimal 5 karakter.'); return; }
      busy(button, true, 'Menyimpan...');
      try {
        const response = await fetch('/api/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ action: 'reset', email, otpCode, newPassword })
        });
        const result = await json(response);
        if (!response.ok || !result.success) throw new Error(result.error || 'Password gagal diperbarui.');
        resetEmailInFlight = '';
        document.getElementById('btn-forgot-back-to-login')?.click();
        const notice = document.getElementById('auth-notice-box');
        const noticeText = document.getElementById('auth-notice-text');
        if (notice && noticeText) {
          noticeText.textContent = 'Password berhasil diperbarui. Silakan login dengan password baru.';
          notice.classList.remove('hidden');
        }
      } catch (error) {
        show('forgot-confirm-error-alert', error.message || 'Password gagal diperbarui.');
      } finally {
        if (button) button.disabled = false;
      }
    }
  }, true);
}

export function initAuthServerBridge() {
  bind();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
}
