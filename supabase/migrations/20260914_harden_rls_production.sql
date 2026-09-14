-- Production Security Hardening Migration
-- 1. users: Revoke broad public SELECT; allow authenticated users to read only their own record.
-- 2. notifications: Allow authenticated users to SELECT and UPDATE only their own notifications.
-- 3. app_reviews: Public SELECT allowed; INSERT requires authenticated user; UPDATE/DELETE only owner or admin.

-- -----------------------------------------------------------------------------
-- USERS TABLE RLS HARDENING
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_public" ON public.users;
DROP POLICY IF EXISTS "users_public_select" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;

-- Revoke all direct browser access for anon
REVOKE ALL ON TABLE public.users FROM anon;

-- Authenticated users can only SELECT their own record
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id::text);

-- Prevent browser account writes directly; server-side service_role retains full access
REVOKE INSERT, UPDATE, DELETE ON TABLE public.users FROM anon, authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE RLS HARDENING
-- -----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_public" ON public.notifications;
DROP POLICY IF EXISTS "notifications_public_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_public_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_all" ON public.notifications;

-- Authenticated users can SELECT only their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Authenticated users can UPDATE only their own notifications (e.g. mark read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

-- -----------------------------------------------------------------------------
-- APP_REVIEWS TABLE RLS HARDENING
-- -----------------------------------------------------------------------------
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_reviews_read_public" ON public.app_reviews;
DROP POLICY IF EXISTS "app_reviews_insert_all" ON public.app_reviews;
DROP POLICY IF EXISTS "app_reviews_update_all" ON public.app_reviews;
DROP POLICY IF EXISTS "app_reviews_delete_all" ON public.app_reviews;
DROP POLICY IF EXISTS "app_reviews_insert_authenticated" ON public.app_reviews;
DROP POLICY IF EXISTS "app_reviews_update_owner_admin" ON public.app_reviews;
DROP POLICY IF EXISTS "app_reviews_delete_owner_admin" ON public.app_reviews;

-- Public SELECT allowed for marketplace review display
CREATE POLICY "app_reviews_read_public" ON public.app_reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- INSERT allowed for authenticated users
CREATE POLICY "app_reviews_insert_authenticated" ON public.app_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id IS NULL OR auth.uid()::text = user_id::text)
  );

-- UPDATE allowed for owner or admin
CREATE POLICY "app_reviews_update_owner_admin" ON public.app_reviews
  FOR UPDATE TO authenticated
  USING (
    auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM public.admin_users WHERE id::text = auth.uid()::text)
  );

-- DELETE allowed for owner or admin
CREATE POLICY "app_reviews_delete_owner_admin" ON public.app_reviews
  FOR DELETE TO authenticated
  USING (
    auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM public.admin_users WHERE id::text = auth.uid()::text)
  );

GRANT SELECT ON TABLE public.app_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.app_reviews TO authenticated;
GRANT ALL ON TABLE public.app_reviews TO service_role;
