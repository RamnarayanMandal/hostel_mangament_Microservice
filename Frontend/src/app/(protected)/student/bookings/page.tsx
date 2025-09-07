"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Building2, 
  Bed, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Eye
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { useMyBookings, useCancelBooking, useCheckIn, useCheckOut } from '@/hooks/useBooking'
import { Booking } from '@/types'
import { showSuccess, showError } from '@/lib/sweetAlert'

export default function StudentBookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { data: bookingsData, isLoading, error, refetch } = useMyBookings()
  const cancelBookingMutation = useCancelBooking()
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  const bookings = bookingsData?.data || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'CONFIRMED': { label: 'Confirmed', color: 'bg-green-100 text-green-800' },
      'CANCELLED': { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      'COMPLETED': { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    ) : null
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'PAID': { label: 'Paid', color: 'bg-green-100 text-green-800' },
      'FAILED': { label: 'Failed', color: 'bg-red-100 text-red-800' },
      'REFUNDED': { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    ) : null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBookingMutation.mutateAsync(bookingId)
      refetch()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleCheckIn = async (bookingId: string) => {
    try {
      await checkInMutation.mutateAsync(bookingId)
      refetch()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleCheckOut = async (bookingId: string) => {
    try {
      await checkOutMutation.mutateAsync(bookingId)
      refetch()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

  const canCancel = (booking: Booking) => {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED'
  }

  const canCheckIn = (booking: Booking) => {
    return booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID'
  }

  const canCheckOut = (booking: Booking) => {
    return booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID'
  }

  return (
    <div className="space-y-6">
      <SlideUp>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600">Manage your hostel bookings and reservations</p>
        </div>
      </SlideUp>

      {isLoading ? (
        <FadeIn>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ) : error ? (
        <FadeIn>
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading bookings</h3>
              <p className="text-gray-600 mb-4">Failed to load your bookings. Please try again.</p>
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : bookings.length > 0 ? (
        <StaggerContainer>
          <div className="space-y-6">
            {bookings.map((booking: Booking) => (
              <StaggerItem key={booking._id}>
                <HoverLift>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <Building2 className="h-8 w-8 text-blue-600" />
                              <div>
                                <h3 className="text-lg font-semibold">Booking #{booking._id.slice(-8)}</h3>
                                <p className="text-sm text-gray-600">Room {booking.roomId}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(booking.status)}
                              {getPaymentStatusBadge(booking.paymentStatus)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">Check-in</p>
                                <p className="text-sm text-gray-600">{formatDate(booking.checkInDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">Check-out</p>
                                <p className="text-sm text-gray-600">{formatDate(booking.checkOutDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">Total Amount</p>
                                <p className="text-sm text-gray-600">₹{booking.totalAmount}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>Created on {formatDate(booking.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(booking)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              
                              {canCancel(booking) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking._id)}
                                  disabled={cancelBookingMutation.isPending}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}

                              {canCheckIn(booking) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCheckIn(booking._id)}
                                  disabled={checkInMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Check In
                                </Button>
                              )}

                              {canCheckOut(booking) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCheckOut(booking._id)}
                                  disabled={checkOutMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Check Out
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      ) : (
        <FadeIn>
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-6">You haven't made any hostel bookings yet.</p>
              <Button onClick={() => window.location.href = '/hostels'}>
                Browse Hostels
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FadeIn>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>
                  Complete information about your booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Booking Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booking ID:</span>
                        <span className="font-medium">#{selectedBooking._id.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedBooking.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">₹{selectedBooking.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Dates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in:</span>
                        <span className="font-medium">{formatDate(selectedBooking.checkInDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-medium">{formatDate(selectedBooking.checkOutDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatDate(selectedBooking.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Updated:</span>
                        <span className="font-medium">{formatDate(selectedBooking.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-2">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {canCancel(selectedBooking) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleCancelBooking(selectedBooking._id)
                          setShowDetailsModal(false)
                        }}
                        disabled={cancelBookingMutation.isPending}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel Booking
                      </Button>
                    )}

                    {canCheckIn(selectedBooking) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          handleCheckIn(selectedBooking._id)
                          setShowDetailsModal(false)
                        }}
                        disabled={checkInMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Check In
                      </Button>
                    )}

                    {canCheckOut(selectedBooking) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          handleCheckOut(selectedBooking._id)
                          setShowDetailsModal(false)
                        }}
                        disabled={checkOutMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Check Out
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
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


