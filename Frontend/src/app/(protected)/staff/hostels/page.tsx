"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building2, 
  Search, 
  Eye,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { useHostels } from '@/hooks/useHostel'
import { Hostel } from '@/types'
import { PermissionGate } from '@/components/auth/PermissionGate'

export default function StaffHostelsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: hostelsData, isLoading, error, refetch } = useHostels({ search: searchQuery })
  const hostels = hostelsData?.data || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { label: 'Active', color: 'bg-green-100 text-green-800' },
      'INACTIVE': { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      'MAINTENANCE': { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    ) : null
  }

  const getOccupancyStatus = (occupied: number, capacity: number) => {
    const percentage = (occupied / capacity) * 100
    if (percentage >= 90) {
      return { label: 'Full', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    } else if (percentage >= 70) {
      return { label: 'Almost Full', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    } else {
      return { label: 'Available', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
  }

  return (
    <div className="space-y-6">
      <SlideUp>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hostel Management</h1>
            <p className="text-gray-600">View and manage hostel information</p>
          </div>
        </div>
      </SlideUp>

      {/* Search */}
      <FadeIn>
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search hostels by name, city, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Hostels List */}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading hostels</h3>
              <p className="text-gray-600 mb-4">Failed to load hostels. Please try again.</p>
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels && hostels.length > 0 ? hostels.map((hostel: Hostel) => {
              const occupancyStatus = getOccupancyStatus(hostel.occupied || 0, hostel.capacity)
              const StatusIcon = occupancyStatus.icon
              
              return (
                <StaggerItem key={hostel._id}>
                  <HoverLift>
                    <Card className="hover:shadow-lg transition-shadow">
                      <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-blue-600" />
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          {getStatusBadge(hostel.isActive ? 'ACTIVE' : 'INACTIVE')}
                          <Badge className={occupancyStatus.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {occupancyStatus.label}
                          </Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg">{hostel.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {hostel.city}, {hostel.state}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-gray-500" />
                            <span>{hostel.occupied}/{hostel.capacity}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="truncate">{hostel.phoneNumber}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-1" />
                          <span className="truncate">{hostel.email}</span>
                        </div>

                        {hostel.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {hostel.amenities.slice(0, 3).map((amenity, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {hostel.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{hostel.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <PermissionGate permission="hostels:read">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="bookings:read">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Bookings
                            </Button>
                          </PermissionGate>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </StaggerItem>
              )
            }) : (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hostels found</h3>
                <p className="text-gray-500 mb-4">No hostels are available at the moment.</p>
              </div>
            )}
          </div>
        </StaggerContainer>
      )}
    </div>
  )
}
