"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  Plus,
  Eye,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { 
  useBookingsByStudent,
  useCreateBooking,
  useCancelBooking,
  useAddPayment,
  useAddSpecialRequest,
  useAcceptTerms
} from '@/hooks/useBooking'
import { Booking, getBookingStatusConfig, getPaymentStatusConfig, formatCurrency, formatDate, canCancelBooking, isBookingOverdue } from '@/types/booking'
import { showSuccess, showError } from '@/lib/sweetAlert'
import BookingDetailsModal from '@/components/student/bookings/BookingDetailsModal'
import CreateBookingModal from '@/components/student/bookings/CreateBookingModal'
import PaymentModal from '@/components/student/bookings/PaymentModal'
import SpecialRequestModal from '@/components/student/bookings/SpecialRequestModal'

export default function StudentBookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSpecialRequestModal, setShowSpecialRequestModal] = useState(false)

  // Get current user ID (you'll need to implement this based on your auth system)
  const currentUserId = "current-user-id" // Replace with actual user ID

  // Queries
  const { data: bookingsData, isLoading, error, refetch } = useBookingsByStudent(currentUserId)

  // Mutations
  const createBookingMutation = useCreateBooking()
  const cancelBookingMutation = useCancelBooking()
  const addPaymentMutation = useAddPayment()
  const addSpecialRequestMutation = useAddSpecialRequest()
  const acceptTermsMutation = useAcceptTerms()

  const bookings = bookingsData?.data || []

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

  const handleCreateBooking = () => {
    setShowCreateModal(true)
  }

  const handlePayment = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowPaymentModal(true)
  }

  const handleSpecialRequest = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowSpecialRequestModal(true)
  }

  const handleCancelBooking = async (booking: Booking) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBookingMutation.mutateAsync({
          id: booking._id,
          reason: 'Cancelled by student'
        })
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  }

  const handleAcceptTerms = async (booking: Booking) => {
    try {
      await acceptTermsMutation.mutateAsync(booking._id)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const getStatusBadge = (status: string) => {
    const config = getBookingStatusConfig(status)
    return (
      <Badge className={config.color}>
        {config.icon} {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const config = getPaymentStatusConfig(status)
    return (
      <Badge className={config.color}>
        {config.icon} {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <SlideUp>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">Manage your hostel bookings and payments</p>
          </div>
          <Button 
            onClick={handleCreateBooking}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </SlideUp>

      {/* Quick Stats */}
      <StaggerContainer>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time bookings
                </p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bookings.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bookings.filter(b => b.paymentStatus === 'PENDING').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require payment
                </p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bookings.filter(b => isBookingOverdue(b)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {/* Bookings List */}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading bookings</h3>
              <p className="text-gray-600 mb-4">Failed to load your bookings. Please try again.</p>
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : bookings.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-4">You haven't made any bookings yet. Start by creating your first booking.</p>
              <Button onClick={handleCreateBooking}>
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer>
          <div className="space-y-4">
            {bookings.map((booking: Booking) => (
              <StaggerItem key={booking._id}>
                <HoverLift>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold">#{booking.bookingId}</h3>
                            {getStatusBadge(booking.status)}
                            {getPaymentStatusBadge(booking.paymentStatus)}
                            {isBookingOverdue(booking) && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Check-in:</span> {formatDate(booking.checkInDate)}
                            </div>
                            <div>
                              <span className="font-medium">Check-out:</span> {formatDate(booking.checkOutDate)}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {booking.duration} months
                            </div>
                            <div>
                              <span className="font-medium">Total Amount:</span> {formatCurrency(booking.totalAmount, booking.currency)}
                            </div>
                            <div>
                              <span className="font-medium">Amount Due:</span> {formatCurrency(booking.amountDue, booking.currency)}
                            </div>
                            <div>
                              <span className="font-medium">Due Date:</span> {formatDate(booking.dueDate)}
                            </div>
                          </div>

                          {/* Terms and Conditions */}
                          {!booking.terms.accepted && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 text-yellow-600 mr-2" />
                                  <span className="text-sm text-yellow-800">
                                    Terms and conditions not accepted
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptTerms(booking)}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  Accept Terms
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBooking(booking)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          
                          {booking.paymentStatus === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePayment(booking)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Make Payment
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSpecialRequest(booking)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Special Request
                          </Button>
                          
                          {canCancelBooking(booking) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel Booking
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      )}

      {/* Modals */}
      {selectedBooking && (
        <>
          <BookingDetailsModal
            booking={selectedBooking}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
          />
          
          <PaymentModal
            booking={selectedBooking}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onPayment={addPaymentMutation.mutateAsync}
          />
          
          <SpecialRequestModal
            booking={selectedBooking}
            isOpen={showSpecialRequestModal}
            onClose={() => setShowSpecialRequestModal(false)}
            onRequest={addSpecialRequestMutation.mutateAsync}
          />
        </>
      )}

      <CreateBookingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createBookingMutation.mutateAsync}
        studentId={currentUserId}
      />
    </div>
  )
}