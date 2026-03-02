# SELF — Project Specification
### "Know your SELF."
> Universal Athlete Development Platform — Coaches · Athletes · Parents

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [Architecture Overview](#4-architecture-overview)
5. [Auth Flow](#5-auth-flow)
6. [User Roles & RLS Policy Summary](#6-user-roles--rls-policy-summary)
7. [Database Schema](#7-database-schema)
8. [Component Structure](#8-component-structure)
9. [Page Map](#9-page-map)
10. [Feature Specifications](#10-feature-specifications)
11. [API & Data Layer Patterns](#11-api--data-layer-patterns)
12. [Notification System](#12-notification-system)
13. [PDF & Export System](#13-pdf--export-system)
14. [Build Order (Phases)](#14-build-order-phases)
15. [Important Business Rules](#15-important-business-rules)

---

## 1. Project Overview

**SELF** is a production-grade, full-stack web application designed to replace TeamBuildr, PowerSchool, and SportsU in a single unified platform. It serves coaches, athletes, and parents across any sport, any program, and any competitive level — from middle school through college.

**Core pillars:**
- **Training** — workout creation, logging, PR tracking, compliance
- **Academics** — grade tracking, GPA calculation, NCAA eligibility
- **Recruiting** — measurables comparison, division projections, recruiting reports
- **Communication** — realtime messaging, calendar, file sharing, attendance

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite + TypeScript (strict mode) |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Charts | Recharts |
| Backend / Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (magic link + email invite) |
| Realtime | Supabase Realtime subscriptions |
| Storage | Supabase Storage (photos, PDFs, videos) |
| PDF Generation | react-pdf (v3 / @react-pdf/renderer) |
| CSV Export | papaparse |
| Drag & Drop | @dnd-kit/core |
| QR Code | qrcode.react |
| Deployment | Vercel |
| Type Safety | TypeScript strict — no `any` |

---

## 3. Design System

### Color Palette
```
Background:    #0D0D0D  (obsidian black)
Primary Accent:#C8F000  (volt green)
Text:          #FFFFFF
Cards:         #1A1A1A
Borders:       #2A2A2A
Error/Alert:   #FF4444
Warning:       #F4A261
Success:       #C8F000
```

### Typography
- **Headings** — Space Grotesk (Google Fonts)
- **Body / UI** — Inter (Google Fonts)

### Design Principles
- **Dark mode only** — no light mode toggle
- **Mobile-first** — every view must be fully functional on a 375px phone
- **Big tap targets** — minimum 44px tap areas on all interactive elements
- **Clean cards** — minimal UI, no visual clutter
- **Volt green accent** — used for success states, PRs, CTAs, active nav

### Tailwind Config Additions
```js
colors: {
  background: '#0D0D0D',
  accent: '#C8F000',
  card: '#1A1A1A',
  border: '#2A2A2A',
  error: '#FF4444',
  warning: '#F4A261',
},
fontFamily: {
  heading: ['Space Grotesk', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
}
```

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                              │
│   React + Vite + TypeScript SPA                            │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│   │  Pages/Views │  │  Components  │  │  Hooks/Utils   │  │
│   └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│          └─────────────────┴──────────────────┘             │
│                        Supabase JS Client                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────┐
│                       SUPABASE                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │PostgreSQL│  │ Realtime │  │  Storage  │  │
│  │magic link│  │+ RLS     │  │ Subs     │  │  Buckets  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure
```
SELF-App/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/           # shadcn/ui base components
│   │   ├── layout/       # AppShell, Sidebar, TopBar, BottomNav
│   │   ├── auth/         # Login, InviteAccept, Profile setup
│   │   ├── athletes/     # AthleteCard, AthleteProfile, RosterTable
│   │   ├── training/     # WorkoutBuilder, ExerciseCard, WorkoutLog
│   │   ├── grades/       # GradeTable, GPAChart, ReportCard
│   │   ├── eligibility/  # CoreCourseTracker, DivisionStatus
│   │   ├── recruiting/   # BenchmarkTable, DivisionFit
│   │   ├── messages/     # ChatSidebar, MessageThread, Composer
│   │   ├── calendar/     # MonthView, WeekView, EventForm
│   │   ├── attendance/   # EventRoster, CheckinQR, AttendanceStats
│   │   ├── nutrition/    # MealLogger, DailyMacros, MacroBar
│   │   ├── reports/      # RecruitingPDF, EligibilityPDF
│   │   └── shared/       # Badge, StatCard, RedFlagBanner, etc.
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAthletes.ts
│   │   ├── useWorkouts.ts
│   │   ├── useGrades.ts
│   │   ├── useMessages.ts
│   │   └── useRealtime.ts
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client init
│   │   ├── gpa.ts            # GPA calculation utilities
│   │   ├── oneRM.ts          # Epley formula
│   │   ├── ncaa.ts           # Core course & eligibility logic
│   │   ├── benchmarks.ts     # Division benchmark data
│   │   └── csv.ts            # Export helpers
│   ├── pages/
│   │   ├── coach/
│   │   ├── athlete/
│   │   └── parent/
│   ├── types/
│   │   └── database.ts       # Supabase generated types + custom types
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/           # SQL migration files
│   └── seed.sql              # Benchmark data seed
├── .env.local
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── PROJECT_SPEC.md
```

---

## 5. Auth Flow

### Magic Link Login
```
User enters email
      │
      ▼
Supabase sends magic link email
      │
      ▼
User clicks link → redirected to /auth/callback
      │
      ▼
Check users table for existing profile
      │
  ┌───┴───┐
  │       │
Exists   New (invited)
  │       │
  │       ▼
  │  /onboarding → set name, photo, 
  │                confirm role (from invite)
  │       │
  └───────┘
      │
      ▼
Role-based redirect:
  coach  → /dashboard
  athlete → /athlete/dashboard
  parent  → /parent/dashboard
```

### Email Invite Flow (Coach-initiated)
```
Coach enters email + selects role
      │
      ▼
INSERT into invites table (email, role, athlete_id for parents)
      │
      ▼
Supabase Edge Function sends invite email with magic link
      │
      ▼
Invited user clicks link → /auth/callback
      │
      ▼
System reads invite record, assigns role in users table
      │
      ▼
Onboarding → profile setup → role-based redirect
```

### Session Handling
- Supabase Auth session stored in localStorage
- `AuthContext` wraps entire app, exposes `user`, `role`, `loading`
- Protected routes via `PrivateRoute` component checking role
- On logout: clear session → `/login`

---

## 6. User Roles & RLS Policy Summary

### Role Definitions
| Role | Description |
|---|---|
| `coach` | Full access, program admin |
| `athlete` | Self-only access — own data |
| `parent` | View-only, linked to one athlete |

### RLS Policy Matrix

| Table | Coach | Athlete | Parent |
|---|---|---|---|
| users | All | Own row only | Own row only |
| athletes | All | Own row | Linked child row |
| exercises | All (own) | Read | None |
| workouts | All (own) | Read (assigned) | None |
| workout_logs | All | Own rows | Read (child) |
| grades | All | Own rows | Read (child) |
| injuries | All | Own rows | Read (child) |
| attendance_events | All (own) | Read | Read |
| attendance_records | All | Own rows | Read (child) |
| nutrition_logs | All (read) | Own rows | Read (child) |
| messages | All | Own (to coach only) | Own (to coach only) |
| calendar_events | All (own) | Read | Read |
| files | All | Own uploads | Read (child-linked) |
| personal_records | All | Own rows | Read (child) |
| core_courses | All | Own rows | Read (child) |
| recruiting_benchmarks | All | Read | None |

All policies enforce `auth.uid()` checks via `user_id` or `coach_id` joins.

---

## 7. Database Schema

> All tables include `created_at TIMESTAMPTZ DEFAULT now()` unless noted.
> Primary keys are `UUID` generated by `gen_random_uuid()`.

### `users`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
email       TEXT UNIQUE NOT NULL
role        TEXT NOT NULL CHECK (role IN ('coach','athlete','parent'))
name        TEXT
photo_url   TEXT
created_at  TIMESTAMPTZ DEFAULT now()
```

### `athletes`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
coach_id        UUID REFERENCES users(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id)       -- the athlete's login
name            TEXT NOT NULL
sport           TEXT
position        TEXT
grade           TEXT
age_group       TEXT
height          TEXT
weight          TEXT
photo_url       TEXT
status          TEXT DEFAULT 'active'            -- active | inactive | injured
notes           TEXT
hudl_url        TEXT
instagram       TEXT
twitter         TEXT
tiktok          TEXT
recruiting_url  TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### `exercises`
```sql
id                 UUID PRIMARY KEY DEFAULT gen_random_uuid()
coach_id           UUID REFERENCES users(id) ON DELETE CASCADE
name               TEXT NOT NULL
category           TEXT    -- Strength | Power | Conditioning | Mobility | Sport-Specific
progression_level  TEXT    -- Beginner | Intermediate | Advanced | Elite
video_url          TEXT
notes              TEXT
created_at         TIMESTAMPTZ DEFAULT now()
```

### `workouts`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
coach_id        UUID REFERENCES users(id) ON DELETE CASCADE
name            TEXT NOT NULL
description     TEXT
assigned_to     UUID[]          -- athlete ids
assigned_group  UUID            -- message_group id
date            DATE
is_template     BOOLEAN DEFAULT false
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### `workout_exercises`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
workout_id      UUID REFERENCES workouts(id) ON DELETE CASCADE
exercise_id     UUID REFERENCES exercises(id)
sets            INTEGER
reps            INTEGER
target_weight   NUMERIC
rpe             INTEGER     -- 1–10
order_index     INTEGER
notes           TEXT
```

### `workout_logs`
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
athlete_id       UUID REFERENCES athletes(id) ON DELETE CASCADE
workout_id       UUID REFERENCES workouts(id)
exercise_id      UUID REFERENCES exercises(id)
date             DATE NOT NULL
sets_completed   INTEGER
reps_completed   INTEGER
weight_achieved  NUMERIC
rpe_actual       INTEGER
estimated_1rm    NUMERIC    -- computed: weight * (1 + reps/30)
notes            TEXT
completed        BOOLEAN DEFAULT false
created_at       TIMESTAMPTZ DEFAULT now()
```

### `grades`
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
athlete_id       UUID REFERENCES athletes(id) ON DELETE CASCADE
coach_id         UUID REFERENCES users(id)
subject          TEXT NOT NULL
quarter          TEXT        -- Q1 | Q2 | Q3 | Q4 | Semester 1 | Semester 2 | Final
school_year      TEXT        -- e.g. '2025-2026'
grade_value      NUMERIC     -- 0–100
letter_grade     TEXT        -- A | B | C | D | F
gpa_points       NUMERIC     -- 4.0 | 3.0 | 2.0 | 1.0 | 0.0
notes            TEXT
report_card_url  TEXT
created_at       TIMESTAMPTZ DEFAULT now()
```

### `injuries`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
athlete_id    UUID REFERENCES athletes(id) ON DELETE CASCADE
date          DATE NOT NULL
body_part     TEXT
type          TEXT        -- Strain | Sprain | Fracture | Concussion | Other
severity      TEXT        -- Minor | Moderate | Severe
symptoms      TEXT
status        TEXT DEFAULT 'active'   -- active | healing | cleared
restrictions  TEXT
notes         TEXT
photo_url     TEXT
created_at    TIMESTAMPTZ DEFAULT now()
```

### `attendance_events`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
coach_id    UUID REFERENCES users(id) ON DELETE CASCADE
title       TEXT NOT NULL
date        DATE NOT NULL
time        TIME
type        TEXT    -- Lift | Practice | Game | Meeting | Event
location    TEXT
notes       TEXT
created_at  TIMESTAMPTZ DEFAULT now()
```

### `attendance_records`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
event_id        UUID REFERENCES attendance_events(id) ON DELETE CASCADE
athlete_id      UUID REFERENCES athletes(id) ON DELETE CASCADE
status          TEXT    -- present | late | absent
checked_in_at   TIMESTAMPTZ
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### `nutrition_logs`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
athlete_id  UUID REFERENCES athletes(id) ON DELETE CASCADE
date        DATE NOT NULL
meal_type   TEXT    -- Breakfast | Lunch | Dinner | Snack | Pre-Workout | Post-Workout
food_name   TEXT NOT NULL
calories    NUMERIC
protein     NUMERIC
carbs       NUMERIC
fat         NUMERIC
water_ml    NUMERIC
notes       TEXT
photo_url   TEXT
created_at  TIMESTAMPTZ DEFAULT now()
```

### `messages`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
sender_id     UUID REFERENCES users(id) ON DELETE CASCADE
recipient_id  UUID REFERENCES users(id)      -- null if group message
group_id      UUID REFERENCES message_groups(id)
text          TEXT
read          BOOLEAN DEFAULT false
created_at    TIMESTAMPTZ DEFAULT now()
```

### `message_groups`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
coach_id    UUID REFERENCES users(id) ON DELETE CASCADE
name        TEXT NOT NULL
member_ids  UUID[]
created_at  TIMESTAMPTZ DEFAULT now()
```

### `calendar_events`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
coach_id        UUID REFERENCES users(id) ON DELETE CASCADE
title           TEXT NOT NULL
date            DATE NOT NULL
time            TIME
type            TEXT    -- Lift | Practice | Game | Meeting | Event
location        TEXT
description     TEXT
reminder_sent   BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

### `files`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
uploader_id  UUID REFERENCES users(id) ON DELETE CASCADE
name         TEXT NOT NULL
url          TEXT NOT NULL
file_type    TEXT    -- image | pdf | video
size         BIGINT
event_id     UUID REFERENCES attendance_events(id)
athlete_id   UUID REFERENCES athletes(id)
created_at   TIMESTAMPTZ DEFAULT now()
```

### `personal_records`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
athlete_id      UUID REFERENCES athletes(id) ON DELETE CASCADE
exercise_id     UUID REFERENCES exercises(id)
weight          NUMERIC
estimated_1rm   NUMERIC
date            DATE NOT NULL
is_pr           BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

### `core_courses`
```sql
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
athlete_id     UUID REFERENCES athletes(id) ON DELETE CASCADE
subject        TEXT   -- English | Math | Science | Social Science | Elective
course_name    TEXT NOT NULL
grade_value    NUMERIC
gpa_points     NUMERIC
semester       TEXT
school_year    TEXT
ncaa_approved  BOOLEAN DEFAULT false
completed      BOOLEAN DEFAULT false
created_at     TIMESTAMPTZ DEFAULT now()
```

### `recruiting_benchmarks`
```sql
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
sport          TEXT NOT NULL    -- Football | Basketball | Soccer | Track | etc.
position       TEXT NOT NULL
division       TEXT NOT NULL    -- FBS | FCS | D2/NAIA | D3
height_min     TEXT
weight_min     NUMERIC
forty_yard     NUMERIC
bench          NUMERIC
squat          NUMERIC
vertical       NUMERIC
notes          TEXT
created_at     TIMESTAMPTZ DEFAULT now()
```

### `parent_athlete_links`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
parent_id   UUID REFERENCES users(id) ON DELETE CASCADE
athlete_id  UUID REFERENCES athletes(id) ON DELETE CASCADE
created_at  TIMESTAMPTZ DEFAULT now()
UNIQUE(parent_id, athlete_id)
```

### `invites`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
email       TEXT NOT NULL
role        TEXT NOT NULL CHECK (role IN ('athlete','parent'))
coach_id    UUID REFERENCES users(id)
athlete_id  UUID REFERENCES athletes(id)   -- for parent links
accepted    BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ DEFAULT now()
```

---

## 8. Component Structure

### Layout Components
```
AppShell          — main wrapper, manages sidebar + content area
Sidebar           — desktop navigation (coach/athlete/parent variants)
TopBar            — mobile header with logo, menu, notifications
BottomNav         — mobile tab bar (5 key actions per role)
PrivateRoute      — role-aware route guard
```

### Shared / UI Components
```
StatCard          — icon + label + value, optional delta
RedFlagBanner     — volt red dismissable alert strip
Badge             — status badge (Active | Injured | Inactive | GPA Flag)
ProgressBar       — animated bar with label and percentage
Avatar            — athlete/user photo with fallback initials
SearchBar         — debounced search input
FilterChips       — sport/position/grade filter row
ConfirmModal      — destructive action confirmation
EmptyState        — illustrated empty state with CTA
LoadingSpinner    — branded volt green spinner
```

### Feature Components — Training
```
ExerciseCard      — name, category, level, video link, edit/delete actions
ExerciseForm      — create/edit exercise modal
WorkoutCard       — workout name, date, assigned athletes, exercise count
WorkoutBuilder    — drag-and-drop exercise list with set/rep/weight/RPE inputs
WorkoutLogger     — athlete mobile view: log actual sets per exercise
ComplianceCalendar— monthly grid: green/red/grey per date
ProgressChart     — Recharts LineChart for bench/squat/deadlift/40yd/vertical/volume
PRBadge           — volt green highlight when new PR is achieved
OneRMCalculator   — Epley formula display: weight × (1 + reps/30)
```

### Feature Components — Athletes
```
AthleteCard       — photo, name, sport, position, grade, status badges
AthleteForm       — create/edit athlete form
AthleteProfile    — tabbed full profile (Overview/Training/Grades/Eligibility/Recruiting/Attendance/Nutrition/Notes)
RosterTable       — searchable/filterable athlete list
DigitalPresence   — HUDL, Instagram, Twitter, TikTok, Recruiting URL links
BulkImportCSV     — file upload + column mapping for CSV import
```

### Feature Components — Grades & Eligibility
```
GradeRow          — subject, quarter, letter grade, GPA points, red flag
GradeForm         — add/edit grade entry
GPAChart          — Recharts LineChart of GPA over time
CoreCourseRow     — course name, subject, completed checkbox, NCAA flag
CoreCourseTracker — 16-course list with progress bar per category
DivisionEligStatus— D1/D2/D3 green/yellow/red status cards
TenSevenAlert     — 10/7 rule warning banner
```

### Feature Components — Recruiting
```
BenchmarkRow      — metric + athlete value + benchmark + color-coded delta
BenchmarkTable    — full measurable comparison table per division
DivisionFitCard   — projected division (FBS/FCS/D2/D3/Needs Dev)
BenchmarkTooltip  — disclaimer: "NCAA does not set height requirements..."
```

### Feature Components — Communication
```
ChatSidebar       — team chat, groups, DMs list
MessageThread     — scrollable conversation with read receipts
MessageComposer   — text input + file attach + send
GroupForm         — create/edit message group
```

### Feature Components — Calendar & Attendance
```
MonthCalendar     — full month grid with color-coded event dots
WeekCalendar      — week strip with event blocks
EventForm         — create/edit calendar event
EventRoster       — per-event athlete checkin table (present/late/absent)
QRCheckin         — QR code display for athlete self-checkin
AttendanceStats   — per-athlete attendance % + team summary
```

### Feature Components — Nutrition
```
MealLogger        — food name, meal type, macros, water, photo, notes
DailyMacroSummary — daily calorie/protein/carbs/fat/water progress bars
FavoriteFoods     — quick-add frequently logged items
```

### Feature Components — Reports
```
RecruitingReport  — @react-pdf/renderer document: photo, bio, metrics, grades
EligibilityReport — @react-pdf/renderer document: courses, GPA, division status
CSVExporter       — papaparse-powered export buttons
```

---

## 9. Page Map

### Public Routes
```
/               → redirect to /login
/login          → magic link login page
/auth/callback  → Supabase auth callback handler
/onboarding     → first-time profile setup (name, photo)
/invite/:token  → invite accept with role confirmation
```

### Coach Routes (role: coach)
```
/dashboard                         → Coach Dashboard
/athletes                          → Roster view (search, filter, add)
/athletes/:id                      → Athlete Profile (7 tabs)
/training                          → Training Center (4 tabs)
  /training?tab=exercises          → Exercise Library
  /training?tab=builder            → Workout Builder
  /training?tab=log                → Workout Logs view
  /training?tab=charts             → Progress Charts
  /training?tab=compliance         → Compliance Calendar
/grades                            → Team Grades Overview
/grades/:athleteId                 → Individual Grade Detail
/eligibility/:athleteId            → NCAA Eligibility Tracker
/recruiting/:athleteId             → Recruiting Intelligence
/attendance                        → Attendance Overview
/attendance/:eventId               → Event Roster / Checkin
/messages                          → Messaging (sidebar + thread)
/calendar                          → Calendar (month/week)
/reports/:athleteId                → Generate Reports
/settings                          → Settings (program, users, groups, benchmarks)
```

### Athlete Routes (role: athlete)
```
/athlete/dashboard                 → Athlete Dashboard
/athlete/training                  → Today's workout + log
/athlete/training/history          → Past workouts + PR history
/athlete/training/charts           → Own progress charts
/athlete/grades                    → Own grades
/athlete/eligibility               → Own NCAA tracker
/athlete/nutrition                 → Meal logger + daily summary
/athlete/attendance                → Own attendance log
/athlete/messages                  → Message coach
/athlete/calendar                  → View events
/athlete/profile                   → Edit own profile + digital presence
/athlete/checkin/:eventId          → Self check-in page (QR target)
```

### Parent Routes (role: parent)
```
/parent/dashboard                  → Parent Dashboard (child's key stats)
/parent/grades                     → Child's grades
/parent/attendance                 → Child's attendance
/parent/eligibility                → Child's eligibility status
/parent/training                   → Child's workout compliance
/parent/calendar                   → View upcoming events
/parent/messages                   → Message coach only
/parent/profile                    → Edit contact info
```

---

## 10. Feature Specifications

### 10.1 GPA Calculation
```
A  → 4.0
B  → 3.0
C  → 2.0
D  → 1.0
F  → 0.0

GPA = sum(gpa_points) / count(courses)

Red flag threshold: GPA < 2.5
```

### 10.2 1RM Formula (Epley)
```
Estimated 1RM = weight × (1 + reps / 30)

Logged on every workout_logs entry.
Compared against existing personal_records.
If new 1RM > existing max → insert personal_records row with is_pr = true.
Highlighted in volt green in UI.
```

### 10.3 NCAA Core Course Rules
```
16 total core courses required:
  - 4 English
  - 3 Math (Algebra 1 or higher)
  - 2 Natural/Physical Science (1 must be lab science)
  - 1 additional English, Math, or Science
  - 2 Social Science
  - 4 additional NCAA-approved electives

Progress display:
  - Progress bar: X / 16 completed
  - Per-category breakdown with individual checkboxes
  - Color: green ≥ on track | yellow = at risk | red = behind

10/7 Rule:
  - Must complete 10 of 16 core courses before 7th semester
  - 7 of those 10 must be English, Math, or Science
  - Alert if athlete is behind projected timeline

Division Core GPA Thresholds:
  - D1 minimum: 2.3  (alert if below)
  - D2 minimum: 2.2  (alert if below)
  - D3: self-set, no NCAA clearinghouse
  - No standardized test requirements as of 2023 (D1/D2)
```

### 10.4 Division Fit Calculator
```
Algorithm:
1. Get athlete measurables (height, weight, 40-yard, bench, squat, vertical)
2. Compare to recruiting_benchmarks table per sport/position
3. Find highest division where athlete meets ≥ 70% of benchmarks
4. Output: FBS | FCS | D2/NAIA | D3 | Needs Development

Color coding per metric:
  Green  = meets or exceeds standard
  Yellow = within 10% of standard
  Red    = below standard

Always display tooltip:
"NCAA does not set height requirements.
These are coach evaluation benchmarks used as recruiting filters."
```

### 10.5 Attendance System
```
Coach creates event → attendance_events
Per event: assign all roster athletes → create attendance_records (default: absent)
Coach marks present/late/absent per athlete
Athlete self-check-in via QR code (unique URL: /athlete/checkin/:eventId)
  → sets status = 'present', checked_in_at = now()

Compliance %: sum(present + late) / total events × 100
Red flag: attendance % < 70%
```

### 10.6 Nutrition Log
```
Athlete logs per meal:
  food_name, meal_type, calories, protein, carbs, fat, water_ml, notes, photo

Daily summary:
  Aggregate all logs for the day
  Show macro progress bars (vs no target by default, coach can set targets later)
  Water intake day total

Coach view:
  Team nutrition compliance: % of athletes who logged at least 1 meal today
  Cannot see individual food entries (RLS)
```

### 10.7 Realtime Messaging
```
Supabase Realtime subscription on messages table
  Filtered by recipient_id = auth.uid() OR group_id in user's groups

Message types:
  - DM: sender_id → recipient_id (1:1)
  - Group: sender_id → group_id (coach-created groups)
  - Team: group_id = coach's team group

Role restrictions (enforced by RLS):
  - Athletes: can only send to coach (insert where recipient_id = coach_id)
  - Parents: can only send to their child's coach
  - Coach: unrestricted send

File attachments: upload to Supabase Storage, store URL in message text or files table
Read receipts: UPDATE messages SET read = true WHERE recipient_id = auth.uid()
```

---

## 11. API & Data Layer Patterns

### Supabase Client Init
```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Custom Hooks Pattern
```ts
// Example: useAthletes.ts
export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('athletes')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAthletes(data ?? [])
        setLoading(false)
      })
  }, [])

  return { athletes, loading, error }
}
```

### TypeScript Types
- All types generated from Supabase schema using `supabase gen types typescript`
- Stored in `src/types/database.ts`
- No `any` — strict mode enforced in `tsconfig.json`

### Error Handling
- All Supabase calls check `error` and surface to UI via toast notifications
- Network errors show a retry button
- Auth errors redirect to `/login`

---

## 12. Notification System

### Supabase DB Triggers → Edge Functions → Email/Push
```
Coach Alerts (triggered immediately):
  new PR logged          → realtime notification in app
  new injury reported    → email + in-app alert
  athlete GPA < 2.5      → in-app red flag badge
  core GPA < 2.3 (D1)    → in-app badge + email
  core GPA < 2.2 (D2)    → in-app badge + email
  10/7 rule at risk      → in-app badge
  attendance < 70%       → in-app badge
  unread messages > 24h  → email reminder

Athlete Reminders (scheduled via Supabase Edge Function cron):
  8pm:  if assigned workout not logged → push notification
  7pm:  daily nutrition log reminder
  24h before event: calendar reminder
  Semester change: update core courses reminder
```

---

## 13. PDF & Export System

### Recruiting Report PDF (`@react-pdf/renderer`)
**Contents:**
- SELF logo + "Know your SELF." tagline header
- Athlete photo, name, sport, position, grade, height, weight
- Performance metrics (bench, squat, deadlift, 40yd, vertical) with PR dates
- GPA and academic standing (current cumulative)
- Attendance rate (percent + events attended)
- HUDL link, Instagram, Twitter/X, TikTok, Recruiting profile URL
- Coach evaluation notes
- Training compliance rate (%)
- Footer: SELF branding

### Eligibility Report PDF
**Contents:**
- SELF logo header
- Core course completion: X of 16 (per-category list)
- 10/7 rule status with projection
- Core course GPA
- Division eligibility status (D1 / D2 / D3) with color indicators
- Measurables vs division benchmarks table
- Projected division fit
- Coach notes and recommendations
- Important note: "Standardized tests no longer required for NCAA D1/D2 eligibility (2023)"
- Footer: SELF branding

### CSV Exports (`papaparse`)
- Individual athlete CSV (all profile + metrics)
- Full roster CSV
- Workout logs CSV (date, exercise, sets, reps, weight, 1RM)
- Grade reports CSV (subject, quarter, grade, GPA per athlete)

---

## 14. Build Order (Phases)

### Phase 1 — Foundation
1. Initialize Vite + React + TypeScript project in SELF-App directory
2. Configure Tailwind CSS + shadcn/ui with custom design tokens
3. Create Supabase project, run all migrations, seed benchmark data
4. Implement auth flow: magic link, invite system, role assignment
5. Build AppShell with role-aware Sidebar, TopBar, BottomNav
6. PrivateRoute guards + AuthContext

### Phase 2 — Core Data
7. Athlete CRUD (create, view, edit, delete, photo upload)
8. Full athlete profile with 7 tabs + digital presence fields
9. Exercise library with search, filter, CRUD
10. Workout builder with drag-and-drop exercise ordering + assignment

### Phase 3 — Logging
11. Athlete workout logger (mobile-first, per-set logging)
12. Epley 1RM calculator + PR detection + personal_records tracking
13. Compliance calendar (monthly view, green/red/grey)
14. Grades tracker with auto GPA calculation + trend chart + PDF upload

### Phase 4 — Eligibility & Recruiting
15. NCAA core course tracker (16 courses, per-category checkboxes + progress bar)
16. 10/7 rule alert system
17. Division eligibility calculator (D1/D2/D3 GPA thresholds)
18. Recruiting benchmark comparison table (football seeded, extensible)
19. Projected division fit algorithm

### Phase 5 — Communication
20. Realtime messaging with Supabase Realtime
21. Calendar (month + week view) with event management
22. File sharing via Supabase Storage
23. Attendance tracking with QR code self-checkin

### Phase 6 — Reports & Polish
24. Recruiting PDF generator
25. Eligibility PDF generator
26. CSV exports (roster, workouts, grades)
27. Notification system (DB triggers + edge functions)
28. Mobile optimization pass (375px, tap targets, bottom nav)
29. Performance optimization (lazy loading, query caching)

---

## 15. Important Business Rules

| Rule | Value |
|---|---|
| 1RM Formula | `weight × (1 + reps / 30)` (Epley) |
| GPA Red Flag | < 2.5 |
| D1 Core GPA Alert | < 2.3 |
| D2 Core GPA Alert | < 2.2 |
| Attendance Red Flag | < 70% |
| Core Courses Required | 16 total |
| 10/7 Rule | 10 of 16 before 7th semester; 7 must be EMS |
| NCAA Standardized Tests | No longer required for D1/D2 (2023) |
| D3 Clearinghouse | D3 does NOT use NCAA Eligibility Center model |
| Benchmark Disclaimer | Always show: "NCAA does not set height requirements. These are coach evaluation benchmarks used as recruiting filters." |
| RLS Enforcement | Every query uses Supabase RLS — never expose cross-athlete or cross-user data |
| TypeScript | Strict mode — no `any` types anywhere |
| Mobile Mandate | Every page must function fully on 375px screen |
| Benchmark Extensibility | Benchmark framework must support adding new sports without code changes |
| Dark Mode | Dark mode only — no light mode |

---

*SELF — Know your SELF.*
*Version 1.0 Spec — Ready for Implementation Approval*
