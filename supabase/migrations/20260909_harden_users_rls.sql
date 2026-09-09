-- Harden public users access: directory reads remain public, account writes move to the server-only profile API.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_public_insert" ON public.users;
DROP POLICY IF EXISTS "users_public_update" ON public.users;
DROP POLICY IF EXISTS "Public can insert users" ON public.users;
DROP POLICY IF EXISTS "Public can update users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON public.users;

DROP POLICY IF EXISTS "users_public_select" ON public.users;
CREATE POLICY "users_public_select"
  ON public.users
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.users IS
  'Public directory reads are allowed. Account creation and account mutations must use server-side authentication/profile APIs.';
