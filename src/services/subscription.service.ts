import { apiClient } from '@/lib/api';
import {
  SubscriptionPackage,
  CreatePackageData,
  UpdatePackageData
} from '@/types/subscription';

export interface PackageFilters {
  active_only?: boolean;
}

export const subscriptionService = {
  getPackages: async (filters: PackageFilters = {}): Promise<any> => {
    const params = new URLSearchParams();
    if (filters.active_only !== undefined) {
      params.append('active_only', filters.active_only.toString());
    }

    const response = await apiClient.get(`/super-admin/subscriptions?${params}`);
    return response.data;
  },

  getPackageById: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/super-admin/subscriptions/${id}`);
    return response.data;
  },

  createPackage: async (packageData: CreatePackageData): Promise<any> => {
    const response = await apiClient.post('/super-admin/subscriptions', packageData);
    return response.data;
  },

  updatePackage: async (id: number, packageData: UpdatePackageData): Promise<any> => {
    const response = await apiClient.put(`/super-admin/subscriptions/${id}`, packageData);
    return response.data;
  },

  toggleStatus: async (id: number): Promise<any> => {
    const response = await apiClient.put(`/super-admin/subscriptions/${id}/toggle-status`);
    return response.data;
  },

  removePackage: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/super-admin/subscriptions/${id}`);
    return response.data;
  }
};