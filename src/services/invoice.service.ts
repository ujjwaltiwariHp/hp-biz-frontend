import { apiClient } from '@/lib/api';
import {
  Invoice,
  InvoiceListResponse,
  MarkPaymentReceivedData,
  ApproveRejectData
} from '@/types/invoice';

const INVOICE_URL = '/super-admin/invoices';
const COMPANY_URL = '/super-admin/companies';

const normalizeInvoiceStatus = (invoice: Invoice): Invoice => {
  if (invoice.status === 'payment_received') {
    return { ...invoice, status: 'paid' as any };
  }
  return invoice;
};

const normalizeInvoiceList = (invoices: Invoice[]): Invoice[] => {
  return invoices.map(normalizeInvoiceStatus);
};

export const invoiceService = {
  getAllInvoices: async (
    page: number = 1,
    limit: number = 10,
    filters: Record<string, string | number | undefined> = {}
  ): Promise<InvoiceListResponse> => {
    const cleanFilters: Record<string, string | number> = {};
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key] = value;
      }
    });

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(cleanFilters).map(([key, val]) => [
          key,
          String(val),
        ])
      ),
    });

    const response = await apiClient.get(`${INVOICE_URL}/get?${params.toString()}`);

    if (response.data.data?.invoices) {
      response.data.data.invoices = normalizeInvoiceList(response.data.data.invoices);
    }

    return response.data.data;
  },

  getInvoiceById: async (id: number): Promise<{ invoice: Invoice }> => {
    const response = await apiClient.get(`${INVOICE_URL}/get/${id}`);

    if (response.data.data?.invoice) {
      response.data.data.invoice = normalizeInvoiceStatus(response.data.data.invoice);
    }

    return response.data.data;
  },

  markPaymentReceived: async (
    invoiceId: number,
    data: MarkPaymentReceivedData
  ): Promise<any> => {
    const response = await apiClient.post(
      `${INVOICE_URL}/${invoiceId}/mark-received`,
      {
        payment_method: data.payment_method || '',
        payment_reference: data.payment_reference || '',
        payment_notes: data.payment_notes || '',
      }
    );

    if (response.data.data?.invoice) {
      response.data.data.invoice = normalizeInvoiceStatus(response.data.data.invoice);
    }

    return response.data;
  },

  approveSubscription: async (
    companyId: number,
    data: ApproveRejectData
  ): Promise<any> => {
    const response = await apiClient.post(
      `${COMPANY_URL}/${companyId}/subscription/approve`,
      data
    );
    return response.data;
  },

  rejectSubscription: async (
    companyId: number,
    data: ApproveRejectData
  ): Promise<any> => {
    const response = await apiClient.post(
      `${COMPANY_URL}/${companyId}/subscription/reject`,
      data
    );
    return response.data;
  },

  downloadInvoice: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`${INVOICE_URL}/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};