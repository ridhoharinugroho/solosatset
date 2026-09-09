// Security bootstrap for client-side admin UI hints.
// The server remains the only authority; sessionStorage is never trusted by itself.
const ADMIN_AUTH_KEY = 'pusat_barkas_admin_auth';
const SESSION_ENDPOINT = '/api/admin-auth';
let serverValidated = false;

function setServerValidated(value) {
  serverValidated = value === true;
}

async function refreshServerValidation() {
  try {
    const response = await fetch(`${SESSION_ENDPOINT}?action=session`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    const payload = response.ok ? await response.json() : null;
    setServerValidated(Boolean(payload?.authenticated));
    return serverValidated;
  } catch {
    setServerValidated(false);
    return false;
  }
}

try {
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.getItem = function (key) {
    if (this === window.sessionStorage && key === ADMIN_AUTH_KEY) {
      return serverValidated ? 'true' : null;
    }
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    if (this === window.sessionStorage && key === ADMIN_AUTH_KEY) {
      // Do not let URL parameters or arbitrary client code manufacture admin state.
      if (value === 'true' && serverValidated) {
        return originalSetItem.call(this, key, value);
      }
      if (value !== 'true') {
        return originalSetItem.call(this, key, value);
      }
      return;
    }
    return originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (this === window.sessionStorage && key === ADMIN_AUTH_KEY) {
      setServerValidated(false);
    }
    return originalRemoveItem.call(this, key);
  };
} catch (error) {
  console.warn('[Admin Security Bootstrap] Storage hardening unavailable:', error);
}

window.__solosatsetAdminSecurity = Object.freeze({
  refresh: refreshServerValidation,
  setValidated: setServerValidated,
  isValidated: () => serverValidated
});

// Prevent the legacy client-side admin login handler from accepting credentials
// that never reached the server. The existing modal and redirect UI are retained.
document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('#form-modal-admin-login');
  if (!form) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const username = document.getElementById('modal-admin-username')?.value?.trim() || '';
  const password = document.getElementById('modal-admin-password')?.value || '';
  const errorBox = document.getElementById('modal-login-error');

  try {
    const response = await fetch(`${SESSION_ENDPOINT}?action=login`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.authenticated) {
      throw new Error(payload?.error || 'Login admin gagal.');
    }

    setServerValidated(true);
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    document.getElementById('modal-admin-login')?.classList.add('hidden');
    window.location.href = 'admin.html?tab=studio';
  } catch (error) {
    if (errorBox) {
      errorBox.classList.remove('hidden');
      errorBox.classList.add('animate-bounce');
      setTimeout(() => errorBox.classList.remove('animate-bounce'), 800);
    }
  }
}, true);

// Validate asynchronously before any user can reach an admin-only action.
refreshServerValidation();
