/**
 * Admin authentication bridge.
 *
 * Keeps the legacy admin dashboard UI intact while moving credential
 * verification to the server. The browser never receives the password hash.
 */

const ADMIN_AUTH_KEY = 'pusat_barkas_admin_auth';
const SESSION_ENDPOINT = '/api/admin-auth';

async function getAdminSession() {
  try {
    const response = await fetch(`${SESSION_ENDPOINT}?action=session`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.authenticated ? payload : null;
  } catch {
    return null;
  }
}

async function loginAdmin(username, password) {
  const response = await fetch(`${SESSION_ENDPOINT}?action=login`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password })
  });

  let payload = null;
  try { payload = await response.json(); } catch {}

  if (!response.ok || !payload?.authenticated) {
    const error = new Error(payload?.error || 'Login admin gagal.');
    error.status = response.status;
    throw error;
  }

  sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
  return payload;
}

async function logoutAdmin() {
  try {
    await fetch(`${SESSION_ENDPOINT}?action=logout`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
  } finally {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  }
}

window.__solosatsetAdminAuth = Object.freeze({
  getSession: getAdminSession,
  login: loginAdmin,
  logout: logoutAdmin,
  authKey: ADMIN_AUTH_KEY
});

window.addEventListener('DOMContentLoaded', async () => {
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const loginForm = document.getElementById('form-admin-login');
  const logoutButton = document.getElementById('btn-admin-logout');

  const session = await getAdminSession();
  if (!session) {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    if (dashboardView) dashboardView.classList.add('hidden');
    if (loginView) loginView.classList.remove('hidden');
  } else {
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('admin-username')?.value?.trim() || '';
    const password = document.getElementById('admin-password')?.value || '';
    const submit = loginForm.querySelector('button[type="submit"]');
    const original = submit?.innerHTML;

    if (submit) {
      submit.disabled = true;
      submit.innerHTML = '<span>Memverifikasi...</span>';
    }

    try {
      await loginAdmin(username, password);
      loginForm.reset();
      if (loginView) loginView.classList.add('hidden');
      if (dashboardView) dashboardView.classList.remove('hidden');
      window.dispatchEvent(new CustomEvent('adminAuthenticated'));
    } catch (error) {
      const alert = document.getElementById('login-error-alert');
      const message = document.getElementById('login-error-msg');
      if (alert) alert.classList.remove('hidden');
      if (message) message.textContent = error.message || 'Username atau Password salah.';
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = original || '<span>Masuk ke Panel Admin</span>';
      }
    }
  }, true);

  logoutButton?.addEventListener('click', () => {
    void logoutAdmin();
  }, true);
});
