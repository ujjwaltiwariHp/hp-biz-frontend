import { apiClient } from '@/lib/api';
import {
  LoginCredentials,
  CreateAdminData,
  UpdateProfileData,
  ChangePasswordData,
  AuthResponse,
  ProfileResponse,
  AdminListResponse,
  RolesResponse,
  UpdateRolePermissionsData,
  DeleteAdminResponse,
  ToggleStatusResponse
} from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post(
      '/super-admin/auth/login',
      credentials,
      { withCredentials: true }
    );

    if (response.data.success && response.data.data.token) {
      document.cookie = `auth-token=${response.data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    }
    return response.data;
  },

  createAdmin: async (adminData: CreateAdminData): Promise<AuthResponse> => {
    const response = await apiClient.post('/super-admin/auth/create', adminData);
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get('/super-admin/auth/profile');
    return response.data;
  },

  getAllAdmins: async (): Promise<AdminListResponse> => {
    const response = await apiClient.get('/super-admin/auth/all');
    return response.data;
  },

  updateProfile: async (profileData: UpdateProfileData): Promise<ProfileResponse> => {
    const response = await apiClient.put('/super-admin/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: ChangePasswordData): Promise<ProfileResponse> => {
    const response = await apiClient.put('/super-admin/auth/change-password', passwordData);
    return response.data;
  },

  getRoles: async (): Promise<RolesResponse> => {
    const response = await apiClient.get('/super-admin/auth/roles');
    return response.data;
  },

  updateRolePermissions: async (roleId: number, permissionsData: UpdateRolePermissionsData): Promise<RolesResponse> => {
    const response = await apiClient.put(`/super-admin/auth/roles/${roleId}/permissions`, permissionsData);
    return response.data;
  },

  deleteAdmin: async (adminId: number): Promise<DeleteAdminResponse> => {
    const response = await apiClient.delete(`/super-admin/auth/delete/${adminId}`);
    return response.data;
  },

  toggleAdminStatus: async (adminId: number): Promise<ToggleStatusResponse> => {
    const response = await apiClient.put(`/super-admin/auth/toggle-status/${adminId}`);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/super-admin/auth/logout');
    } catch (error) {
    } finally {
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/auth/signin';
    }
  }
};
