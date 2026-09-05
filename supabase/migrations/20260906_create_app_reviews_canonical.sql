-- Canonical app_reviews schema
-- Safe for a fresh database and existing schema drift.

CREATE TABLE IF NOT EXISTS public.app_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_name TEXT,
  user_avatar TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_location TEXT,
  user_id TEXT,
  category TEXT DEFAULT 'Pengalaman Pengguna',
  review_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_app_reviews_user
  ON public.app_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_app_reviews_created
  ON public.app_reviews(created_at DESC);

ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_reviews'
      AND policyname = 'app_reviews_read_public'
  ) THEN
    CREATE POLICY "app_reviews_read_public"
      ON public.app_reviews
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_reviews'
      AND policyname = 'app_reviews_insert_all'
  ) THEN
    CREATE POLICY "app_reviews_insert_all"
      ON public.app_reviews
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_reviews'
      AND policyname = 'app_reviews_update_all'
  ) THEN
    CREATE POLICY "app_reviews_update_all"
      ON public.app_reviews
      FOR UPDATE
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_reviews'
      AND policyname = 'app_reviews_delete_all'
  ) THEN
    CREATE POLICY "app_reviews_delete_all"
      ON public.app_reviews
      FOR DELETE
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.app_reviews;
  END IF;
END
$$;
