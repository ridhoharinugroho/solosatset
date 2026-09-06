-- SMTP credentials must never be readable or writable from the browser.
-- The server-side email gateway uses the service-role key and bypasses RLS.

ALTER TABLE public.app_smtp_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_smtp_config FROM anon, authenticated;

DROP POLICY IF EXISTS "Public can read SMTP config" ON public.app_smtp_config;
DROP POLICY IF EXISTS "Public can insert SMTP config" ON public.app_smtp_config;
DROP POLICY IF EXISTS "Public can update SMTP config" ON public.app_smtp_config;
DROP POLICY IF EXISTS "Public can delete SMTP config" ON public.app_smtp_config;
DROP POLICY IF EXISTS "Authenticated users can read SMTP config" ON public.app_smtp_config;
DROP POLICY IF EXISTS "Authenticated users can insert SMTP config" ON public.app_smtp_config;
DROP POLICY IF EXISTS "Authenticated users can update SMTP config" ON public.app_smtp_config;
DROP POLICY IF EXISTS "Authenticated users can delete SMTP config" ON public.app_smtp_config;

COMMENT ON TABLE public.app_smtp_config IS
  'Server-only SMTP configuration. Browser access is intentionally revoked; backend service-role access only.';
