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
  const [viewingHostel, setViewingHostel] = useState<Hostel | null>(null)
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
      city: hostel.city || '',
      state: hostel.state || '',
      zipCode: hostel.zipCode || '',
      phoneNumber: hostel.contactInfo?.phone || hostel.phoneNumber || '',
      email: hostel.contactInfo?.email || hostel.email || '',
      capacity: hostel.capacity.toString(),
      description: hostel.description || '',
      amenities: hostel.amenities
    })
  }

  const handleView = (hostel: Hostel) => {
    setViewingHostel(hostel)
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
                        {getStatusBadge(hostel.isActive ? 'ACTIVE' : 'INACTIVE')}
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{hostel.name}</CardTitle>
                      <CardDescription className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {hostel.campus || `${hostel.city || ''}, ${hostel.state || ''}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Address */}
                      <div className="text-sm text-gray-600">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-500" />
                          <span className="text-xs">{hostel.address}</span>
                        </div>
                      </div>

                      {/* Capacity and Contact Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{hostel.occupied || 0}/{hostel.capacity}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="truncate text-xs">{hostel.contactInfo?.phone || hostel.phoneNumber || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-1" />
                        <span className="truncate text-xs">{hostel.contactInfo?.email || hostel.email || 'N/A'}</span>
                      </div>

                      {/* Description */}
                      {hostel.description && (
                        <div className="text-xs text-gray-500">
                          <p className="line-clamp-2">{hostel.description}</p>
                        </div>
                      )}

                      {/* Amenities */}
                      {hostel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {hostel.amenities.slice(0, 4).map((amenity, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {hostel.amenities.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{hostel.amenities.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="text-xs text-gray-500 border-t pt-2">
                        <div className="flex justify-between">
                          <span>ID: {hostel._id.slice(-8)}</span>
                          <span>Created: {new Date(hostel.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

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
                            onClick={() => handleView(hostel)}
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

      {/* View Modal */}
      {viewingHostel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FadeIn>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{viewingHostel.name}</CardTitle>
                    <CardDescription className="flex items-center mt-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {viewingHostel.campus || `${viewingHostel.city || ''}, ${viewingHostel.state || ''}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingHostel(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-sm">{viewingHostel.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <p className="text-sm">
                        <Badge className={viewingHostel.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {viewingHostel.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Capacity</label>
                      <p className="text-sm">{viewingHostel.occupied || 0}/{viewingHostel.capacity}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Available</label>
                      <p className="text-sm">{viewingHostel.available || viewingHostel.capacity}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Address Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-sm">{viewingHostel.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-sm">{viewingHostel.campus || `${viewingHostel.city || ''}, ${viewingHostel.state || ''}`}</p>
                    </div>
                    {viewingHostel.zipCode && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">ZIP Code</label>
                        <p className="text-sm">{viewingHostel.zipCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-sm">{viewingHostel.contactInfo?.phone || viewingHostel.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm">{viewingHostel.contactInfo?.email || viewingHostel.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {viewingHostel.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{viewingHostel.description}</p>
                  </div>
                )}

                {/* Amenities */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Amenities ({viewingHostel.amenities.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingHostel.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hostel ID</label>
                      <p className="text-sm font-mono">{viewingHostel._id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created Date</label>
                      <p className="text-sm">{new Date(viewingHostel.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-sm">{new Date(viewingHostel.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Occupancy Rate</label>
                      <p className="text-sm">{Math.round(((viewingHostel.occupied || 0) / viewingHostel.capacity) * 100)}%</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <PermissionGate permission="hostels:update">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewingHostel(null)
                        handleEdit(viewingHostel)
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Hostel
                    </Button>
                  </PermissionGate>
                  <Button
                    variant="outline"
                    onClick={() => setViewingHostel(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      )}
    </div>
  )
}
