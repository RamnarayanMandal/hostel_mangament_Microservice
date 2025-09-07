import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '@/lib/axiosClient'

export interface User {
  _id: string
  fullName: string
  email: string
  phone?: string
  role: 'STUDENT' | 'ADMIN' | 'STAFF' | 'SUPER_ADMIN' | 'HOSTEL_ADMIN' | 'ACCOUNTANT'
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  profilePicture?: string
  gender?: 'male' | 'female' | 'other'
}

export interface UsersResponse {
  success: boolean
  data: {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
  message: string
}

export interface UpdateUserRoleRequest {
  userId: string
  role: string
}

export interface UpdateUserStatusRequest {
  userId: string
  isActive: boolean
}

export interface CreateUserRequest {
  fullName: string
  email: string
  phone?: string
  role: string
  password: string
}

// Fetch all users
export const useUsers = (params?: {
  search?: string
  role?: string
  page?: number
  limit?: number
  isActive?: boolean
}) => {
  return useQuery<UsersResponse>({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await axiosClient.get('/admin/users', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch single user
export const useUser = (userId: string) => {
  return useQuery<User>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await axiosClient.get(`/admin/users/${userId}`)
      return response.data.data
    },
    enabled: !!userId,
  })
}

// Create user
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userData: CreateUserRequest) => {
      const response = await axiosClient.post('/admin/users', userData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, role }: UpdateUserRoleRequest) => {
      const response = await axiosClient.patch(`/admin/users/${userId}/role`, { role })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
    },
  })
}

// Update user status
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, isActive }: UpdateUserStatusRequest) => {
      const response = await axiosClient.patch(`/admin/users/${userId}/status`, { isActive })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
    },
  })
}

// Bulk update user roles
export const useBulkUpdateUserRoles = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: Array<{ userId: string; role: string }>) => {
      const response = await axiosClient.patch('/admin/users/bulk-roles', { updates })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosClient.delete(`/admin/users/${userId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
