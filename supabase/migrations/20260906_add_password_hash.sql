-- Transitional password hardening: retain legacy password column for compatibility
-- until all authentication writers/readers are migrated to password_hash.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN public.users.password_hash IS
  'Server-generated password hash. Preferred authentication credential; legacy password column is temporary compatibility data.';

CREATE INDEX IF NOT EXISTS idx_users_password_hash
  ON public.users (id)
  WHERE password_hash IS NOT NULL;
