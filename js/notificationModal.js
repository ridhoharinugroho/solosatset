// ============================================================
// NOTIFICATION MODAL CONTROLLER & PARTIAL LOADER
// Single source of truth for loading #modal-notifications partial
// ============================================================

const MODAL_ID = 'modal-notifications';
const OPEN_BUTTON_ID = 'btn-open-notifications-modal';

let initialized = false;
let loadPromise = null;

export function ensureNotificationsModalLoaded() {
  if (document.getElementById(MODAL_ID)) {
    return Promise.resolve(true);
  }

  // Prevent concurrent callers from issuing duplicate fetches.
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const response = await fetch('components/modals/notifications.html');
      if (!response.ok) {
        console.error('[Notifications] Error loading modal partial: HTTP', response.status);
        return false;
      }

      const html = await response.text();
      if (!document.getElementById(MODAL_ID)) {
        document.body.insertAdjacentHTML('beforeend', html);
        if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
          try { window.lucide.createIcons(); } catch (e) {}
        }
      }
      return Boolean(document.getElementById(MODAL_ID));
    } catch (err) {
      console.error('[Notifications] Error loading modal partial:', err);
      return false;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function ensureNotificationsModal() {
  const el = document.getElementById(MODAL_ID);
  if (el) {
    if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    return el;
  }

  ensureNotificationsModalLoaded().catch(() => {});
  return document.getElementById(MODAL_ID);
}

export async function openNotifications() {
  const loaded = await ensureNotificationsModalLoaded();
  if (!loaded) {
    console.error('[Notifications] ERROR: #modal-notifications gagal dimuat.');
    return false;
  }

  const modal = document.getElementById(MODAL_ID);
  if (!modal) {
    console.error('[Notifications] ERROR: #modal-notifications tidak ditemukan.');
    return false;
  }

  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }

  const openFn = window.openModal || (typeof openModal === 'function' ? openModal : null);
  if (openFn) {
    openFn(MODAL_ID);
  } else {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
  }

  window.dispatchEvent(new CustomEvent('notifications:opened'));
  return true;
}

export function closeNotifications() {
  const closeFn = window.closeModal || (typeof closeModal === 'function' ? closeModal : null);
  if (closeFn) {
    closeFn(MODAL_ID);
  } else {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
      document.body.style.overflow = '';
    }
  }

  window.dispatchEvent(new CustomEvent('notifications:closed'));
}

export function initNotificationsModal() {
  if (initialized) {
    return;
  }
  initialized = true;

  // Delegation removes the load-order race: the button can be clicked even
  // when the modal partial is still being fetched.
  document.addEventListener('click', function (event) {
    const button = event.target.closest?.(`#${OPEN_BUTTON_ID}`);
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    openNotifications().catch((err) => {
      console.warn('[Notifications] Gagal membuka modal:', err);
    });
  });

  const button = document.getElementById(OPEN_BUTTON_ID);
  if (button) {
    button.type = 'button';
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
  }

  // Prefetch is deliberately non-blocking; openNotifications() still awaits
  // the same in-flight promise when the user clicks immediately.
  ensureNotificationsModalLoaded().catch(() => {});

  window.openNotifications = openNotifications;
  window.closeNotifications = closeNotifications;
  window.ensureNotificationsModal = ensureNotificationsModal;
  window.ensureNotificationsModalLoaded = ensureNotificationsModalLoaded;
}

// Auto-prefetch when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initNotificationsModal(); }, { once: true });
} else {
  setTimeout(initNotificationsModal, 0);
}
