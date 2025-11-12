'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { toast } from 'react-toastify';
import {
  FileText,
  Download,
  Search,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Typography } from '@/components/common/Typography';
import { useSSE } from '@/hooks/useSSE';
import Link from 'next/link'; // FIX 1: Imported Link component

const formatStatusText = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'payment_received':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'sent':
    case 'pending':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'overdue':
      return 'bg-danger/10 text-danger border-danger/20';
    case 'rejected':
      return 'bg-danger/10 text-danger border-danger/20';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function InvoicesPage() {
  const { isSuperAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const paymentDialog = useConfirmDialog();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'N/A',
    payment_reference: 'N/A',
    payment_notes: '',
  });

  const invoicesQueryKey = ['invoices', currentPage, searchTerm, statusFilter];

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: invoicesQueryKey,
    queryFn: () =>
      invoiceService.getAllInvoices(currentPage, 10, {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // --- SSE Integration for Real-time Refresh ---
  useSSE('sa_finance_update', invoicesQueryKey);
  // ----------------------------------------------


  const markPaymentMutation = useMutation({
    mutationFn: (invoiceId: number) =>
      invoiceService.markPaymentReceived(invoiceId, paymentData),
    onSuccess: () => {
      toast.success('Payment marked as received successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      paymentDialog.closeDialog();
      setSelectedInvoice(null);
      setPaymentData({
        payment_method: 'N/A',
        payment_reference: 'N/A',
        payment_notes: '',
      });
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to mark payment as received';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  const confirmMarkPayment = () => {
    if (selectedInvoice?.id) {
      markPaymentMutation.mutate(selectedInvoice.id);
    }
  };

  const handleMarkPaymentReceived = (invoice: Invoice) => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied.');
      return;
    }
    if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
      toast.error('This invoice cannot be marked as payment received');
      return;
    }
    setSelectedInvoice(invoice);
    setPaymentData({
      payment_method: 'N/A',
      payment_reference: 'N/A',
      payment_notes: '',
    });
    paymentDialog.openDialog();
  };

  const handleDownloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      toast.info('Downloading invoice...');
      const blob = await invoiceService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && !['paid', 'rejected', 'cancelled'].includes(status);
  };

  const canMarkPayment = (status: string) => {
    return status === 'sent' || status === 'overdue';
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  const invoices = invoicesData?.invoices || [];
  const pagination = invoicesData?.pagination;

  return (
    <DefaultLayout>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
          <div className="flex justify-between items-start">
            <div>
              <Typography variant="page-title" as="h4">
                Invoice Management
              </Typography>
              <Typography variant="caption" className="mt-1">
                Track and manage all invoices and payment records
              </Typography>
            </div>
            {isSuperAdmin && (
               <Link
                href="/companies"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
              >
                <Plus size={20} />
                <Typography variant="body" as="span" className="text-white">Generate Invoice</Typography>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Typography variant="label" as="span">Search Invoices</Typography>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by invoice #, company, or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-stroke py-2.5 pl-10 pr-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Typography variant="label" as="span">Filter by Status</Typography>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-stroke py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm"
            >
              <option value="all">All Status</option>
              {['draft', 'pending', 'sent', 'payment_received', 'paid', 'overdue', 'rejected'].map(status => (
                <option key={status} value={status}>{formatStatusText(status)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 text-sm font-medium border border-stroke rounded hover:bg-white dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              {/* Table Header Styling and Typography */}
              <tr className="bg-gray-100 text-left dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                <th className="py-4 px-4 xl:pl-7">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Invoice ID</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Customer</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Amount</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Due Date</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Status</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Actions</Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <Typography variant="value" className="text-lg font-medium">No invoices found</Typography>
                    <Typography variant="caption" className="text-sm mt-1">Try adjusting your filters</Typography>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice: Invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className="py-5 px-4 xl:pl-7">
                      {/* Stacking Invoice Number and Package Name */}
                      <div className="flex flex-col space-y-1">
                        <Typography variant="value" as="h5" className="font-semibold text-black dark:text-white">
                          {invoice.invoice_number}
                        </Typography>
                        <Typography variant="caption" className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.package_name || 'N/A'}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      {/* Stacking Company Name and ID */}
                      <div className="flex flex-col space-y-1">
                        <Typography variant="value" className="font-medium text-black dark:text-white">{invoice.company_name}</Typography>
                        <Typography variant="body" className="text-sm text-gray-600 dark:text-gray-400">
                            {/* FIX 3: Safely access unique_company_id */}
                            ID: {(invoice as any).unique_company_id || 'N/A'}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-baseline gap-1">
                        <Typography variant="value" as="span" className="font-semibold text-black dark:text-white">
                          {invoice.currency}
                        </Typography>
                        <Typography variant="value" as="span" className="text-lg font-bold text-primary">
                          {parseFloat(invoice.total_amount).toFixed(2)}
                        </Typography>
                      </div>
                      <Typography variant="caption" className="text-xs text-gray-500 mt-1">
                        Inc. {invoice.currency} {parseFloat(invoice.tax_amount).toFixed(2)} tax
                      </Typography>
                    </td>
                    <td className="py-5 px-4">
                      {/* Stacking Due Date and Overdue status */}
                      <div className="flex flex-col space-y-1">
                        <Typography variant="value" className="font-medium text-black dark:text-white">
                          {formatDate(invoice.due_date)}
                        </Typography>
                        {isOverdue(invoice.due_date, invoice.status) && (
                          <Typography variant="caption" className="text-xs text-danger font-semibold">
                            OVERDUE
                          </Typography>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-2">
                        {/* REMOVED: Status icon before the badge (as requested) */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border py-1.5 px-3 text-xs font-semibold ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          <Typography variant="badge">{formatStatusText(invoice.status)}</Typography>
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-2">
                        {/* Download Button */}
                        <button
                          onClick={() =>
                            handleDownloadInvoice(invoice.id, invoice.invoice_number)
                          }
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>

                        {/* Mark Payment Received - Only visible if status is pending/sent/overdue */}
                        {canMarkPayment(invoice.status) ? (
                          <button
                            onClick={() => handleMarkPaymentReceived(invoice)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-warning hover:text-warning disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark Payment Received"
                            disabled={markPaymentMutation.isPending}
                          >
                            <DollarSign size={18} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stroke py-4 px-4 dark:border-strokedark md:px-6 xl:px-7.5 bg-gray-50 dark:bg-meta-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <Typography variant="caption">
                Showing <span className="font-semibold text-black dark:text-white">{((currentPage - 1) * 10) + 1}</span> to <span className="font-semibold text-black dark:text-white">{Math.min(currentPage * 10, pagination.totalCount)}</span> of <span className="font-semibold text-black dark:text-white">{pagination.totalCount}</span> results
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-black dark:text-white">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
                }
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 text-sm font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mark Payment Received Dialog */}
      <ConfirmDialog
        {...paymentDialog.confirmProps}
        type="success"
        title="Mark Payment Received"
        message={`Record payment received for invoice ${selectedInvoice?.invoice_number}? (Amount: ${selectedInvoice?.currency} ${parseFloat(selectedInvoice?.total_amount || '0').toFixed(2)})`}
        onConfirm={confirmMarkPayment}
        confirmText="Mark as Received"
        cancelText="Cancel"
        isLoading={markPaymentMutation.isPending}
      >
        {/* Removed all input fields for payment data from the dialog */}
      </ConfirmDialog>
    </DefaultLayout>
  );
}