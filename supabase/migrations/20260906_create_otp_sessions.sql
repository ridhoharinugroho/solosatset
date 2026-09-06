-- Dedicated server-only OTP session store.
-- OTP values are stored as hashes; plaintext OTP must never be persisted.

CREATE TABLE IF NOT EXISTS public.otp_sessions (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_sessions_expires_at
  ON public.otp_sessions(expires_at);

ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.otp_sessions FROM anon, authenticated;

COMMENT ON TABLE public.otp_sessions IS
  'Server-only OTP state. Stores only a hash of the OTP and enforces expiration/attempt metadata.';
