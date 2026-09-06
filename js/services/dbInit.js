/**
 * Read-only Database Health Check - Pusat Jual Beli Solo Raya
 *
 * Schema changes are managed exclusively by Supabase migrations.
 * This module only verifies that the runtime schema is reachable and that
 * the OTP columns are available; it never creates, alters, grants, or drops DB objects.
 */

import { supabase } from '../lib/supabase.js';

let isDbInitialized = false;
let hasOtpDbColumns = false;

if (typeof window !== 'undefined') {
  window._hasOtpDbColumns = false;
}

export function isOtpDbColumnSupported() {
  return hasOtpDbColumns || (typeof window !== 'undefined' && Boolean(window._hasOtpDbColumns));
}

export async function checkAndInitDatabaseSchema() {
  if (isDbInitialized) return;
  isDbInitialized = true;

  try {
    if (!supabase) return;

    // Read-only schema probe. No runtime migration/fallback is attempted.
    const { data, error } = await supabase
      .from('users')
      .select('otp_code, otp_expires_at')
      .limit(1);

    if (!error) {
      hasOtpDbColumns = true;
      if (typeof window !== 'undefined') window._hasOtpDbColumns = true;
      console.log('[DB Health] Kolom OTP pada tabel users terverifikasi.');
    } else {
      hasOtpDbColumns = false;
      if (typeof window !== 'undefined') window._hasOtpDbColumns = false;
      console.warn('[DB Health] Kolom OTP belum tersedia atau schema tidak dapat diakses:', error.message);
    }
  } catch (err) {
    hasOtpDbColumns = false;
    if (typeof window !== 'undefined') window._hasOtpDbColumns = false;
    console.warn('[DB Health Exception]', err);
  }
}

// Jalankan otomatis saat browser idle / dimuat.
if (typeof window !== 'undefined') {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => checkAndInitDatabaseSchema());
  } else {
    setTimeout(checkAndInitDatabaseSchema, 1000);
  }
}
