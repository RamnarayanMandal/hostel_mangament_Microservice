'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useStaff } from '@/hooks/useStaff';

interface Staff {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  employeeId: string;
  department: string;
  position: string;
  salary?: number;
  hireDate?: string;
  address?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  gender?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
}

const StaffPage = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    position: '',
    salary: '',
    hireDate: '',
    address: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: ''
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const availablePermissions = [
    'user_management',
    'student_management',
    'staff_management',
    'hostel_management',
    'booking_management',
    'payment_management',
    'report_generation',
    'system_settings'
  ];

  const { 
    getAllStaff, 
    createStaff, 
    updateStaff, 
    deleteStaff, 
    updateStaffStatus,
    updateStaffPermissions
  } = useStaff();

  useEffect(() => {
    loadStaff();
  }, [searchTerm, departmentFilter, positionFilter, statusFilter]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const response = await getAllStaff({
        search: searchTerm,
        department: departmentFilter,
        position: positionFilter,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      });
      setStaff(response.staff || []);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    try {
      await createStaff({ 
        ...formData, 
        isActive: true,
        salary: formData.salary ? Number(formData.salary) : undefined
      });
      toast.success('Staff created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadStaff();
    } catch (error) {
      toast.error('Failed to create staff');
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      await updateStaff(selectedStaff._id, formData);
      toast.success('Staff updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadStaff();
    } catch (error) {
      toast.error('Failed to update staff');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await deleteStaff(staffId);
      toast.success('Staff deleted successfully');
      loadStaff();
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  const handleStatusToggle = async (staffId: string, currentStatus: boolean) => {
    try {
      await updateStaffStatus(staffId, !currentStatus);
      toast.success('Staff status updated successfully');
      loadStaff();
    } catch (error) {
      toast.error('Failed to update staff status');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedStaff) return;
    
    try {
      await updateStaffPermissions(selectedStaff._id, selectedPermissions);
      toast.success('Staff permissions updated successfully');
      setIsPermissionsDialogOpen(false);
      loadStaff();
    } catch (error) {
      toast.error('Failed to update staff permissions');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      employeeId: '',
      department: '',
      position: '',
      salary: '',
      hireDate: '',
      address: '',
      emergencyContact: '',
      dateOfBirth: '',
      gender: ''
    });
    setSelectedStaff(null);
    setSelectedPermissions([]);
  };

  const openEditDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setFormData({
      fullName: staffMember.fullName,
      email: staffMember.email,
      phone: staffMember.phone || '',
      employeeId: staffMember.employeeId,
      department: staffMember.department,
      position: staffMember.position,
      salary: staffMember.salary?.toString() || '',
      hireDate: staffMember.hireDate || '',
      address: staffMember.address || '',
      emergencyContact: staffMember.emergencyContact || '',
      dateOfBirth: staffMember.dateOfBirth || '',
      gender: staffMember.gender || ''
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsViewDialogOpen(true);
  };

  const openPermissionsDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setSelectedPermissions(staffMember.permissions || []);
    setIsPermissionsDialogOpen(true);
  };

  const StaffForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Enter full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <Label htmlFor="employeeId">Employee ID *</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            placeholder="Enter employee ID"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="Enter department"
          />
        </div>
        <div>
          <Label htmlFor="position">Position *</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Enter position"
          />
        </div>
        <div>
          <Label htmlFor="salary">Salary</Label>
          <Input
            id="salary"
            type="number"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            placeholder="Enter salary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hireDate">Hire Date</Label>
          <Input
            id="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input
            id="emergencyContact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            placeholder="Enter emergency contact"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter address"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdateStaff : handleCreateStaff}>
          {isEdit ? 'Update' : 'Create'} Staff
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage all staff members in the system</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new staff member to the system
              </DialogDescription>
            </DialogHeader>
            <StaffForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>View and manage all staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Housekeeping">Housekeeping</SelectItem>
              </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Positions</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Technician">Technician</SelectItem>
                <SelectItem value="Guard">Guard</SelectItem>
                <SelectItem value="Cleaner">Cleaner</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading staff...
                    </TableCell>
                  </TableRow>
                ) : staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No staff found
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((staffMember) => (
                    <TableRow key={staffMember._id}>
                      <TableCell className="font-medium">{staffMember.fullName}</TableCell>
                      <TableCell>{staffMember.email}</TableCell>
                      <TableCell>{staffMember.employeeId}</TableCell>
                      <TableCell>{staffMember.department}</TableCell>
                      <TableCell>{staffMember.position}</TableCell>
                      <TableCell>
                        <Badge variant={staffMember.isActive ? "default" : "secondary"}>
                          {staffMember.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(staffMember)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(staffMember)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPermissionsDialog(staffMember)}
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusToggle(staffMember._id, staffMember.isActive)}
                          >
                            {staffMember.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStaff(staffMember._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information
            </DialogDescription>
          </DialogHeader>
          <StaffForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Member Details</DialogTitle>
            <DialogDescription>
              View complete staff member information
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Employee ID</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.employeeId}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Position</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.position}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Salary</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.salary ? `$${selectedStaff.salary}` : 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Hire Date</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.hireDate || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <p className="text-sm text-muted-foreground">{selectedStaff.dateOfBirth || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground">{selectedStaff.address || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Emergency Contact</Label>
                <p className="text-sm text-muted-foreground">{selectedStaff.emergencyContact || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={selectedStaff.isActive ? "default" : "secondary"}>
                  {selectedStaff.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Set permissions for {selectedStaff?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {availablePermissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission}
                    checked={selectedPermissions.includes(permission)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPermissions([...selectedPermissions, permission]);
                      } else {
                        setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                      }
                    }}
                  />
                  <Label htmlFor={permission} className="text-sm">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePermissions}>
                Update Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;
