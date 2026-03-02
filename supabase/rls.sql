-- ============================================================
-- SELF App — Supplemental Schema + RLS Policies
-- Run AFTER schema.sql in the Supabase SQL Editor
-- This file adds missing tables the app uses and applies
-- complete Row Level Security to every table.
-- ============================================================

-- ============================================================
-- SUPPLEMENTAL TABLES (not in original schema.sql)
-- ============================================================

-- profiles (alias view of users — app uses 'profiles')
-- We create a view so both names work
CREATE OR REPLACE VIEW public.profiles AS
  SELECT
    id,
    email,
    role,
    name,
    photo_url,
    NULL::text  AS team_name,
    NULL::text  AS school,
    NULL::text  AS sport,
    created_at
  FROM public.users;

-- To allow updates through the view:
CREATE OR REPLACE RULE profiles_update AS
  ON UPDATE TO public.profiles DO INSTEAD
  UPDATE public.users SET
    name      = NEW.name,
    photo_url = NEW.photo_url
  WHERE id = OLD.id;

-- events table (what the Attendance + Calendar pages insert/select)
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  time        TIME,
  type        TEXT CHECK (type IN ('Practice','Game','Film Session','Strength Training','Meeting','Other')),
  location    TEXT,
  required    BOOLEAN DEFAULT false,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- attendance table (what the Attendance page records per-athlete status)
CREATE TABLE IF NOT EXISTS public.attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID REFERENCES public.events(id) ON DELETE CASCADE,
  athlete_id  UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_id    UUID REFERENCES public.users(id),
  status      TEXT DEFAULT 'absent' CHECK (status IN ('present','late','excused','absent')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, athlete_id)
);

-- workout_assignments (links workouts to individual athletes with completion tracking)
CREATE TABLE IF NOT EXISTS public.workout_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id    UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  athlete_id    UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_id      UUID REFERENCES public.users(id),
  assigned_date DATE NOT NULL,
  completed     BOOLEAN DEFAULT false,
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workout_id, athlete_id, assigned_date)
);

-- workout_exercises extended (the app references exercise_name, sets, reps as text, rest_seconds, sort_order)
-- Drop and recreate if needed, or add columns
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS exercise_name TEXT,
  ADD COLUMN IF NOT EXISTS reps          TEXT,   -- stored as text e.g. "8-10" or "AMRAP"
  ADD COLUMN IF NOT EXISTS rest_seconds  INTEGER,
  ADD COLUMN IF NOT EXISTS sort_order    INTEGER DEFAULT 0;

-- Backfill exercise_name from exercises join if empty
UPDATE public.workout_exercises we
SET exercise_name = e.name
FROM public.exercises e
WHERE we.exercise_id = e.id
  AND we.exercise_name IS NULL;

-- personal_records (app uses metric_type TEXT, value NUMERIC, is_pr BOOLEAN)
DROP TABLE IF EXISTS public.personal_records CASCADE;
CREATE TABLE public.personal_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  metric_type  TEXT NOT NULL,   -- e.g. 'forty_yard', 'bench_press_1rm', 'squat_1rm', 'vertical_jump'
  value        NUMERIC NOT NULL,
  is_pr        BOOLEAN DEFAULT false,
  recorded_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- message_threads (two-party conversation container)
CREATE TABLE IF NOT EXISTS public.message_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  participant_b   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_a, participant_b)
);

-- messages (thread-based, app uses thread_id + sender_id + content)
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                'gpa_red_flag','injury_logged','workout_missed',
                'invite_accepted','attendance_alert','message_received','general'
              )),
  title       TEXT NOT NULL,
  body        TEXT,
  related_id  UUID,   -- FK to relevant record (athlete_id, injury_id, etc.)
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- core_courses extended (app uses coach_id for RLS)
ALTER TABLE public.core_courses
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.users(id);

-- ============================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — events
-- ============================================================

DROP POLICY IF EXISTS "events: coach full access" ON public.events;
CREATE POLICY "events: coach full access" ON public.events
  FOR ALL USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "events: athlete and parent read team events" ON public.events;
CREATE POLICY "events: athlete and parent read team events" ON public.events
  FOR SELECT USING (
    -- Athlete sees their coach's events
    coach_id = public.get_my_coach_id()
    OR
    -- Parent sees events from their child's coach
    coach_id = (
      SELECT a.coach_id FROM public.athletes a
      JOIN public.parent_athlete_links pal ON pal.athlete_id = a.id
      WHERE pal.parent_id = auth.uid()
      LIMIT 1
    )
  );

-- ============================================================
-- RLS POLICIES — attendance
-- ============================================================

DROP POLICY IF EXISTS "attendance: coach full access" ON public.attendance;
CREATE POLICY "attendance: coach full access" ON public.attendance
  FOR ALL USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "attendance: athlete reads own" ON public.attendance;
CREATE POLICY "attendance: athlete reads own" ON public.attendance
  FOR SELECT USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "attendance: parent reads child" ON public.attendance;
CREATE POLICY "attendance: parent reads child" ON public.attendance
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — workout_assignments
-- ============================================================

DROP POLICY IF EXISTS "workout_assignments: coach full access" ON public.workout_assignments;
CREATE POLICY "workout_assignments: coach full access" ON public.workout_assignments
  FOR ALL USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "workout_assignments: athlete reads + completes own" ON public.workout_assignments;
CREATE POLICY "workout_assignments: athlete reads + completes own" ON public.workout_assignments
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "workout_assignments: parent reads child" ON public.workout_assignments;
CREATE POLICY "workout_assignments: parent reads child" ON public.workout_assignments
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — personal_records
-- ============================================================

DROP POLICY IF EXISTS "personal_records: coach full access" ON public.personal_records;
CREATE POLICY "personal_records: coach full access" ON public.personal_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "personal_records: athlete manages own" ON public.personal_records;
CREATE POLICY "personal_records: athlete manages own" ON public.personal_records
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "personal_records: parent reads child" ON public.personal_records;
CREATE POLICY "personal_records: parent reads child" ON public.personal_records
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — message_threads
-- ============================================================

DROP POLICY IF EXISTS "message_threads: participant access" ON public.message_threads;
CREATE POLICY "message_threads: participant access" ON public.message_threads
  FOR ALL USING (
    participant_a = auth.uid() OR participant_b = auth.uid()
  );

-- ============================================================
-- RLS POLICIES — messages
-- ============================================================

DROP POLICY IF EXISTS "messages: thread participant access" ON public.messages;
CREATE POLICY "messages: thread participant access" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
        AND (t.participant_a = auth.uid() OR t.participant_b = auth.uid())
    )
  );

-- ============================================================
-- RLS POLICIES — notifications
-- ============================================================

DROP POLICY IF EXISTS "notifications: own only" ON public.notifications;
CREATE POLICY "notifications: own only" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- SUPABASE STORAGE BUCKETS
-- ============================================================
-- Run these to create the storage buckets (if not already created via dashboard):

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('report-cards', 'report-cards', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS for avatars bucket (public read, owner write):
DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;
CREATE POLICY "avatars: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars: authenticated upload" ON storage.objects;
CREATE POLICY "avatars: authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "avatars: owner update" ON storage.objects;
CREATE POLICY "avatars: owner update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND owner = auth.uid()
  );

DROP POLICY IF EXISTS "avatars: owner delete" ON storage.objects;
CREATE POLICY "avatars: owner delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND owner = auth.uid()
  );

-- ============================================================
-- DB TRIGGERS — Auto-create notifications
-- ============================================================

-- Trigger function: notify coach when GPA drops below 2.5
CREATE OR REPLACE FUNCTION public.notify_gpa_red_flag()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
  v_athlete_name TEXT;
BEGIN
  -- Only fire when gpa_points drops to 0 or 1 (D or F = red flag risk)
  IF NEW.gpa_points <= 1.0 THEN
    SELECT a.coach_id, a.name INTO v_coach_id, v_athlete_name
    FROM public.athletes a WHERE a.id = NEW.athlete_id;

    IF v_coach_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, related_id)
      VALUES (
        v_coach_id,
        'gpa_red_flag',
        'GPA Alert: ' || v_athlete_name,
        v_athlete_name || ' received a ' || NEW.letter_grade || ' in ' || NEW.subject || '. GPA may drop below 2.5.',
        NEW.athlete_id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gpa_red_flag ON public.grades;
CREATE TRIGGER trg_gpa_red_flag
  AFTER INSERT ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.notify_gpa_red_flag();

-- Trigger function: notify coach when injury is logged
CREATE OR REPLACE FUNCTION public.notify_injury_logged()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
  v_athlete_name TEXT;
BEGIN
  SELECT a.coach_id, a.name INTO v_coach_id, v_athlete_name
  FROM public.athletes a WHERE a.id = NEW.athlete_id;

  IF v_coach_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, related_id)
    VALUES (
      v_coach_id,
      'injury_logged',
      'Injury Logged: ' || v_athlete_name,
      NEW.severity || ' ' || COALESCE(NEW.type, 'injury') || ' — ' || COALESCE(NEW.body_part, 'unknown area') || '. Status: ' || NEW.status,
      NEW.athlete_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_injury_logged ON public.injuries;
CREATE TRIGGER trg_injury_logged
  AFTER INSERT ON public.injuries
  FOR EACH ROW EXECUTE FUNCTION public.notify_injury_logged();

-- Trigger function: notify recipient when a message is received
CREATE OR REPLACE FUNCTION public.notify_message_received()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name  TEXT;
BEGIN
  -- Find the other participant in the thread
  SELECT
    CASE WHEN t.participant_a = NEW.sender_id THEN t.participant_b ELSE t.participant_a END,
    u.name
  INTO v_recipient_id, v_sender_name
  FROM public.message_threads t
  JOIN public.users u ON u.id = NEW.sender_id
  WHERE t.id = NEW.thread_id;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, related_id)
    VALUES (
      v_recipient_id,
      'message_received',
      'New message from ' || COALESCE(v_sender_name, 'Coach'),
      LEFT(NEW.content, 100),
      NEW.thread_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_message_received ON public.messages;
CREATE TRIGGER trg_message_received
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message_received();

-- Trigger function: notify coach when invite is accepted
CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.accepted = true AND OLD.accepted = false AND NEW.coach_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, related_id)
    VALUES (
      NEW.coach_id,
      'invite_accepted',
      'Invite Accepted',
      NEW.email || ' accepted their invite as ' || NEW.role || '.',
      NEW.athlete_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_invite_accepted ON public.invites;
CREATE TRIGGER trg_invite_accepted
  AFTER UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_invite_accepted();

-- ============================================================
-- INDEXES (performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_athletes_coach_id    ON public.athletes(coach_id);
CREATE INDEX IF NOT EXISTS idx_athletes_user_id     ON public.athletes(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_athlete_id    ON public.grades(athlete_id);
CREATE INDEX IF NOT EXISTS idx_injuries_athlete_id  ON public.injuries(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attendance_athlete   ON public.attendance(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event     ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_events_coach_id      ON public.events(coach_id);
CREATE INDEX IF NOT EXISTS idx_events_date          ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_wa_athlete           ON public.workout_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_wa_date              ON public.workout_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread      ON public.messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pr_athlete           ON public.personal_records(athlete_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_pal_parent           ON public.parent_athlete_links(parent_id);

-- ============================================================
-- DONE
-- ============================================================
-- After running this file:
-- 1. Go to Supabase Dashboard → Storage → Create buckets:
--    - "avatars" (public)
--    - "report-cards" (private)
-- 2. Verify RLS is enabled on all tables (Table Editor → RLS column)
-- 3. Test by logging in as each role and confirming data isolation
