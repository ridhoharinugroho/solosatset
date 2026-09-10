import { getCurrentUser } from '../../services/auth.js';
import { refreshIcons } from '../../utils/runtime.js';

export let isProfileEditMode = false;

export function setProfileEditMode(isEditing, options = {}) {
  isProfileEditMode = isEditing;
  const { userProfileAvatarData } = options;
  const avatarWrapper = document.getElementById('profile-avatar-upload-wrapper');
  const btnEdit = document.getElementById('btn-profile-enable-edit');
  const btnCancel = document.getElementById('btn-profile-cancel-edit');
  const btnSave = document.getElementById('btn-profile-save');
  const passSection = document.getElementById('profile-password-section');

  const inputs = [
    'profile-input-name',
    'profile-input-store-name',
    'profile-input-phone',
    'profile-input-email',
    'profile-input-bio',
    'profile-input-new-password',
    'profile-input-confirm-password'
  ];

  const btnRegion = document.getElementById('btn-open-profile-region-picker');
  const btnDistrict = document.getElementById('btn-open-profile-district-picker');
  const chevronRegion = document.getElementById('profile-region-trigger-chevron');
  const chevronDistrict = document.getElementById('profile-district-trigger-chevron');

  if (isEditing) {
    inputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = false;
        el.readOnly = false;
        el.removeAttribute('disabled');
        el.removeAttribute('readonly');
        el.className = "w-full px-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6";
        if (id === 'profile-input-phone' || id === 'profile-input-email') {
          el.className = "w-full pl-5 pr-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6";
        }
        if (id === 'profile-input-bio') {
          el.className = "w-full px-2 py-0.5 bg-white border border-rose-300 rounded-md text-[10.5px] font-medium text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6 min-h-[24px] max-h-[30px]";
        }
      }
    });

    if (btnRegion) {
      btnRegion.disabled = false;
      btnRegion.className = "w-full px-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6 cursor-pointer flex items-center justify-between text-left";
    }
    if (btnDistrict) {
      btnDistrict.disabled = false;
      btnDistrict.className = "w-full px-2 py-0 bg-white border border-rose-300 rounded-md text-[10.5px] font-semibold text-slate-900 focus:ring-1 focus:ring-rose-900 focus:bg-white focus:outline-none transition-all h-6 cursor-pointer flex items-center justify-between text-left";
    }
    if (chevronRegion) chevronRegion.classList.remove('hidden');
    if (chevronDistrict) chevronDistrict.classList.remove('hidden');

    const btnDeleteAvatar = document.getElementById('btn-profile-delete-avatar');
    if (avatarWrapper) avatarWrapper.classList.remove('hidden');
    if (btnDeleteAvatar) {
      const currentUser = getCurrentUser();
      if (userProfileAvatarData || (currentUser && currentUser.avatar)) {
        btnDeleteAvatar.classList.remove('hidden');
      } else {
        btnDeleteAvatar.classList.add('hidden');
      }
    }
    if (passSection) passSection.classList.remove('hidden');

    if (btnEdit) btnEdit.classList.add('hidden');
    if (btnCancel) btnCancel.classList.remove('hidden');
    if (btnSave) btnSave.classList.remove('hidden');

    setTimeout(() => {
      document.getElementById('profile-input-name')?.focus();
    }, 50);
  } else {
    const btnDeleteAvatar = document.getElementById('btn-profile-delete-avatar');
    inputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = true;
        el.readOnly = true;
        el.setAttribute('disabled', 'true');
        el.setAttribute('readonly', 'true');
        el.className = "w-full px-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed h-6";
        if (id === 'profile-input-phone' || id === 'profile-input-email') {
          el.className = "w-full pl-5 pr-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed h-6";
        }
        if (id === 'profile-input-bio') {
          el.className = "w-full px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-medium text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed h-6 min-h-[24px] max-h-[30px]";
        }
      }
    });

    if (btnRegion) {
      btnRegion.disabled = true;
      btnRegion.className = "w-full px-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed flex items-center justify-between text-left h-6";
    }
    if (btnDistrict) {
      btnDistrict.disabled = true;
      btnDistrict.className = "w-full px-2 py-0 bg-slate-100 border border-slate-300 rounded-md text-[10.5px] font-semibold text-slate-700 focus:outline-none transition-all disabled:opacity-85 disabled:cursor-not-allowed flex items-center justify-between text-left h-6";
    }
    if (chevronRegion) chevronRegion.classList.add('hidden');
    if (chevronDistrict) chevronDistrict.classList.add('hidden');

    if (avatarWrapper) avatarWrapper.classList.add('hidden');
    if (btnDeleteAvatar) btnDeleteAvatar.classList.add('hidden');
    if (passSection) passSection.classList.add('hidden');

    if (btnEdit) btnEdit.classList.remove('hidden');
    if (btnCancel) btnCancel.classList.add('hidden');
    if (btnSave) btnSave.classList.add('hidden');
  }

  if (window.lucide) {
    try { refreshIcons(); } catch (e) { }
  }
}
