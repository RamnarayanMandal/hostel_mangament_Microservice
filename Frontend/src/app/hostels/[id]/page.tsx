"use client"

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Users, 
  Wifi, 
  Utensils, 
  Car, 
  Shield,
  Building2,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Star,
  Bed,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { useHostelById, useRoomsByHostel, useAvailableRooms } from '@/hooks/useHostel'
import { useCreateBooking } from '@/hooks/useBooking'
import { Room } from '@/types'
import { showSuccess, showError } from '@/lib/sweetAlert'

export default function HostelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const hostelId = params.id as string
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: ''
  })

  // Fetch hostel and room data
  const { data: hostelData, isLoading: hostelLoading, error: hostelError } = useHostelById(hostelId)
  const { data: roomsData, isLoading: roomsLoading } = useRoomsByHostel(hostelId)
  const { data: availableRoomsData } = useAvailableRooms(hostelId)
  
  const hostel = hostelData?.data
  const rooms = roomsData?.data || []
  const availableRooms = availableRoomsData?.data || []

  // Booking mutation
  const createBookingMutation = useCreateBooking()

  const amenities = [
    { key: 'WIFI', label: 'WiFi', icon: Wifi, color: 'text-blue-600' },
    { key: 'FOOD', label: 'Food', icon: Utensils, color: 'text-orange-600' },
    { key: 'TRANSPORT', label: 'Transport', icon: Car, color: 'text-green-600' },
    { key: 'SECURITY', label: 'Security', icon: Shield, color: 'text-red-600' },
  ]

  const getAmenityIcon = (amenity: string) => {
    const amenityData = amenities.find(a => a.key === amenity)
    return amenityData ? { icon: amenityData.icon, color: amenityData.color } : { icon: Building2, color: 'text-gray-600' }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'AVAILABLE': { label: 'Available', color: 'bg-green-100 text-green-800' },
      'OCCUPIED': { label: 'Occupied', color: 'bg-red-100 text-red-800' },
      'MAINTENANCE': { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
      'RESERVED': { label: 'Reserved', color: 'bg-blue-100 text-blue-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    ) : null
  }

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room)
    setShowBookingModal(true)
  }

  const handleBookingSubmit = async () => {
    if (!selectedRoom || !bookingDates.checkIn || !bookingDates.checkOut) {
      showError('Error', 'Please fill in all booking details')
      return
    }

    if (new Date(bookingDates.checkIn) >= new Date(bookingDates.checkOut)) {
      showError('Error', 'Check-out date must be after check-in date')
      return
    }

    try {
      await createBookingMutation.mutateAsync({
        hostelId,
        roomId: selectedRoom._id,
        checkInDate: bookingDates.checkIn,
        checkOutDate: bookingDates.checkOut,
      })
      
      setShowBookingModal(false)
      setSelectedRoom(null)
      setBookingDates({ checkIn: '', checkOut: '' })
      router.push('/student/bookings')
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  if (hostelLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hostel details...</p>
        </div>
      </div>
    )
  }

  if (hostelError || !hostel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hostel not found</h2>
          <p className="text-gray-600 mb-4">The hostel you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/hostels')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hostels
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <SlideUp className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <HoverLift>
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/hostels')}>
                <ArrowLeft className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Back to Hostels</span>
              </div>
            </HoverLift>
            
            <HoverLift>
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">HostelHub</span>
              </div>
            </HoverLift>
          </div>
        </div>
      </SlideUp>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaggerContainer>
          {/* Hostel Header */}
          <StaggerItem>
            <Card className="mb-8">
              <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                <Building2 className="h-24 w-24 text-blue-600" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{hostel.name}</CardTitle>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{hostel.address}, {hostel.campus || `${hostel.city || ''}, ${hostel.state || ''}`}</span>
                    </div>
                    {hostel.description && (
                      <p className="text-gray-600 mb-4">{hostel.description}</p>
                    )}
                    
                    {/* Additional hostel details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-gray-600">Capacity: <span className="font-semibold">{hostel.capacity}</span></span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-gray-600">Status: <span className="font-semibold capitalize">{hostel.isActive ? 'Active' : 'Inactive'}</span></span>
                      </div>
                      {hostel.contactInfo?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-gray-600">{hostel.contactInfo.phone}</span>
                        </div>
                      )}
                      {hostel.contactInfo?.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-gray-600">{hostel.contactInfo.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Occupied:</span>
                        <span className="font-semibold text-lg">{hostel.occupied || 0}/{hostel.capacity}</span>
                      </div>
                      <div className="text-green-600 font-medium text-center">
                        {hostel.available || hostel.capacity} available
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(((hostel.occupied || 0) / hostel.capacity) * 100)}% occupied
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </StaggerItem>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Amenities */}
              <StaggerItem>
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-500" />
                      Amenities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {hostel.amenities.map((amenity, index) => {
                        const { icon: Icon, color } = getAmenityIcon(amenity)
                        return (
                          <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <Icon className={`h-5 w-5 ${color}`} />
                            <span className="text-sm font-medium">{amenity}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Total Amenities:</strong> {hostel.amenities.length} facilities available
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              {/* Rooms */}
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Available Rooms</span>
                      <Badge variant="secondary">
                        {availableRooms.length} available
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Choose from our comfortable and well-maintained rooms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {roomsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="animate-pulse">
                            <div className="h-24 bg-gray-200 rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : rooms.length > 0 ? (
                      <div className="space-y-4">
                        {rooms.map((room: Room) => (
                          <HoverLift key={room._id}>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-2">
                                      <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
                                      {getStatusBadge(room.status)}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                                      <div className="flex items-center">
                                        <Bed className="h-4 w-4 mr-1" />
                                        <span>{room.type}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1" />
                                        <span>{room.occupied}/{room.capacity} occupied</span>
                                      </div>
                                      <div className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        <span>₹{room.price}/month</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Building2 className="h-4 w-4 mr-1" />
                                        <span>Floor {room.floor}</span>
                                      </div>
                                    </div>
                                    {room.amenities.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-4">
                                        {room.amenities.map((amenity, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {amenity}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <Button
                                      onClick={() => handleBookRoom(room)}
                                      disabled={room.status !== 'AVAILABLE'}
                                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                      {room.status === 'AVAILABLE' ? 'Book Now' : 'Not Available'}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </HoverLift>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms available</h3>
                        <p className="text-gray-600">All rooms are currently occupied or under maintenance.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <StaggerItem>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{hostel.contactInfo?.phone || hostel.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-gray-600">{hostel.contactInfo?.email || hostel.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Capacity</p>
                        <p className="text-sm text-gray-600">{hostel.capacity} students</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="text-sm text-gray-600 capitalize">{hostel.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                    {hostel.zipCode && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">ZIP Code</p>
                          <p className="text-sm text-gray-600">{hostel.zipCode}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Created</p>
                        <p className="text-sm text-gray-600">{new Date(hostel.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-gray-600">{new Date(hostel.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              {/* Additional Details Card */}
              <StaggerItem>
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hostel.description && (
                      <div>
                        <p className="font-medium mb-2">Description</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{hostel.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium mb-2">Full Address</p>
                      <p className="text-sm text-gray-600">
                        {hostel.address}<br />
                        {hostel.campus || `${hostel.city || ''}, ${hostel.state || ''}`}
                        {hostel.zipCode && <><br />{hostel.zipCode}</>}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Hostel ID</p>
                      <p className="text-sm text-gray-500 font-mono">{hostel._id}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </div>
        </StaggerContainer>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FadeIn>
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Book Room {selectedRoom.roomNumber}</CardTitle>
                <CardDescription>
                  Please select your check-in and check-out dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={bookingDates.checkIn}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={bookingDates.checkOut}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                    min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Monthly Rate:</span>
                    <span className="text-lg font-bold text-green-600">₹{selectedRoom.price}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBookingSubmit}
                    disabled={createBookingMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {createBookingMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      )}
    </div>
  )
}

