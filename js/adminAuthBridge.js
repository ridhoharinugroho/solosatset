/**
 * Admin authentication bridge.
 * Credential verification and session authority remain server-side.
 */

const ADMIN_AUTH_KEY = "pusat_barkas_admin_auth";
const SESSION_ENDPOINT = "/api/admin-auth";

async function getAdminSession() {
  try {
    const response = await fetch(`${SESSION_ENDPOINT}?action=session`, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (payload?.authenticated) {
      window.__solosatsetAdminSecurity?.setValidated(true);
      return payload;
    }
    window.__solosatsetAdminSecurity?.setValidated(false);
    return null;
  } catch {
    window.__solosatsetAdminSecurity?.setValidated(false);
    return null;
  }
}

async function loginAdmin(username, password) {
  const response = await fetch(`${SESSION_ENDPOINT}?action=login`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok || !payload?.authenticated) {
    const error = new Error(payload?.error || "Login admin gagal.");
    error.status = response.status;
    throw error;
  }

  window.__solosatsetAdminSecurity?.setValidated(true);
  sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
  return payload;
}

async function logoutAdmin() {
  try {
    await fetch(`${SESSION_ENDPOINT}?action=logout`, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
  } finally {
    window.__solosatsetAdminSecurity?.setValidated(false);
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  }
}

window.__solosatsetAdminAuth = Object.freeze({
  getSession: getAdminSession,
  login: loginAdmin,
  logout: logoutAdmin,
  authKey: ADMIN_AUTH_KEY,
});
