/**
 * Module Live Visual Editor & Overlay Bubble Controls
 * Isolasi logika studio edit teks/visual in-place dan modal login admin.
 */

import { showToast } from '../common/toast.js';

let activeEditableTarget = null;
let activeEditableKey = null;

export function initLiveVisualEditor() {
  let clickCount = 0;
  let clickTimer = null;
  let lastClickTime = 0;

  // 10-Clicks Hidden Trigger on Brand Logo
  window.handleSecretAdminClick = function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const now = Date.now();
    if (now - lastClickTime < 40) return;
    lastClickTime = now;

    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 7 && clickCount < 10) {
      const remaining = 10 - clickCount;
      showToast(`🔑 ${remaining} ketukan lagi untuk membuka Akses Admin...`, "info");
    }

    if (clickCount >= 10) {
      clickCount = 0;
      showToast("🔓 10x Ketukan Berhasil! Mengalihkan ke Studio Visual...", "success");

      const isAuth = sessionStorage.getItem('pusat_barkas_admin_auth') === 'true';
      if (isAuth) {
        window.location.href = 'admin.html?tab=studio';
      } else {
        openAdminLoginModal();
      }
      return;
    }

    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 4500);
  };

  const logoContainer = document.getElementById('brand-logo-icon-container');
  if (logoContainer) {
    logoContainer.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.handleSecretAdminClick(e);
    });
  }

  const brandLogo = document.getElementById('brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', window.handleSecretAdminClick);
  }

  // Admin Login Modal Form Handler
  const loginForm = document.getElementById('form-modal-admin-login');
  loginForm?.addEventListener('submit', handleModalAdminLogin);

  // Floating Control Bar Action Buttons
  document.getElementById('btn-save-live-visual')?.addEventListener('click', saveVisualChanges);
  document.getElementById('btn-exit-live-visual')?.addEventListener('click', disableVisualEditor);
  document.getElementById('btn-exit-live-visual-mobile')?.addEventListener('click', disableVisualEditor);

  // Floating Overlay Bubble Toolbar Controls
  initOverlayBubbleEvents();
}

export function initOverlayBubbleEvents() {
  const bubble = document.getElementById('live-editor-overlay-bubble');
  if (!bubble) return;

  // Font Family Selector
  document.getElementById('bubble-font-family')?.addEventListener('change', (e) => {
    if (!activeEditableTarget || !activeEditableKey) return;
    const font = e.target.value;
    activeEditableTarget.style.fontFamily = font !== 'inherit' ? font : '';
    saveElementStyle(activeEditableKey, 'fontFamily', font);
  });

  // Font Size Dec (-)
  document.getElementById('bubble-btn-font-dec')?.addEventListener('click', () => {
    if (!activeEditableTarget || !activeEditableKey) return;
    const currentSize = parseFloat(window.getComputedStyle(activeEditableTarget).fontSize) || 14;
    const newSize = Math.max(9, Math.round(currentSize - 1));
    activeEditableTarget.style.fontSize = `${newSize}px`;
    saveElementStyle(activeEditableKey, 'fontSize', `${newSize}px`);
  });

  // Font Size Inc (+)
  document.getElementById('bubble-btn-font-inc')?.addEventListener('click', () => {
    if (!activeEditableTarget || !activeEditableKey) return;
    const currentSize = parseFloat(window.getComputedStyle(activeEditableTarget).fontSize) || 14;
    const newSize = Math.min(48, Math.round(currentSize + 1));
    activeEditableTarget.style.fontSize = `${newSize}px`;
    saveElementStyle(activeEditableKey, 'fontSize', `${newSize}px`);
  });

  // Bold (B)
  document.getElementById('bubble-btn-bold')?.addEventListener('click', () => {
    if (!activeEditableTarget || !activeEditableKey) return;
    const currentWeight = window.getComputedStyle(activeEditableTarget).fontWeight;
    const isBold = currentWeight === '700' || currentWeight === '800' || currentWeight === '900' || currentWeight === 'bold';
    const newWeight = isBold ? '400' : '800';
    activeEditableTarget.style.fontWeight = newWeight;
    saveElementStyle(activeEditableKey, 'fontWeight', newWeight);
  });

  // Italic (I)
  document.getElementById('bubble-btn-italic')?.addEventListener('click', () => {
    if (!activeEditableTarget || !activeEditableKey) return;
    const currentStyle = window.getComputedStyle(activeEditableTarget).fontStyle;
    const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
    activeEditableTarget.style.fontStyle = newStyle;
    saveElementStyle(activeEditableKey, 'fontStyle', newStyle);
  });

  // Underline (U)
  document.getElementById('bubble-btn-underline')?.addEventListener('click', () => {
    if (!activeEditableTarget || !activeEditableKey) return;
    const currentDecoration = window.getComputedStyle(activeEditableTarget).textDecoration;
    const newDec = currentDecoration.includes('underline') ? 'none' : 'underline';
    activeEditableTarget.style.textDecoration = newDec;
    saveElementStyle(activeEditableKey, 'textDecoration', newDec);
  });

  // Color Picker
  document.getElementById('bubble-color-picker')?.addEventListener('input', (e) => {
    if (!activeEditableTarget || !activeEditableKey) return;
    const color = e.target.value;
    activeEditableTarget.style.color = color;
    saveElementStyle(activeEditableKey, 'color', color);
  });

  // Close Bubble
  document.getElementById('bubble-btn-close')?.addEventListener('click', () => {
    hideOverlayBubble();
  });

  // Reposition on window scroll/resize
  window.addEventListener('scroll', () => {
    if (activeEditableTarget && window.state?.isVisualEditorActive) {
      positionOverlayBubble(activeEditableTarget);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (activeEditableTarget && window.state?.isVisualEditorActive) {
      positionOverlayBubble(activeEditableTarget);
    }
  }, { passive: true });
}

export function broadcastStudioSync() {
  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({
        type: 'LIVE_STUDIO_SYNC',
        customTexts: window.state?.customTexts || (typeof window.getCustomTexts === 'function' ? window.getCustomTexts() : {}),
        siteSettings: window.state?.siteSettings || (typeof window.getSiteSettings === 'function' ? window.getSiteSettings() : {})
      }, '*');
    } catch (e) { }
  }
}

export function saveElementStyle(key, prop, value) {
  if (!window.state) window.state = {};
  if (!window.state.siteSettings) window.state.siteSettings = typeof window.getSiteSettings === 'function' ? window.getSiteSettings() : {};
  if (!window.state.siteSettings.textStyles) window.state.siteSettings.textStyles = {};
  if (!window.state.siteSettings.textStyles[key]) window.state.siteSettings.textStyles[key] = {};
  window.state.siteSettings.textStyles[key][prop] = value;
  broadcastStudioSync();
}

export function showOverlayBubbleForElement(el, key) {
  activeEditableTarget = el;
  activeEditableKey = key;

  document.querySelectorAll('.active-editable-target').forEach((e) => e.classList.remove('active-editable-target'));
  el.classList.add('active-editable-target');

  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    el.focus();
  } else {
    el.focus();
  }

  const bubble = document.getElementById('live-editor-overlay-bubble');
  if (bubble) {
    bubble.classList.remove('hidden');
    positionOverlayBubble(el);

    const existingStyle = (window.state?.siteSettings?.textStyles && window.state.siteSettings.textStyles[key]) || {};
    const fontSelect = document.getElementById('bubble-font-family');
    if (fontSelect) fontSelect.value = existingStyle.fontFamily || 'inherit';

    const colorPicker = document.getElementById('bubble-color-picker');
    if (colorPicker && existingStyle.color) colorPicker.value = existingStyle.color;
  }
}

export function hideOverlayBubble() {
  const bubble = document.getElementById('live-editor-overlay-bubble');
  if (bubble) bubble.classList.add('hidden');
  if (activeEditableTarget) {
    activeEditableTarget.classList.remove('active-editable-target');
  }
  activeEditableTarget = null;
  activeEditableKey = null;
}

export function positionOverlayBubble(targetElement) {
  const bubble = document.getElementById('live-editor-overlay-bubble');
  if (!bubble || !targetElement) return;

  const rect = targetElement.getBoundingClientRect();
  const bubbleWidth = bubble.offsetWidth || 340;
  const bubbleHeight = bubble.offsetHeight || 44;

  let top = rect.top - bubbleHeight - 8;
  if (top < 10) {
    top = rect.bottom + 8;
  }

  let left = rect.left + (rect.width / 2) - (bubbleWidth / 2);
  const maxLeft = window.innerWidth - bubbleWidth - 10;
  left = Math.max(10, Math.min(left, maxLeft));

  bubble.style.top = `${top}px`;
  bubble.style.left = `${left}px`;
}

export function openAdminLoginModal() {
  const modal = document.getElementById('modal-admin-login');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.zIndex = '10000';
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-login-error')?.classList.add('hidden');
    const uInput = document.getElementById('modal-admin-username');
    const pInput = document.getElementById('modal-admin-password');
    if (uInput) uInput.value = '';
    if (pInput) pInput.value = '';
    setTimeout(() => {
      uInput?.focus();
    }, 150);
    if (typeof window.refreshIcons === 'function') window.refreshIcons();
  }
}

export function closeAdminLoginModal() {
  const modal = document.getElementById('modal-admin-login');
  if (modal) modal.classList.add('hidden');
}

export function handleModalAdminLogin(e) {
  e.preventDefault();
  const u = document.getElementById('modal-admin-username')?.value.trim() || '';
  const p = document.getElementById('modal-admin-password')?.value.trim() || '';
  const errorBox = document.getElementById('modal-login-error');

  if (u === 'ratakanan' && p === '280995') {
    sessionStorage.setItem('pusat_barkas_admin_auth', 'true');
    closeAdminLoginModal();
    window.location.href = 'admin.html?tab=studio';
  } else {
    if (errorBox) {
      errorBox.classList.remove('hidden');
      errorBox.classList.add('animate-bounce');
      setTimeout(() => errorBox.classList.remove('animate-bounce'), 800);
    }
  }
}

export function enableVisualEditor() {
  const isMobileEditor = window.location.search.includes('mode=mobile_editor');
  if (!isMobileEditor) {
    document.body.classList.remove('visual-editor-active', 'is-in-phone-frame');
    document.getElementById('floating-live-editor-bar')?.classList.add('hidden');
    if (window.state) window.state.isVisualEditorActive = false;
    return;
  }

  if (window.state) window.state.isVisualEditorActive = true;
  document.body.classList.add('visual-editor-active', 'is-in-phone-frame');
  const bar = document.getElementById('floating-live-editor-bar');
  if (bar) {
    bar.classList.remove('hidden');
    if (typeof window.refreshIcons === 'function') window.refreshIcons();
  }

  document.querySelectorAll('[data-text-key]').forEach((el) => {
    const key = el.getAttribute('data-text-key');
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
    }

    el.onclick = (e) => {
      e.stopPropagation();
      showOverlayBubbleForElement(el, key);
    };

    el.oninput = () => {
      const typed = (el.innerText || el.textContent || '').trim();
      if (window.state) {
        if (!window.state.customTexts) window.state.customTexts = typeof window.getCustomTexts === 'function' ? window.getCustomTexts() : {};
        window.state.customTexts[key] = typed;
      }

      document.querySelectorAll(`[data-text-key="${key}"]`).forEach((otherEl) => {
        if (otherEl !== el && otherEl.tagName !== 'INPUT' && otherEl.tagName !== 'TEXTAREA') {
          otherEl.textContent = typed;
        }
      });
      broadcastStudioSync();
    };
  });
}

export function disableVisualEditor() {
  if (window.state) window.state.isVisualEditorActive = false;
  document.body.classList.remove('visual-editor-active');
  const bar = document.getElementById('floating-live-editor-bar');
  if (bar) bar.classList.add('hidden');

  hideOverlayBubble();

  if (window.state) {
    if (typeof window.getCustomTexts === 'function') window.state.customTexts = window.getCustomTexts();
    if (typeof window.getSiteSettings === 'function') window.state.siteSettings = window.getSiteSettings();
    if (typeof window.applyCustomTexts === 'function') window.applyCustomTexts(window.state.customTexts);
    if (typeof window.applySiteSettings === 'function') window.applySiteSettings(window.state.siteSettings);
  }

  document.querySelectorAll('[data-text-key]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.onclick = null;
    el.oninput = null;
  });

  showToast("Mode Edit Visual ditutup.", "info");
}

export function saveVisualChanges() {
  const collectedTexts = { ...(window.state?.customTexts || {}) };

  document.querySelectorAll('[data-text-key]').forEach((el) => {
    const key = el.getAttribute('data-text-key');
    if (!key) return;

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (key === 'search_placeholder' || el.hasAttribute('placeholder')) {
        const typedVal = el.value ? el.value.trim() : '';
        if (typedVal !== '') {
          collectedTexts[key] = typedVal;
          el.setAttribute('placeholder', typedVal);
        } else if (el.placeholder) {
          collectedTexts[key] = el.placeholder.trim();
        }
      } else {
        const typedVal = el.value ? el.value.trim() : '';
        if (typedVal !== '') collectedTexts[key] = typedVal;
      }
    } else {
      const raw = (el.innerText || el.textContent || '').trim();
      if (raw !== '') {
        collectedTexts[key] = raw;
      }
    }
  });

  if (window.state) window.state.customTexts = collectedTexts;
  if (typeof window.saveCustomTexts === 'function') window.saveCustomTexts(collectedTexts);
  showToast("Semua perubahan teks visual berhasil disimpan!", "success");
}

// Window binding
window.initLiveVisualEditor = initLiveVisualEditor;
window.enableVisualEditor = enableVisualEditor;
window.disableVisualEditor = disableVisualEditor;
window.saveVisualChanges = saveVisualChanges;
window.openAdminLoginModal = openAdminLoginModal;
window.closeAdminLoginModal = closeAdminLoginModal;
window.handleModalAdminLogin = handleModalAdminLogin;
