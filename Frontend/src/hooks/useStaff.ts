import { useState } from 'react';
import axiosClient from '@/lib/axiosClient';

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

interface StaffFilters {
  search?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface StaffResponse {
  staff: Staff[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const useStaff = () => {
  const [loading, setLoading] = useState(false);

  const getAllStaff = async (filters: StaffFilters = {}): Promise<StaffResponse> => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.department) params.append('department', filters.department);
      if (filters.position) params.append('position', filters.position);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await axiosClient.get(`/admin/staff?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async (staffData: Omit<Staff, '_id' | 'createdAt'>): Promise<Staff> => {
    try {
      setLoading(true);
      const response = await axiosClient.post('/admin/staff', staffData);
      return response.data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStaffById = async (staffId: string): Promise<Staff> => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/admin/staff/${staffId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStaff = async (staffId: string, updateData: Partial<Staff>): Promise<Staff> => {
    try {
      setLoading(true);
      const response = await axiosClient.patch(`/admin/staff/${staffId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStaffStatus = async (staffId: string, isActive: boolean): Promise<Staff> => {
    try {
      setLoading(true);
      const response = await axiosClient.patch(`/admin/staff/${staffId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error updating staff status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStaffPermissions = async (staffId: string, permissions: string[]): Promise<Staff> => {
    try {
      setLoading(true);
      const response = await axiosClient.patch(`/admin/staff/${staffId}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      console.error('Error updating staff permissions:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (staffId: string): Promise<void> => {
    try {
      setLoading(true);
      await axiosClient.delete(`/admin/staff/${staffId}`);
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStaffByEmployeeId = async (employeeId: string): Promise<Staff> => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/admin/staff/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff by employee ID:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getAllStaff,
    createStaff,
    getStaffById,
    updateStaff,
    updateStaffStatus,
    updateStaffPermissions,
    deleteStaff,
    getStaffByEmployeeId
  };
};
