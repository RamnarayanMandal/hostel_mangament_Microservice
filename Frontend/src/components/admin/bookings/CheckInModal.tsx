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
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Booking } from '@/types/booking'

interface CheckInModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onCheckIn: (params: { 
    id: string
    checkInData: { roomCondition: string; notes?: string }
  }) => Promise<any>
}

export default function CheckInModal({ booking, isOpen, onClose, onCheckIn }: CheckInModalProps) {
  const [roomCondition, setRoomCondition] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onCheckIn({
        id: booking._id,
        checkInData: {
          roomCondition,
          notes: notes || undefined,
        }
      })
      onClose()
      // Reset form
      setRoomCondition('')
      setNotes('')
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
          <DialogTitle>Check-in Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomCondition">Room Condition</Label>
            <Select value={roomCondition} onValueChange={setRoomCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Select room condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCELLENT">Excellent</SelectItem>
                <SelectItem value="GOOD">Good</SelectItem>
                <SelectItem value="FAIR">Fair</SelectItem>
                <SelectItem value="POOR">Poor</SelectItem>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about the check-in..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !roomCondition}>
              {isLoading ? 'Checking In...' : 'Check In'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
