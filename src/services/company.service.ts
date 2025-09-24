import { apiClient } from '@/lib/api';
import { Company, DashboardStats } from '@/types/company';

export interface CompaniesResponse {
  success: boolean;
  data: {
    companies: Company[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface DashboardResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
  };
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

export const companyService = {
  // Dashboard stats
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get('/company-management/get-dashboard');
    return response.data;
  },

  // Get all companies with filters
  getCompanies: async (filters: CompanyFilters = {}): Promise<CompaniesResponse> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const response = await apiClient.get(`/company-management/get-all-companies?${params}`);
    return response.data;
  },

  // Get companies report
  getCompaniesReport: async (): Promise<any> => {
    const response = await apiClient.get('/company-management/get-companies-report');
    return response.data;
  },

  // Get company by ID
  getCompanyById: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/company-management/get-company-by-id/${id}`);
    return response.data;
  },

  // Activate company
  activateCompany: async (id: number): Promise<any> => {
    const response = await apiClient.put(`/company-management/activate-company/${id}`);
    return response.data;
  },

  // Deactivate company
  deactivateCompany: async (id: number): Promise<any> => {
    const response = await apiClient.put(`/company-management/deactivate-company/${id}`);
    return response.data;
  },

  // Give subscription to company
  giveSubscriptionToCompany: async (companyId: number, subscriptionData: any): Promise<any> => {
    const response = await apiClient.put(`/company-management/give-subscription-to-company/${companyId}`, subscriptionData);
    return response.data;
  },

  // Delete company
  deleteCompany: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/company-management/delete-company/${id}`);
    return response.data;
  },
};