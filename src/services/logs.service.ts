import { apiClient } from '@/lib/api';
import { LogFilters, LogsResponse } from '@/types/logs';

export const logsService = {
  getLogs: async (filters: LogFilters): Promise<LogsResponse> => {
    const params = new URLSearchParams();

    // 1. Pagination
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    // 2. Identity Filters
    if (filters.company_id !== undefined) {
        // If explicitly null, we might be filtering for system/admin logs
        params.append('company_id', filters.company_id === null ? 'null' : filters.company_id.toString());
    }
    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());
    if (filters.super_admin_id) params.append('super_admin_id', filters.super_admin_id.toString());

    // 3. Date Handling (Fix for "1-2 day delay")
    // We ensure that if a string like "2023-11-24" is passed, we treat it as LOCAL start of day
    // and convert it to the ISO string the backend expects.
    if (filters.start_date) {
        const d = new Date(filters.start_date);
        // Reset to 00:00:00 local time if it looks like a plain date input
        if (typeof filters.start_date === 'string' && filters.start_date.length <= 10) {
            d.setHours(0, 0, 0, 0);
        }
        params.append('start_date', d.toISOString());
    }

    if (filters.end_date) {
        const d = new Date(filters.end_date);
        // Set to 23:59:59 local time to capture the full day
        if (typeof filters.end_date === 'string' && filters.end_date.length <= 10) {
            d.setHours(23, 59, 59, 999);
        }
        params.append('end_date', d.toISOString());
    }

    // 4. Other Filters
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.log_level) params.append('log_level', filters.log_level);

    // 5. Determine Context (Super Admin vs Company)
    let isSuperAdmin = false;
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('superAdmin');
        if (userStr) isSuperAdmin = true;
    }

    const logType = filters.type === 'system' ? 'system' : 'activity';
    const endpoint = isSuperAdmin
        ? `/super-admin/logs/${logType}`
        : `/logs/${logType}`;

    const response = await apiClient.get<LogsResponse>(endpoint, { params });
    return response.data;
  },

  exportLogs: async (filters: LogFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    // Re-apply filters for export...
    if (filters.start_date) params.append('start_date', new Date(filters.start_date).toISOString());
    if (filters.end_date) params.append('end_date', new Date(filters.end_date).toISOString());
    if (filters.type) params.append('type', filters.type);
    if (filters.company_id !== undefined) params.append('company_id', String(filters.company_id));

    let isSuperAdmin = false;
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('superAdmin');
        if (userStr) isSuperAdmin = true;
    }

    const endpoint = isSuperAdmin ? '/super-admin/logs/export' : '/logs/export';

    const response = await apiClient.get(endpoint, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};