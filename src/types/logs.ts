export interface ActivityLog {
  id: number;
  staff_id: number | null;
  company_id: number | null;
  super_admin_id: number | null;
  action_type: string;
  resource_type: string;
  resource_id: number | null;
  action_details: string;
  ip_address: string;
  created_at: string;
  user_name: string;
  email: string;
  company_name: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
}

export interface SystemLog {
  id: number;
  company_id: number | null;
  staff_id: number | null;
  super_admin_id: number | null;
  log_level: string;
  log_category: string;
  message: string;
  ip_address: string;
  created_at: string;
  user_name: string;
  email: string;
  company_name: string;
}

export interface LogFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'activity' | 'system';
  start_date?: string | Date;
  end_date?: string | Date;
  company_id?: number | null;
  staff_id?: number;
  super_admin_id?: number;
  action_type?: string;
  resource_type?: string;
  log_level?: string;
  ip_address?: string;
  log_category?: string;
}

export interface LogsPagination {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LogsData {
  logs: ActivityLog[] | SystemLog[];
  pagination: LogsPagination;
}

export interface LogsResponse {
  success: boolean;
  message: string;
  data: LogsData;
  meta?: {
    timezone: string;
    timezone_abbr: string;
  };
}