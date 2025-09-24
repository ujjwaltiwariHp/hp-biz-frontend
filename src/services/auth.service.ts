import { apiClient } from '@/lib/api';
import { LoginCredentials, AuthResponse } from '@/lib/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/super-admin/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/super-admin/profile');
    return response.data;
  },
};