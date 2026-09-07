-- ============================================================
-- solosatset - Production Supabase schema
-- Apply schema changes in Supabase SQL Editor / migrations.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price BIGINT DEFAULT 0,
  category TEXT,
  condition TEXT,
  nego_type TEXT DEFAULT 'bisa_nego',
  region TEXT,
  district TEXT,
  seller_id TEXT,
  seller_name TEXT,
  seller_phone TEXT,
  seller_avatar TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_region ON public.listings(region);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_created ON public.listings(created_at DESC);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_read_public ON public.listings;
CREATE POLICY listings_read_public ON public.listings FOR SELECT USING (status <> 'deleted');
DROP POLICY IF EXISTS listings_insert_own ON public.listings;
CREATE POLICY listings_insert_own ON public.listings FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid()::text);
DROP POLICY IF EXISTS listings_update_own ON public.listings;
CREATE POLICY listings_update_own ON public.listings FOR UPDATE TO authenticated USING (seller_id = auth.uid()::text) WITH CHECK (seller_id = auth.uid()::text);
DROP POLICY IF EXISTS listings_delete_own ON public.listings;
CREATE POLICY listings_delete_own ON public.listings FOR DELETE TO authenticated USING (seller_id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT,
  store_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  region TEXT,
  district TEXT,
  password_hash TEXT,
  avatar TEXT,
  bio TEXT,
  is_demo BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_read_public ON public.users;
CREATE POLICY users_read_public ON public.users FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid()::text);
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
DROP POLICY IF EXISTS users_delete_own ON public.users;
CREATE POLICY users_delete_own ON public.users FOR DELETE TO authenticated USING (id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS settings_read_public ON public.site_settings;
CREATE POLICY settings_read_public ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS settings_write_admin ON public.site_settings;
CREATE POLICY settings_write_admin ON public.site_settings FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.custom_texts (
  id TEXT PRIMARY KEY DEFAULT 'global',
  texts JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.custom_texts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS texts_read_public ON public.custom_texts;
CREATE POLICY texts_read_public ON public.custom_texts FOR SELECT USING (true);
DROP POLICY IF EXISTS texts_write_admin ON public.custom_texts;
CREATE POLICY texts_write_admin ON public.custom_texts FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  buyer_id TEXT,
  buyer_name TEXT,
  buyer_avatar TEXT,
  product_image TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON public.seller_reviews(seller_id);
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_read_public ON public.seller_reviews;
CREATE POLICY reviews_read_public ON public.seller_reviews FOR SELECT USING (NOT is_hidden);
DROP POLICY IF EXISTS reviews_insert_own ON public.seller_reviews;
CREATE POLICY reviews_insert_own ON public.seller_reviews FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid()::text);
DROP POLICY IF EXISTS reviews_update_own ON public.seller_reviews;
CREATE POLICY reviews_update_own ON public.seller_reviews FOR UPDATE TO authenticated USING (buyer_id = auth.uid()::text) WITH CHECK (buyer_id = auth.uid()::text);
DROP POLICY IF EXISTS reviews_delete_own ON public.seller_reviews;
CREATE POLICY reviews_delete_own ON public.seller_reviews FOR DELETE TO authenticated USING (buyer_id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.app_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_location TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  category TEXT,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_reviews_user ON public.app_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_created ON public.app_reviews(created_at DESC);
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_reviews_read_public ON public.app_reviews;
CREATE POLICY app_reviews_read_public ON public.app_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS app_reviews_insert_own ON public.app_reviews;
CREATE POLICY app_reviews_insert_own ON public.app_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id TEXT)
RETURNS void AS $$
  UPDATE public.listings SET views = views + 1 WHERE id = listing_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Apply separately if these tables are present in the project:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_texts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_reviews;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.app_reviews;
