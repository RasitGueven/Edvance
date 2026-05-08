import { Navigate, Route, Routes } from 'react-router-dom'
import { Login } from '@/pages/Login'
import { StudentDashboard } from '@/pages/StudentDashboard'
import { CoachDashboard } from '@/pages/CoachDashboard'
import { ParentDashboard } from '@/pages/ParentDashboard'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { DesignShowcase } from '@/pages/DesignShowcase'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ThemePanel } from '@/components/ThemePanel'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach"
          element={
            <ProtectedRoute allowedRoles={['coach']}>
              <CoachDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/showcase" element={<DesignShowcase />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ThemePanel />
    </>
  )
}
