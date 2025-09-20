"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { UserRole, ROLE_PERMISSIONS } from '@/config/permissions'

interface User {
  _id: string
  fullName: string
  email: string
  role: UserRole
}

interface RoleManagerProps {
  onRoleUpdate: (roleUpdates: Array<{ userId: string; newRole: UserRole }>) => void
  users: User[]
}

export default function RoleManager({ onRoleUpdate, users }: RoleManagerProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkRole, setBulkRole] = useState<UserRole>('STUDENT')
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id))
    }
  }

  const handleBulkRoleUpdate = () => {
    const roleUpdates = selectedUsers.map(userId => ({
      userId,
      newRole: bulkRole
    }))
    onRoleUpdate(roleUpdates)
    setSelectedUsers([])
    setShowBulkUpdate(false)
  }

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

  const getRoleStats = () => {
    const stats = filteredUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<UserRole, number>)

    return stats
  }

  const roleStats = getRoleStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Manage user roles and permissions in bulk</p>
        </div>
        <Dialog open={showBulkUpdate} onOpenChange={setShowBulkUpdate}>
          <DialogTrigger asChild>
            <Button 
              disabled={selectedUsers.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Update ({selectedUsers.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Role Update</DialogTitle>
              <DialogDescription>
                Update roles for {selectedUsers.length} selected users
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-role">New Role</Label>
                <Select value={bulkRole} onValueChange={(value) => setBulkRole(value as UserRole)}>
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
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Warning</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This action will change the role and permissions for {selectedUsers.length} users. 
                  This cannot be undone.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkUpdate(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkRoleUpdate}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Update Roles
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(roleStats).map(([role, count]) => (
          <Card key={role}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{role}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="whitespace-nowrap"
            >
              {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Users ({filteredUsers.length})</span>
          </CardTitle>
          <CardDescription>
            Select users to perform bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div 
                key={user._id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  selectedUsers.includes(user._id) 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{user.fullName}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getRoleBadge(user.role)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Handle individual user role update
                      console.log('Update role for user:', user._id)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Role Templates</span>
          </CardTitle>
          <CardDescription>
            Quick access to role definitions and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{role}</h4>
                  {getRoleBadge(role as UserRole)}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {permissions.length} permissions
                </p>
                <div className="flex flex-wrap gap-1">
                  {permissions.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission.split(':')[0]}
                    </Badge>
                  ))}
                  {permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
