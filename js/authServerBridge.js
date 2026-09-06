// Server-authoritative authentication bridge.
// Keeps legacy profile/session code isolated while login, registration,
// and password reset are handled by server-side endpoints.

let bound = false;
let resetEmailInFlight = '';

function parseJson(response) {
  return response.json().catch(() => ({}));
}

function busy(button, isBusy, loadingLabel) {
  if (!button) return;
  if (isBusy) {
    button.dataset.originalLabel = button.querySelector('span')?.textContent || '';
    button.disabled = true;
    const span = button.querySelector('span');
    if (span && loadingLabel) span.textContent = loadingLabel;
    return;
  }

  button.disabled = false;
  const span = button.querySelector('span');
  if (span && button.dataset.originalLabel) {
    span.textContent = button.dataset.originalLabel;
    delete button.dataset.originalLabel;
  }
}

function sanitizeSessionUser(user) {
  if (!user || typeof user !== 'object') throw new Error('Data sesi pengguna tidak valid.');
  const clean = { ...user };
  delete clean.password;
  delete clean.password_hash;
  delete clean.otp_code;
  delete clean.otp_expires_at;
  delete clean.resetCode;
  delete clean.pendingReset;
  return clean;
}

async function setSession(user) {
  const auth = await import('./services/auth.js');
  if (typeof auth.setCurrentUser !== 'function') {
    throw new Error('Layanan sesi pengguna tidak tersedia.');
  }
  auth.setCurrentUser(sanitizeSessionUser(user));
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

function closeAuthModal() {
  document.querySelector('[data-close-modal="modal-user-auth"]')?.click();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await parseJson(response);
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Permintaan gagal diproses.');
  }
  return result;
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
        show(
          'login-error-alert',
          !identifier
            ? 'Nomor WhatsApp, Email, atau Nama Pengguna harus diisi.'
            : 'Password harus diisi.'
        );
        return;
      }

      busy(button, true, 'Memproses...');
      try {
        const result = await postJson('/api/auth-login', { identifier, password });
        await setSession(result.user);
        form.reset();
        closeAuthModal();
        window.dispatchEvent(new CustomEvent('authLoginSuccess', { detail: sanitizeSessionUser(result.user) }));
      } catch (error) {
        show('login-error-alert', error.message || 'Login gagal.');
      } finally {
        busy(button, false);
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
        const result = await postJson('/api/auth-register', payload);
        await setSession(result.user);
        form.reset();
        closeAuthModal();
        window.dispatchEvent(new CustomEvent('authRegisterSuccess', { detail: sanitizeSessionUser(result.user) }));
      } catch (error) {
        show('register-error-alert', error.message || 'Pendaftaran gagal.');
      } finally {
        busy(button, false);
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
        const result = await postJson('/api/password-reset', { action: 'request', email });
        resetEmailInFlight = email;
        document.getElementById('forgot-step-reset')?.classList.remove('hidden');
        document.getElementById('forgot-input-email')?.setAttribute('readonly', 'readonly');
        if (result.expiresAt) {
          const expiry = document.getElementById('forgot-otp-expiry');
          if (expiry) expiry.dataset.expiresAt = result.expiresAt;
        }
      } catch (error) {
        show('forgot-error-alert', error.message || 'Gagal mengirim kode pemulihan.');
      } finally {
        busy(button, false);
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
      if (otpCode.length !== 6) {
        show('forgot-confirm-error-alert', 'Masukkan kode verifikasi 6 digit.');
        return;
      }
      if (newPassword.trim().length < 5) {
        show('forgot-confirm-error-alert', 'Password baru minimal 5 karakter.');
        return;
      }

      busy(button, true, 'Menyimpan...');
      try {
        await postJson('/api/password-reset', {
          action: 'reset',
          email,
          otpCode,
          newPassword
        });

        resetEmailInFlight = '';
        form.reset();
        document.getElementById('forgot-input-email')?.removeAttribute('readonly');
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
        busy(button, false);
      }
    }
  }, true);
}

export function initAuthServerBridge() {
  bind();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
