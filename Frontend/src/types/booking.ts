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

// Status configurations
export const BOOKING_STATUS_CONFIG = {
  HOLD: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-800', icon: '⏸️' },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-orange-100 text-orange-800', icon: '💳' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: '✅' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' },
  CHECKED_IN: { label: 'Checked In', color: 'bg-blue-100 text-blue-800', icon: '🏠' },
  CHECKED_OUT: { label: 'Checked Out', color: 'bg-gray-100 text-gray-800', icon: '🚪' },
}

export const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  PARTIAL: { label: 'Partial', color: 'bg-orange-100 text-orange-800', icon: '💰' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✅' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: '❌' },
  REFUNDED: { label: 'Refunded', color: 'bg-blue-100 text-blue-800', icon: '↩️' },
}

// Utility functions
export const getBookingStatusConfig = (status: string) => {
  return BOOKING_STATUS_CONFIG[status as keyof typeof BOOKING_STATUS_CONFIG] || 
         { label: status, color: 'bg-gray-100 text-gray-800', icon: '❓' }
}

export const getPaymentStatusConfig = (status: string) => {
  return PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG] || 
         { label: status, color: 'bg-gray-100 text-gray-800', icon: '❓' }
}

export const formatCurrency = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const isBookingActive = (booking: Booking) => {
  return ['CONFIRMED', 'CHECKED_IN'].includes(booking.status)
}

export const isBookingOverdue = (booking: Booking) => {
  return booking.paymentStatus !== 'COMPLETED' && new Date() > new Date(booking.dueDate)
}

export const canCancelBooking = (booking: Booking) => {
  return !booking.cancellation?.requestedAt && ['HOLD', 'PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status)
}

export const canCheckIn = (booking: Booking) => {
  return booking.status === 'CONFIRMED' && booking.paymentStatus === 'COMPLETED'
}

export const canCheckOut = (booking: Booking) => {
  return booking.status === 'CHECKED_IN'
}
