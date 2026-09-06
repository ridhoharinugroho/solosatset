// ============================================================
// AUTH & PROFILE MODALS LOADER
// Single source of truth for loading components/modals/auth-profile.html
// Modals: modal-user-auth, modal-user-profile,
// modal-profile-region-picker, modal-profile-district-picker
// ============================================================

let passwordResetBound = false;
let loginBound = false;
let registerBound = false;
let resetEmailInFlight = '';

function getJsonBody(response) {
    return response.json().catch(() => ({}));
}

function setFormBusy(button, busy, busyText, idleText) {
    if (!button) return;
    button.disabled = busy;
    button.classList.toggle('opacity-60', busy);
    button.classList.toggle('cursor-not-allowed', busy);
    const label = button.querySelector('span');
    if (label) label.textContent = busy ? busyText : idleText;
}

function showMessage(elementId, text) {
    const box = document.getElementById(elementId);
    if (!box) return;
    const textNode = box.querySelector(`#${elementId.replace('-alert', '-text')}`) || box.querySelector('div[id$="-text"]');
    if (textNode) textNode.textContent = text;
    box.classList.remove('hidden');
}

function hideMessage(elementId) {
    const box = document.getElementById(elementId);
    if (box) box.classList.add('hidden');
}

async function setAuthenticatedUser(user) {
    const authModule = await import('./services/auth.js');
    if (typeof authModule.setCurrentUser !== 'function') throw new Error('Layanan sesi pengguna tidak tersedia.');
    authModule.setCurrentUser(user);
}

function bindServerAuthoritativeLogin() {
    if (loginBound) return;
    loginBound = true;
    document.addEventListener('submit', async (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== 'login-form') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const identifier = String(document.getElementById('login-input-identifier')?.value || '').trim();
        const password = String(document.getElementById('login-input-password')?.value || '');
        const button = document.getElementById('btn-submit-login');
        hideMessage('login-error-alert');
        if (!identifier || !password) {
            showMessage('login-error-alert', !identifier ? 'Nomor WhatsApp, Email, atau Nama Toko harus diisi.' : 'Password harus diisi.');
            return;
        }
        setFormBusy(button, true, 'Memproses...', 'Masuk');
        try {
            const response = await fetch('/api/auth-login', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const result = await getJsonBody(response);
            if (!response.ok || !result.success || !result.user) throw new Error(result.error || 'Login gagal. Silakan periksa data login Anda.');
            await setAuthenticatedUser(result.user);
            form.reset();
            hideMessage('login-error-alert');
            document.getElementById('btn-close-user-auth')?.click();
            window.dispatchEvent(new CustomEvent('authLoginSuccess', { detail: result.user }));
        } catch (error) {
            console.error('[AUTH LOGIN]', error);
            showMessage('login-error-alert', error.message || 'Login gagal. Silakan coba lagi.');
        } finally {
            setFormBusy(button, false, 'Memproses...', 'Masuk');
        }
    }, true);
}

function bindServerAuthoritativeRegistration() {
    if (registerBound) return;
    registerBound = true;
    document.addEventListener('submit', async (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== 'form-user-register') return;
        event.preventDefault();
        event.stopImmediatePropagation();

        const name = String(document.getElementById('reg-input-name')?.value || '').trim();
        const storeName = String(document.getElementById('reg-input-store')?.value || '').trim();
        const phone = String(document.getElementById('reg-input-phone')?.value || '').trim();
        const email = String(document.getElementById('reg-input-email')?.value || '').trim().toLowerCase();
        const region = String(document.getElementById('reg-select-region')?.value || '').trim();
        const district = String(document.getElementById('reg-select-district')?.value || '').trim();
        const password = String(document.getElementById('reg-input-password')?.value || '');
        const confirmPassword = String(document.getElementById('reg-input-password-confirm')?.value || '');
        const button = form.querySelector('button[type="submit"]');

        hideMessage('register-error-alert');
        document.getElementById('reg-field-error-msg')?.classList.add('hidden');
        if (password !== confirmPassword) {
            showMessage('register-error-alert', 'Konfirmasi password tidak cocok.');
            document.getElementById('reg-field-error-msg')?.classList.remove('hidden');
            return;
        }
        setFormBusy(button, true, 'Mendaftarkan...', 'Daftar Akun Sekarang');
        try {
            const response = await fetch('/api/auth-register', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ name, storeName, phone, email, region, district, password, confirmPassword })
            });
            const result = await getJsonBody(response);
            if (!response.ok || !result.success || !result.user) throw new Error(result.error || 'Pendaftaran gagal.');
            await setAuthenticatedUser(result.user);
            form.reset();
            document.getElementById('modal-user-auth')?.classList.add('hidden');
            document.body.classList.remove('modal-open');
            const notice = document.getElementById('auth-notice-box');
            const noticeText = document.getElementById('auth-notice-text');
            if (notice && noticeText) {
                noticeText.textContent = 'Akun berhasil dibuat dan Anda sudah masuk.';
                notice.classList.remove('hidden');
            }
            window.dispatchEvent(new CustomEvent('authRegisterSuccess', { detail: result.user }));
        } catch (error) {
            console.error('[AUTH REGISTER]', error);
            showMessage('register-error-alert', error.message || 'Pendaftaran gagal.');
        } finally {
            setFormBusy(button, false, 'Mendaftarkan...', 'Daftar Akun Sekarang');
        }
    }, true);
}

function bindServerAuthoritativePasswordReset() {
    if (passwordResetBound) return;
    passwordResetBound = true;
    document.addEventListener('submit', async (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (form.id === 'forgot-password-form') {
            event.preventDefault(); event.stopImmediatePropagation();
            const emailInput = document.getElementById('forgot-input-email');
            const email = String(emailInput?.value || '').trim().toLowerCase();
            const button = document.getElementById('btn-submit-forgot-request');
            hideMessage('forgot-error-alert');
            if (!email || !email.includes('@')) { showMessage('forgot-error-alert', 'Masukkan alamat email yang valid.'); return; }
            setFormBusy(button, true, 'Mengirim kode...', 'Kirim Kode Pemulihan');
            try {
                const response = await fetch('/api/password-reset', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ action: 'request', email }) });
                const result = await getJsonBody(response);
                if (!response.ok || !result.success) throw new Error(result.error || 'Gagal memproses permintaan reset password.');
                resetEmailInFlight = email;
                document.getElementById('forgot-step-reset')?.classList.remove('hidden');
                emailInput?.setAttribute('readonly', 'readonly'); button?.classList.add('hidden'); hideMessage('forgot-error-alert');
            } catch (error) { showMessage('forgot-error-alert', error.message || 'Gagal mengirim kode pemulihan.'); }
            finally { setFormBusy(button, false, 'Mengirim kode...', 'Kirim Kode Pemulihan'); }
            return;
        }
        if (form.id === 'form-forgot-confirm') {
            event.preventDefault(); event.stopImmediatePropagation();
            const email = resetEmailInFlight || String(document.getElementById('forgot-input-email')?.value || '').trim().toLowerCase();
            const code = String(document.getElementById('forgot-input-code')?.value || '').replace(/\D/g, '').slice(0, 6);
            const newPassword = String(document.getElementById('forgot-input-new-password')?.value || '');
            const button = document.getElementById('btn-submit-forgot-confirm');
            hideMessage('forgot-confirm-error-alert');
            if (!email || !email.includes('@')) { showMessage('forgot-confirm-error-alert', 'Email reset tidak valid. Silakan mulai ulang proses.'); return; }
            if (code.length !== 6) { showMessage('forgot-confirm-error-alert', 'Masukkan kode verifikasi 6 digit.'); return; }
            if (newPassword.trim().length < 5) { showMessage('forgot-confirm-error-alert', 'Password baru minimal 5 karakter.'); return; }
            setFormBusy(button, true, 'Menyimpan...', 'Simpan Password Baru & Masuk');
            try {
                const response = await fetch('/api/password-reset', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ action: 'reset', email, otpCode: code, newPassword }) });
                const result = await getJsonBody(response);
                if (!response.ok || !result.success) throw new Error(result.error || 'Password gagal diperbarui.');
                const loginIdentifier = document.getElementById('login-input-identifier');
                const loginPassword = document.getElementById('login-input-password');
                if (loginIdentifier) loginIdentifier.value = email; if (loginPassword) loginPassword.value = '';
                document.getElementById('btn-forgot-back-to-login')?.click(); resetEmailInFlight = '';
                const notice = document.getElementById('auth-notice-box'); const noticeText = document.getElementById('auth-notice-text');
                if (notice && noticeText) { noticeText.textContent = 'Password berhasil diperbarui. Silakan login dengan password baru.'; notice.classList.remove('hidden'); }
            } catch (error) { showMessage('forgot-confirm-error-alert', error.message || 'Password gagal diperbarui.'); }
            finally { setFormBusy(button, false, 'Menyimpan...', 'Simpan Password Baru & Masuk'); }
        }
    }, true);
}

export async function ensureAuthProfileModalsLoaded() {
    if (document.getElementById('modal-user-auth')) {
        bindServerAuthoritativeLogin(); bindServerAuthoritativeRegistration(); bindServerAuthoritativePasswordReset(); return true;
    }
    try {
        const response = await fetch('components/modals/auth-profile.html');
        if (!response.ok) return false;
        const html = await response.text();
        if (!document.getElementById('modal-user-auth')) {
            document.body.insertAdjacentHTML('beforeend', html);
            if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') { try { window.lucide.createIcons(); } catch (e) {} }
        }
        bindServerAuthoritativeLogin(); bindServerAuthoritativeRegistration(); bindServerAuthoritativePasswordReset(); return true;
    } catch (err) { console.error('[AUTH PROFILE MODALS] Error loading auth & profile modals partial:', err); return false; }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { ensureAuthProfileModalsLoaded(); }, { once: true });
else setTimeout(ensureAuthProfileModalsLoaded, 0);
