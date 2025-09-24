import { apiClient } from '@/lib/api';
import { Company, CompanyStats, DashboardStats } from '@/types/company';

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

export interface UsageReportFilters {
  startDate: string;
  endDate: string;
}

export interface SubscriptionUpdate {
  subscription_package_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
}

export const companyService = {
  getDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/super-admin/companies/dashboard');
    return response.data;
  },

  getCompanies: async (filters: CompanyFilters = {}): Promise<any> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const response = await apiClient.get(`/super-admin/companies?${params}`);
    return response.data;
  },

  getUsageReport: async (filters: UsageReportFilters): Promise<any> => {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/super-admin/companies/usage-report?${params}`);
    return response.data;
  },

  getCompany: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/super-admin/companies/${id}`);
    return response.data;
  },

  activateCompanyAccount: async (id: number): Promise<any> => {
    const response = await apiClient.put(`/super-admin/companies/${id}/activate`);
    return response.data;
  },

  deactivateCompanyAccount: async (id: number): Promise<any> => {
    const response = await apiClient.put(`/super-admin/companies/${id}/deactivate`);
    return response.data;
  },

  updateSubscription: async (id: number, subscriptionData: SubscriptionUpdate): Promise<any> => {
    const response = await apiClient.put(`/super-admin/companies/${id}/subscription`, subscriptionData);
    return response.data;
  },

  removeCompany: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/super-admin/companies/${id}`);
    return response.data;
  }
};