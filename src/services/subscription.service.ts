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
  FeaturesResponse,
} from '@/types/subscription';

const BASE_URL = '/super-admin/subscriptions';

export interface PackageFilters {
  active_only?: boolean;
}

const formatOutgoingPackageData = (data: CreatePackageData | UpdatePackageData) => {
  const payload: any = { ...data };

  if (payload.price_monthly !== undefined) {
    payload.price_monthly = parseFloat(payload.price_monthly.toString());
  }
  if (payload.price_quarterly !== undefined) {
    payload.price_quarterly = parseFloat(payload.price_quarterly.toString());
  }
  if (payload.price_yearly !== undefined) {
    payload.price_yearly = parseFloat(payload.price_yearly.toString());
  }

  if (payload.max_staff_count !== undefined) {
    payload.max_staff_count = parseInt(payload.max_staff_count.toString(), 10);
  }
  if (payload.max_leads_per_month !== undefined) {
    payload.max_leads_per_month = parseInt(payload.max_leads_per_month.toString(), 10);
  }
  if (payload.max_custom_fields !== undefined) {
    payload.max_custom_fields = parseInt(payload.max_custom_fields.toString(), 10);
  }
  if (payload.yearly_discount_percent !== undefined) {
    payload.yearly_discount_percent = parseInt(payload.yearly_discount_percent.toString(), 10);
  }

  delete payload.price;
  delete payload.duration_type;

  return payload;
};

export const subscriptionService = {
  getFeatures: async (): Promise<FeaturesResponse> => {
    const response = await apiClient.get<FeaturesResponse>(`${BASE_URL}/features`);
    return response.data;
  },

  getPackages: async (filters: PackageFilters = {}): Promise<PackagesResponse> => {
    const params = new URLSearchParams();
    if (filters.active_only !== undefined) {
      params.append('active_only', filters.active_only.toString());
    }

    const response = await apiClient.get<PackagesResponse>(`${BASE_URL}?${params}`);
    return response.data;
  },

  getPackageById: async (id: number): Promise<PackageResponse> => {
    const response = await apiClient.get<PackageResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  createPackage: async (packageData: CreatePackageData): Promise<CreatePackageResponse> => {
    const payload = formatOutgoingPackageData(packageData);
    const response = await apiClient.post<CreatePackageResponse>(BASE_URL, payload);
    return response.data;
  },

  updatePackage: async (id: number, packageData: UpdatePackageData): Promise<UpdatePackageResponse> => {
    const payload = formatOutgoingPackageData(packageData);
    const response = await apiClient.put<UpdatePackageResponse>(`${BASE_URL}/${id}`, payload);
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