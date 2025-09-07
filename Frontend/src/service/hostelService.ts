import axiosClient from '@/lib/axiosClient'
import {
  Hostel,
  Room,
  CreateHostelRequest,
  UpdateHostelRequest,
  CreateRoomRequest,
  CreateBookingRequest,
  CreateComplaintRequest,
  CreateMaintenanceRequest,
  CreateNoticeRequest
} from '@/types'

// Hostel Service
export const hostelService = {
  // Hostel Management
  getHostels: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Hostel[]; total: number; page: number; limit: number }> => {
    const response = await axiosClient.get('/hostels', { params })
    return response.data
  },

  getHostelById: async (id: string): Promise<{ data: Hostel }> => {
    const response = await axiosClient.get(`/hostels/${id}`)
    return response.data
  },

  searchHostels: async (query: string): Promise<{ data: Hostel[] }> => {
    const response = await axiosClient.get('/hostels/search', { params: { q: query } })
    return response.data
  },

  getHostelsByCampus: async (campus: string): Promise<{ data: Hostel[] }> => {
    const response = await axiosClient.get(`/hostels/campus/${campus}`)
    return response.data
  },

  getHostelsByAmenity: async (amenity: string): Promise<{ data: Hostel[] }> => {
    const response = await axiosClient.get(`/hostels/amenity/${amenity}`)
    return response.data
  },

  createHostel: async (hostelData: CreateHostelRequest): Promise<{ data: Hostel }> => {
    const response = await axiosClient.post('/hostels', hostelData)
    return response.data
  },

  updateHostel: async (id: string, hostelData: UpdateHostelRequest): Promise<{ data: Hostel }> => {
    const response = await axiosClient.patch(`/hostels/${id}`, hostelData)
    return response.data
  },

  // Room Management
  getRoomsByHostel: async (hostelId: string): Promise<{ data: Room[] }> => {
    const response = await axiosClient.get(`/hostels/${hostelId}/rooms`)
    return response.data
  },

  getAvailableRooms: async (hostelId: string): Promise<{ data: Room[] }> => {
    const response = await axiosClient.get(`/hostels/${hostelId}/rooms/available`)
    return response.data
  },

  getRoomById: async (id: string): Promise<{ data: Room }> => {
    const response = await axiosClient.get(`/hostels/rooms/${id}`)
    return response.data
  },

  createRoom: async (roomData: CreateRoomRequest): Promise<{ data: Room }> => {
    const response = await axiosClient.post('/hostels/rooms', roomData)
    return response.data
  },

  updateRoom: async (id: string, roomData: Partial<CreateRoomRequest>): Promise<{ data: Room }> => {
    const response = await axiosClient.patch(`/hostels/rooms/${id}`, roomData)
    return response.data
  },

  // Bed Management
  getBedsByRoom: async (roomId: string): Promise<{ data: any[] }> => {
    const response = await axiosClient.get(`/hostels/rooms/${roomId}/beds`)
    return response.data
  },

  getAvailableBeds: async (roomId: string): Promise<{ data: any[] }> => {
    const response = await axiosClient.get(`/hostels/rooms/${roomId}/beds/available`)
    return response.data
  },

  getBedById: async (id: string): Promise<{ data: any }> => {
    const response = await axiosClient.get(`/hostels/beds/${id}`)
    return response.data
  },

  // Bed Operations
  holdBed: async (bedId: string, data: { userId: string; duration?: number }): Promise<{ data: any }> => {
    const response = await axiosClient.post(`/hostels/beds/${bedId}/hold`, data)
    return response.data
  },

  allocateBed: async (bedId: string, data: { userId: string }): Promise<{ data: any }> => {
    const response = await axiosClient.post(`/hostels/beds/${bedId}/allocate`, data)
    return response.data
  },

  releaseBed: async (bedId: string): Promise<{ data: any }> => {
    const response = await axiosClient.post(`/hostels/beds/${bedId}/release`)
    return response.data
  },

  // Statistics
  getBedStatistics: async (roomId: string): Promise<{ data: any }> => {
    const response = await axiosClient.get(`/hostels/rooms/${roomId}/bed-statistics`)
    return response.data
  },

  getHostelBedStatistics: async (hostelId: string): Promise<{ data: any }> => {
    const response = await axiosClient.get(`/hostels/${hostelId}/bed-statistics`)
    return response.data
  }
}

export default hostelService
