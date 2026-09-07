-- Security hardening for the users table.
-- The browser must never be able to read credential columns or mutate account records directly.
-- Authentication/profile/interest mutations are handled by server-side API routes using service_role.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove the legacy broad browser write policies. Existing policies are named explicitly
-- so this migration is safe to apply after the original schema and prior migrations.
DROP POLICY IF EXISTS "users_insert_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;

-- Keep public profile discovery available, but prevent credential-column reads through PostgREST.
-- PostgreSQL column grants are used because RLS policies cannot hide individual columns.
REVOKE SELECT ON TABLE public.users FROM anon, authenticated;
GRANT SELECT (
  id,
  name,
  store_name,
  email,
  phone,
  region,
  district,
  avatar,
  bio,
  is_demo,
  is_verified,
  status,
  deleted_at,
  created_at,
  updated_at,
  interests
) ON TABLE public.users TO anon, authenticated;

-- No browser-side account writes. The server-side service_role client remains able to perform
-- the required authentication, profile, registration and interest operations.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.users FROM anon, authenticated;

COMMENT ON TABLE public.users IS
  'User accounts. Browser clients may read only non-credential profile columns; all account writes are server-authoritative.';
