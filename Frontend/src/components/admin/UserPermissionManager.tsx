"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Shield, 
  User, 
  Settings, 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  FileText, 
  BarChart3,
  Bell,
  MessageSquare,
  Eye,
  Lock
} from 'lucide-react'
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/config/permissions'

interface UserPermissionManagerProps {
  user: {
    _id: string
    fullName: string
    email: string
    role: UserRole
    isActive: boolean
    isEmailVerified: boolean
  }
  isOpen: boolean
  onClose: () => void
  onUpdate: (userId: string, updates: { role?: UserRole; permissions?: Permission[] }) => void
}

// Group permissions by category for better organization
const PERMISSION_CATEGORIES = {
  'Hostel Management': {
    icon: Building2,
    permissions: ['hostels:read', 'hostels:create', 'hostels:update', 'hostels:delete']
  },
  'User Management': {
    icon: Users,
    permissions: ['students:read', 'students:create', 'students:update', 'students:delete', 'staff:read', 'staff:create', 'staff:update', 'staff:delete']
  },
  'Booking Management': {
    icon: Calendar,
    permissions: ['bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:approve', 'bookings:cancel']
  },
  'Payment Management': {
    icon: CreditCard,
    permissions: ['payments:read', 'payments:create', 'payments:update', 'payments:refund']
  },
  'Reports & Analytics': {
    icon: BarChart3,
    permissions: ['reports:read', 'reports:generate', 'reports:export']
  },
  'Admin Functions': {
    icon: Shield,
    permissions: ['admin:read', 'admin:create', 'admin:update', 'admin:delete']
  },
  'Settings & Configuration': {
    icon: Settings,
    permissions: ['settings:read', 'settings:update']
  },
  'Notifications': {
    icon: Bell,
    permissions: ['notifications:read', 'notifications:send']
  },
  'Documents': {
    icon: FileText,
    permissions: ['documents:read', 'documents:upload', 'documents:delete']
  },
  'Security & Audit': {
    icon: Lock,
    permissions: ['security:read', 'audit:read']
  },
  'Messages': {
    icon: MessageSquare,
    permissions: ['messages:read', 'messages:send']
  }
}

export default function UserPermissionManager({ 
  user, 
  isOpen, 
  onClose, 
  onUpdate 
}: UserPermissionManagerProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])
  const [useCustomPermissions, setUseCustomPermissions] = useState(false)

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole)
    setUseCustomPermissions(false)
    setCustomPermissions([])
  }

  const handlePermissionToggle = (permission: Permission) => {
    setCustomPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  const handleSave = () => {
    const updates = {
      role: selectedRole,
      permissions: useCustomPermissions ? customPermissions : undefined
    }
    onUpdate(user._id, updates)
    onClose()
  }

  const getRoleDescription = (role: UserRole) => {
    const descriptions = {
      'SUPER_ADMIN': 'Full system access with all permissions',
      'HOSTEL_ADMIN': 'Full access to assigned hostels and related operations',
      'ADMIN': 'General administrative access to most system features',
      'STAFF': 'Limited operational access for daily hostel management',
      'ACCOUNTANT': 'Financial operations and payment management only',
      'STUDENT': 'Access to own data and basic booking operations'
    }
    return descriptions[role] || 'No description available'
  }

  const getRolePermissions = (role: UserRole) => {
    return ROLE_PERMISSIONS[role] || []
  }

  const currentPermissions = useCustomPermissions ? customPermissions : getRolePermissions(selectedRole)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Manage Permissions for {user.fullName}</span>
          </DialogTitle>
          <DialogDescription>
            Configure user role and permissions. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm">{user.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Role</Label>
                  <Badge className="mt-1">{user.role}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="flex space-x-2 mt-1">
                    <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={user.isEmailVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Assignment</CardTitle>
              <CardDescription>
                Select a role to automatically assign standard permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                    <SelectItem value="HOSTEL_ADMIN">Hostel Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">{selectedRole}</h4>
                <p className="text-sm text-blue-700">{getRoleDescription(selectedRole)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Permissions Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Permissions</CardTitle>
              <CardDescription>
                Override role permissions with custom settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="custom-permissions"
                  checked={useCustomPermissions}
                  onCheckedChange={setUseCustomPermissions}
                />
                <Label htmlFor="custom-permissions">
                  Use custom permissions instead of role defaults
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Permissions by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissions</CardTitle>
              <CardDescription>
                {useCustomPermissions 
                  ? "Select specific permissions for this user"
                  : `Standard permissions for ${selectedRole} role`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, { icon: Icon, permissions }]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">{category}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-7">
                      {permissions.map((permission) => {
                        const isChecked = currentPermissions.includes(permission)
                        const isDisabled = !useCustomPermissions
                        
                        return (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={isChecked}
                              disabled={isDisabled}
                              onCheckedChange={() => handlePermissionToggle(permission)}
                            />
                            <Label 
                              htmlFor={permission} 
                              className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}
                            >
                              {permission}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permission Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Permission Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Total Permissions:</span>
                  <Badge variant="secondary">{currentPermissions.length}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {currentPermissions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {currentPermissions.map((permission) => (
                        <span key={permission} className="text-xs bg-white px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>No permissions assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
