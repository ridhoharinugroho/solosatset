// ============================================================
// AUTH & PROFILE MODALS LOADER
// Single source of truth for loading components/modals/auth-profile.html
// Modals: modal-user-auth, modal-user-profile,
// modal-profile-region-picker, modal-profile-district-picker
// ============================================================

let passwordResetBound = false;
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

function bindServerAuthoritativePasswordReset() {
    if (passwordResetBound) return;
    passwordResetBound = true;

    document.addEventListener('submit', async (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;

        if (form.id === 'forgot-password-form') {
            event.preventDefault();
            event.stopImmediatePropagation();

            const emailInput = document.getElementById('forgot-input-email');
            const email = String(emailInput?.value || '').trim().toLowerCase();
            const button = document.getElementById('btn-submit-forgot-request');

            hideMessage('forgot-error-alert');
            if (!email || !email.includes('@')) {
                showMessage('forgot-error-alert', 'Masukkan alamat email yang valid.');
                return;
            }

            setFormBusy(button, true, 'Mengirim kode...', 'Kirim Kode Pemulihan');
            try {
                const response = await fetch('/api/password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ action: 'request', email })
                });
                const result = await getJsonBody(response);

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Gagal memproses permintaan reset password.');
                }

                resetEmailInFlight = email;
                document.getElementById('forgot-step-reset')?.classList.remove('hidden');
                emailInput?.setAttribute('readonly', 'readonly');
                button?.classList.add('hidden');
                hideMessage('forgot-error-alert');
            } catch (error) {
                showMessage('forgot-error-alert', error.message || 'Gagal mengirim kode pemulihan.');
            } finally {
                setFormBusy(button, false, 'Mengirim kode...', 'Kirim Kode Pemulihan');
            }
            return;
        }

        if (form.id === 'form-forgot-confirm') {
            event.preventDefault();
            event.stopImmediatePropagation();

            const email = resetEmailInFlight || String(document.getElementById('forgot-input-email')?.value || '').trim().toLowerCase();
            const code = String(document.getElementById('forgot-input-code')?.value || '').replace(/\D/g, '').slice(0, 6);
            const newPassword = String(document.getElementById('forgot-input-new-password')?.value || '');
            const button = document.getElementById('btn-submit-forgot-confirm');

            hideMessage('forgot-confirm-error-alert');
            if (!email || !email.includes('@')) {
                showMessage('forgot-confirm-error-alert', 'Email reset tidak valid. Silakan mulai ulang proses.');
                return;
            }
            if (code.length !== 6) {
                showMessage('forgot-confirm-error-alert', 'Masukkan kode verifikasi 6 digit.');
                return;
            }
            if (newPassword.trim().length < 5) {
                showMessage('forgot-confirm-error-alert', 'Password baru minimal 5 karakter.');
                return;
            }

            setFormBusy(button, true, 'Menyimpan...', 'Simpan Password Baru & Masuk');
            try {
                const response = await fetch('/api/password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ action: 'reset', email, otpCode: code, newPassword })
                });
                const result = await getJsonBody(response);

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Password gagal diperbarui.');
                }

                const loginIdentifier = document.getElementById('login-input-identifier');
                const loginPassword = document.getElementById('login-input-password');
                if (loginIdentifier) loginIdentifier.value = email;
                if (loginPassword) loginPassword.value = '';

                document.getElementById('btn-forgot-back-to-login')?.click();
                resetEmailInFlight = '';
                const notice = document.getElementById('auth-notice-box');
                const noticeText = document.getElementById('auth-notice-text');
                if (notice && noticeText) {
                    noticeText.textContent = 'Password berhasil diperbarui. Silakan login dengan password baru.';
                    notice.classList.remove('hidden');
                }
            } catch (error) {
                showMessage('forgot-confirm-error-alert', error.message || 'Password gagal diperbarui.');
            } finally {
                setFormBusy(button, false, 'Menyimpan...', 'Simpan Password Baru & Masuk');
            }
        }
    }, true);
}

export async function ensureAuthProfileModalsLoaded() {
    if (document.getElementById('modal-user-auth')) {
        bindServerAuthoritativePasswordReset();
        return true;
    }
    try {
        const response = await fetch('components/modals/auth-profile.html');
        if (!response.ok) return false;
        const html = await response.text();
        if (!document.getElementById('modal-user-auth')) {
            document.body.insertAdjacentHTML('beforeend', html);
            if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
                try { window.lucide.createIcons(); } catch (e) {}
            }
        }
        bindServerAuthoritativePasswordReset();
        return true;
    } catch (err) {
        console.error('[AUTH PROFILE MODALS] Error loading auth & profile modals partial:', err);
        return false;
    }
}

// Auto-prefetch when module loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { ensureAuthProfileModalsLoaded(); }, { once: true });
} else {
    setTimeout(ensureAuthProfileModalsLoaded, 0);
}
