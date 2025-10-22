// services/subscription.service.ts (Updated Content)

import { apiClient } from '@/lib/api';
import {
  PackagesResponse,
  PackageResponse,
  CreatePackageData,
  CreatePackageResponse,
  UpdatePackageData,
  UpdatePackageResponse,
  ToggleStatusResponse,
  DeletePackageResponse,
  SubscriptionPackage,
} from '@/types/subscription';

const BASE_URL = '/super-admin/subscriptions';

export interface PackageFilters {
  active_only?: boolean;
}

// Helper to ensure 'price' is a number
const normalizePackagePrice = (pkg: SubscriptionPackage): SubscriptionPackage => ({
    ...pkg,
    price: Number(pkg.price),
    max_staff_count: Number(pkg.max_staff_count),
    max_leads_per_month: Number(pkg.max_leads_per_month),
});


export const subscriptionService = {
  getPackages: async (filters: PackageFilters = {}): Promise<PackagesResponse> => {
    const params = new URLSearchParams();
    if (filters.active_only !== undefined) {
      params.append('active_only', filters.active_only.toString());
    }

    const response = await apiClient.get<PackagesResponse>(`${BASE_URL}?${params}`);

    // Normalize prices for all packages
    response.data.data.packages = response.data.data.packages.map(normalizePackagePrice);

    return response.data;
  },

  getPackageById: async (id: number): Promise<PackageResponse> => {
    const response = await apiClient.get<PackageResponse>(`${BASE_URL}/${id}`);

    // Normalize price for the single package
    response.data.data.package = normalizePackagePrice(response.data.data.package);

    return response.data;
  },

  createPackage: async (packageData: CreatePackageData): Promise<CreatePackageResponse> => {
    const response = await apiClient.post<CreatePackageResponse>(BASE_URL, packageData);
    return response.data;
  },

  updatePackage: async (id: number, packageData: UpdatePackageData): Promise<UpdatePackageResponse> => {
    const response = await apiClient.put<UpdatePackageResponse>(`${BASE_URL}/${id}`, packageData);
    return response.data;
  },

  toggleStatus: async (id: number): Promise<ToggleStatusResponse> => {
    const response = await apiClient.put<ToggleStatusResponse>(`${BASE_URL}/${id}/toggle-status`, {});
    return response.data;
  },

  removePackage: async (id: number): Promise<DeletePackageResponse> => {
    const response = await apiClient.delete<DeletePackageResponse>(`${BASE_URL}/${id}`);
    return response.data;
  }
};