export interface SubscriptionPackage {
  id: number;
  name: string;
  duration_type: 'monthly' | 'yearly';
  price: number;
  features: string[];
  max_staff_count: number;
  max_leads_per_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePackageData {
  name: string;
  duration_type: 'monthly' | 'yearly';
  price: number;
  features: string[];
  max_staff_count: number;
  max_leads_per_month: number;
}