import { axiosClient } from '@/lib/axiosClient'

// Booking Types
export interface Booking {
  _id: string
  bookingId: string
  studentId: string
  hostelId: string
  roomId: string
  bedId?: string
  status: 'HOLD' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT'
  checkInDate: string
  checkOutDate: string
  duration: number
  totalAmount: number
  currency: string
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  amountDue: number
  amountPaid: number
  dueDate: string
  paymentHistory: PaymentHistory[]
  specialRequests: SpecialRequest[]
  documents: Document[]
  terms: {
    accepted: boolean
    version: string
  }
  cancellation?: {
    requestedAt: string
    requestedBy: string
    reason: string
    refundAmount: number
    refundStatus: string
  }
  checkIn?: {
    checkedInAt: string
    checkedInBy: string
    roomCondition: string
    notes: string
  }
  checkOut?: {
    checkedOutAt: string
    checkedOutBy: string
    roomCondition: string
    damages: string[]
    notes: string
  }
  createdAt: string
  updatedAt: string
}

export interface PaymentHistory {
  paymentId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status: string
  transactionId?: string
}

export interface SpecialRequest {
  type: string
  description: string
  status: string
  requestedAt: string
  processedAt?: string
  processedBy?: string
  notes?: string
}

export interface Document {
  type: string
  name: string
  url: string
  uploadedAt: string
  verified: boolean
  verifiedAt?: string
  verifiedBy?: string
}

export interface CreateBookingRequest {
  studentId: string
  hostelId: string
  roomId: string
  bedId?: string
  startDate: string
  endDate?: string
}

export interface UpdateBookingRequest {
  status?: 'HOLD' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT'
  startDate?: string
  endDate?: string
}

export interface BookingStatistics {
  totalBookings: number
  activeBookings: number
  pendingBookings: number
  cancelledBookings: number
  completedBookings: number
  totalRevenue: number
  monthlyRevenue: number
  occupancyRate: number
}

// Booking Service
export const bookingService = {
  // Create a new booking
  createBooking: async (data: CreateBookingRequest): Promise<{ data: Booking }> => {
    const response = await axiosClient.post('/bookings', data)
    return response.data
  },

  // Get all bookings with pagination and filters
  getBookings: async (params?: {
    page?: number
    limit?: number
    status?: string
    studentId?: string
    hostelId?: string
    roomId?: string
  }): Promise<{ data: Booking[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await axiosClient.get('/bookings', { params })
    return response.data
  },

  // Get booking by ID
  getBookingById: async (id: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.get(`/bookings/${id}`)
    return response.data
  },

  // Update booking
  updateBooking: async (id: string, data: UpdateBookingRequest): Promise<{ data: Booking }> => {
    const response = await axiosClient.patch(`/bookings/${id}`, data)
    return response.data
  },

  // Get bookings by student
  getBookingsByStudent: async (studentId: string): Promise<{ data: Booking[] }> => {
    const response = await axiosClient.get(`/bookings/student/${studentId}`)
    return response.data
  },

  // Get bookings by hostel
  getBookingsByHostel: async (hostelId: string): Promise<{ data: Booking[] }> => {
    const response = await axiosClient.get(`/bookings/hostel/${hostelId}`)
    return response.data
  },

  // Cancel booking
  cancelBooking: async (id: string, reason?: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/cancel`, { reason })
    return response.data
  },

  // Check in
  checkIn: async (id: string, checkInData: {
    roomCondition: string
    notes?: string
  }): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/check-in`, checkInData)
    return response.data
  },

  // Check out
  checkOut: async (id: string, checkOutData: {
    roomCondition: string
    damages?: string[]
    notes?: string
  }): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/check-out`, checkOutData)
    return response.data
  },

  // Add payment
  addPayment: async (id: string, paymentData: {
    amount: number
    paymentMethod: string
    transactionId?: string
  }): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/payments`, paymentData)
    return response.data
  },

  // Add special request
  addSpecialRequest: async (id: string, requestData: {
    type: string
    description: string
  }): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/special-requests`, requestData)
    return response.data
  },

  // Accept terms and conditions
  acceptTerms: async (id: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/accept-terms`)
    return response.data
  },

  // Get booking statistics (Admin only)
  getBookingStatistics: async (): Promise<{ data: BookingStatistics }> => {
    const response = await axiosClient.get('/statistics')
    return response.data
  },

  // Get overdue bookings (Staff only)
  getOverdueBookings: async (): Promise<{ data: Booking[] }> => {
    const response = await axiosClient.get('/overdue')
    return response.data
  },

  // Get expired bookings (Staff only)
  getExpiredBookings: async (): Promise<{ data: Booking[] }> => {
    const response = await axiosClient.get('/expired')
    return response.data
  }
}