import { useMemo } from 'react'
import { getUserRole } from '@/lib/auth'
import { 
  Permission, 
  UserRole, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  ROLE_PERMISSIONS 
} from '@/config/permissions'

export const usePermissions = () => {
  const userRole = getUserRole() as UserRole

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[userRole] || []
  }, [userRole])

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(userRole, permission)
  }

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return hasAnyPermission(userRole, permissions)
  }

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return hasAllPermissions(userRole, permissions)
  }

  const isAdmin = (): boolean => {
    return ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'ADMIN'].includes(userRole)
  }

  const isStaff = (): boolean => {
    return ['STAFF', 'ACCOUNTANT'].includes(userRole)
  }

  const isStudent = (): boolean => {
    return userRole === 'STUDENT'
  }

  const canManageHostels = (): boolean => {
    return checkAnyPermission(['hostels:create', 'hostels:update', 'hostels:delete'])
  }

  const canManageStudents = (): boolean => {
    return checkAnyPermission(['students:create', 'students:update', 'students:delete'])
  }

  const canManageStaff = (): boolean => {
    return checkAnyPermission(['staff:create', 'staff:update', 'staff:delete'])
  }

  const canManageBookings = (): boolean => {
    return checkAnyPermission(['bookings:create', 'bookings:update', 'bookings:delete', 'bookings:approve'])
  }

  const canManagePayments = (): boolean => {
    return checkAnyPermission(['payments:create', 'payments:update', 'payments:refund'])
  }

  const canViewReports = (): boolean => {
    return checkPermission('reports:read')
  }

  const canGenerateReports = (): boolean => {
    return checkPermission('reports:generate')
  }

  const canManageSettings = (): boolean => {
    return checkPermission('settings:update')
  }

  const canSendNotifications = (): boolean => {
    return checkPermission('notifications:send')
  }

  const canUploadDocuments = (): boolean => {
    return checkPermission('documents:upload')
  }

  const canViewAuditLogs = (): boolean => {
    return checkPermission('audit:read')
  }

  return {
    userRole,
    permissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    isAdmin,
    isStaff,
    isStudent,
    canManageHostels,
    canManageStudents,
    canManageStaff,
    canManageBookings,
    canManagePayments,
    canViewReports,
    canGenerateReports,
    canManageSettings,
    canSendNotifications,
    canUploadDocuments,
    canViewAuditLogs
  }
}
