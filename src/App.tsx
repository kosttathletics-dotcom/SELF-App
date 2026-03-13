import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { PrivateRoute } from '@/components/auth/PrivateRoute'

// Public pages
import LoginPage from '@/pages/Login'
import AuthCallback from '@/pages/AuthCallback'
import Onboarding from '@/pages/Onboarding'

// Coach pages
import CoachDashboard from '@/pages/coach/Dashboard'
import AthletesPage from '@/pages/coach/Athletes'
import AthleteProfilePage from '@/pages/coach/AthleteProfile'
import TrainingPage from '@/pages/coach/Training'
import GradesPage from '@/pages/coach/Grades'
import AttendancePage from '@/pages/coach/Attendance'
import MessagesPage from '@/pages/coach/Messages'
import CalendarPage from '@/pages/coach/CalendarPage'
import SettingsPage from '@/pages/coach/Settings'
import InjuryLogPage from '@/pages/coach/InjuryLog'
import RecruitingPage from '@/pages/coach/Recruiting'
import TeamAccessPage from '@/pages/coach/TeamAccess'

// Athlete pages
import AthleteDashboard from '@/pages/athlete/Dashboard'
import AthleteTraining from '@/pages/athlete/Training'
import AthleteGrades from '@/pages/athlete/Grades'
import AthleteNutrition from '@/pages/athlete/Nutrition'
import AthleteMessages from '@/pages/athlete/Messages'
import AthleteCalendar from '@/pages/athlete/CalendarPage'
import AthleteProfile from '@/pages/athlete/Profile'
import LogWorkout from '@/pages/athlete/LogWorkout'

// Parent pages
import ParentDashboard from '@/pages/parent/Dashboard'
import ParentGrades from '@/pages/parent/Grades'
import ParentAttendance from '@/pages/parent/Attendance'
import ParentEligibility from '@/pages/parent/Eligibility'
import ParentMessages from '@/pages/parent/Messages'
import ParentCalendar from '@/pages/parent/CalendarPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Coach routes */}
          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={['coach']}>
              <CoachDashboard />
            </PrivateRoute>
          } />
          <Route path="/athletes" element={
            <PrivateRoute allowedRoles={['coach']}>
              <AthletesPage />
            </PrivateRoute>
          } />
          <Route path="/athletes/:id" element={
            <PrivateRoute allowedRoles={['coach']}>
              <AthleteProfilePage />
            </PrivateRoute>
          } />
          <Route path="/training" element={
            <PrivateRoute allowedRoles={['coach']}>
              <TrainingPage />
            </PrivateRoute>
          } />
          <Route path="/grades" element={
            <PrivateRoute allowedRoles={['coach']}>
              <GradesPage />
            </PrivateRoute>
          } />
          <Route path="/attendance" element={
            <PrivateRoute allowedRoles={['coach']}>
              <AttendancePage />
            </PrivateRoute>
          } />
          <Route path="/messages" element={
            <PrivateRoute allowedRoles={['coach']}>
              <MessagesPage />
            </PrivateRoute>
          } />
          <Route path="/calendar" element={
            <PrivateRoute allowedRoles={['coach']}>
              <CalendarPage />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute allowedRoles={['coach']}>
              <SettingsPage />
            </PrivateRoute>
          } />
          <Route path="/injuries" element={
            <PrivateRoute allowedRoles={['coach']}>
              <InjuryLogPage />
            </PrivateRoute>
          } />
          <Route path="/recruiting" element={
            <PrivateRoute allowedRoles={['coach']}>
              <RecruitingPage />
            </PrivateRoute>
          } />
          <Route path="/team-access" element={
            <PrivateRoute allowedRoles={['coach']}>
              <TeamAccessPage />
            </PrivateRoute>
          } />

          {/* Athlete routes */}
          <Route path="/athlete/dashboard" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <AthleteDashboard />
            </PrivateRoute>
          } />
          <Route path="/athlete/training" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <AthleteTraining />
            </PrivateRoute>
          } />
          <Route path="/athlete/grades" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <AthleteGrades />
            </PrivateRoute>
          } />
          <Route path="/athlete/nutrition" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <AthleteNutrition />
            </PrivateRoute>
          } />
          <Route path="/athlete/messages" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <AthleteMessages />
            </PrivateRoute>
          } />
          <Route path="/athlete/calendar" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <AthleteCalendar />
            </PrivateRoute>
          } />
          <Route path="/athlete/profile" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <AthleteProfile />
            </PrivateRoute>
          } />
          <Route path="/athlete/log-workout" element={
            <PrivateRoute allowedRoles={['athlete']}>
              <LogWorkout />
            </PrivateRoute>
          } />

          {/* Parent routes */}
          <Route path="/parent/dashboard" element={
            <PrivateRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </PrivateRoute>
          } />
          <Route path="/parent/grades" element={
            <PrivateRoute allowedRoles={['parent']}>
              <ParentGrades />
            </PrivateRoute>
          } />
          <Route path="/parent/attendance" element={
            <PrivateRoute allowedRoles={['parent']}>
              <ParentAttendance />
            </PrivateRoute>
          } />
          <Route path="/parent/eligibility" element={
            <PrivateRoute allowedRoles={['parent']}>
              <ParentEligibility />
            </PrivateRoute>
          } />
          <Route path="/parent/messages" element={
            <PrivateRoute allowedRoles={['parent']}>
              <ParentMessages />
            </PrivateRoute>
          } />
          <Route path="/parent/calendar" element={
            <PrivateRoute allowedRoles={['parent']}>
              <ParentCalendar />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
