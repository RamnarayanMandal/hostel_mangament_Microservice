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
import { CreateBookingRequest } from '@/types/booking'

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateBookingRequest) => Promise<any>
  studentId: string
}

export default function CreateBookingModal({ isOpen, onClose, onCreate, studentId }: CreateBookingModalProps) {
  const [hostelId, setHostelId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [bedId, setBedId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onCreate({
        studentId,
        hostelId,
        roomId,
        bedId: bedId || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      })
      onClose()
      // Reset form
      setHostelId('')
      setRoomId('')
      setBedId('')
      setStartDate('')
      setEndDate('')
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
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="hostelId">Hostel</Label>
            <Select value={hostelId} onValueChange={setHostelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select hostel" />
              </SelectTrigger>
              <SelectContent>
                {/* You'll need to fetch and populate hostels here */}
                <SelectItem value="hostel1">Hostel A</SelectItem>
                <SelectItem value="hostel2">Hostel B</SelectItem>
                <SelectItem value="hostel3">Hostel C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="roomId">Room</Label>
            <Select value={roomId} onValueChange={setRoomId} disabled={!hostelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {/* You'll need to fetch and populate rooms based on selected hostel */}
                <SelectItem value="room1">Room 101</SelectItem>
                <SelectItem value="room2">Room 102</SelectItem>
                <SelectItem value="room3">Room 103</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bedId">Bed (Optional)</Label>
            <Select value={bedId} onValueChange={setBedId} disabled={!roomId}>
              <SelectTrigger>
                <SelectValue placeholder="Select bed" />
              </SelectTrigger>
              <SelectContent>
                {/* You'll need to fetch and populate beds based on selected room */}
                <SelectItem value="bed1">Bed 1</SelectItem>
                <SelectItem value="bed2">Bed 2</SelectItem>
                <SelectItem value="bed3">Bed 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate">Check-in Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">Check-out Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !hostelId || !roomId || !startDate}>
              {isLoading ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
