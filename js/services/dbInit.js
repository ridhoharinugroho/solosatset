/**
 * Lightweight database capability check.
 * Runtime never creates, alters, or seeds database schema/data.
 * Schema changes must be applied through Supabase migrations.
 */

import { supabase } from '../lib/supabase.js';

let isDbChecked = false;
let hasOtpDbColumns = false;

if (typeof window !== 'undefined') {
  window._hasOtpDbColumns = false;
}

export function isOtpDbColumnSupported() {
  return hasOtpDbColumns || (typeof window !== 'undefined' && Boolean(window._hasOtpDbColumns));
}

export async function checkAndInitDatabaseSchema() {
  if (isDbChecked) return isOtpDbColumnSupported();
  isDbChecked = true;

  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, otp_code, otp_expires_at')
      .limit(1);

    if (!error && Array.isArray(data)) {
      hasOtpDbColumns = true;
      if (typeof window !== 'undefined') window._hasOtpDbColumns = true;
      return true;
    }
  } catch (err) {
    console.warn('[DB Capability Check]', err?.message || err);
  }

  hasOtpDbColumns = false;
  if (typeof window !== 'undefined') window._hasOtpDbColumns = false;
  return false;
}

// Run a read-only capability check after the app is idle. No schema mutation occurs.
if (typeof window !== 'undefined') {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => { checkAndInitDatabaseSchema(); });
  } else {
    setTimeout(() => { checkAndInitDatabaseSchema(); }, 1000);
  }
}
