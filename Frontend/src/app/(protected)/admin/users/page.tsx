"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Grid3X3, List } from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  SlideUp
} from '@/components/ui/motion'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { usePermissions } from '@/hooks/usePermissions'
import { UserRole } from '@/config/permissions'
import RoleManager from '@/components/admin/RoleManager'
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUserRole, 
  useUpdateUserStatus, 
  useBulkUpdateUserRoles,
  User 
} from '@/hooks/useUsers'
import {
  UserCard,
  UserListView,
  UserEditModal,
  UserDetailsModal,
  CreateUserModal,
  Pagination,
  SearchBar,
  CreateUserData
} from '@/components/admin/users'

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list')
  const { canManageStaff, canManageStudents } = usePermissions()

  // API hooks
  const { data: usersData, isLoading, error, refetch } = useUsers({ 
    search: searchQuery,
    page: currentPage,
    limit: pageSize
  })
  const createUserMutation = useCreateUser()
  const updateUserRoleMutation = useUpdateUserRole()
  const updateUserStatusMutation = useUpdateUserStatus()
  const bulkUpdateRolesMutation = useBulkUpdateUserRoles()

  const users = usersData?.data?.users || []
  const pagination = usersData?.data || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  }


  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowPermissionModal(true)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleSelectUser = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user._id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    updateUserRoleMutation.mutate({ userId, role: newRole })
    setShowPermissionModal(false)
    setEditingUser(null)
  }

  const handleBulkRoleUpdate = (roleUpdates: Array<{ userId: string; newRole: UserRole }>) => {
    const formattedUpdates = roleUpdates.map(update => ({
      userId: update.userId,
      role: update.newRole
    }))
    bulkUpdateRolesMutation.mutate(formattedUpdates)
  }

  const handleUpdateUserStatus = (userId: string, isActive: boolean) => {
    updateUserStatusMutation.mutate({ userId, isActive })
  }

  const handleCreateUser = (userData: CreateUserData) => {
    createUserMutation.mutate(userData)
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
      <SearchBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Role Management Section */}
      <PermissionGate permission="admin:update">
        <RoleManager onRoleUpdate={handleBulkRoleUpdate} users={users} />
      </PermissionGate>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">View Mode:</span>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {users.length} users found
        </div>
      </div>

      {/* Users List */}
      {viewMode === 'list' ? (
        <UserListView
          users={users}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          onEdit={handleEditUser}
          onView={handleViewUser}
        />
      ) : (
        <StaggerContainer>
          <div className="grid grid-cols-1 gap-4">
            {users.map((user) => (
              <StaggerItem key={user._id}>
                <UserCard
                  user={user}
                  onView={handleViewUser}
                  onEdit={handleEditUser}
                  onToggleStatus={handleUpdateUserStatus}
                />
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        onPageChange={setCurrentPage}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        user={selectedUser}
        onToggleStatus={handleUpdateUserStatus}
      />

      {/* Edit User Permissions Modal */}
      <UserEditModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        user={editingUser}
        onUpdateRole={handleUpdateUserRole}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateUser={handleCreateUser}
      />
    </div>
  )
}
