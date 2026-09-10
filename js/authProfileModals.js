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

export async function ensureAuthProfileModalsLoaded() {
    if (document.getElementById('modal-user-auth')) { installRegistrationDistrictHandler(); return true; }
    if (authProfileLoadPromise) return authProfileLoadPromise;
    authProfileLoadPromise = (async () => {
        try {
            // Muat kedua file HTML secara paralel untuk efisiensi
            const [authRes, profileRes] = await Promise.all([
                fetch('components/modals/auth-user.html', { cache: 'no-cache' }),
                fetch('components/modals/profile-settings.html', { cache: 'no-cache' })
            ]);

            if (!authRes.ok) {
                // Fallback ke file monolitik lama jika file baru belum ada
                const fallback = await fetch('components/modals/auth-profile.html', { cache: 'no-cache' });
                if (!fallback.ok) return false;
                const html = await fallback.text();
                if (!document.getElementById('modal-user-auth')) {
                    document.body.insertAdjacentHTML('beforeend', html);
                    if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') { try { window.lucide.createIcons(); } catch (e) {} }
                }
                installRegistrationDistrictHandler();
                window.dispatchEvent(new CustomEvent('auth-profile-modals:ready'));
                return true;
            }

            const [authHtml, profileHtml] = await Promise.all([
                authRes.text(),
                profileRes.ok ? profileRes.text() : Promise.resolve('')
            ]);

            if (!document.getElementById('modal-user-auth')) {
                document.body.insertAdjacentHTML('beforeend', authHtml);
            }
            if (profileHtml && !document.getElementById('modal-user-profile')) {
                document.body.insertAdjacentHTML('beforeend', profileHtml);
            }

            if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') { try { window.lucide.createIcons(); } catch (e) {} }
            installRegistrationDistrictHandler();
            window.dispatchEvent(new CustomEvent('auth-profile-modals:ready'));
            return true;
        } catch (err) {
            console.error('[AUTH PROFILE MODALS] Error loading modals:', err);
            return false;
        } finally { authProfileLoadPromise = null; }
    })();
    return authProfileLoadPromise;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { ensureAuthProfileModalsLoaded(); }, { once: true });
else setTimeout(ensureAuthProfileModalsLoaded, 0);
