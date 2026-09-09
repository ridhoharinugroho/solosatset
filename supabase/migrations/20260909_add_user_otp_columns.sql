-- OTP state is required by the server-side authentication gateway.
-- Idempotent so it is safe to apply to databases that already have the columns.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS otp_code TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_otp
  ON public.users (email, otp_code);
