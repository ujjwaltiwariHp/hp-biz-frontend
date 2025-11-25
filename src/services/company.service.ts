import { apiClient } from '@/lib/api';
import {
  Company,
  CompanyStats,
  DashboardStats,
  DashboardResponse,
  CompaniesResponse,
  UsageReportResponse,
  CompanyResponse,
  CompanyActionResponse,
  DeleteCompanyResponse,
  CreateCompanyData,
  CreateCompanyResponse,
  SubscriptionUpdate,
} from '@/types/company';

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
}

export interface UsageReportFilters {
  startDate: string;
  endDate: string;
}

export const companyService = {
  getDashboard: async (startDate?: string, endDate?: string): Promise<DashboardResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get(`/super-admin/companies/dashboard?${params}`);
    return response.data;
  },

  getCompanies: async (filters: CompanyFilters = {}): Promise<CompaniesResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/super-admin/companies?${params}`);
    return response.data;
  },

  getUsageReport: async (filters: UsageReportFilters): Promise<UsageReportResponse> => {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/super-admin/companies/usage-report?${params}`);
    return response.data;
  },

  getCompany: async (id: number): Promise<CompanyResponse> => {
    const response = await apiClient.get(`/super-admin/companies/${id}`);
    return response.data;
  },

  createCompanyByAdmin: async (companyData: CreateCompanyData): Promise<CreateCompanyResponse> => {
    const response = await apiClient.post('/super-admin/companies/create', companyData);
    return response.data;
  },

  activateCompanyAccount: async (id: number): Promise<CompanyActionResponse> => {
    const response = await apiClient.put(`/super-admin/companies/${id}/activate`);
    return response.data;
  },

  deactivateCompanyAccount: async (id: number): Promise<CompanyActionResponse> => {
    const response = await apiClient.put(`/super-admin/companies/${id}/deactivate`);
    return response.data;
  },

  updateSubscription: async (id: number, subscriptionData: SubscriptionUpdate): Promise<CompanyActionResponse> => {
    const response = await apiClient.put(`/super-admin/companies/${id}/subscription`, subscriptionData);
    return response.data;
  },

  removeCompany: async (id: number): Promise<DeleteCompanyResponse> => {
    const response = await apiClient.delete(`/super-admin/companies/${id}`);
    return response.data;
  }
};