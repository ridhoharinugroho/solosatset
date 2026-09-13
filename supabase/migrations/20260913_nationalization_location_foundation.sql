-- Migration: Nationalization Location Foundation (SOPALOKA Phase 1)
-- Non-breaking location schema expansion for national location hierarchy (Province -> Regency -> District -> Village)

DO $$ 
BEGIN
    -- 1. Add province, regency, village to listings if not existing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='province') THEN
        ALTER TABLE public.listings ADD COLUMN province VARCHAR(100) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='regency') THEN
        ALTER TABLE public.listings ADD COLUMN regency VARCHAR(100) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='village') THEN
        ALTER TABLE public.listings ADD COLUMN village VARCHAR(100) DEFAULT NULL;
    END IF;

    -- 2. Add province, regency, village to users if not existing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='province') THEN
        ALTER TABLE public.users ADD COLUMN province VARCHAR(100) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='regency') THEN
        ALTER TABLE public.users ADD COLUMN regency VARCHAR(100) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='village') THEN
        ALTER TABLE public.users ADD COLUMN village VARCHAR(100) DEFAULT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.listings.province IS 'SOPALOKA National Location: Province';
COMMENT ON COLUMN public.listings.regency IS 'SOPALOKA National Location: Regency / City';
COMMENT ON COLUMN public.users.province IS 'SOPALOKA User Location: Province';
COMMENT ON COLUMN public.users.regency IS 'SOPALOKA User Location: Regency / City';
