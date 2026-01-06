'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { toast } from 'react-toastify';
import {
  FileText,
  Download,
  DollarSign,
  Plus,
  Filter,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Typography } from '@/components/common/Typography';
import { useSSE } from '@/hooks/useSSE';
import Link from 'next/link';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import StandardSearchInput from '@/components/common/StandardSearchInput';
import DateRangePicker from '@/components/common/DateRangePicker';
import Loader from '@/components/common/Loader';

const formatStatusText = (status: string) => {
  return status.replace(/_/g, ' ').toUpperCase();
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'payment_received':
    case 'partially_paid':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'sent':
    case 'pending':
    case 'draft':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'overdue':
    case 'rejected':
    case 'cancelled':
    case 'void':
      return 'bg-danger/10 text-danger border-danger/20';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
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
  return new Date(dueDate) < new Date() && !['paid', 'rejected', 'cancelled', 'void', 'payment_received'].includes(status);
};

const canMarkPayment = (status: string) => {
  return status === 'sent' || status === 'overdue' || status === 'partially_paid';
};

export default function InvoicesPage() {
  const { isSuperAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const queryClient = useQueryClient();

  const paymentDialog = useConfirmDialog();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'N/A',
    payment_reference: 'N/A',
    payment_notes: '',
  });

  const invoicesQueryKey = ['invoices', currentPage, appliedSearchTerm, statusFilter, dateRange];

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: invoicesQueryKey,
    queryFn: () =>
      invoiceService.getAllInvoices(currentPage, 10, {
        search: appliedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      }),
  });

  useSSE('sa_finance_update', invoicesQueryKey);

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
    if (!canMarkPayment(invoice.status)) {
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

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateRangeApply = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setStatusFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const invoices = invoicesData?.invoices || [];
  const pagination = invoicesData?.pagination;

  const activeFiltersCount = [
    appliedSearchTerm,
    statusFilter !== 'all',
    dateRange.startDate || dateRange.endDate
  ].filter(Boolean).length;

  const invoiceColumns: TableColumn<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice ID',
      headerClassName: 'min-w-[150px] xl:pl-7',
      className: 'xl:pl-7',
      render: (invoice) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" as="h5" className="font-semibold text-black dark:text-white">
            {invoice.invoice_number}
          </Typography>
          <Typography variant="caption" className="text-sm text-gray-500 dark:text-gray-400">
            {invoice.package_name || 'N/A'}
          </Typography>
        </div>
      ),
    },
    {
      key: 'company_name',
      header: 'Customer',
      headerClassName: 'min-w-[150px]',
      render: (invoice) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" className="font-medium text-black dark:text-white">{invoice.company_name}</Typography>
          <Typography variant="body" className="text-sm text-gray-600 dark:text-gray-400">
            ID: {(invoice as any).unique_company_id || 'N/A'}
          </Typography>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      headerClassName: 'min-w-[120px]',
      render: (invoice) => (
        <div>
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
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      headerClassName: 'min-w-[120px]',
      render: (invoice) => (
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
      ),
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'min-w-[120px]',
      render: (invoice) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full border py-1.5 px-3 text-xs font-semibold ${getStatusColor(
            invoice.status
          )}`}
        >
          <Typography variant="badge">{formatStatusText(invoice.status)}</Typography>
        </span>
      ),
    },
    {
      key: 'download_action',
      header: 'Download',
      headerClassName: 'w-[100px] text-center',
      className: 'w-[100px] text-center',
      render: (invoice) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() =>
              handleDownloadInvoice(invoice.id, invoice.invoice_number)
            }
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            title="Download PDF"
          >
            <Download size={18} />
          </button>
        </div>
      ),
    },
    {
      key: 'payment_action',
      header: 'Payment',
      headerClassName: 'min-w-[170px] text-center',
      className: 'min-w-[170px] text-center',
      render: (invoice) => (
        <div className="flex items-center justify-center min-h-[40px]">
          {canMarkPayment(invoice.status) ? (
            <button
              onClick={() => handleMarkPaymentReceived(invoice)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-warning rounded-lg hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-[150px]"
              title="Mark Payment Received"
              disabled={markPaymentMutation.isPending}
            >
              <DollarSign size={16} />
              Mark Payment
            </button>
          ) : invoice.status === 'paid' ? (
             <button
              disabled
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success rounded-lg shadow-sm w-full max-w-[150px] opacity-100 cursor-default"
            >
              <CheckCircle size={16} />
              Paid
            </button>
          ) : (
             <span className="w-full max-w-[150px]"></span>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <Loader variant="page" size="xl" />;
  }

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
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

        <div className="px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Typography variant="label" as="span">Search Invoices</Typography>
              </label>
              <StandardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Search by invoice #, company, email..."
                minLength={3}
                isLoading={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Typography variant="label" as="span">Filter by Status</Typography>
              </label>
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="w-full h-11 rounded-lg border border-stroke px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="payment_received">Payment Received</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="void">Void</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Typography variant="label" as="span">Date Range</Typography>
              </label>
              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center justify-between w-full h-11 px-4 text-sm border border-stroke bg-white dark:bg-boxdark rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-boxdark dark:border-strokedark text-left"
              >
                <span className="truncate text-black dark:text-white">
                  {dateRange.startDate && dateRange.endDate
                    ? `${dateRange.startDate} - ${dateRange.endDate}`
                    : 'Select dates'}
                </span>
                <Filter size={16} className="text-gray-500 flex-shrink-0" />
              </button>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <Typography variant="body2" className="text-primary font-medium">
                  Active Filters ({activeFiltersCount}):
                </Typography>
                {appliedSearchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                    Search: {appliedSearchTerm}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                    Status: {formatStatusText(statusFilter)}
                  </span>
                )}
                {(dateRange.startDate || dateRange.endDate) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                    Date: {dateRange.startDate} - {dateRange.endDate}
                  </span>
                )}
              </div>
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
              >
                <X size={16} />
                Clear All
              </button>
            </div>
          )}
        </div>

        {invoices.length > 0 || isLoading ? (
          <DynamicTable<Invoice>
            data={invoices}
            columns={invoiceColumns}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <Typography variant="value" className="text-lg font-medium">No invoices found</Typography>
            <Typography variant="caption" className="text-sm mt-1">
              {activeFiltersCount > 0
                ? 'Try adjusting your filters'
                : 'No invoices available'}
            </Typography>
          </div>
        )}

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

      <DateRangePicker
        isOpen={showDatePicker}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onClose={() => setShowDatePicker(false)}
        onApply={handleDateRangeApply}
      />

      <ConfirmDialog
        {...paymentDialog.confirmProps}
        type="success"
        title="Mark Payment Received"
        message={`Record payment received for invoice ${selectedInvoice?.invoice_number}? (Amount: ${selectedInvoice?.currency} ${parseFloat(selectedInvoice?.total_amount || '0').toFixed(2)})`}
        onConfirm={confirmMarkPayment}
        confirmText="Mark as Received"
        cancelText="Cancel"
        isLoading={markPaymentMutation.isPending}
      />
    </>
  );
}