import StaffLayout from '@/components/layouts/StaffLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function StaffLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['STAFF']}>
      <StaffLayout>{children}</StaffLayout>
    </ProtectedRoute>
  )
}
