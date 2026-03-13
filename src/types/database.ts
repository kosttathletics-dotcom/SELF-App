// ============================================================
// SELF App — Supabase Database Types
// ============================================================

export type Role = 'coach' | 'athlete' | 'parent' | 'pending'
export type AthleteStatus = 'active' | 'inactive' | 'injured'
export type EventType = 'Lift' | 'Practice' | 'Game' | 'Meeting' | 'Event'
export type AttendanceStatus = 'present' | 'late' | 'absent'
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Pre-Workout' | 'Post-Workout'
export type ExerciseCategory = 'Strength' | 'Power' | 'Conditioning' | 'Mobility' | 'Sport-Specific'
export type ProgressionLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite'
export type InjurySeverity = 'Minor' | 'Moderate' | 'Severe'
export type InjuryStatus = 'active' | 'healing' | 'cleared'
export type InjuryType = 'Strain' | 'Sprain' | 'Fracture' | 'Concussion' | 'Other'
export type FileType = 'image' | 'pdf' | 'video'
export type Division = 'FBS' | 'FCS' | 'D2/NAIA' | 'D3'
export type CoreSubject = 'English' | 'Math' | 'Science' | 'Social Science' | 'Elective'
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Semester 1' | 'Semester 2' | 'Final'

export interface User {
    id: string
    email: string
    role: Role
    name: string | null
    photo_url: string | null
    approved: boolean
    created_at: string
}

export interface Athlete {
    id: string
    coach_id: string
    user_id: string | null
    name: string
    sport: string | null
    position: string | null
    grade: string | null
    graduation_year: string | null
    age_group: string | null
    height: string | null
    weight: string | null
    gpa: number | null
    photo_url: string | null
    status: AthleteStatus
    notes: string | null
    parent_name: string | null
    parent_email: string | null
    parent_phone: string | null
    hudl_url: string | null
    instagram: string | null
    twitter: string | null
    tiktok: string | null
    recruiting_url: string | null
    created_at: string
}

export interface Exercise {
    id: string
    coach_id: string
    name: string
    category: ExerciseCategory | null
    progression_level: ProgressionLevel | null
    video_url: string | null
    notes: string | null
    created_at: string
}

export interface Workout {
    id: string
    coach_id: string
    name: string
    description: string | null
    assigned_to: string[] | null
    assigned_group: string | null
    date: string | null
    is_template: boolean
    notes: string | null
    created_at: string
}

export interface WorkoutExercise {
    id: string
    workout_id: string
    exercise_id: string
    sets: number | null
    reps: number | null
    target_weight: number | null
    rpe: number | null
    order_index: number
    notes: string | null
    exercise?: Exercise
}

export interface WorkoutLog {
    id: string
    athlete_id: string
    workout_id: string | null
    exercise_id: string | null
    date: string
    sets_completed: number | null
    reps_completed: number | null
    weight_achieved: number | null
    rpe_actual: number | null
    estimated_1rm: number | null
    notes: string | null
    completed: boolean
    created_at: string
    exercise?: Exercise
}

export interface Grade {
    id: string
    athlete_id: string
    coach_id: string
    subject: string
    quarter: Quarter
    school_year: string
    grade_value: number | null
    letter_grade: string | null
    gpa_points: number
    notes: string | null
    report_card_url: string | null
    created_at: string
}

export interface Injury {
    id: string
    athlete_id: string
    date: string
    body_part: string | null
    type: InjuryType | null
    severity: InjurySeverity | null
    symptoms: string | null
    status: InjuryStatus
    restrictions: string | null
    notes: string | null
    photo_url: string | null
    created_at: string
}

export interface AttendanceEvent {
    id: string
    coach_id: string
    title: string
    date: string
    time: string | null
    type: EventType
    location: string | null
    notes: string | null
    created_at: string
}

export interface AttendanceRecord {
    id: string
    event_id: string
    athlete_id: string
    status: AttendanceStatus
    checked_in_at: string | null
    notes: string | null
    created_at: string
    athlete?: Athlete
}

export interface NutritionLog {
    id: string
    athlete_id: string
    date: string
    meal_type: MealType
    food_name: string
    calories: number | null
    protein: number | null
    carbs: number | null
    fat: number | null
    water_ml: number | null
    notes: string | null
    photo_url: string | null
    created_at: string
}

export interface Message {
    id: string
    sender_id: string
    recipient_id: string | null
    group_id: string | null
    text: string
    read: boolean
    created_at: string
    sender?: User
}

export interface MessageGroup {
    id: string
    coach_id: string
    name: string
    member_ids: string[]
    created_at: string
}

export interface CalendarEvent {
    id: string
    coach_id: string
    title: string
    date: string
    time: string | null
    type: EventType
    location: string | null
    description: string | null
    reminder_sent: boolean
    created_at: string
}

export interface FileRecord {
    id: string
    uploader_id: string
    name: string
    url: string
    file_type: FileType
    size: number | null
    event_id: string | null
    athlete_id: string | null
    created_at: string
}

export interface PersonalRecord {
    id: string
    athlete_id: string
    exercise_id: string
    weight: number
    estimated_1rm: number
    date: string
    is_pr: boolean
    created_at: string
    exercise?: Exercise
}

export interface CoreCourse {
    id: string
    athlete_id: string
    subject: CoreSubject
    course_name: string
    grade_value: number | null
    gpa_points: number | null
    semester: string | null
    school_year: string | null
    ncaa_approved: boolean
    completed: boolean
    created_at: string
}

export interface RecruitingBenchmark {
    id: string
    sport: string
    position: string
    division: Division
    height_min: string | null
    weight_min: number | null
    forty_yard: number | null
    bench: number | null
    squat: number | null
    vertical: number | null
    notes: string | null
    created_at: string
}

export interface ParentAthleteLink {
    id: string
    parent_id: string
    athlete_id: string
    created_at: string
}

export interface Invite {
    id: string
    email: string
    role: 'athlete' | 'parent'
    coach_id: string
    athlete_id: string | null
    accepted: boolean
    created_at: string
}

// Database shape for Supabase typed client
export type Database = {
    public: {
        Tables: {
            users: { Row: User; Insert: Omit<User, 'id' | 'created_at'>; Update: Partial<Omit<User, 'id'>> }
            athletes: { Row: Athlete; Insert: Omit<Athlete, 'id' | 'created_at'>; Update: Partial<Omit<Athlete, 'id'>> }
            exercises: { Row: Exercise; Insert: Omit<Exercise, 'id' | 'created_at'>; Update: Partial<Omit<Exercise, 'id'>> }
            workouts: { Row: Workout; Insert: Omit<Workout, 'id' | 'created_at'>; Update: Partial<Omit<Workout, 'id'>> }
            workout_exercises: { Row: WorkoutExercise; Insert: Omit<WorkoutExercise, 'id'>; Update: Partial<Omit<WorkoutExercise, 'id'>> }
            workout_logs: { Row: WorkoutLog; Insert: Omit<WorkoutLog, 'id' | 'created_at'>; Update: Partial<Omit<WorkoutLog, 'id'>> }
            grades: { Row: Grade; Insert: Omit<Grade, 'id' | 'created_at'>; Update: Partial<Omit<Grade, 'id'>> }
            injuries: { Row: Injury; Insert: Omit<Injury, 'id' | 'created_at'>; Update: Partial<Omit<Injury, 'id'>> }
            attendance_events: { Row: AttendanceEvent; Insert: Omit<AttendanceEvent, 'id' | 'created_at'>; Update: Partial<Omit<AttendanceEvent, 'id'>> }
            attendance_records: { Row: AttendanceRecord; Insert: Omit<AttendanceRecord, 'id' | 'created_at'>; Update: Partial<Omit<AttendanceRecord, 'id'>> }
            nutrition_logs: { Row: NutritionLog; Insert: Omit<NutritionLog, 'id' | 'created_at'>; Update: Partial<Omit<NutritionLog, 'id'>> }
            messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at'>; Update: Partial<Omit<Message, 'id'>> }
            message_groups: { Row: MessageGroup; Insert: Omit<MessageGroup, 'id' | 'created_at'>; Update: Partial<Omit<MessageGroup, 'id'>> }
            calendar_events: { Row: CalendarEvent; Insert: Omit<CalendarEvent, 'id' | 'created_at'>; Update: Partial<Omit<CalendarEvent, 'id'>> }
            files: { Row: FileRecord; Insert: Omit<FileRecord, 'id' | 'created_at'>; Update: Partial<Omit<FileRecord, 'id'>> }
            personal_records: { Row: PersonalRecord; Insert: Omit<PersonalRecord, 'id' | 'created_at'>; Update: Partial<Omit<PersonalRecord, 'id'>> }
            core_courses: { Row: CoreCourse; Insert: Omit<CoreCourse, 'id' | 'created_at'>; Update: Partial<Omit<CoreCourse, 'id'>> }
            recruiting_benchmarks: { Row: RecruitingBenchmark; Insert: Omit<RecruitingBenchmark, 'id' | 'created_at'>; Update: Partial<Omit<RecruitingBenchmark, 'id'>> }
            parent_athlete_links: { Row: ParentAthleteLink; Insert: Omit<ParentAthleteLink, 'id' | 'created_at'>; Update: Partial<Omit<ParentAthleteLink, 'id'>> }
            invites: { Row: Invite; Insert: Omit<Invite, 'id' | 'created_at'>; Update: Partial<Omit<Invite, 'id'>> }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}
