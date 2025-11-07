import { apiClient } from '@/lib/api';
import { BillingSettings, UpdateBillingSettingsPayload } from '@/types/billing';

const BILLING_URL = '/super-admin/billing-settings';

export const billingService = {
  getBillingSettings: async (): Promise<BillingSettings> => {
    const response = await apiClient.get<{ data: { settings: BillingSettings } }>(BILLING_URL);
    return response.data.data.settings;
  },

  updateBillingSettings: async (data: UpdateBillingSettingsPayload): Promise<BillingSettings> => {
    const response = await apiClient.put<{ data: { settings: BillingSettings } }>(BILLING_URL, data);
    return response.data.data.settings;
  },
};