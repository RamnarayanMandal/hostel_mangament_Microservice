import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/service/bookingService'
import { showSuccess, showError } from '@/lib/sweetAlert'

// Query keys
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters: any) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  history: () => [...bookingKeys.all, 'history'] as const,
}

// Hooks for fetching data
export const useMyBookings = () => {
  return useQuery({
    queryKey: bookingKeys.lists(),
    queryFn: () => bookingService.getMyBookings(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useBookingById = (id: string) => {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useBookingHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => bookingService.getBookingHistory(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hooks for mutations
export const useCreateBooking = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (data) => {
      showSuccess('Success', 'Booking created successfully!')
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to create booking')
    },
  })
}

export const useConfirmBooking = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bookingService.confirmBooking,
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Booking confirmed successfully!')
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to confirm booking')
    },
  })
}

export const useCancelBooking = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bookingService.cancelBooking,
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Booking cancelled successfully!')
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to cancel booking')
    },
  })
}

export const useCheckIn = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bookingService.checkIn,
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Check-in completed successfully!')
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to check in')
    },
  })
}

export const useCheckOut = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bookingService.checkOut,
    onSuccess: (data, variables) => {
      showSuccess('Success', 'Check-out completed successfully!')
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
    onError: (error: any) => {
      showError('Error', error.message || 'Failed to check out')
    },
  })
}
