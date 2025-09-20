import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService, CreateBookingRequest, UpdateBookingRequest } from '@/service/bookingService'
import { showSuccess, showError } from '@/lib/sweetAlert'

// Query Keys
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...bookingKeys.lists(), { filters }] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  byStudent: (studentId: string) => [...bookingKeys.all, 'student', studentId] as const,
  byHostel: (hostelId: string) => [...bookingKeys.all, 'hostel', hostelId] as const,
  statistics: () => [...bookingKeys.all, 'statistics'] as const,
  overdue: () => [...bookingKeys.all, 'overdue'] as const,
  expired: () => [...bookingKeys.all, 'expired'] as const,
}

// Hooks for fetching bookings
export const useBookings = (params?: {
  page?: number
  limit?: number
  status?: string
  studentId?: string
  hostelId?: string
  roomId?: string
}) => {
  return useQuery({
    queryKey: bookingKeys.list(params || {}),
    queryFn: () => bookingService.getBookings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useBookingById = (id: string) => {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
  })
}

export const useBookingsByStudent = (studentId: string) => {
  return useQuery({
    queryKey: bookingKeys.byStudent(studentId),
    queryFn: () => bookingService.getBookingsByStudent(studentId),
    enabled: !!studentId,
  })
}

export const useBookingsByHostel = (hostelId: string) => {
  return useQuery({
    queryKey: bookingKeys.byHostel(hostelId),
    queryFn: () => bookingService.getBookingsByHostel(hostelId),
    enabled: !!hostelId,
  })
}

export const useBookingStatistics = () => {
  return useQuery({
    queryKey: bookingKeys.statistics(),
    queryFn: () => bookingService.getBookingStatistics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useOverdueBookings = () => {
  return useQuery({
    queryKey: bookingKeys.overdue(),
    queryFn: () => bookingService.getOverdueBookings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useExpiredBookings = () => {
  return useQuery({
    queryKey: bookingKeys.expired(),
    queryFn: () => bookingService.getExpiredBookings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hooks
export const useCreateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => bookingService.createBooking(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.statistics() })
      showSuccess('Success', 'Booking created successfully!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to create booking')
    },
  })
}

export const useUpdateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingRequest }) =>
      bookingService.updateBooking(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.statistics() })
      showSuccess('Success', 'Booking updated successfully!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to update booking')
    },
  })
}

export const useCancelBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingService.cancelBooking(id, reason),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.statistics() })
      showSuccess('Success', 'Booking cancelled successfully!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to cancel booking')
    },
  })
}

export const useCheckIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, checkInData }: { 
      id: string
      checkInData: { roomCondition: string; notes?: string }
    }) => bookingService.checkIn(id, checkInData),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.statistics() })
      showSuccess('Success', 'Check-in completed successfully!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to check in')
    },
  })
}

export const useCheckOut = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, checkOutData }: { 
      id: string
      checkOutData: { roomCondition: string; damages?: string[]; notes?: string }
    }) => bookingService.checkOut(id, checkOutData),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.statistics() })
      showSuccess('Success', 'Check-out completed successfully!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to check out')
    },
  })
}

export const useAddPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, paymentData }: { 
      id: string
      paymentData: { amount: number; paymentMethod: string; transactionId?: string }
    }) => bookingService.addPayment(id, paymentData),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      showSuccess('Success', 'Payment added successfully!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to add payment')
    },
  })
}

export const useAddSpecialRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, requestData }: { 
      id: string
      requestData: { type: string; description: string }
    }) => bookingService.addSpecialRequest(id, requestData),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      showSuccess('Success', 'Special request added successfully!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to add special request')
    },
  })
}

export const useAcceptTerms = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bookingService.acceptTerms(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      showSuccess('Success', 'Terms and conditions accepted!')
    },
    onError: (error: any) => {
      showError('Error', error.response?.data?.message || 'Failed to accept terms')
    },
  })
}