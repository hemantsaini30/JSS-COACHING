import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicLayout from '../layouts/PublicLayout'
import LandingPage from '../pages/Public/LandingPage'
import LoginPage from '../pages/Public/LoginPage'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import BatchesPage from '../pages/Admin/BatchesPage'
import StudentsPage from '../pages/Admin/StudentsPage'
import TeachersPage from '../pages/Admin/TeachersPage'
import AttendancePage from '../pages/Admin/AttendancePage'
import FeesPage from '../pages/Admin/FeesPage'
import InquiriesPage from '../pages/Admin/InquiriesPage'
import TestsOverviewPage from '../pages/Admin/TestsOverviewPage'
import TeacherDashboard from '../pages/Teacher/TeacherDashboard'
import TestsPage from '../pages/Teacher/TestsPage'
import TestBuilderPage from '../pages/Teacher/TestBuilderPage'
import TestAnalyticsPage from '../pages/Teacher/TestAnalyticsPage'
import StudentDashboard from '../pages/Student/StudentDashboard'
import StudentTestsPage from '../pages/Student/StudentTestsPage'
import ExamPage from '../pages/Student/ExamPage'
import TestResultPage from '../pages/Student/TestResultPage'
import TestLeaderboardPage from '../pages/Student/TestLeaderboardPage'
import StudentDoubtsPage from '../pages/Student/DoubtsPage'
import TeacherDoubtsPage from '../pages/Teacher/DoubtsPage'
import AdminAnnouncementsPage   from '../pages/Admin/AnnouncementsPage'
import TeacherAnnouncementsPage from '../pages/Teacher/AnnouncementsPage'

const guard = (roles, element) => <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin/dashboard" element={guard(['admin'], <AdminDashboard />)} />
      <Route path="/admin/students" element={guard(['admin'], <StudentsPage />)} />
      <Route path="/admin/teachers" element={guard(['admin'], <TeachersPage />)} />
      <Route path="/admin/batches" element={guard(['admin'], <BatchesPage />)} />
      <Route path="/admin/attendance" element={guard(['admin'], <AttendancePage />)} />
      <Route path="/admin/fees" element={guard(['admin'], <FeesPage />)} />
      <Route path="/admin/inquiries" element={guard(['admin'], <InquiriesPage />)} />
      <Route path="/admin/tests" element={guard(['admin'], <TestsOverviewPage />)} />
      <Route path="/admin/tests/:id/analytics" element={guard(['admin'], <TestAnalyticsPage />)} />
      <Route path="/admin/announcements"   element={guard(['admin'],   <AdminAnnouncementsPage />)} />

      <Route path="/teacher/dashboard" element={guard(['teacher'], <TeacherDashboard />)} />
      <Route path="/teacher/tests" element={guard(['teacher'], <TestsPage />)} />
      <Route path="/teacher/tests/:id/build" element={guard(['teacher'], <TestBuilderPage />)} />
      <Route path="/teacher/tests/:id/analytics" element={guard(['teacher'], <TestAnalyticsPage />)} />
      <Route path="/teacher/doubts" element={guard(['teacher'], <TeacherDoubtsPage />)} />
      <Route path="/teacher/announcements" element={guard(['teacher'], <TeacherAnnouncementsPage />)} />

      <Route path="/student/dashboard" element={guard(['student'], <StudentDashboard />)} />
      <Route path="/student/tests" element={guard(['student'], <StudentTestsPage />)} />
      <Route path="/student/tests/:id/exam" element={guard(['student'], <ExamPage />)} />
      <Route path="/student/tests/:id/result" element={guard(['student'], <TestResultPage />)} />
      <Route path="/student/tests/:id/leaderboard" element={guard(['student'], <TestLeaderboardPage />)} />
      <Route path="/student/doubts" element={guard(['student'], <StudentDoubtsPage />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)

export default AppRoutes