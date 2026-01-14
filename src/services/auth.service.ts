import { apiClient } from '@/lib/api';
import { setAuthToken, removeAuthToken } from '@/lib/auth';
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
    const response = await apiClient.post<AuthResponse>(
      '/super-admin/auth/login',
      credentials
    );

    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('superAdmin', JSON.stringify(response.data.data.superAdmin));
      }
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
    if (response.data.success && typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('superAdmin');
      if (currentUser) {
        const parsed = JSON.parse(currentUser);
        localStorage.setItem('superAdmin', JSON.stringify({ ...parsed, ...response.data.data }));
      }
    }
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
    if (!response.data.success) {
      throw { response: { data: response.data } }; // Throw object structure matching axios error
    }
    return response.data;
  },

  toggleAdminStatus: async (adminId: number): Promise<ToggleStatusResponse> => {
    const response = await apiClient.put(`/super-admin/auth/toggle-status/${adminId}`, {});
    if (!response.data.success) {
      throw { response: { data: response.data } };
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/super-admin/auth/logout');
    } catch (error) {
      console.error("Logout API call failed", error);
    } finally {
      removeAuthToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('superAdmin');
      }
      window.location.href = '/auth/signin';
    }
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('superAdmin');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }
};