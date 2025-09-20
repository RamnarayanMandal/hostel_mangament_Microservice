"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  MapPin, 
  Users, 
  Star, 
  Wifi, 
  Utensils, 
  Car, 
  Shield,
  Filter,
  Building2,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { useHostels, useSearchHostels } from '@/hooks/useHostel'
import { Hostel } from '@/types'

export default function HostelsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAmenity, setSelectedAmenity] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Use both hooks but only use the appropriate one
  const searchResults = useSearchHostels(debouncedSearch)
  const hostelsResults = useHostels({ search: debouncedSearch })

  // Use appropriate query based on search
  const { data: hostelsData, isLoading, error } = debouncedSearch ? searchResults : hostelsResults
  const hostels = hostelsData?.data || []

  // Filter hostels based on selected filters
  const filteredHostels = hostels.filter((hostel: Hostel) => {
    if (selectedAmenity && !hostel.amenities.includes(selectedAmenity)) {
      return false
    }
    if (selectedStatus) {
      const hostelStatus = hostel.isActive ? 'ACTIVE' : 'INACTIVE'
      if (hostelStatus !== selectedStatus) {
        return false
      }
    }
    return true
  })

  const amenities = [
    { key: 'WIFI', label: 'WiFi', icon: Wifi },
    { key: 'FOOD', label: 'Food', icon: Utensils },
    { key: 'TRANSPORT', label: 'Transport', icon: Car },
    { key: 'SECURITY', label: 'Security', icon: Shield },
  ]

  const statuses = [
    { key: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
    { key: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { key: 'MAINTENANCE', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  ]

  const getAmenityIcon = (amenity: string) => {
    const amenityData = amenities.find(a => a.key === amenity)
    return amenityData ? amenityData.icon : Building2
  }

  const getStatusBadge = (status: string) => {
    const statusData = statuses.find(s => s.key === status)
    return statusData ? (
      <Badge className={statusData.color}>
        {statusData.label}
      </Badge>
    ) : null
  }

  const handleHostelClick = (hostelId: string) => {
    router.push(`/hostels/${hostelId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <SlideUp className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <HoverLift>
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">HostelHub</span>
              </div>
            </HoverLift>
            
            <div className="flex items-center space-x-4">
              <HoverLift>
                <Button variant="outline" onClick={() => router.push('/auth/login')}>
                  Login
                </Button>
              </HoverLift>
              <HoverLift>
                <Button onClick={() => router.push('/auth/signup')} className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
                  Get Started
                </Button>
              </HoverLift>
            </div>
          </div>
        </div>
      </SlideUp>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <FadeIn className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Hostel
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover comfortable and affordable student accommodation with modern amenities
          </p>
        </FadeIn>

        {/* Search and Filters */}
        <FadeIn className="mb-8">
          <Card className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search hostels by name, location, or amenities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                {/* Amenity Filter */}
                <select
                  value={selectedAmenity}
                  onChange={(e) => setSelectedAmenity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Amenities</option>
                  {amenities.map((amenity) => (
                    <option key={amenity.key} value={amenity.key}>
                      {amenity.label}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {statuses.map((status) => (
                    <option key={status.key} value={status.key}>
                      {status.label}
                    </option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(selectedAmenity || selectedStatus) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAmenity('')
                      setSelectedStatus('')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Results */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoading ? 'Loading...' : `${filteredHostels.length} Hostels Found`}
            </h2>
            {error && (
              <p className="text-red-600">Error loading hostels. Please try again.</p>
            )}
          </div>

          {/* Hostels Grid */}
          {isLoading ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <StaggerItem key={index}>
                  <Card className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : filteredHostels.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHostels.map((hostel: Hostel) => (
                <StaggerItem key={hostel._id}>
                  <HoverLift>
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 h-full"
                      onClick={() => handleHostelClick(hostel._id)}
                    >
                      {/* Hostel Image */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-blue-600" />
                        {getStatusBadge(hostel.isActive ? 'ACTIVE' : 'INACTIVE')}
                      </div>

                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-2">{hostel.name}</CardTitle>
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">{hostel.campus || `${hostel.city || ''}, ${hostel.state || ''}`}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Capacity Info */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{hostel.occupied || 0}/{hostel.capacity} occupied</span>
                          </div>
                          <div className="text-green-600 font-medium">
                            {hostel.available || hostel.capacity} available
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-2">
                          {hostel.amenities.slice(0, 3).map((amenity, index) => {
                            const Icon = getAmenityIcon(amenity)
                            return (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Icon className="h-3 w-3 mr-1" />
                                {amenity}
                              </Badge>
                            )
                          })}
                          {hostel.amenities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{hostel.amenities.length - 3} more
                            </Badge>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{hostel.contactInfo?.phone || hostel.phoneNumber}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>{hostel.contactInfo?.email || hostel.email}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHostelClick(hostel._id)
                          }}
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <FadeIn>
              <Card className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hostels found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedAmenity || selectedStatus 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No hostels are currently available.'
                  }
                </p>
                {(searchQuery || selectedAmenity || selectedStatus) && (
                  <Button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedAmenity('')
                      setSelectedStatus('')
                    }}
                    variant="outline"
                  >
                    Clear All Filters
                  </Button>
                )}
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  )
}
