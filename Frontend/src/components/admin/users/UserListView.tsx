"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Edit, 
  Eye,
  Mail,
  User as UserIcon
} from 'lucide-react'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { UserRole } from '@/config/permissions'
import { User } from '@/hooks/useUsers'

interface UserListViewProps {
  users: User[]
  selectedUsers: string[]
  onSelectUser: (userId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onEdit: (user: User) => void
  onView: (user: User) => void
}

export default function UserListView({ 
  users, 
  selectedUsers, 
  onSelectUser, 
  onSelectAll, 
  onEdit,
  onView
}: UserListViewProps) {
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

  const allSelected = users.length > 0 && selectedUsers.length === users.length
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-0">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onCheckedChange={onSelectAll}
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {selectedUsers.length} of {users.length} selected
              </span>
            </div>
          </div>

          {/* Users List */}
          <div className="divide-y">
            {users.map((user) => (
              <div key={user._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedUsers.includes(user._id)}
                      onCheckedChange={(checked) => onSelectUser(user._id, checked as boolean)}
                    />
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getRoleBadge(user.role)}
                    <PermissionGate permission="admin:read">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(user)}
                        className="h-8 w-8 p-0 hover:bg-gray-200"
                        title="View user details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="admin:update">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="h-8 w-8 p-0 hover:bg-gray-200"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
