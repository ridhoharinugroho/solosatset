-- Push subscriptions contain browser endpoint credentials and must never be publicly readable/writable.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_public_read" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_public_write" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_select_all" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_all" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update_all" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_all" ON public.push_subscriptions;

REVOKE ALL ON TABLE public.push_subscriptions FROM anon, authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;

COMMENT ON TABLE public.push_subscriptions IS
  'Server-only Web Push subscriptions. Browser clients must use /api/push-subscribe and never access this table directly.';
