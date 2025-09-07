import { useState } from 'react';
import axiosClient from '@/lib/axiosClient';

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

interface StudentFilters {
  search?: string;
  course?: string;
  year?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface StudentsResponse {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useStudents = () => {
  const [loading, setLoading] = useState(false);

  const getAllStudents = async (filters: StudentFilters = {}): Promise<StudentsResponse> => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.course) params.append('course', filters.course);
      if (filters.year) params.append('year', filters.year);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await axiosClient.get(`/admin/students?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (studentData: Omit<Student, '_id' | 'createdAt'>): Promise<Student> => {
    try {
      setLoading(true);
      const response = await axiosClient.post('/admin/students', studentData);
      return response.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStudentById = async (studentId: string): Promise<Student> => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/admin/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async (studentId: string, updateData: Partial<Student>): Promise<Student> => {
    try {
      setLoading(true);
      const response = await axiosClient.patch(`/admin/students/${studentId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStudentStatus = async (studentId: string, isActive: boolean): Promise<Student> => {
    try {
      setLoading(true);
      const response = await axiosClient.patch(`/admin/students/${studentId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId: string): Promise<void> => {
    try {
      setLoading(true);
      await axiosClient.delete(`/admin/students/${studentId}`);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStudentByEnrollment = async (enrollmentNo: string): Promise<Student> => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/admin/students/enrollment/${enrollmentNo}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student by enrollment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getAllStudents,
    createStudent,
    getStudentById,
    updateStudent,
    updateStudentStatus,
    deleteStudent,
    getStudentByEnrollment
  };
};
