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
    // Backend returns { data: { hostels: [...], total: 1, page: 1, limit: 10, totalPages: 1 } }
    // We need to transform it to { data: [...], total: 1, page: 1, limit: 10 }
    const backendData = response.data.data
    return {
      data: backendData.hostels,
      total: backendData.total,
      page: backendData.page,
      limit: backendData.limit
    }
  },

  getHostelById: async (id: string): Promise<{ data: Hostel }> => {
    const response = await axiosClient.get(`/hostels/${id}`)
    return response.data
  },

  searchHostels: async (query: string): Promise<{ data: Hostel[] }> => {
    const response = await axiosClient.get('/hostels/search', { params: { q: query } })
    // Backend returns { data: [...] } for search
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
    // Transform frontend data to backend format
    const transformedData = {
      name: hostelData.name,
      campus: `${hostelData.city}, ${hostelData.state}`, // Combine city and state as campus
      address: hostelData.address,
      contactInfo: {
        phone: hostelData.phoneNumber,
        email: hostelData.email
      },
      capacity: hostelData.capacity,
      amenities: hostelData.amenities,
      description: hostelData.description
    }
    
    const response = await axiosClient.post('/hostels', transformedData)
    return response.data
  },

  updateHostel: async (id: string, hostelData: UpdateHostelRequest): Promise<{ data: Hostel }> => {
    // Transform frontend data to backend format
    const transformedData: any = {}
    
    if (hostelData.name) transformedData.name = hostelData.name
    if (hostelData.address) transformedData.address = hostelData.address
    if (hostelData.city && hostelData.state) {
      transformedData.campus = `${hostelData.city}, ${hostelData.state}`
    }
    if (hostelData.phoneNumber || hostelData.email) {
      transformedData.contactInfo = {}
      if (hostelData.phoneNumber) transformedData.contactInfo.phone = hostelData.phoneNumber
      if (hostelData.email) transformedData.contactInfo.email = hostelData.email
    }
    if (hostelData.capacity) transformedData.capacity = hostelData.capacity
    if (hostelData.amenities) transformedData.amenities = hostelData.amenities
    if (hostelData.description !== undefined) transformedData.description = hostelData.description
    
    const response = await axiosClient.patch(`/hostels/${id}`, transformedData)
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
