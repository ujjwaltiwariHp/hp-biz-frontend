'use client';

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { SkeletonRect } from '@/components/common/Skeleton';
import TableSkeleton from '@/components/common/TableSkeleton';
import {
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

import { Typography } from '@/components/common/Typography';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import { Invoice } from '@/types/invoice';
import TableToolbar from '@/components/common/TableToolbar';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const formatStatusText = (status: string) => {
  return status.replace(/_/g, ' ').toUpperCase();
}

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

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) {
    return 'N/A';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

const isOverdue = (dueDate: string | null | undefined, status: string) => {
  if (!dueDate) return false;
  try {
    return new Date(dueDate) < new Date() && !['paid', 'rejected'].includes(status);
  } catch {
    return false;
  }
};

export default function CompanyInvoicesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id, 10);
  const router = useRouter();


  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');


  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['company-invoices', companyId, currentPage, statusFilter, appliedSearchTerm],
    queryFn: () =>
      invoiceService.getAllInvoices(currentPage, 10, {
        search: appliedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const downloadMutation = useMutation({
    mutationFn: (invoiceId: number) =>
      invoiceService.downloadInvoice(invoiceId),
    onSuccess: (blob, invoiceId) => {
      const invoiceNumber = invoicesData?.invoices?.find(
        (inv) => inv.id === invoiceId
      )?.invoice_number;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    },
    onError: () => {
      toast.error('Failed to download invoice');
    },
  });


  const handleDownload = (invoiceId: number) => {
    downloadMutation.mutate(invoiceId);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (term?: string) => {
    setAppliedSearchTerm(term !== undefined ? term : searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // UPDATED: Allow UI to render, use skeletons for data
  if (companyLoading) {
    return (
      <div className="space-y-6">
        <SkeletonRect className="h-8 w-48 mb-6" /> {/* Breadcrumb skeleton */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <SkeletonRect className="h-16 w-full mb-4" /> {/* Toolbar skeleton */}
          <TableSkeleton columns={5} />
        </div>
      </div>
    );
  }

  const company = companyResponse?.data?.company;
  const invoices = invoicesData?.invoices || [];
  const pagination = invoicesData?.pagination;

  const companyInvoices = invoices.filter(
    (inv) => inv.company_id === companyId || !inv.company_id
  );

  const activeFiltersCount = [
    appliedSearchTerm,
    statusFilter !== 'all'
  ].filter(Boolean).length;

  if (!company) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-3 text-danger opacity-50" />
        <Typography variant="body1" className="text-base font-medium text-gray-600 dark:text-gray-400">
          Company not found
        </Typography>
      </div>
    );
  }

  const invoiceColumns: TableColumn<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice ID',
      headerClassName: 'min-w-[200px]',
      render: (invoice) => (
        <div>
          <Typography variant="value" as="h5" className="font-semibold text-black dark:text-white">
            {invoice.invoice_number}
          </Typography>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      headerClassName: 'min-w-[100px]',
      render: (invoice) => (
        <div>
          <div className="flex items-baseline gap-1">
            <Typography variant="caption" as="span" className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {invoice.currency}
            </Typography>
            <Typography variant="value" as="span" className="text-sm font-bold text-primary">
              {parseFloat(invoice.total_amount).toFixed(2)}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      headerClassName: 'min-w-[100px]',
      render: (invoice) => (
        <div>
          <Typography variant="body" className="text-sm font-medium text-black dark:text-white">
            {formatDate(invoice.due_date)}
          </Typography>
          {isOverdue(invoice.due_date, invoice.status) && (
            <Typography variant="caption" className="text-xxs text-danger font-semibold mt-1">
              OVERDUE
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'min-w-[150px]',
      render: (invoice) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(invoice.status)}
          <span
            className={`inline-flex items-center gap-1 rounded-full border py-1.5 px-3 text-xs font-semibold ${getStatusBadgeColor(
              invoice.status
            )}`}
          >
            {formatStatusText(invoice.status)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'w-[100px] text-center',
      className: 'text-center',
      render: (invoice) => (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => handleDownload(invoice.id)}
            disabled={downloadMutation.isPending}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-success dark:hover:text-success disabled:opacity-50"
            title="Download PDF"
          >
            <Download size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Breadcrumb pageName="Invoices" />
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <TableToolbar
          searchConfig={{
            value: searchTerm,
            onChange: setSearchTerm,
            onSearch: handleSearch,
            onClear: handleClearSearch,
            placeholder: "Search invoices...",
            isLoading: invoicesLoading,
          }}
          filterConfigs={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: (val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              },
              options: [
                { label: 'All Status', value: 'all' },
                { label: 'Draft', value: 'draft' },
                { label: 'Pending', value: 'pending' },
                { label: 'Sent', value: 'sent' },
                { label: 'Payment Received', value: 'payment_received' },
                { label: 'Partially Paid', value: 'partially_paid' },
                { label: 'Paid', value: 'paid' },
                { label: 'Overdue', value: 'overdue' },
                { label: 'Void', value: 'void' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Rejected', value: 'rejected' },
              ],
            },
          ]}
          activeFilters={{
            count: activeFiltersCount,
            filters: [
              appliedSearchTerm ? { key: 'search', label: 'Search', value: appliedSearchTerm } : null,
              statusFilter !== 'all' ? { key: 'status', label: 'Status', value: formatStatusText(statusFilter) } : null,
            ].filter(Boolean) as any,
            onClearAll: handleClearFilters,
          }}
        />

        {companyInvoices.length > 0 ? (
          <DynamicTable<Invoice>
            data={companyInvoices}
            columns={invoiceColumns}
            isLoading={invoicesLoading}
            skeletonConfig={{
              rows: 5,
              columnWidths: [150, 100, 100, 120, 100],
            }}
          />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-boxdark">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <Typography variant="body1" className="text-base font-medium">
              {appliedSearchTerm || statusFilter !== 'all'
                ? `No invoices match your current filters.`
                : "No invoices found"}
            </Typography>
            <Typography variant="caption" className="text-xs mt-1">
              {appliedSearchTerm || statusFilter !== 'all'
                ? "Try clearing the search or adjusting your filters."
                : "Invoice data is currently unavailable."}
            </Typography>
          </div>
        )}

        {pagination && pagination.totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t border-stroke dark:border-strokedark">
            <Typography variant="caption" className="text-xs text-gray-600 dark:text-gray-400">
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
            </Typography>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
              >
                Previous
              </button>
              <Typography variant="body" className="px-4 py-2 text-xs font-semibold text-black dark:text-white">
                Page {currentPage} of {pagination.totalPages}
              </Typography>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
                }
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 text-xs font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {pagination && pagination.totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <Typography variant="caption" className="text-xs text-gray-600 dark:text-gray-400">
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
          </Typography>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Previous
            </button>
            <Typography variant="body" className="px-4 py-2 text-xs font-semibold text-black dark:text-white">
              Page {currentPage} of {pagination.totalPages}
            </Typography>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
              }
              disabled={currentPage === pagination.totalPages}
              className="px-4 py-2 text-xs font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}