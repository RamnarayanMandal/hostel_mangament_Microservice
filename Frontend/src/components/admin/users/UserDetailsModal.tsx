"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CheckCircle, 
  XCircle,
  User as UserIcon,
  Clock
} from 'lucide-react'
import { User } from '@/hooks/useUsers'
import { UserRole } from '@/config/permissions'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onToggleStatus: (userId: string, isActive: boolean) => void
}

export default function UserDetailsModal({ isOpen, onClose, user, onToggleStatus }: UserDetailsModalProps) {
  if (!user) return null

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

  const handleToggleStatus = () => {
    onToggleStatus(user._id, !user.isActive)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {user.fullName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{user.fullName}</h3>
                {getRoleBadge(user.role)}
                {getStatusBadge(user.isActive, user.isEmailVerified)}
              </div>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Basic Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Joined Date</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Last Login</p>
                      <p className="font-medium">{new Date(user.lastLoginAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Status
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Account Status</span>
                  {getStatusBadge(user.isActive, user.isEmailVerified)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <div className="flex items-center gap-2">
                    {user.isEmailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">User Role</span>
                  {getRoleBadge(user.role)}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {user.firstName && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.firstName && (
                  <div>
                    <p className="text-sm text-gray-600">First Name</p>
                    <p className="font-medium">{user.firstName}</p>
                  </div>
                )}
                {user.lastName && (
                  <div>
                    <p className="text-sm text-gray-600">Last Name</p>
                    <p className="font-medium">{user.lastName}</p>
                  </div>
                )}
                {user.gender && (
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium capitalize">{user.gender}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            onClick={handleToggleStatus}
            className={user.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {user.isActive ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Deactivate User
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate User
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
