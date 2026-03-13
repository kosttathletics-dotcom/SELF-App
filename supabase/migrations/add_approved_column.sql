-- ============================================================
-- Migration: Add approved column to users table
-- Coaches are auto-approved; athletes/parents require coach approval
-- ============================================================

-- 1. Add the column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 2. Auto-approve all existing coaches
UPDATE public.users SET approved = true WHERE role = 'coach';

-- 3. Trigger: auto-approve whenever role is set to 'coach'
CREATE OR REPLACE FUNCTION public.auto_approve_coach()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'coach' THEN
    NEW.approved := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_approve_coach ON public.users;
CREATE TRIGGER trg_auto_approve_coach
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_coach();

-- 4. RLS: allow coaches to update other users (for approval)
DROP POLICY IF EXISTS "users: coach can approve" ON public.users;
CREATE POLICY "users: coach can approve" ON public.users
  FOR UPDATE USING (public.get_my_role() = 'coach');
