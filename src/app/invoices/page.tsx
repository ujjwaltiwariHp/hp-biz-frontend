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
  Eye,
  Search,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  X,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export default function InvoicesPage() {
  const { isSuperAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewInvoiceModal, setViewInvoiceModal] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();

  const paymentDialog = useConfirmDialog();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'N/A',
    payment_reference: 'N/A',
    payment_notes: '',
  });

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', currentPage, searchTerm, statusFilter],
    queryFn: () =>
      invoiceService.getAllInvoices(currentPage, 10, {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

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

  const handleMarkPaymentReceived = (invoice: Invoice) => {
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

  const confirmMarkPayment = () => {

    if (selectedInvoice?.id) {
      markPaymentMutation.mutate(selectedInvoice.id);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewInvoiceModal(invoice);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={18} className="text-success" />;
      case 'payment_received':
        return <Clock size={18} className="text-warning" />;
      case 'sent':
      case 'pending':
        return <Clock size={18} className="text-primary" />;
      case 'overdue':
        return <AlertCircle size={18} className="text-danger" />;
      case 'rejected':
        return <XCircle size={18} className="text-danger" />;
      default:
        return <FileText size={18} className="text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
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

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && !['paid', 'rejected'].includes(status);
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
              <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <FileText size={24} />
                Invoices & Payments
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage all invoices and payment records
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Invoices
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
              Filter by Status
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
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="payment_received">Payment Received</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="rejected">Rejected</option>
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
              <tr className="bg-gray-100 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Invoice
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Company
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Amount
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Due Date
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Status
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No invoices found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice: Invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className="py-5 px-4">
                      <div>
                        <h5 className="font-semibold text-black dark:text-white">
                          {invoice.invoice_number}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {formatDate(invoice.billing_period_start)}
                        </p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div>
                        <h5 className="font-semibold text-black dark:text-white flex items-center gap-2">
                          <Building size={16} />
                          {invoice.company_name}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {invoice.package_name}
                        </p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-black dark:text-white">
                          {invoice.currency}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {parseFloat(invoice.total_amount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Inc. ${parseFloat(invoice.tax_amount).toFixed(2)} tax
                      </p>
                    </td>
                    <td className="py-5 px-4">
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          {formatDate(invoice.due_date)}
                        </p>
                        {isOverdue(invoice.due_date, invoice.status) && (
                          <p className="text-xs text-danger font-semibold mt-1">
                            OVERDUE
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border py-1.5 px-3 text-xs font-semibold ${getStatusBadgeColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                          title="View Invoice"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadInvoice(invoice.id, invoice.invoice_number)
                          }
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-success dark:hover:text-success"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        {canMarkPayment(invoice.status) ? (
                          <button
                            onClick={() => handleMarkPaymentReceived(invoice)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-warning dark:hover:text-warning disabled:opacity-50 disabled:cursor-not-allowed"
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
              Showing{' '}
              <span className="font-semibold text-black dark:text-white">
                {(currentPage - 1) * 10 + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-black dark:text-white">
                {Math.min(currentPage * 10, pagination.totalCount)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-black dark:text-white">
                {pagination.totalCount}
              </span>{' '}
              results
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

      {/* Invoice Details Modal */}
      {viewInvoiceModal && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-boxdark shadow-xl m-4">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white dark:bg-boxdark dark:border-strokedark p-6">
              <h3 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <FileText size={24} />
                Invoice Details
              </h3>
              <button
                onClick={() => setViewInvoiceModal(null)}
                className="text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Invoice Number
                    </p>
                    <p className="text-lg font-bold text-black dark:text-white">
                      {viewInvoiceModal.invoice_number}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Company
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {viewInvoiceModal.company_name}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Package
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {viewInvoiceModal.package_name}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(viewInvoiceModal.status)}
                      <span
                        className={`inline-flex rounded-full py-1 px-2.5 text-xs font-semibold border ${getStatusBadgeColor(
                          viewInvoiceModal.status
                        )}`}
                      >
                        {viewInvoiceModal.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Billing Period
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {formatDate(viewInvoiceModal.billing_period_start)} -{' '}
                      {formatDate(viewInvoiceModal.billing_period_end)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Due Date
                    </p>
                    <p className="font-semibold text-black dark:text-white">
                      {formatDate(viewInvoiceModal.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="border-t border-stroke dark:border-strokedark pt-6">
                <h4 className="text-lg font-semibold text-black dark:text-white mb-4">
                  Amount Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-semibold text-black dark:text-white">
                      {viewInvoiceModal.currency}{' '}
                      {(
                        parseFloat(viewInvoiceModal.total_amount) -
                        parseFloat(viewInvoiceModal.tax_amount)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%):</span>
                    <span className="font-semibold text-black dark:text-white">
                      {viewInvoiceModal.currency}{' '}
                      {parseFloat(viewInvoiceModal.tax_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="font-semibold text-primary">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      {viewInvoiceModal.currency}{' '}
                      {parseFloat(viewInvoiceModal.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Removed Payment Information Section */}


              {/* Rejection Information */}
              {viewInvoiceModal.rejection_reason && (
                <div className="border-t border-stroke dark:border-strokedark pt-6">
                  <h4 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-danger" />
                    Rejection Details
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                      <p className="text-xs font-medium text-danger mb-1">Rejection Reason</p>
                      <p className="text-sm text-black dark:text-white">
                        {viewInvoiceModal.rejection_reason}
                      </p>
                    </div>
                    {viewInvoiceModal.rejection_note && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-meta-4">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Additional Notes
                        </p>
                        <p className="text-sm text-black dark:text-white">
                          {viewInvoiceModal.rejection_note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6 flex gap-3">
              <button
                onClick={() =>
                  handleDownloadInvoice(
                    viewInvoiceModal.id,
                    viewInvoiceModal.invoice_number
                  )
                }
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 px-6 font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Download size={18} />
                Download PDF
              </button>
              <button
                onClick={() => setViewInvoiceModal(null)}
                className="flex-1 rounded-lg bg-gray-200 py-3 px-6 font-medium text-black hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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