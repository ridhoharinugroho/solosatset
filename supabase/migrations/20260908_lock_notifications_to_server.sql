-- Notifications are now accessed only through server-authoritative API endpoints.
-- The service_role bypasses RLS; browser roles must not read/write this table directly.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_public" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_all" ON public.notifications;

REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;
