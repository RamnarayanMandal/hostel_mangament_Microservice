import React from 'react'
import { Permission, UserRole } from '@/config/permissions'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGateProps {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  role?: UserRole
  roles?: UserRole[]
  fallback?: React.ReactNode
  showError?: boolean
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  fallback = null,
  showError = false
}) => {
  const { userRole, checkPermission, checkAnyPermission, checkAllPermissions } = usePermissions()

  const hasAccess = (): boolean => {
    // Check role-based access first
    if (role && userRole === role) {
      return true
    }
    
    if (roles.length > 0 && roles.includes(userRole)) {
      return true
    }

    // Check permission-based access
    const allPermissions = permission ? [permission, ...permissions] : permissions
    
    if (allPermissions.length === 0) {
      return true // No restrictions
    }

    if (requireAll) {
      return checkAllPermissions(allPermissions)
    } else {
      return checkAnyPermission(allPermissions)
    }
  }

  if (!hasAccess()) {
    if (showError) {
      return (
        <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 font-medium mb-2">Access Denied</div>
            <div className="text-red-500 text-sm">
              You don't have permission to access this content.
            </div>
          </div>
        </div>
      )
    }
    
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Convenience components for common permission checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate roles={['SUPER_ADMIN', 'HOSTEL_ADMIN', 'ADMIN']} fallback={fallback}>
    {children}
  </PermissionGate>
)

export const StaffOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate roles={['STAFF', 'ACCOUNTANT']} fallback={fallback}>
    {children}
  </PermissionGate>
)

export const StudentOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate role="STUDENT" fallback={fallback}>
    {children}
  </PermissionGate>
)

export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate role="SUPER_ADMIN" fallback={fallback}>
    {children}
  </PermissionGate>
)

export const HostelAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate roles={['SUPER_ADMIN', 'HOSTEL_ADMIN']} fallback={fallback}>
    {children}
  </PermissionGate>
)

export const AccountantOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate role="ACCOUNTANT" fallback={fallback}>
    {children}
  </PermissionGate>
)
