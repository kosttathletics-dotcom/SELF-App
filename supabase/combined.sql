-- ============================================================
-- SELF App — Complete Database Schema & RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('coach', 'athlete', 'parent')),
  name       TEXT,
  photo_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- athletes
CREATE TABLE IF NOT EXISTS public.athletes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id),
  name            TEXT NOT NULL,
  sport           TEXT,
  position        TEXT,
  grade           TEXT,
  age_group       TEXT,
  height          TEXT,
  weight          TEXT,
  photo_url       TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'injured')),
  notes           TEXT,
  hudl_url        TEXT,
  instagram       TEXT,
  twitter         TEXT,
  tiktok          TEXT,
  recruiting_url  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- exercises
CREATE TABLE IF NOT EXISTS public.exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          TEXT CHECK (category IN ('Strength','Power','Conditioning','Mobility','Sport-Specific')),
  progression_level TEXT CHECK (progression_level IN ('Beginner','Intermediate','Advanced','Elite')),
  video_url         TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- message_groups (declared before workouts so FK can reference)
CREATE TABLE IF NOT EXISTS public.message_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  member_ids  UUID[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- workouts
CREATE TABLE IF NOT EXISTS public.workouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  assigned_to     UUID[] DEFAULT '{}',
  assigned_group  UUID REFERENCES public.message_groups(id),
  date            DATE,
  is_template     BOOLEAN DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- workout_exercises
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id      UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id     UUID REFERENCES public.exercises(id),
  sets            INTEGER,
  reps            INTEGER,
  target_weight   NUMERIC,
  rpe             INTEGER CHECK (rpe BETWEEN 1 AND 10),
  order_index     INTEGER NOT NULL DEFAULT 0,
  notes           TEXT
);

-- workout_logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  workout_id       UUID REFERENCES public.workouts(id),
  exercise_id      UUID REFERENCES public.exercises(id),
  date             DATE NOT NULL,
  sets_completed   INTEGER,
  reps_completed   INTEGER,
  weight_achieved  NUMERIC,
  rpe_actual       INTEGER CHECK (rpe_actual BETWEEN 1 AND 10),
  estimated_1rm    NUMERIC,
  notes            TEXT,
  completed        BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- grades
CREATE TABLE IF NOT EXISTS public.grades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_id         UUID REFERENCES public.users(id),
  subject          TEXT NOT NULL,
  quarter          TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4','Semester 1','Semester 2','Final')),
  school_year      TEXT,
  grade_value      NUMERIC CHECK (grade_value BETWEEN 0 AND 100),
  letter_grade     TEXT CHECK (letter_grade IN ('A','B','C','D','F')),
  gpa_points       NUMERIC CHECK (gpa_points BETWEEN 0 AND 4),
  notes            TEXT,
  report_card_url  TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- injuries
CREATE TABLE IF NOT EXISTS public.injuries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  body_part     TEXT,
  type          TEXT CHECK (type IN ('Strain','Sprain','Fracture','Concussion','Other')),
  severity      TEXT CHECK (severity IN ('Minor','Moderate','Severe')),
  symptoms      TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','healing','cleared')),
  restrictions  TEXT,
  notes         TEXT,
  photo_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- attendance_events
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  time        TIME,
  type        TEXT CHECK (type IN ('Lift','Practice','Game','Meeting','Event')),
  location    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- attendance_records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES public.attendance_events(id) ON DELETE CASCADE,
  athlete_id      UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'absent' CHECK (status IN ('present','late','absent')),
  checked_in_at   TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, athlete_id)
);

-- nutrition_logs
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  meal_type   TEXT CHECK (meal_type IN ('Breakfast','Lunch','Dinner','Snack','Pre-Workout','Post-Workout')),
  food_name   TEXT NOT NULL,
  calories    NUMERIC,
  protein     NUMERIC,
  carbs       NUMERIC,
  fat         NUMERIC,
  water_ml    NUMERIC,
  notes       TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id  UUID REFERENCES public.users(id),
  group_id      UUID REFERENCES public.message_groups(id),
  text          TEXT NOT NULL,
  read          BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- calendar_events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  date            DATE NOT NULL,
  time            TIME,
  type            TEXT CHECK (type IN ('Lift','Practice','Game','Meeting','Event')),
  location        TEXT,
  description     TEXT,
  reminder_sent   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- files
CREATE TABLE IF NOT EXISTS public.files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  file_type    TEXT CHECK (file_type IN ('image','pdf','video')),
  size         BIGINT,
  event_id     UUID REFERENCES public.attendance_events(id),
  athlete_id   UUID REFERENCES public.athletes(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- personal_records
CREATE TABLE IF NOT EXISTS public.personal_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  exercise_id     UUID REFERENCES public.exercises(id),
  weight          NUMERIC NOT NULL,
  estimated_1rm   NUMERIC NOT NULL,
  date            DATE NOT NULL,
  is_pr           BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- core_courses
CREATE TABLE IF NOT EXISTS public.core_courses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id     UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  subject        TEXT CHECK (subject IN ('English','Math','Science','Social Science','Elective')),
  course_name    TEXT NOT NULL,
  grade_value    NUMERIC,
  gpa_points     NUMERIC,
  semester       TEXT,
  school_year    TEXT,
  ncaa_approved  BOOLEAN DEFAULT false,
  completed      BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- recruiting_benchmarks
CREATE TABLE IF NOT EXISTS public.recruiting_benchmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport        TEXT NOT NULL,
  position     TEXT NOT NULL,
  division     TEXT NOT NULL CHECK (division IN ('FBS','FCS','D2/NAIA','D3')),
  height_min   TEXT,
  weight_min   NUMERIC,
  forty_yard   NUMERIC,
  bench        NUMERIC,
  squat        NUMERIC,
  vertical     NUMERIC,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- parent_athlete_links
CREATE TABLE IF NOT EXISTS public.parent_athlete_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  athlete_id  UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, athlete_id)
);

-- invites
CREATE TABLE IF NOT EXISTS public.invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('athlete','parent')),
  coach_id    UUID REFERENCES public.users(id),
  athlete_id  UUID REFERENCES public.athletes(id),
  accepted    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injuries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY; (handled below after table recreate)
ALTER TABLE public.message_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_athlete_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites              ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's coach_id (for athletes: their coach)
CREATE OR REPLACE FUNCTION public.get_my_coach_id()
RETURNS UUID AS $$
  SELECT a.coach_id 
  FROM public.athletes a 
  WHERE a.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the athlete_id linked to a parent
CREATE OR REPLACE FUNCTION public.get_parent_athlete_id()
RETURNS UUID AS $$
  SELECT athlete_id 
  FROM public.parent_athlete_links 
  WHERE parent_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES — users
-- ============================================================
CREATE POLICY "users: own profile" ON public.users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "users: coaches see all" ON public.users
  FOR SELECT USING (public.get_my_role() = 'coach');

-- ============================================================
-- RLS POLICIES — athletes
-- ============================================================
CREATE POLICY "athletes: coach full access" ON public.athletes
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "athletes: athlete sees own" ON public.athletes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "athletes: parent sees linked child" ON public.athletes
  FOR SELECT USING (id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — exercises
-- ============================================================
CREATE POLICY "exercises: coach full access" ON public.exercises
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "exercises: athlete read" ON public.exercises
  FOR SELECT USING (
    public.get_my_role() = 'athlete'
    AND coach_id = public.get_my_coach_id()
  );

-- ============================================================
-- RLS POLICIES — workouts
-- ============================================================
CREATE POLICY "workouts: coach full access" ON public.workouts
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "workouts: athlete reads assigned" ON public.workouts
  FOR SELECT USING (
    public.get_my_role() = 'athlete'
    AND (
      (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1) = ANY(assigned_to)
    )
  );

-- ============================================================
-- RLS POLICIES — workout_exercises
-- ============================================================
CREATE POLICY "workout_exercises: coach full access" ON public.workout_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.coach_id = auth.uid())
  );

CREATE POLICY "workout_exercises: athlete reads assigned workouts" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_id
      AND (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1) = ANY(w.assigned_to)
    )
  );

-- ============================================================
-- RLS POLICIES — workout_logs
-- ============================================================
CREATE POLICY "workout_logs: coach full access" ON public.workout_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
  );

CREATE POLICY "workout_logs: athlete manages own" ON public.workout_logs
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "workout_logs: parent reads child" ON public.workout_logs
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — grades
-- ============================================================
CREATE POLICY "grades: coach full access" ON public.grades
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "grades: athlete reads own" ON public.grades
  FOR SELECT USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "grades: parent reads child" ON public.grades
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — injuries
-- ============================================================
CREATE POLICY "injuries: coach full access" ON public.injuries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
  );

CREATE POLICY "injuries: athlete manages own" ON public.injuries
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "injuries: parent reads child" ON public.injuries
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — attendance_events
-- ============================================================
CREATE POLICY "attendance_events: coach full access" ON public.attendance_events
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "attendance_events: athlete reads" ON public.attendance_events
  FOR SELECT USING (public.get_my_role() IN ('athlete', 'parent'));

-- ============================================================
-- RLS POLICIES — attendance_records
-- ============================================================
CREATE POLICY "attendance_records: coach full access" ON public.attendance_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.attendance_events e WHERE e.id = event_id AND e.coach_id = auth.uid())
  );

CREATE POLICY "attendance_records: athlete manages own" ON public.attendance_records
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "attendance_records: parent reads child" ON public.attendance_records
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — nutrition_logs
-- ============================================================
CREATE POLICY "nutrition_logs: athlete manages own" ON public.nutrition_logs
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "nutrition_logs: coach reads all on team" ON public.nutrition_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
  );

CREATE POLICY "nutrition_logs: parent reads child" ON public.nutrition_logs
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — messages
-- ============================================================
-- (stale messages policies removed — table was recreated with thread_id/content schema)

-- ============================================================
-- RLS POLICIES — message_groups
-- ============================================================
CREATE POLICY "message_groups: coach full access" ON public.message_groups
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "message_groups: member reads" ON public.message_groups
  FOR SELECT USING (auth.uid() = ANY(member_ids));

-- ============================================================
-- RLS POLICIES — calendar_events
-- ============================================================
CREATE POLICY "calendar_events: coach full access" ON public.calendar_events
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "calendar_events: athlete/parent reads" ON public.calendar_events
  FOR SELECT USING (public.get_my_role() IN ('athlete', 'parent'));

-- ============================================================
-- RLS POLICIES — files
-- ============================================================
CREATE POLICY "files: coach full access" ON public.files
  FOR ALL USING (
    public.get_my_role() = 'coach'
    AND (
      athlete_id IS NULL
      OR EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
    )
  );

CREATE POLICY "files: uploader manages own" ON public.files
  FOR ALL USING (uploader_id = auth.uid());

CREATE POLICY "files: parent reads child files" ON public.files
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — personal_records
-- ============================================================
CREATE POLICY "personal_records: coach full access" ON public.personal_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
  );

CREATE POLICY "personal_records: athlete manages own" ON public.personal_records
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "personal_records: parent reads child" ON public.personal_records
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — core_courses
-- ============================================================
CREATE POLICY "core_courses: coach full access" ON public.core_courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
  );

CREATE POLICY "core_courses: athlete manages own" ON public.core_courses
  FOR ALL USING (
    athlete_id = (SELECT a.id FROM public.athletes a WHERE a.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "core_courses: parent reads child" ON public.core_courses
  FOR SELECT USING (athlete_id = public.get_parent_athlete_id());

-- ============================================================
-- RLS POLICIES — recruiting_benchmarks
-- ============================================================
CREATE POLICY "recruiting_benchmarks: coach full access" ON public.recruiting_benchmarks
  FOR ALL USING (public.get_my_role() = 'coach');

CREATE POLICY "recruiting_benchmarks: athlete reads" ON public.recruiting_benchmarks
  FOR SELECT USING (public.get_my_role() = 'athlete');

-- ============================================================
-- RLS POLICIES — parent_athlete_links
-- ============================================================
CREATE POLICY "parent_athlete_links: coach manages" ON public.parent_athlete_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.coach_id = auth.uid())
  );

CREATE POLICY "parent_athlete_links: parent reads own" ON public.parent_athlete_links
  FOR SELECT USING (parent_id = auth.uid());

-- ============================================================
-- RLS POLICIES — invites
-- ============================================================
CREATE POLICY "invites: coach manages own" ON public.invites
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "invites: invitee reads by email" ON public.invites
  FOR SELECT USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- SEED: Football Recruiting Benchmarks
-- ============================================================

INSERT INTO public.recruiting_benchmarks (sport, position, division, height_min, weight_min, forty_yard) VALUES
('Football','QB','FBS','6''3',215,4.6),
('Football','RB','FBS','5''11',210,4.5),
('Football','WR','FBS','6''2',185,4.5),
('Football','TE','FBS','6''4',240,4.7),
('Football','OL','FBS','6''5',280,5.0),
('Football','LB','FBS','6''2',220,4.6),
('Football','DB','FBS','6''0',195,4.5),
('Football','DL','FBS','6''4',250,4.8),
('Football','QB','FCS','6''2',205,4.7),
('Football','RB','FCS','5''10',200,4.6),
('Football','WR','FCS','6''1',180,4.6),
('Football','TE','FCS','6''3',230,4.8),
('Football','OL','FCS','6''4',265,5.1),
('Football','LB','FCS','6''1',215,4.7),
('Football','DB','FCS','5''11',185,4.6),
('Football','DL','FCS','6''3',240,4.9),
('Football','QB','D2/NAIA','6''1',195,4.8),
('Football','RB','D2/NAIA','5''10',195,4.7),
('Football','WR','D2/NAIA','6''0',175,4.7),
('Football','TE','D2/NAIA','6''2',220,4.9),
('Football','OL','D2/NAIA','6''3',255,5.2),
('Football','LB','D2/NAIA','6''0',205,4.8),
('Football','DB','D2/NAIA','5''10',180,4.7),
('Football','DL','D2/NAIA','6''2',230,5.0),
('Football','QB','D3','6''0',190,4.9),
('Football','RB','D3','5''9',185,4.8),
('Football','WR','D3','5''11',170,4.8),
('Football','TE','D3','6''1',210,5.0),
('Football','OL','D3','6''2',240,5.3),
('Football','LB','D3','5''11',200,4.9),
('Football','DB','D3','5''9',175,4.8),
('Football','DL','D3','6''1',220,5.1)
ON CONFLICT DO NOTHING;
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
