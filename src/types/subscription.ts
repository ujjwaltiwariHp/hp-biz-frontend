// types/subscription.ts (Updated Content)

export interface SubscriptionPackage {
  id: number;
  name: string;
  duration_type: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'one_time';
  price: number;
  features: string[];
  max_staff_count: number;
  max_leads_per_month: number;
  is_active: boolean;

  // New fields from backend enhancements
  is_trial: boolean;
  trial_duration_days: number;

  company_count: number;

  created_at: string;
  updated_at: string;
}

export interface CreatePackageData {
  name: string;
  duration_type: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'one_time';
  price: number;
  features: string[];
  max_staff_count: number;
  max_leads_per_month: number;
  is_active?: boolean;

  // New fields for creation
  is_trial: boolean;
  trial_duration_days: number;
}

export interface UpdatePackageData {
  name?: string;
  duration_type?: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'one_time';
  price?: number;
  features?: string[];
  max_staff_count?: number;
  max_leads_per_month?: number;
  is_active?: boolean;

  // New optional fields for update
  is_trial?: boolean;
  trial_duration_days?: number;
}


export interface PackagesResponse {
  success: boolean;
  message: string;
  data: {
    packages: SubscriptionPackage[];
  };
}

export interface PackageResponse {
  success: boolean;
  message: string;
  data: {
    package: SubscriptionPackage;
  };
}

export interface CreatePackageResponse {
  success: boolean;
  message: string;
  data: {
    package: SubscriptionPackage;
  };
}

export interface UpdatePackageResponse {
  success: boolean;
  message: string;
  data: {
    package: SubscriptionPackage;
  };
}

export interface ToggleStatusResponse {
  success: boolean;
  message: string;
  data: {
    package: SubscriptionPackage;
  };
}

export interface DeletePackageResponse {
  success: boolean;
  message: string;
  data: {
    deletedPackage: {
      id: number;
      name: string;
    };
  };
}