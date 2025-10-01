export interface Company {
  id: number;
  unique_company_id: string;
  company_name: string;
  admin_email: string;
  admin_name: string;
  phone: string;
  address: string;
  website: string;
  industry: string;
  company_size: string;
  subscription_start_date: string;
  subscription_end_date: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  package_name: string;
  package_price: number;
  duration_type: string;
}

export interface CompanyStats {
  total_staff: number;
  total_leads: number;
  leads_this_month: number;
  total_activities: number;
}

export interface DashboardStats {
  total_companies: number;
  active_companies: number;
  inactive_companies: number;
  new_companies_this_month: number;
}

export interface UsageReport {
  id: number;
  company_name: string;
  unique_company_id: string;
  package_name: string;
  staff_count: number;
  leads_count: number;
  activities_count: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CompaniesResponse {
  success: boolean;
  message: string;
  data: {
    companies: Company[];
    pagination: PaginationInfo;
  };
}

export interface CompanyResponse {
  success: boolean;
  message: string;
  data: {
    company: Company;
    stats: CompanyStats;
  };
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    stats: DashboardStats;
  };
}

export interface UsageReportResponse {
  success: boolean;
  message: string;
  data: {
    report: UsageReport[];
    period: {
      startDate: string;
      endDate: string;
    };
    summary: {
      totalCompanies: number;
      totalLeads: number;
      totalActivities: number;
    };
  };
}

export interface CompanyActionResponse {
  success: boolean;
  message: string;
  data: {
    company: Company;
  };
}

export interface DeleteCompanyResponse {
  success: boolean;
  message: string;
  data: {
    deletedCompany: {
      id: number;
      company_name: string;
      unique_company_id: string;
    };
  };
}