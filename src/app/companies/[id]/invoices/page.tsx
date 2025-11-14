'use client';

import React, { use, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

import { Typography } from '@/components/common/Typography';
import { useSearch } from '@/hooks/useSearch';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import { Invoice } from '@/types/invoice';

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

  const [finalSearchQuery, setFinalSearchQuery] = useState('');

  const queryClient = useQueryClient();
  const MIN_SEARCH_LENGTH = 3;

  const searchTrigger = useCallback(
    async (q: string) => {
      setFinalSearchQuery(q);
      setCurrentPage(1);
      return [];
    },
    []
  );

  const {
    query: searchInputQuery,
    handleSearch,
    handleClear,
    handleSearchSubmit,
    isLoading: isSearchDebouncing,
    error: searchError,
  } = useSearch(searchTrigger, 400, MIN_SEARCH_LENGTH, '');

  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['company-invoices', companyId, currentPage, statusFilter, finalSearchQuery],
    queryFn: () =>
      invoiceService.getAllInvoices(currentPage, 10, {
        search: finalSearchQuery || undefined,
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


  if (companyLoading || invoicesLoading) {
    return <Loader />;
  }

  const company = companyResponse?.data?.company;
  const invoices = invoicesData?.invoices || [];
  const pagination = invoicesData?.pagination;

  const companyInvoices = invoices.filter(
    (inv) => inv.company_id === companyId || !inv.company_id
  );

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
      <div className='flex items-end justify-between'>
        <div>
          <Typography variant="page-title" as="h2">
            Invoices
          </Typography>
          <Typography variant="caption" className="mt-1">
            View and manage invoices for {company.company_name}
          </Typography>
        </div>
      </div>

      {companyInvoices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
            <Typography variant="label" as="p">
              Total Invoices
            </Typography>
            <Typography variant="page-title" className="text-lg font-bold text-black dark:text-white mt-2">
              {companyInvoices.length}
            </Typography>
          </div>

          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
            <Typography variant="label" as="p">
              Total Amount
            </Typography>
            <Typography variant="page-title" className="text-lg font-bold text-primary mt-2">
              {companyInvoices[0]?.currency}{' '}
              {companyInvoices
                .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
                .toFixed(2)}
            </Typography>
          </div>

          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
            <Typography variant="label" as="p">
              Overdue Invoices
            </Typography>
            <Typography variant="page-title" className="text-lg font-bold text-danger mt-2">
              {companyInvoices.filter(
                (inv) => isOverdue(inv.due_date, inv.status)
              ).length}
            </Typography>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <input
              type="text"
              placeholder={`Search by invoice number (min ${MIN_SEARCH_LENGTH} chars)...`}
              value={searchInputQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="w-full rounded border border-stroke py-2.5 pl-10 pr-10 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
          />
          <Search
              size={18}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isSearchDebouncing ? 'text-primary animate-spin' : 'text-gray-400'
              }`}
          />
          <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-black dark:hover:text-white"
              onClick={handleSearchSubmit}
              aria-label="Search"
          >
            <Search size={18} />
          </button>
          {searchInputQuery && (
              <XCircle
                  size={18}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-danger"
                  onClick={handleClear}
              />
          )}
        </div>

        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="w-full rounded border border-stroke py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
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

      <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
        {companyInvoices.length > 0 ? (
          <DynamicTable<Invoice>
            data={companyInvoices}
            columns={invoiceColumns}
            isLoading={isSearchDebouncing}
          />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-boxdark">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <Typography variant="body1" className="text-base font-medium">
              {finalSearchQuery ? `No invoices match "${finalSearchQuery}"` : "No invoices found"}
            </Typography>
            {finalSearchQuery && (
                <Typography variant="caption" className="text-xs mt-1">Try clearing the search or adjusting your filters.</Typography>
            )}
            {!finalSearchQuery && (
                <Typography variant="caption" className="text-xs mt-1">Invoice data is currently unavailable.</Typography>
            )}
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