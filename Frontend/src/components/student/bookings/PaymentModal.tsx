"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Booking, formatCurrency } from '@/types/booking'

interface PaymentModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onPayment: (params: { 
    id: string
    paymentData: { amount: number; paymentMethod: string; transactionId?: string }
  }) => Promise<any>
}

export default function PaymentModal({ booking, isOpen, onClose, onPayment }: PaymentModalProps) {
  const [amount, setAmount] = useState(booking.amountDue.toString())
  const [paymentMethod, setPaymentMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onPayment({
        id: booking._id,
        paymentData: {
          amount: parseFloat(amount),
          paymentMethod,
          transactionId: transactionId || undefined,
        }
      })
      onClose()
      // Reset form
      setAmount(booking.amountDue.toString())
      setPaymentMethod('')
      setTransactionId('')
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(booking.totalAmount, booking.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(booking.amountPaid, booking.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Amount Due:</span>
                  <span className="text-red-600">{formatCurrency(booking.amountDue, booking.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                max={booking.amountDue}
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {formatCurrency(booking.amountDue, booking.currency)}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="ONLINE">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID if available"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !amount || !paymentMethod}>
                {isLoading ? 'Processing...' : 'Make Payment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
