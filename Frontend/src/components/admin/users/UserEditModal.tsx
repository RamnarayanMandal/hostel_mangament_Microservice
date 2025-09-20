"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole, ROLE_PERMISSIONS } from '@/config/permissions'
import { User } from '@/hooks/useUsers'

interface UserEditModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onUpdateRole: (userId: string, newRole: UserRole) => void
}

export default function UserEditModal({ isOpen, onClose, user, onUpdateRole }: UserEditModalProps) {
  const [editingUser, setEditingUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    if (user) {
      setEditingUser(user)
    }
  }, [user])

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

  const handleUpdate = () => {
    if (editingUser) {
      onUpdateRole(editingUser._id, editingUser.role)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Update User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
