import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostelService } from '@/service/hostelService'
import { showSuccess, showError } from '@/lib/sweetAlert'

// Query keys
export const hostelKeys = {
  all: ['hostels'] as const,
  lists: () => [...hostelKeys.all, 'list'] as const,
  list: (filters: any) => [...hostelKeys.lists(), filters] as const,
  details: () => [...hostelKeys.all, 'detail'] as const,
  detail: (id: string) => [...hostelKeys.details(), id] as const,
  rooms: (hostelId: string) => [...hostelKeys.all, 'rooms', hostelId] as const,
  availableRooms: (hostelId: string) => [...hostelKeys.all, 'available-rooms', hostelId] as const,
  beds: (roomId: string) => [...hostelKeys.all, 'beds', roomId] as const,
  availableBeds: (roomId: string) => [...hostelKeys.all, 'available-beds', roomId] as const,
}

// Hooks for fetching data
export const useHostels = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: hostelKeys.list(params),
    queryFn: () => hostelService.getHostels(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useHostelById = (id: string) => {
  return useQuery({
    queryKey: hostelKeys.detail(id),
    queryFn: () => hostelService.getHostelById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useSearchHostels = (query: string) => {
  return useQuery({
    queryKey: hostelKeys.list({ search: query }),
    queryFn: () => hostelService.searchHostels(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useHostelsByCampus = (campus: string) => {
  return useQuery({
    queryKey: hostelKeys.list({ campus }),
    queryFn: () => hostelService.getHostelsByCampus(campus),
    enabled: !!campus,
    staleTime: 5 * 60 * 1000,
  })
}

export const useHostelsByAmenity = (amenity: string) => {
  return useQuery({
    queryKey: hostelKeys.list({ amenity }),
    queryFn: () => hostelService.getHostelsByAmenity(amenity),
    enabled: !!amenity,
    staleTime: 5 * 60 * 1000,
  })
}

export const useRoomsByHostel = (hostelId: string) => {
  return useQuery({
    queryKey: hostelKeys.rooms(hostelId),
    queryFn: () => hostelService.getRoomsByHostel(hostelId),
    enabled: !!hostelId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export const useAvailableRooms = (hostelId: string) => {
  return useQuery({
    queryKey: hostelKeys.availableRooms(hostelId),
    queryFn: () => hostelService.getAvailableRooms(hostelId),
    enabled: !!hostelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useRoomById = (id: string) => {
  return useQuery({
    queryKey: hostelKeys.detail(id),
    queryFn: () => hostelService.getRoomById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  })
}

export const useBedsByRoom = (roomId: string) => {
  return useQuery({
    queryKey: hostelKeys.beds(roomId),
    queryFn: () => hostelService.getBedsByRoom(roomId),
    enabled: !!roomId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useAvailableBeds = (roomId: string) => {
  return useQuery({
    queryKey: hostelKeys.availableBeds(roomId),
    queryFn: () => hostelService.getAvailableBeds(roomId),
    enabled: !!roomId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useBedById = (id: string) => {
  return useQuery({
    queryKey: hostelKeys.detail(id),
    queryFn: () => hostelService.getBedById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

// Hooks for mutations
export const useCreateHostel = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: hostelService.createHostel,
    onSuccess: (data) => {
      showSuccess('Success', 'Hostel created successfully!')
      queryClient.invalidateQueries({ queryKey: hostelKeys.lists() })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to create hostel')
    },
  })
}

export const useUpdateHostel = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hostelService.updateHostel(id, data),
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Hostel updated successfully!')
      queryClient.invalidateQueries({ queryKey: hostelKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: hostelKeys.lists() })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to update hostel')
    },
  })
}

export const useCreateRoom = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: hostelService.createRoom,
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Room created successfully!')
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms(variables.hostelId) })
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableRooms(variables.hostelId) })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to create room')
    },
  })
}

export const useUpdateRoom = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hostelService.updateRoom(id, data),
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Room updated successfully!')
      queryClient.invalidateQueries({ queryKey: hostelKeys.detail(variables.id) })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to update room')
    },
  })
}

export const useHoldBed = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bedId, data }: { bedId: string; data: any }) => hostelService.holdBed(bedId, data),
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Bed held successfully!')
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableBeds(variables.bedId) })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to hold bed')
    },
  })
}

export const useAllocateBed = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bedId, data }: { bedId: string; data: any }) => hostelService.allocateBed(bedId, data),
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Bed allocated successfully!')
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableBeds(variables.bedId) })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to allocate bed')
    },
  })
}

export const useReleaseBed = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (bedId: string) => hostelService.releaseBed(bedId),
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Bed released successfully!')
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableBeds(variables) })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to release bed')
    },
  })
}
