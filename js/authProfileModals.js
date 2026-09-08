// ============================================================
// AUTH & PROFILE MODALS LOADER
// Single source of truth for loading components/modals/auth-profile.html
// Modals: modal-user-auth, modal-user-profile,
// modal-profile-region-picker, modal-profile-district-picker
//
// IMPORTANT RUNTIME NOTE:
// auth-profile.html is loaded asynchronously. The main app previously
// attempted to bind auth listeners before this partial finished loading,
// which left the Forgot Password controls without handlers and produced
// a silent no-op in Production. This loader now owns the auth-modal runtime
// initialization immediately after the partial is inserted.
// ============================================================

import {
    loginUser,
    registerUser,
    requestPasswordReset,
    confirmPasswordReset
} from './services/auth.js';

export async function ensureAuthProfileModalsLoaded() {
    if (document.getElementById('modal-user-auth')) {
        initializeAuthModalRuntime();
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

        initializeAuthModalRuntime();
        window.dispatchEvent(new CustomEvent('authProfileModalsLoaded'));
        return true;
    } catch (err) {
        console.error('[AUTH PROFILE MODALS] Error loading auth & profile modals partial:', err);
        return false;
    }
}

function initializeAuthModalRuntime() {
    const modal = document.getElementById('modal-user-auth');
    if (!modal || modal.dataset.runtimeInitialized === 'true') return;
    modal.dataset.runtimeInitialized = 'true';

    const refreshIcons = () => {
        try {
            if (typeof window.refreshIcons === 'function') {
                window.refreshIcons(modal);
            } else if (window.lucide?.createIcons) {
                window.lucide.createIcons();
            }
        } catch (e) {}
    };

    const clearErrors = () => {
        modal.querySelectorAll(
            '#login-error-alert, #register-error-alert, #forgot-error-alert, #forgot-confirm-error-alert, #login-field-error-msg, #reg-field-error-msg'
        ).forEach(el => el.classList.add('hidden'));
    };

    const showError = (boxId, textId, message) => {
        const box = document.getElementById(boxId);
        const text = document.getElementById(textId);
        if (text) text.textContent = message;
        if (box) {
            box.classList.remove('hidden');
            try { box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
        }
        refreshIcons();
    };

    const switchAuthTab = (tab = 'login') => {
        clearErrors();

        const tabLogin = document.getElementById('tab-auth-login');
        const tabRegister = document.getElementById('tab-auth-register');
        const panelLogin = document.getElementById('panel-auth-login');
        const panelRegister = document.getElementById('panel-auth-register');
        const panelForgot = document.getElementById('panel-auth-forgot');
        const tabsContainer = document.getElementById('auth-tabs-container');
        const modalTitle = document.getElementById('auth-modal-title');
        const modalSubtitle = document.getElementById('auth-modal-subtitle');

        if (tab === 'register') {
            tabsContainer?.classList.remove('hidden');
            panelLogin?.classList.add('hidden');
            panelRegister?.classList.remove('hidden');
            panelForgot?.classList.add('hidden');
            tabRegister?.classList.add('bg-white', 'text-rose-900', 'font-black', 'shadow-xs');
            tabRegister?.classList.remove('text-slate-500', 'font-bold');
            tabLogin?.classList.remove('bg-white', 'text-rose-900', 'font-black', 'shadow-xs');
            tabLogin?.classList.add('text-slate-500', 'font-bold');
            if (modalTitle) modalTitle.textContent = 'Daftar Akun Penjual';
            if (modalSubtitle) modalSubtitle.textContent = 'Mulai pasang iklan gratis se-Solo Raya';
        } else if (tab === 'forgot') {
            tabsContainer?.classList.add('hidden');
            panelLogin?.classList.add('hidden');
            panelRegister?.classList.add('hidden');
            panelForgot?.classList.remove('hidden');
            if (modalTitle) modalTitle.textContent = 'Lupa Password Akun';
            if (modalSubtitle) modalSubtitle.textContent = 'Atur ulang password akun Anda';
        } else {
            tabsContainer?.classList.remove('hidden');
            panelLogin?.classList.remove('hidden');
            panelRegister?.classList.add('hidden');
            panelForgot?.classList.add('hidden');
            tabLogin?.classList.add('bg-white', 'text-rose-900', 'font-black', 'shadow-xs');
            tabLogin?.classList.remove('text-slate-500', 'font-bold');
            tabRegister?.classList.remove('bg-white', 'text-rose-900', 'font-black', 'shadow-xs');
            tabRegister?.classList.add('text-slate-500', 'font-bold');
            if (modalTitle) modalTitle.textContent = 'Masuk ke Akun';
            if (modalSubtitle) modalSubtitle.innerHTML = 'Cepet Payune, Cepet oleh barange !!!<br>Po ra Well ?';
        }

        refreshIcons();
    };

    // Expose only the safe UI controller needed by the dynamically loaded modal.
    window.switchAuthTab = switchAuthTab;

    document.getElementById('tab-auth-login')?.addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-auth-register')?.addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('btn-goto-forgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchAuthTab('forgot');
    });
    document.getElementById('btn-forgot-back-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        switchAuthTab('login');
    });
    document.getElementById('btn-switch-to-reg-from-login')?.addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('btn-switch-to-login-from-reg')?.addEventListener('click', () => switchAuthTab('login'));

    // Login password visibility toggle.
    document.getElementById('btn-toggle-login-pass')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById('login-input-password');
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        const icon = e.currentTarget.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', show ? 'eye-off' : 'eye');
        refreshIcons();
    });

    // Login runtime handler. This is intentionally initialized here because
    // this modal is asynchronous and may not exist when app.js binds its listeners.
    document.getElementById('form-user-login')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const identifier = (document.getElementById('login-input-identifier')?.value || '').trim();
        const password = (document.getElementById('login-input-password')?.value || '').trim();
        if (!identifier || !password) {
            showError('login-error-alert', 'login-error-text', 'Nomor WA / Email / Nama Pengguna dan password wajib diisi.');
            return;
        }

        const submit = e.submitter || modal.querySelector('#form-user-login button[type="submit"]');
        const originalHtml = submit?.innerHTML || '';
        if (submit) {
            submit.disabled = true;
            submit.innerHTML = '<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span><span>Memproses...</span>';
        }

        try {
            const user = await loginUser(identifier, password);
            window.closeModal?.('modal-user-auth');
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: user }));
        } catch (err) {
            showError('login-error-alert', 'login-error-text', err?.message || 'Gagal masuk. Periksa kembali akun dan password Anda.');
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.innerHTML = originalHtml;
                refreshIcons();
            }
        }
    });

    // Registration runtime handler.
    document.getElementById('form-user-register')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const name = document.getElementById('reg-input-name')?.value.trim() || '';
        const storeName = document.getElementById('reg-input-store')?.value.trim() || '';
        const phone = document.getElementById('reg-input-phone')?.value.trim() || '';
        const email = document.getElementById('reg-input-email')?.value.trim() || '';
        const region = document.getElementById('reg-select-region')?.value || 'solo';
        const district = document.getElementById('reg-select-district')?.value || '';
        const password = document.getElementById('reg-input-password')?.value || '';
        const confirmPass = document.getElementById('reg-input-password-confirm')?.value || '';

        if (!name || !storeName || !phone || !email || !password) {
            showError('register-error-alert', 'register-error-text', 'Semua data wajib diisi sebelum membuat akun.');
            return;
        }
        if (password !== confirmPass) {
            showError('register-error-alert', 'register-error-text', 'Konfirmasi password tidak cocok.');
            return;
        }

        const submit = e.submitter || modal.querySelector('#form-user-register button[type="submit"]');
        const originalHtml = submit?.innerHTML || '';
        if (submit) {
            submit.disabled = true;
            submit.innerHTML = '<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span><span>Mendaftarkan...</span>';
        }

        try {
            const user = await registerUser({ name, storeName, phone, email, region, district, password });
            window.closeModal?.('modal-user-auth');
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: user }));
        } catch (err) {
            showError('register-error-alert', 'register-error-text', err?.message || 'Pendaftaran akun gagal. Silakan coba lagi.');
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.innerHTML = originalHtml;
                refreshIcons();
            }
        }
    });

    // Forgot Password request flow.
    document.getElementById('forgot-password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const emailInput = document.getElementById('forgot-input-email');
        const email = (emailInput?.value || '').trim();
        if (!email) {
            showError('forgot-error-alert', 'forgot-error-text', 'Silakan masukkan alamat email akun Anda.');
            emailInput?.focus();
            return;
        }
        if (!email.includes('@')) {
            showError('forgot-error-alert', 'forgot-error-text', 'Format email tidak valid.');
            emailInput?.focus();
            return;
        }

        const submit = document.getElementById('btn-submit-forgot-request');
        const originalHtml = submit?.innerHTML || '';
        if (submit) {
            submit.disabled = true;
            submit.classList.add('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
            submit.innerHTML = '<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span><span>Mengirim...</span>';
        }

        try {
            const res = await requestPasswordReset(email);
            const step2 = document.getElementById('forgot-step-reset');
            const codeInput = document.getElementById('forgot-input-code');
            step2?.classList.remove('hidden');
            codeInput && (codeInput.value = '');
            setTimeout(() => codeInput?.focus(), 250);
            if (window.showToast) window.showToast(`Kode verifikasi telah dikirim ke ${res.email}.`, 'success', 6000);
        } catch (err) {
            showError('forgot-error-alert', 'forgot-error-text', err?.message || 'Gagal membuat kode reset password.');
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.classList.remove('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
                submit.innerHTML = originalHtml;
                refreshIcons();
            }
        }
    });

    // Forgot Password confirmation flow.
    document.getElementById('form-forgot-confirm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = (document.getElementById('forgot-input-email')?.value || '').trim();
        const resetCode = (document.getElementById('forgot-input-code')?.value || '').trim();
        const newPassword = document.getElementById('forgot-input-new-password')?.value || '';

        if (!resetCode) {
            showError('forgot-confirm-error-alert', 'forgot-confirm-error-text', 'Silakan masukkan 6 digit kode verifikasi.');
            return;
        }
        if (!newPassword || newPassword.length < 5) {
            showError('forgot-confirm-error-alert', 'forgot-confirm-error-text', 'Password baru minimal 5 karakter.');
            return;
        }

        const submit = document.getElementById('btn-submit-forgot-confirm');
        const originalHtml = submit?.innerHTML || '';
        if (submit) {
            submit.disabled = true;
            submit.classList.add('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
            submit.innerHTML = '<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span><span>Menyimpan...</span>';
        }

        try {
            await confirmPasswordReset(email, resetCode, newPassword);
            if (window.showToast) window.showToast('Password berhasil diperbarui. Silakan masuk dengan password baru.', 'success', 6000);
            switchAuthTab('login');
            const loginId = document.getElementById('login-input-identifier');
            const loginPass = document.getElementById('login-input-password');
            if (loginId) loginId.value = email;
            if (loginPass) {
                loginPass.value = '';
                setTimeout(() => loginPass.focus(), 200);
            }
        } catch (err) {
            showError('forgot-confirm-error-alert', 'forgot-confirm-error-text', err?.message || 'Gagal mengatur ulang password. Pastikan kode verifikasi benar.');
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.classList.remove('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
                submit.innerHTML = originalHtml;
                refreshIcons();
            }
        }
    });

    document.getElementById('btn-toggle-forgot-password')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById('forgot-input-new-password');
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        const icon = e.currentTarget.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', show ? 'eye-off' : 'eye');
        refreshIcons();
    });

    // Keep the auth modal usable on mobile after dynamic insertion.
    modal.addEventListener('input', (e) => {
        if (e.target?.matches('input')) {
            e.target.classList.remove('border-rose-500', 'ring-2', 'ring-rose-400', 'bg-rose-50/40');
        }
    });
}

// Auto-prefetch when module loads.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { ensureAuthProfileModalsLoaded(); }, { once: true });
} else {
    setTimeout(ensureAuthProfileModalsLoaded, 0);
}
