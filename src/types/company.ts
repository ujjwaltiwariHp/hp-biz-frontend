//
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
  subscription_package_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  package_name: string;
  package_price: number | string;
  package_currency: string;
}

export interface CreateCompanyData {
  company_name: string;
  admin_email: string;
  admin_name: string;
  password: string;
  subscription_package_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  send_welcome_email?: boolean;
}

export interface CreateCompanyResponse {
  success: boolean;
  message: string;
  data: {
    company: {
      id: number;
      company_name: string;
      admin_email: string;
      created_at: string;
      subscription_package_id: number;
    };
  };
}

export interface CompanyStats {
  total_staff: number;
  total_leads: number;
  leads_this_month: number;
  total_activities: number;
}

export interface DashboardOverview {
  total_companies: number;
  active_companies: number;
  inactive_companies: number;
  new_companies_period: number;
}

export interface DashboardFinancials {
  total_revenue: string;
  mrr_estimate: string;
  currency: string;
}

export interface PackageDistributionItem {
  name: string;
  count: number;
  is_trial: boolean;
}

export interface DashboardPackages {
  distribution: PackageDistributionItem[];
  paid_vs_free: {
    paid: number;
    free: number;
  };
}

// Updated interface to match backend response (no ID returned in aggregate query)
export interface ActiveCompany {
  id?: number;
  company_name: string;
  activity_count: number;
}

export interface ExpiredCompany {
  company_name: string;
  admin_email: string;
  subscription_end_date: string;
}

export interface DashboardEngagement {
  top_active_companies: ActiveCompany[];
  recent_expiries: ExpiredCompany[];
}

export interface DashboardData {
  overview: DashboardOverview;
  financials: DashboardFinancials;
  packages: DashboardPackages;
  engagement: DashboardEngagement;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    dashboard: DashboardData;
  };
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

export interface SubscriptionUpdate {
  subscription_package_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
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