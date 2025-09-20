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
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { Booking } from '@/types/booking'

interface CheckOutModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onCheckOut: (params: { 
    id: string
    checkOutData: { roomCondition: string; damages?: string[]; notes?: string }
  }) => Promise<any>
}

export default function CheckOutModal({ booking, isOpen, onClose, onCheckOut }: CheckOutModalProps) {
  const [roomCondition, setRoomCondition] = useState('')
  const [damages, setDamages] = useState<string[]>([])
  const [newDamage, setNewDamage] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addDamage = () => {
    if (newDamage.trim() && !damages.includes(newDamage.trim())) {
      setDamages([...damages, newDamage.trim()])
      setNewDamage('')
    }
  }

  const removeDamage = (damage: string) => {
    setDamages(damages.filter(d => d !== damage))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onCheckOut({
        id: booking._id,
        checkOutData: {
          roomCondition,
          damages: damages.length > 0 ? damages : undefined,
          notes: notes || undefined,
        }
      })
      onClose()
      // Reset form
      setRoomCondition('')
      setDamages([])
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
          <DialogTitle>Check-out Student</DialogTitle>
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
            <Label htmlFor="damages">Damages (Optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newDamage}
                  onChange={(e) => setNewDamage(e.target.value)}
                  placeholder="Add damage description..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addDamage()
                    }
                  }}
                />
                <Button type="button" onClick={addDamage} size="sm">
                  Add
                </Button>
              </div>
              {damages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {damages.map((damage, index) => (
                    <Badge key={index} variant="destructive" className="flex items-center gap-1">
                      {damage}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeDamage(damage)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about the check-out..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !roomCondition}>
              {isLoading ? 'Checking Out...' : 'Check Out'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

