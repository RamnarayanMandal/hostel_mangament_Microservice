"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Calendar,
  DollarSign,
  User,
  Building2,
  Bed,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { Booking, getBookingStatusConfig, getPaymentStatusConfig, formatCurrency, formatDate, formatDateTime } from '@/types/booking'

interface BookingDetailsModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
}

export default function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  const statusConfig = getBookingStatusConfig(booking.status)
  const paymentStatusConfig = getPaymentStatusConfig(booking.paymentStatus)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Booking Details - #{booking.bookingId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Payment Status */}
          <div className="flex gap-4">
            <Badge className={statusConfig.color}>
              {statusConfig.icon} {statusConfig.label}
            </Badge>
            <Badge className={paymentStatusConfig.color}>
              {paymentStatusConfig.icon} {paymentStatusConfig.label}
            </Badge>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Student ID</label>
                  <p className="text-sm">{booking.studentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Hostel ID</label>
                  <p className="text-sm">{booking.hostelId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Room ID</label>
                  <p className="text-sm">{booking.roomId}</p>
                </div>
                {booking.bedId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bed ID</label>
                    <p className="text-sm">{booking.bedId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dates and Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dates & Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Check-in Date</label>
                  <p className="text-sm">{formatDate(booking.checkInDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Check-out Date</label>
                  <p className="text-sm">{formatDate(booking.checkOutDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-sm">{booking.duration} months</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Amount</label>
                  <p className="text-sm font-semibold">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                  <p className="text-sm">{formatCurrency(booking.amountPaid, booking.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount Due</label>
                  <p className="text-sm font-semibold text-red-600">{formatCurrency(booking.amountDue, booking.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <p className="text-sm">{formatDate(booking.dueDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {booking.paymentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.paymentHistory.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount, booking.currency)}</p>
                        <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDateTime(payment.paymentDate)}</p>
                        <Badge className={payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Requests */}
          {booking.specialRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Special Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.specialRequests.map((request, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{request.type}</p>
                          <p className="text-sm text-gray-600">{request.description}</p>
                        </div>
                        <Badge className={
                          request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Requested: {formatDateTime(request.requestedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-in Information */}
          {booking.checkIn && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Check-in Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Checked in at</label>
                    <p className="text-sm">{formatDateTime(booking.checkIn.checkedInAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Checked in by</label>
                    <p className="text-sm">{booking.checkIn.checkedInBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room Condition</label>
                    <p className="text-sm">{booking.checkIn.roomCondition}</p>
                  </div>
                  {booking.checkIn.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-sm">{booking.checkIn.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-out Information */}
          {booking.checkOut && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Check-out Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Checked out at</label>
                    <p className="text-sm">{formatDateTime(booking.checkOut.checkedOutAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Checked out by</label>
                    <p className="text-sm">{booking.checkOut.checkedOutBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room Condition</label>
                    <p className="text-sm">{booking.checkOut.roomCondition}</p>
                  </div>
                  {booking.checkOut.damages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Damages</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {booking.checkOut.damages.map((damage, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {damage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {booking.checkOut.notes && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-sm">{booking.checkOut.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Information */}
          {booking.cancellation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Cancellation Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Requested at</label>
                    <p className="text-sm">{formatDateTime(booking.cancellation.requestedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Requested by</label>
                    <p className="text-sm">{booking.cancellation.requestedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reason</label>
                    <p className="text-sm">{booking.cancellation.reason}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Refund Amount</label>
                    <p className="text-sm">{formatCurrency(booking.cancellation.refundAmount, booking.currency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Refund Status</label>
                    <Badge className={
                      booking.cancellation.refundStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      booking.cancellation.refundStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {booking.cancellation.refundStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Terms and Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {booking.terms.accepted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  Terms and conditions {booking.terms.accepted ? 'accepted' : 'not accepted'} 
                  (Version {booking.terms.version})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-sm">{formatDateTime(booking.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-sm">{formatDateTime(booking.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
