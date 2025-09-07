import axiosClient from '@/lib/axiosClient'
import { Booking, CreateBookingRequest } from '@/types'

// Booking Service
export const bookingService = {
  // Get all bookings for current user
  getMyBookings: async (): Promise<{ data: Booking[] }> => {
    const response = await axiosClient.get('/bookings')
    return response.data
  },

  // Get booking by ID
  getBookingById: async (id: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.get(`/bookings/${id}`)
    return response.data
  },

  // Create new booking
  createBooking: async (bookingData: CreateBookingRequest): Promise<{ data: Booking }> => {
    const response = await axiosClient.post('/bookings', bookingData)
    return response.data
  },

  // Confirm booking
  confirmBooking: async (id: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/confirm`)
    return response.data
  },

  // Cancel booking
  cancelBooking: async (id: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/cancel`)
    return response.data
  },

  // Check in
  checkIn: async (id: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/checkin`)
    return response.data
  },

  // Check out
  checkOut: async (id: string): Promise<{ data: Booking }> => {
    const response = await axiosClient.post(`/bookings/${id}/checkout`)
    return response.data
  },

  // Get booking history
  getBookingHistory: async (params?: { page?: number; limit?: number }): Promise<{ data: Booking[]; total: number; page: number; limit: number }> => {
    const response = await axiosClient.get('/bookings/history', { params })
    return response.data
  }
}

export default bookingService
