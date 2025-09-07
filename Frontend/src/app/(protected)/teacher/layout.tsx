import TeacherLayout from '@/components/layouts/TeacherLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function TeacherLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['STAFF']}>
      <TeacherLayout>{children}</TeacherLayout>
    </ProtectedRoute>
  )
} 