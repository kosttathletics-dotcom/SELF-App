-- ============================================================
-- Migration: Add extra fields to athletes table
-- graduation_year, gpa, parent_name, parent_email, parent_phone
-- ============================================================

ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS graduation_year TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS gpa DECIMAL(3,2);
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS parent_email TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS parent_phone TEXT;
