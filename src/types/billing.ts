export interface BankDetails {
  bank_name: string;
  account_number: string;
  ifsc_code: string;
}

export interface BillingSettings {
  id: number;
  company_name: string;
  address: string;
  email: string;
  phone: string;
  tax_rate: number; // Stored as decimal (e.g., 0.05)
  currency: string;
  bank_details: BankDetails | null;
  qr_code_image_url: string | null;
  updated_at: string;
}

export interface UpdateBillingSettingsPayload {
  company_name?: string;
  address?: string;
  email?: string;
  phone?: string;
  tax_rate?: number;
  currency?: string;
  bank_details?: Partial<BankDetails>;
  qr_code_image_url?: string;
}