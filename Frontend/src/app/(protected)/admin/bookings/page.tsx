"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Search, 
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { 
  useBookings, 
  useBookingStatistics,
  useOverdueBookings,
  useExpiredBookings,
  useUpdateBooking,
  useCancelBooking,
  useCheckIn,
  useCheckOut
} from '@/hooks/useBooking'
import { Booking, getBookingStatusConfig, getPaymentStatusConfig, formatCurrency, formatDate } from '@/types/booking'
import { showSuccess, showError } from '@/lib/sweetAlert'
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal'
import BookingStatusModal from '@/components/admin/bookings/BookingStatusModal'
import CheckInModal from '@/components/admin/bookings/CheckInModal'
import CheckOutModal from '@/components/admin/bookings/CheckOutModal'

export default function AdminBookingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showCheckOutModal, setShowCheckOutModal] = useState(false)

  // Queries
  const { data: bookingsData, isLoading, error, refetch } = useBookings({
    status: statusFilter || undefined,
    // Add more filters as needed
  })
  const { data: statisticsData } = useBookingStatistics()
  const { data: overdueData } = useOverdueBookings()
  const { data: expiredData } = useExpiredBookings()

  // Mutations
  const updateBookingMutation = useUpdateBooking()
  const cancelBookingMutation = useCancelBooking()
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  const bookings = bookingsData?.data || []
  const statistics = statisticsData?.data
  const overdueBookings = overdueData?.data || []
  const expiredBookings = expiredData?.data || []

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

  const handleUpdateStatus = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowStatusModal(true)
  }

  const handleCheckIn = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowCheckInModal(true)
  }

  const handleCheckOut = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowCheckOutModal(true)
  }

  const handleCancelBooking = async (booking: Booking) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBookingMutation.mutateAsync({
          id: booking._id,
          reason: 'Cancelled by admin'
        })
      } catch (error) {
        // Error is handled by the mutation
      }
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
            <p className="text-gray-600">View and manage all hostel bookings</p>
          </div>
        </div>
      </SlideUp>

      {/* Statistics Cards */}
      {statistics && (
        <StaggerContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.activeBookings} active
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(statistics.monthlyRevenue)} this month
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.occupancyRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Current occupancy
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overdueBookings.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </StaggerContainer>
      )}

      {/* Search and Filters */}
      <FadeIn>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search bookings by ID, student name, or hostel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="HOLD">On Hold</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                </select>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Payment Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Bookings List */}
      {isLoading ? (
        <FadeIn>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
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
              <p className="text-gray-600 mb-4">Failed to load bookings. Please try again.</p>
              <Button onClick={() => refetch()}>
                Retry
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
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Student ID:</span> {booking.studentId}
                            </div>
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
                              <span className="font-medium">Total Amount:</span> {formatCurrency(booking.totalAmount)}
                            </div>
                            <div>
                              <span className="font-medium">Amount Due:</span> {formatCurrency(booking.amountDue)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBooking(booking)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(booking)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                          
                          {booking.status === 'CONFIRMED' && booking.paymentStatus === 'COMPLETED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckIn(booking)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Check In
                            </Button>
                          )}
                          
                          {booking.status === 'CHECKED_IN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckOut(booking)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Check Out
                            </Button>
                          )}
                          
                          {['HOLD', 'PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
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
          
          <BookingStatusModal
            booking={selectedBooking}
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            onUpdate={updateBookingMutation.mutateAsync}
          />
          
          <CheckInModal
            booking={selectedBooking}
            isOpen={showCheckInModal}
            onClose={() => setShowCheckInModal(false)}
            onCheckIn={checkInMutation.mutateAsync}
          />
          
          <CheckOutModal
            booking={selectedBooking}
            isOpen={showCheckOutModal}
            onClose={() => setShowCheckOutModal(false)}
            onCheckOut={checkOutMutation.mutateAsync}
          />
        </>
      )}
    </div>
  )
}

