-- Browser clients may read the public user directory, but account mutations must
-- go through server-side APIs that authenticate the caller and use the service key.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_public_insert" ON public.users;
DROP POLICY IF EXISTS "users_public_update" ON public.users;
DROP POLICY IF EXISTS "users_public_select" ON public.users;

CREATE POLICY "users_public_select"
  ON public.users
  FOR SELECT
  TO anon, authenticated
  USING (true);
