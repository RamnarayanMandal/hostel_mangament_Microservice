import AdminLayout from '@/components/layouts/AdminLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}
