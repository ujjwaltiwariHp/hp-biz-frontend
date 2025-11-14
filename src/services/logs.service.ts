import { apiClient } from '@/lib/api';
import { LogFilters, LogsResponse } from '@/types/logs';

export const logsService = {
  // Centralized function to fetch either activity or system logs for the main page
  getLogs: async (type: 'activity' | 'system', filters: LogFilters = {}): Promise<LogsResponse> => {
    const params = new URLSearchParams();

    if (filters.company_id !== undefined) {
      params.append('company_id', filters.company_id === null ? 'null' : filters.company_id.toString());
    }
    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());

    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.log_level) params.append('log_level', filters.log_level);
    if (filters.log_category) params.append('log_category', filters.log_category);

    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/super-admin/logs/${type}?${params}`);
    return response.data;
  },

  // Retained for company detail pages
  getCompanyActivityLogs: async (companyId: number, filters: LogFilters = {}): Promise<LogsResponse> => {
    const params = new URLSearchParams();

    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/super-admin/logs/company/${companyId}/activity?${params}`);
    return response.data;
  },

  exportLogs: async (type: 'activity' | 'system', filters: LogFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('type', type);

    if (filters.company_id !== undefined) {
      params.append('company_id', filters.company_id === null ? 'null' : filters.company_id.toString());
    }
    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.log_level) params.append('log_level', filters.log_level);
    if (filters.log_category) params.append('log_category', filters.log_category);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await apiClient.get(`/super-admin/logs/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};