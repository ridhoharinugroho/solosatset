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

CREATE OR REPLACE FUNCTION public.consume_otp_and_reset_password(
  p_email TEXT,
  p_code_hash TEXT,
  p_password_hash TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  otp_row public.otp_sessions%ROWTYPE;
  updated_users INTEGER;
BEGIN
  SELECT * INTO otp_row
  FROM public.otp_sessions
  WHERE email = lower(trim(p_email))
  FOR UPDATE;

  IF NOT FOUND OR otp_row.consumed_at IS NOT NULL THEN
    RETURN 'invalid';
  END IF;

  IF otp_row.expires_at <= NOW() THEN
    UPDATE public.otp_sessions
      SET consumed_at = NOW(), updated_at = NOW()
      WHERE email = otp_row.email AND consumed_at IS NULL;
    RETURN 'expired';
  END IF;

  IF otp_row.attempts >= otp_row.max_attempts THEN
    RETURN 'locked';
  END IF;

  IF otp_row.code_hash IS DISTINCT FROM p_code_hash THEN
    UPDATE public.otp_sessions
      SET attempts = attempts + 1, updated_at = NOW()
      WHERE email = otp_row.email AND consumed_at IS NULL;
    IF otp_row.attempts + 1 >= otp_row.max_attempts THEN
      RETURN 'locked';
    END IF;
    RETURN 'invalid';
  END IF;

  UPDATE public.users
    SET password_hash = p_password_hash,
        password = NULL,
        updated_at = NOW()
    WHERE lower(email) = lower(trim(p_email))
      AND COALESCE(lower(status), 'active') <> 'deleted'
      AND deleted_at IS NULL;

  GET DIAGNOSTICS updated_users = ROW_COUNT;
  IF updated_users <> 1 THEN
    RETURN 'account_missing';
  END IF;

  UPDATE public.otp_sessions
    SET consumed_at = NOW(), updated_at = NOW()
    WHERE email = otp_row.email AND consumed_at IS NULL;

  RETURN 'success';
END;
$$;

REVOKE ALL ON FUNCTION public.consume_otp_and_reset_password(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_otp_and_reset_password(TEXT, TEXT, TEXT) TO service_role;

COMMENT ON TABLE public.otp_sessions IS
  'Server-only OTP state. Stores only a hash of the OTP and enforces expiration/attempt metadata.';
COMMENT ON FUNCTION public.consume_otp_and_reset_password(TEXT, TEXT, TEXT) IS
  'Atomically verifies and consumes a password-reset OTP and updates the user password hash.';
