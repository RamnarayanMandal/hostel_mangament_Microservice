"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Search, 
  Edit, 
  Eye,
  Shield,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { usePermissions } from '@/hooks/usePermissions'
import { UserRole, ROLE_PERMISSIONS } from '@/config/permissions'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import RoleManager from '@/components/admin/RoleManager'
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUserRole, 
  useUpdateUserStatus, 
  useBulkUpdateUserRoles,
  User 
} from '@/hooks/useUsers'

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'STUDENT' as UserRole,
    password: ''
  })
  const { canManageStaff, canManageStudents } = usePermissions()

  // API hooks
  const { data: usersData, isLoading, error, refetch } = useUsers({ 
    search: searchQuery 
  })
  const createUserMutation = useCreateUser()
  const updateUserRoleMutation = useUpdateUserRole()
  const updateUserStatusMutation = useUpdateUserStatus()
  const bulkUpdateRolesMutation = useBulkUpdateUserRoles()

  const users = usersData?.data?.users || []

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      'SUPER_ADMIN': { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
      'HOSTEL_ADMIN': { label: 'Hostel Admin', color: 'bg-blue-100 text-blue-800' },
      'ADMIN': { label: 'Admin', color: 'bg-indigo-100 text-indigo-800' },
      'STAFF': { label: 'Staff', color: 'bg-green-100 text-green-800' },
      'ACCOUNTANT': { label: 'Accountant', color: 'bg-yellow-100 text-yellow-800' },
      'STUDENT': { label: 'Student', color: 'bg-gray-100 text-gray-800' },
    }
    
    const config = roleConfig[role]
    return config ? (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    ) : null
  }

  const getStatusBadge = (isActive: boolean, isEmailVerified: boolean) => {
    if (!isActive) {
      return <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    }
    if (!isEmailVerified) {
      return <Badge className="bg-yellow-100 text-yellow-800">Unverified</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setShowPermissionModal(true)
  }

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    // TODO: Implement API call to update user role
    console.log(`Updating user ${userId} to role ${newRole}`)
    setShowPermissionModal(false)
    setEditingUser(null)
  }

  const handleBulkRoleUpdate = (roleUpdates: Array<{ userId: string; newRole: UserRole }>) => {
    // TODO: Implement API call for bulk role updates
    console.log('Bulk role updates:', roleUpdates)
  }

  const handleUpdateUserStatus = (userId: string, isActive: boolean) => {
    // TODO: Implement API call to update user status
    console.log(`Updating user ${userId} status to ${isActive}`)
  }

  return (
    <div className="space-y-6">
      <SlideUp>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user roles, permissions, and access</p>
          </div>
          <PermissionGate permission="admin:create">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </PermissionGate>
        </div>
      </SlideUp>

      {/* Search */}
      <FadeIn>
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Role Management Section */}
      <PermissionGate permission="admin:update">
        <RoleManager onRoleUpdate={handleBulkRoleUpdate} />
      </PermissionGate>

      {/* Users List */}
      <StaggerContainer>
        <div className="grid grid-cols-1 gap-4">
          {users.map((user) => (
            <StaggerItem key={user._id}>
              <HoverLift>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{user.fullName}</h3>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.isActive, user.isEmailVerified)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {user.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {user.phone}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PermissionGate permission="admin:read">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="admin:update">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="admin:update">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateUserStatus(user._id, !user.isActive)}
                            className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          >
                            {user.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      {/* Edit User Permissions Modal */}
      <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Update role and permissions for {editingUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-6">
              {/* Current User Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{editingUser.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{editingUser.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Role:</span>
                    <span className="ml-2">{getRoleBadge(editingUser.role)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2">{getStatusBadge(editingUser.isActive, editingUser.isEmailVerified)}</span>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value: UserRole) => setEditingUser({...editingUser, role: value})}
                >
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

              {/* Permissions Preview */}
              <div className="space-y-2">
                <Label>Permissions for {editingUser.role}</Label>
                <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {ROLE_PERMISSIONS[editingUser.role]?.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPermissionModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => editingUser && handleUpdateUserRole(editingUser._id, editingUser.role)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Enter full name" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="Enter phone number" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  <SelectItem value="HOSTEL_ADMIN">Hostel Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
