// ============================================================
// AUTH & PROFILE MODALS LOADER
// Single source of truth for loading components/modals/auth-profile.html
// ============================================================

import { getDistrictsByRegionId } from './data/regions.js';
import './services/otpAuth.js';
import './services/passwordChangeOtp.js';

let authProfileLoadPromise = null;

function populateRegistrationDistricts(preferredDistrict = '') {
    const regionSelect = document.getElementById('reg-select-region');
    const districtSelect = document.getElementById('reg-select-district');
    if (!regionSelect || !districtSelect) return false;
    const regionId = regionSelect.value || 'solo';
    const districts = getDistrictsByRegionId(regionId);
    const previousValue = preferredDistrict || districtSelect.value || '';
    districtSelect.replaceChildren();
    if (!districts.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Kecamatan tidak tersedia';
        districtSelect.appendChild(option);
        districtSelect.value = '';
        return false;
    }
    districts.forEach((district) => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });
    const matchingDistrict = districts.find((district) => district === previousValue);
    districtSelect.value = matchingDistrict || districts[0];
    return true;
}

function installRegistrationDistrictHandler() {
    const regionSelect = document.getElementById('reg-select-region');
    const districtSelect = document.getElementById('reg-select-district');
    if (!regionSelect || !districtSelect) return false;
    if (!regionSelect.dataset.districtHandlerInstalled) {
        regionSelect.addEventListener('change', () => populateRegistrationDistricts());
        regionSelect.dataset.districtHandlerInstalled = 'true';
    }
    populateRegistrationDistricts();
    return true;
}

function showAuthModal(mode = 'login') {
    const modal = document.getElementById('modal-user-auth');
    if (!modal) return false;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    const loginPanel = document.getElementById('panel-auth-login');
    const registerPanel = document.getElementById('panel-auth-register');
    const loginTab = document.getElementById('tab-auth-login');
    const registerTab = document.getElementById('tab-auth-register');
    const isRegister = mode === 'register';
    if (loginPanel) loginPanel.classList.toggle('hidden', isRegister);
    if (registerPanel) registerPanel.classList.toggle('hidden', !isRegister);
    if (loginTab) {
        loginTab.classList.toggle('bg-white', !isRegister);
        loginTab.classList.toggle('text-rose-900', !isRegister);
        loginTab.classList.toggle('shadow-xs', !isRegister);
        loginTab.classList.toggle('text-slate-500', isRegister);
    }
    if (registerTab) {
        registerTab.classList.toggle('bg-white', isRegister);
        registerTab.classList.toggle('text-rose-900', isRegister);
        registerTab.classList.toggle('shadow-xs', isRegister);
        registerTab.classList.toggle('text-slate-500', !isRegister);
    }
    if (isRegister) installRegistrationDistrictHandler();
    if (typeof window.refreshIcons === 'function') { try { window.refreshIcons(modal); } catch (e) {} }
    else if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') { try { window.lucide.createIcons(); } catch (e) {} }
    return true;
}

function showForgotPassword() {
    const modal = document.getElementById('modal-user-auth');
    const emailInput = document.getElementById('forgot-input-email');
    if (!modal || !emailInput) return false;
    const forgotPanel = emailInput.closest('form')?.parentElement || emailInput.closest('[id^="panel-"]') || emailInput.closest('.space-y-4');
    if (!forgotPanel) return false;
    const loginPanel = document.getElementById('panel-auth-login');
    const registerPanel = document.getElementById('panel-auth-register');
    if (loginPanel) loginPanel.classList.add('hidden');
    if (registerPanel) registerPanel.classList.add('hidden');
    modal.querySelectorAll('[id^="panel-auth-"]').forEach((panel) => {
        if (panel !== forgotPanel && panel.id !== 'panel-auth-login' && panel.id !== 'panel-auth-register') panel.classList.add('hidden');
    });
    forgotPanel.classList.remove('hidden');
    const tabs = document.getElementById('auth-tabs-container');
    if (tabs) tabs.classList.add('hidden');
    document.getElementById('forgot-step-reset')?.classList.add('hidden');
    emailInput.focus();
    if (typeof window.refreshIcons === 'function') { try { window.refreshIcons(forgotPanel); } catch (e) {} }
    else if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') { try { window.lucide.createIcons(); } catch (e) {} }
    return true;
}

export async function ensureAuthProfileModalsLoaded() {
    if (document.getElementById('modal-user-auth')) { installRegistrationDistrictHandler(); return true; }
    if (authProfileLoadPromise) return authProfileLoadPromise;
    authProfileLoadPromise = (async () => {
        try {
            const response = await fetch('components/modals/auth-profile.html', { cache: 'no-cache' });
            if (!response.ok) return false;
            const html = await response.text();
            if (!document.getElementById('modal-user-auth')) {
                document.body.insertAdjacentHTML('beforeend', html);
                if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') { try { window.lucide.createIcons(); } catch (e) {} }
            }
            installRegistrationDistrictHandler();
            window.dispatchEvent(new CustomEvent('auth-profile-modals:ready'));
            return true;
        } catch (err) {
            console.error('[AUTH PROFILE MODALS] Error loading auth & profile modals partial:', err);
            return false;
        } finally { authProfileLoadPromise = null; }
    })();
    return authProfileLoadPromise;
}

function installAuthClickDelegation() {
    if (window.__solosatsetAuthClickDelegationInstalled) return;
    window.__solosatsetAuthClickDelegationInstalled = true;
    document.addEventListener('click', async (event) => {
        const target = event.target instanceof Element ? event.target.closest('button, a, [role="button"]') : null;
        if (!target) return;
        const id = (target.id || '').toLowerCase();
        const text = (target.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

        if (id === 'btn-goto-forgot' || text === 'lupa password?' || text.includes('lupa password')) {
            event.preventDefault();
            event.stopPropagation();
            const loaded = await ensureAuthProfileModalsLoaded();
            if (loaded) showForgotPassword();
            return;
        }

        const isRegisterTrigger = id.includes('register') || id.includes('daftar') || text.includes('daftar akun') || text.includes('daftar sekarang');
        const isLoginTrigger = id.includes('login') || text === 'masuk' || text.includes('masuk / login');
        if (!isRegisterTrigger && !isLoginTrigger) return;
        if (target.closest('#form-user-register, #form-user-login')) return;
        event.preventDefault();
        event.stopPropagation();
        const loaded = await ensureAuthProfileModalsLoaded();
        if (loaded) showAuthModal(isRegisterTrigger ? 'register' : 'login');
    }, true);
}
installAuthClickDelegation();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { ensureAuthProfileModalsLoaded(); }, { once: true });
else setTimeout(ensureAuthProfileModalsLoaded, 0);
