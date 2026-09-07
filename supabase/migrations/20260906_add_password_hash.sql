-- Transitional password hardening: retain legacy password column for compatibility
-- until all authentication writers/readers are migrated to password_hash.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN public.users.password_hash IS
  'Server-generated password hash. Preferred authentication credential; legacy password column is temporary compatibility data.';

CREATE INDEX IF NOT EXISTS idx_users_password_hash
  ON public.users (id)
  WHERE password_hash IS NOT NULL;

-- Browser clients must not be able to read credential columns or mutate account rows.
-- Authentication, profile, registration and interest writes are server-authoritative.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Keep existing policies intact for compatibility; revoke browser privileges instead.
-- This does not delete rows, columns, tables, or policies.
REVOKE SELECT ON TABLE public.users FROM anon, authenticated;

-- Grant only columns that actually exist in the target production table,
-- excluding all known credential/OTP columns. This keeps the migration compatible
-- with older production schemas that do not yet have every profile column.
DO $$
DECLARE
  safe_columns TEXT;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
    INTO safe_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name NOT IN (
      'password',
      'password_hash',
      'otp_code',
      'otp_expires_at'
    );

  IF safe_columns IS NOT NULL THEN
    EXECUTE format(
      'GRANT SELECT (%s) ON TABLE public.users TO anon, authenticated',
      safe_columns
    );
  END IF;
END $$;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.users FROM anon, authenticated;

COMMENT ON TABLE public.users IS
  'User accounts. Browser clients may read only non-credential profile columns; all account writes are server-authoritative.';
