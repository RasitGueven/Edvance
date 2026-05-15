import { Navigate, Route, Routes } from 'react-router-dom'
import { Login } from '@/pages/Login'
import { DesignShowcase } from '@/pages/DesignShowcase'
import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { CoachDashboard } from '@/pages/coach/CoachDashboard'
import { ParentDashboard } from '@/pages/parent/ParentDashboard'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { LambacherPreview } from '@/pages/admin/LambacherPreview'
import { ClusterView } from '@/pages/student/ClusterView'
import { TaskPlayer } from '@/pages/student/TaskPlayer'
import { ProtectedRoute } from '@/components/edvance/ProtectedRoute'
import { ThemePanel } from '@/components/edvance/ThemePanel'
import { DiagnosisProvider } from '@/context/DiagnosisContext'
import { DiagnosisSession } from '@/pages/DiagnosisSession'
import { DiagnosisResult } from '@/pages/DiagnosisResult'
import { TaskWidgetDemo } from '@/pages/student/TaskWidgetDemo'

export default function App(): JSX.Element {
  return (
    <DiagnosisProvider>
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
          path="/student/cluster/:clusterId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ClusterView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/task/:taskId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <TaskPlayer />
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
        <Route
          path="/admin/lambacher-preview"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <LambacherPreview />
            </ProtectedRoute>
          }
        />

        <Route path="/showcase" element={<DesignShowcase />} />
        <Route path="/demo/widgets" element={<TaskWidgetDemo />} />

        {/* Diagnose-Engine: zugänglich ohne Login (Tablet-Sicht für Schüler).
            Coach erreicht den Coach-View über ?view=coach. */}
        <Route path="/diagnosis" element={<DiagnosisSession />} />
        <Route path="/diagnosis/result" element={<DiagnosisResult />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ThemePanel />
    </DiagnosisProvider>
  )
}
