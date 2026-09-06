# SMTP Security Transition

The SMTP credentials used by `api/send-email.js` must be resolved server-side only.

Required production environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

SMTP settings are read by the backend from `app_smtp_config`. The browser must never send `smtpConfig` to `/api/send-email`.

This document tracks the transition; production environment configuration must be verified before enabling the hardened path.
