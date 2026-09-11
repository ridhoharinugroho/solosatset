/**
 * Client database health facade.
 *
 * Database schema is managed exclusively by Supabase migrations and sensitive
 * user/OTP columns are intentionally not queried from the browser. Authentication
 * and password-reset schema checks are server-authoritative.
 */

let hasOtpDbColumns = false;

if (typeof window !== "undefined") {
  window._hasOtpDbColumns = false;
}

export function isOtpDbColumnSupported() {
  return hasOtpDbColumns || (typeof window !== "undefined" && Boolean(window._hasOtpDbColumns));
}

export async function checkAndInitDatabaseSchema() {
  // Intentionally no browser-side query against users/OTP columns.
  // Browser access to the users table is restricted by the security model.
  return isOtpDbColumnSupported();
}
