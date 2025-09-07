"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  MapPin,
  Phone,
  Mail,
  MoreHorizontal
} from 'lucide-react'
import { 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  FadeIn,
  SlideUp
} from '@/components/ui/motion'
import { useHostels, useCreateHostel, useUpdateHostel } from '@/hooks/useHostel'
import { Hostel } from '@/types'
import { showSuccess, showError } from '@/lib/sweetAlert'
import HostelModal from '@/components/hostels/HostelModal'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { usePermissions } from '@/hooks/usePermissions'

export default function AdminHostelsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null)
  const { canManageHostels, canManageStudents } = usePermissions()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    email: '',
    capacity: '',
    description: '',
    amenities: [] as string[]
  })

  const { data: hostelsData, isLoading, error, refetch } = useHostels({ search: searchQuery })
  const createHostelMutation = useCreateHostel()
  const updateHostelMutation = useUpdateHostel()

  const hostels = hostelsData?.data || []

  const amenities = [
    'WIFI', 'FOOD', 'TRANSPORT', 'SECURITY', 'LAUNDRY', 'GYM', 'LIBRARY', 'PARKING'
  ]

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

  const handleCreateHostel = async () => {
    try {
      await createHostelMutation.mutateAsync({
        ...formData,
        capacity: parseInt(formData.capacity)
      })
      setShowCreateModal(false)
      resetForm()
      refetch()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleUpdateHostel = async () => {
    if (!editingHostel) return
    
    try {
      await updateHostelMutation.mutateAsync({
        id: editingHostel._id,
        data: {
          ...formData,
          capacity: parseInt(formData.capacity)
        }
      })
      setEditingHostel(null)
      resetForm()
      refetch()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleEdit = (hostel: Hostel) => {
    setEditingHostel(hostel)
    setFormData({
      name: hostel.name,
      address: hostel.address,
      city: hostel.city,
      state: hostel.state,
      zipCode: hostel.zipCode,
      phoneNumber: hostel.phoneNumber,
      email: hostel.email,
      capacity: hostel.capacity.toString(),
      description: hostel.description || '',
      amenities: hostel.amenities
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phoneNumber: '',
      email: '',
      capacity: '',
      description: '',
      amenities: []
    })
  }

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  return (
    <div className="space-y-6">
      <SlideUp>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Hostels</h1>
            <p className="text-gray-600">Create, edit, and manage hostel properties</p>
          </div>
          <PermissionGate permission="hostels:create">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Hostel
            </Button>
          </PermissionGate>
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
            {hostels && hostels.length > 0 ? hostels.map((hostel: Hostel) => (
              <StaggerItem key={hostel._id}>
                <HoverLift>
                  <Card className="hover:shadow-lg transition-shadow">
                    <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-blue-600" />
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(hostel.status)}
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
                        <PermissionGate permission="hostels:update">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(hostel)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="hostels:read">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </PermissionGate>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            )) : (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hostels found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first hostel.</p>
                <PermissionGate permission="hostels:create">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Hostel
                  </Button>
                </PermissionGate>
              </div>
            )}
          </div>
        </StaggerContainer>
      )}

      {/* Create/Edit Modal */}
      <HostelModal
        showModal={showCreateModal || !!editingHostel}
        editingHostel={editingHostel}
        formData={formData}
        setFormData={setFormData}
        onClose={() => {
          setShowCreateModal(false)
          setEditingHostel(null)
          resetForm()
        }}
        onSubmit={editingHostel ? handleUpdateHostel : handleCreateHostel}
        isLoading={createHostelMutation.isPending || updateHostelMutation.isPending}
        amenities={amenities}
        toggleAmenity={toggleAmenity}
      />
    </div>
  )
}
