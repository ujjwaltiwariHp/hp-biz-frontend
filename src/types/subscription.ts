export type SubscriptionDurationType = 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'one_time';

export interface SubscriptionFeature {
  key: string;
  label: string;
  description: string;
  category: string;
}

export interface SubscriptionPackage {
  id: number;
  name: string;
  price_monthly: string;
  price_quarterly: string;
  price_yearly: string;
  yearly_discount_percent: number;
  currency: string;
  max_custom_fields: number;

  features: string[];
  max_staff_count: number;
  max_leads_per_month: number;
  is_active: boolean;

  is_trial: boolean;
  trial_duration_days: number;

  company_count: number;

  created_at: string;
  updated_at: string;
}

export interface CreatePackageData {
  name: string;
  price_monthly: string;
  price_quarterly: string;
  price_yearly: string;
  yearly_discount_percent: number;
  max_custom_fields: number;

  features: string[];
  max_staff_count: number;
  max_leads_per_month: number;
  is_active?: boolean;

  is_trial: boolean;
  trial_duration_days: number;
}

export interface UpdatePackageData {
  name?: string;
  price_monthly?: string;
  price_quarterly?: string;
  price_yearly?: string;
  yearly_discount_percent?: number;
  currency?: string;
  max_custom_fields?: number;

  features?: string[];
  max_staff_count?: number;
  max_leads_per_month?: number;
  is_active?: boolean;

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

export interface FeaturesResponse {
  success: boolean;
  message: string;
  data: {
    features: SubscriptionFeature[];
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