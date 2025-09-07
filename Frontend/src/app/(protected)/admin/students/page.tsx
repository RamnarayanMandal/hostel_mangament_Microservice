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
import { Plus, Search, Edit, Trash2, Eye, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useStudents } from '@/hooks/useStudents';

interface Student {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  enrollmentNo: string;
  course: string;
  year: string;
  semester: string;
  address?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  createdAt: string;
}

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    enrollmentNo: '',
    course: '',
    year: '',
    semester: '',
    address: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: ''
  });

  const { 
    getAllStudents, 
    createStudent, 
    updateStudent, 
    deleteStudent, 
    updateStudentStatus 
  } = useStudents();

  useEffect(() => {
    loadStudents();
  }, [searchTerm, courseFilter, yearFilter, statusFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllStudents({
        search: searchTerm,
        course: courseFilter,
        year: yearFilter,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      });
      setStudents(response.students || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    try {
      await createStudent(formData);
      toast.success('Student created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadStudents();
    } catch (error) {
      toast.error('Failed to create student');
    }
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      await updateStudent(selectedStudent._id, formData);
      toast.success('Student updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadStudents();
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await deleteStudent(studentId);
      toast.success('Student deleted successfully');
      loadStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleStatusToggle = async (studentId: string, currentStatus: boolean) => {
    try {
      await updateStudentStatus(studentId, !currentStatus);
      toast.success('Student status updated successfully');
      loadStudents();
    } catch (error) {
      toast.error('Failed to update student status');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      enrollmentNo: '',
      course: '',
      year: '',
      semester: '',
      address: '',
      emergencyContact: '',
      dateOfBirth: '',
      gender: ''
    });
    setSelectedStudent(null);
  };

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone || '',
      enrollmentNo: student.enrollmentNo,
      course: student.course,
      year: student.year,
      semester: student.semester,
      address: student.address || '',
      emergencyContact: student.emergencyContact || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || ''
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const StudentForm = ({ isEdit = false }: { isEdit?: boolean }) => (
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
          <Label htmlFor="enrollmentNo">Enrollment Number *</Label>
          <Input
            id="enrollmentNo"
            value={formData.enrollmentNo}
            onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
            placeholder="Enter enrollment number"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="course">Course *</Label>
          <Input
            id="course"
            value={formData.course}
            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            placeholder="Enter course"
          />
        </div>
        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="Enter year"
          />
        </div>
        <div>
          <Label htmlFor="semester">Semester *</Label>
          <Input
            id="semester"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            placeholder="Enter semester"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>
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

      <div>
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input
          id="emergencyContact"
          value={formData.emergencyContact}
          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
          placeholder="Enter emergency contact"
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
        <Button onClick={isEdit ? handleUpdateStudent : handleCreateStudent}>
          {isEdit ? 'Update' : 'Create'} Student
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">Manage all students in the system</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Student</DialogTitle>
              <DialogDescription>
                Add a new student to the system
              </DialogDescription>
            </DialogHeader>
            <StudentForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>View and manage all students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Courses</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Information Technology">Information Technology</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                <SelectItem value="1st">1st Year</SelectItem>
                <SelectItem value="2nd">2nd Year</SelectItem>
                <SelectItem value="3rd">3rd Year</SelectItem>
                <SelectItem value="4th">4th Year</SelectItem>
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
                  <TableHead>Enrollment No</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.enrollmentNo}</TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell>{student.year}</TableCell>
                      <TableCell>
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(student)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusToggle(student._id, student.isActive)}
                          >
                            {student.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student._id)}
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
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          <StudentForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              View complete student information
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Enrollment Number</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.enrollmentNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Course</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.course}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Year</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Semester</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.semester}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.dateOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Gender</Label>
                  <p className="text-sm text-muted-foreground">{selectedStudent.gender || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground">{selectedStudent.address || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Emergency Contact</Label>
                <p className="text-sm text-muted-foreground">{selectedStudent.emergencyContact || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={selectedStudent.isActive ? "default" : "secondary"}>
                  {selectedStudent.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
