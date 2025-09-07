import StudentLayout from '@/components/layouts/StudentLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function StudentLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>{children}</StudentLayout>
    </ProtectedRoute>
  )
}
