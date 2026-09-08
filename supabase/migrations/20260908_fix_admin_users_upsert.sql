-- Ensure Supabase upsert(onConflict: 'username') has a matching unique constraint/index.
-- Admin usernames are normalized to lowercase by the server before storage.

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_uidx
  ON public.admin_users (username);
