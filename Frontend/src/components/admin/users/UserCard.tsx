"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Edit, 
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { HoverLift } from '@/components/ui/motion'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { UserRole } from '@/config/permissions'
import { User } from '@/hooks/useUsers'

interface UserCardProps {
  user: User
  onView: (user: User) => void
  onEdit: (user: User) => void
  onToggleStatus: (userId: string, isActive: boolean) => void
}

export default function UserCard({ user, onView, onEdit, onToggleStatus }: UserCardProps) {
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

  return (
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
                  onClick={() => onView(user)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </PermissionGate>
              <PermissionGate permission="admin:update">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(user)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </PermissionGate>
              <PermissionGate permission="admin:update">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(user._id, !user.isActive)}
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
  )
}
