export interface ActivityLog {
  id: number;
  company_id?: number | null;
  company_name?: string | null;
  staff_id?: number | null;
  user_type?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  action_type?: string;
  resource_type?: string;
  resource_id?: number | null;
  action_details?: string;
  ip_address?: string;
  created_at: string;
}

export interface SystemLog {
  id: number;
  company_id?: number | null;
  company_name?: string | null;
  staff_id?: number | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  log_level?: string;
  log_category?: string;
  message?: string;
  ip_address?: string;
  created_at: string;
}

export interface LogFilters {
  company_id?: number | null;
  staff_id?: number;
  action_type?: string;
  resource_type?: string;
  log_level?: string;
  log_category?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface LogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: (ActivityLog | SystemLog)[];
    pagination: {
      page: number;
      limit: number;
      total_records: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}