export interface Invoice {
  id: number;
  company_id: number;
  subscription_package_id: number;
  invoice_number: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  status: 'draft' | 'pending' | 'sent' | 'payment_received' | 'paid' | 'partially_paid' | 'overdue' | 'void' | 'cancelled' | 'rejected';
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_notes: string | null;
  admin_verified_at: string | null;
  admin_verified_by: number | null;
  rejection_reason: string | null;
  rejection_note: string | null;
  company_name: string;
  package_name: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface MarkPaymentReceivedData {
  payment_method: string;
  payment_reference: string;
  payment_notes: string;
}

export interface ApproveRejectData {
  invoice_id: number;
  rejection_reason?: string;
  rejection_note?: string;
  start_date_override?: string; // Only for approve
}