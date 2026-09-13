-- Migration: Phase 2 & 5 National Location System (SOPALOKA)
-- Local migration proposal for national location reference tables up to Kecamatan (District) level.
-- NO ON DELETE CASCADE on reference tables to protect data integrity.
-- Row Level Security (RLS): Enabled with SELECT only policy for client access.

DO $$ 
BEGIN
    -- 1. Master Table: ref_provinces (Provinsi)
    CREATE TABLE IF NOT EXISTS public.ref_provinces (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Master Table: ref_regencies (Kabupaten / Kota)
    CREATE TABLE IF NOT EXISTS public.ref_regencies (
        code VARCHAR(10) PRIMARY KEY,
        province_code VARCHAR(10) NOT NULL REFERENCES public.ref_provinces(code),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) DEFAULT 'Kabupaten',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Master Table: ref_districts (Kecamatan)
    CREATE TABLE IF NOT EXISTS public.ref_districts (
        code VARCHAR(15) PRIMARY KEY,
        regency_code VARCHAR(10) NOT NULL REFERENCES public.ref_regencies(code),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. Additive non-breaking location fields to listings table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='province_code') THEN
        ALTER TABLE public.listings ADD COLUMN province_code VARCHAR(10) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='regency_code') THEN
        ALTER TABLE public.listings ADD COLUMN regency_code VARCHAR(10) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='district_code') THEN
        ALTER TABLE public.listings ADD COLUMN district_code VARCHAR(15) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='village') THEN
        ALTER TABLE public.listings ADD COLUMN village VARCHAR(100) DEFAULT NULL;
    END IF;

    -- 5. Additive non-breaking location fields to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='province_code') THEN
        ALTER TABLE public.users ADD COLUMN province_code VARCHAR(10) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='regency_code') THEN
        ALTER TABLE public.users ADD COLUMN regency_code VARCHAR(10) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='district_code') THEN
        ALTER TABLE public.users ADD COLUMN district_code VARCHAR(15) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='village') THEN
        ALTER TABLE public.users ADD COLUMN village VARCHAR(100) DEFAULT NULL;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ref_regencies_prov ON public.ref_regencies(province_code);
CREATE INDEX IF NOT EXISTS idx_ref_districts_reg ON public.ref_districts(regency_code);

CREATE INDEX IF NOT EXISTS idx_listings_prov_code ON public.listings(province_code);
CREATE INDEX IF NOT EXISTS idx_listings_reg_code ON public.listings(regency_code);
CREATE INDEX IF NOT EXISTS idx_listings_dist_code ON public.listings(district_code);

CREATE INDEX IF NOT EXISTS idx_users_reg_code ON public.users(regency_code);

-- Enable Row Level Security (RLS) on reference tables
ALTER TABLE public.ref_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_regencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_districts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public read-only (SELECT) access. INSERT, UPDATE, DELETE are denied by default RLS rules.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ref_provinces' AND policyname = 'Allow public read access to ref_provinces') THEN
        CREATE POLICY "Allow public read access to ref_provinces" ON public.ref_provinces FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ref_regencies' AND policyname = 'Allow public read access to ref_regencies') THEN
        CREATE POLICY "Allow public read access to ref_regencies" ON public.ref_regencies FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ref_districts' AND policyname = 'Allow public read access to ref_districts') THEN
        CREATE POLICY "Allow public read access to ref_districts" ON public.ref_districts FOR SELECT USING (true);
    END IF;
END $$;

COMMENT ON TABLE public.ref_provinces IS 'SOPALOKA Master Location: Provinces (Provinsi)';
COMMENT ON TABLE public.ref_regencies IS 'SOPALOKA Master Location: Regencies / Cities (Kabupaten / Kota)';
COMMENT ON TABLE public.ref_districts IS 'SOPALOKA Master Location: Districts (Kecamatan)';
