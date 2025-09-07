// Permission system configuration based on backend roles and permissions

export type UserRole = 'STUDENT' | 'ADMIN' | 'STAFF' | 'SUPER_ADMIN' | 'HOSTEL_ADMIN' | 'ACCOUNTANT'

export type Permission = 
  // Hostel Management
  | 'hostels:read' | 'hostels:create' | 'hostels:update' | 'hostels:delete'
  // Student Management  
  | 'students:read' | 'students:create' | 'students:update' | 'students:delete'
  // Staff Management
  | 'staff:read' | 'staff:create' | 'staff:update' | 'staff:delete'
  // Booking Management
  | 'bookings:read' | 'bookings:create' | 'bookings:update' | 'bookings:delete' | 'bookings:approve' | 'bookings:cancel'
  // Payment Management
  | 'payments:read' | 'payments:create' | 'payments:update' | 'payments:refund'
  // Reports & Analytics
  | 'reports:read' | 'reports:generate' | 'reports:export'
  // Admin Management
  | 'admin:read' | 'admin:create' | 'admin:update' | 'admin:delete'
  // Settings & Configuration
  | 'settings:read' | 'settings:update'
  // Notifications
  | 'notifications:read' | 'notifications:send'
  // Documents
  | 'documents:read' | 'documents:upload' | 'documents:delete'
  // Security & Audit
  | 'security:read' | 'audit:read'
  // Messages
  | 'messages:read' | 'messages:send'

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Super Admin - Full access to everything
  SUPER_ADMIN: [
    'hostels:read', 'hostels:create', 'hostels:update', 'hostels:delete',
    'students:read', 'students:create', 'students:update', 'students:delete',
    'staff:read', 'staff:create', 'staff:update', 'staff:delete',
    'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:approve', 'bookings:cancel',
    'payments:read', 'payments:create', 'payments:update', 'payments:refund',
    'reports:read', 'reports:generate', 'reports:export',
    'admin:read', 'admin:create', 'admin:update', 'admin:delete',
    'settings:read', 'settings:update',
    'notifications:read', 'notifications:send',
    'documents:read', 'documents:upload', 'documents:delete',
    'security:read', 'audit:read',
    'messages:read', 'messages:send'
  ],

  // Hostel Admin - Full access to assigned hostels
  HOSTEL_ADMIN: [
    'hostels:read', 'hostels:create', 'hostels:update', 'hostels:delete',
    'students:read', 'students:create', 'students:update',
    'staff:read', 'staff:create', 'staff:update',
    'bookings:read', 'bookings:create', 'bookings:update', 'bookings:approve', 'bookings:cancel',
    'payments:read', 'payments:create', 'payments:update',
    'reports:read', 'reports:generate',
    'notifications:read', 'notifications:send',
    'documents:read', 'documents:upload',
    'messages:read', 'messages:send'
  ],

  // Staff - Limited access to operations
  STAFF: [
    'hostels:read',
    'students:read', 'students:create', 'students:update',
    'bookings:read', 'bookings:create', 'bookings:update',
    'payments:read',
    'reports:read',
    'notifications:read',
    'documents:read', 'documents:upload',
    'messages:read', 'messages:send'
  ],

  // Accountant - Financial operations only
  ACCOUNTANT: [
    'hostels:read',
    'students:read',
    'bookings:read',
    'payments:read', 'payments:create', 'payments:update', 'payments:refund',
    'reports:read', 'reports:generate', 'reports:export',
    'documents:read'
  ],

  // Admin - General admin access (legacy role)
  ADMIN: [
    'hostels:read', 'hostels:create', 'hostels:update', 'hostels:delete',
    'students:read', 'students:create', 'students:update', 'students:delete',
    'staff:read', 'staff:create', 'staff:update', 'staff:delete',
    'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:approve', 'bookings:cancel',
    'payments:read', 'payments:create', 'payments:update', 'payments:refund',
    'reports:read', 'reports:generate', 'reports:export',
    'admin:read', 'admin:create', 'admin:update', 'admin:delete',
    'settings:read', 'settings:update',
    'notifications:read', 'notifications:send',
    'documents:read', 'documents:upload', 'documents:delete',
    'security:read', 'audit:read',
    'messages:read', 'messages:send'
  ],

  // Student - Limited to own data
  STUDENT: [
    'hostels:read',
    'bookings:read', 'bookings:create',
    'payments:read', 'payments:create',
    'documents:read',
    'messages:read', 'messages:send'
  ]
}

// Navigation items with permission requirements
export interface NavigationItem {
  title: string
  href: string
  icon: any
  permissions?: Permission[]
  roles?: UserRole[]
  children?: NavigationItem[]
}

// Check if user has specific permission
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

// Check if user has any of the specified permissions
export const hasAnyPermission = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Check if user has all of the specified permissions
export const hasAllPermissions = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Check if user role is allowed for navigation item
export const canAccessNavigationItem = (userRole: UserRole, item: NavigationItem): boolean => {
  // If no permissions or roles specified, allow access
  if (!item.permissions && !item.roles) {
    return true
  }

  // Check role-based access
  if (item.roles && item.roles.includes(userRole)) {
    return true
  }

  // Check permission-based access
  if (item.permissions && hasAnyPermission(userRole, item.permissions)) {
    return true
  }

  return false
}

// Filter navigation items based on user permissions
export const filterNavigationByPermissions = (navigation: NavigationItem[], userRole: UserRole): NavigationItem[] => {
  return navigation.filter(item => {
    if (!canAccessNavigationItem(userRole, item)) {
      return false
    }

    // Filter children if they exist
    if (item.children) {
      item.children = filterNavigationByPermissions(item.children, userRole)
    }

    return true
  })
}
