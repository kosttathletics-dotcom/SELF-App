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
ALTER TABLE public.messages             ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "messages: sender or recipient" ON public.messages
  FOR ALL USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "messages: group member reads" ON public.messages
  FOR SELECT USING (
    group_id IS NOT NULL
    AND auth.uid() = ANY(
      (SELECT member_ids FROM public.message_groups WHERE id = group_id)
    )
  );

CREATE POLICY "messages: group member inserts" ON public.messages
  FOR INSERT WITH CHECK (
    group_id IS NOT NULL
    AND auth.uid() = ANY(
      (SELECT member_ids FROM public.message_groups WHERE id = group_id)
    )
  );

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
-- FBS
('Football','QB','FBS',"6'3",215,4.6),
('Football','RB','FBS',"5'11",210,4.5),
('Football','WR','FBS',"6'2",185,4.5),
('Football','TE','FBS',"6'4",240,4.7),
('Football','OL','FBS',"6'5",280,5.0),
('Football','LB','FBS',"6'2",220,4.6),
('Football','DB','FBS',"6'0",195,4.5),
('Football','DL','FBS',"6'4",250,4.8),
-- FCS
('Football','QB','FCS',"6'2",205,4.7),
('Football','RB','FCS',"5'10",200,4.6),
('Football','WR','FCS',"6'1",180,4.6),
('Football','TE','FCS',"6'3",230,4.8),
('Football','OL','FCS',"6'4",265,5.1),
('Football','LB','FCS',"6'1",215,4.7),
('Football','DB','FCS',"5'11",185,4.6),
('Football','DL','FCS',"6'3",240,4.9),
-- D2/NAIA
('Football','QB','D2/NAIA',"6'1",195,4.8),
('Football','RB','D2/NAIA',"5'10",195,4.7),
('Football','WR','D2/NAIA',"6'0",175,4.7),
('Football','TE','D2/NAIA',"6'2",220,4.9),
('Football','OL','D2/NAIA',"6'3",255,5.2),
('Football','LB','D2/NAIA',"6'0",205,4.8),
('Football','DB','D2/NAIA',"5'10",180,4.7),
('Football','DL','D2/NAIA',"6'2",230,5.0),
-- D3
('Football','QB','D3',"6'0",190,4.9),
('Football','RB','D3',"5'9",185,4.8),
('Football','WR','D3',"5'11",170,4.8),
('Football','TE','D3',"6'1",210,5.0),
('Football','OL','D3',"6'2",240,5.3),
('Football','LB','D3',"5'11",200,4.9),
('Football','DB','D3',"5'9",175,4.8),
('Football','DL','D3',"6'1",220,5.1)
ON CONFLICT DO NOTHING;
