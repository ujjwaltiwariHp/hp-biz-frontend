import { apiClient } from '@/lib/api';
import { LoginCredentials, AuthResponse } from '@/lib/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/admin-auth/super-admin-login', credentials);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('auth-token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.admin));
      document.cookie = `auth-token=${response.data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    }

    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/admin-auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');

      // Clear cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      // Redirect to login
      window.location.href = '/auth/signin';
    }
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/admin-auth/get-profile');
    return response.data;
  },

  updateEmail: async (email: string) => {
    const response = await apiClient.put('/admin-auth/update-email', { email });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put('/admin-auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  createNewSuperAdmin: async (adminData: any) => {
    const response = await apiClient.post('/admin-auth/create-new-super-admin', adminData);
    return response.data;
  }
};