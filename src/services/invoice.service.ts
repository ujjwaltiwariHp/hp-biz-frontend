import { apiClient } from '@/lib/api';
import {
  Invoice,
  InvoiceListResponse,
  MarkPaymentReceivedData,
  ApproveRejectData
} from '@/types/invoice';

const INVOICE_URL = '/super-admin/invoices';
const COMPANY_URL = '/super-admin/companies';

export const invoiceService = {
  getAllInvoices: async (page: number = 1, limit: number = 10, filters: Record<string, string | number> = {}): Promise<InvoiceListResponse> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...filters });
    const response = await apiClient.get(`${INVOICE_URL}/get?${params.toString()}`);
    return response.data.data;
  },

  getInvoiceById: async (id: number): Promise<{ invoice: Invoice }> => {
    const response = await apiClient.get(`${INVOICE_URL}/get/${id}`);
    return response.data.data;
  },

  markPaymentReceived: async (invoiceId: number, data: MarkPaymentReceivedData): Promise<any> => {
    const response = await apiClient.post(`${INVOICE_URL}/${invoiceId}/mark-received`, data);
    return response.data;
  },

  approveSubscription: async (companyId: number, data: ApproveRejectData): Promise<any> => {
    // Requires invoice_id and optional start_date_override
    const response = await apiClient.post(`${COMPANY_URL}/${companyId}/subscription/approve`, data);
    return response.data;
  },

  rejectSubscription: async (companyId: number, data: ApproveRejectData): Promise<any> => {
    const response = await apiClient.post(`${COMPANY_URL}/${companyId}/subscription/reject`, data);
    return response.data;
  },

  downloadInvoice: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`${INVOICE_URL}/${id}/download`, { responseType: 'blob' });
    return response.data;
  }
};