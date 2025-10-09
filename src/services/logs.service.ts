import { apiClient } from '@/lib/api';
import { LogFilters, LogsResponse } from '@/types/logs';

export const logsService = {
  // Get all company activity logs (cross-company view)
  getAllActivityLogs: async (filters: LogFilters = {}): Promise<LogsResponse> => {
    const params = new URLSearchParams();

    if (filters.company_id !== undefined) {
      params.append('company_id', filters.company_id === null ? 'null' : filters.company_id.toString());
    }
    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/super-admin/logs/activity?${params}`);
    return response.data;
  },

  // Get activity logs for a specific company
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

  // Get all system logs
  getAllSystemLogs: async (filters: LogFilters = {}): Promise<LogsResponse> => {
    const params = new URLSearchParams();

    if (filters.company_id !== undefined) {
      params.append('company_id', filters.company_id === null ? 'null' : filters.company_id.toString());
    }
    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());
    if (filters.log_level) params.append('log_level', filters.log_level);
    if (filters.log_category) params.append('log_category', filters.log_category);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/super-admin/logs/system?${params}`);
    return response.data;
  },

  // Export logs as CSV
  exportLogs: async (type: 'activity' | 'system', filters: LogFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('type', type);

    if (filters.company_id !== undefined) {
      params.append('company_id', filters.company_id === null ? 'null' : filters.company_id.toString());
    }
    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await apiClient.get(`/super-admin/logs/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};