'use client';

import React, { use, useState } from 'react';
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
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompanyInvoicesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoiceModal, setViewInvoiceModal] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch company data
  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch invoices for this company
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['company-invoices', companyId, currentPage, statusFilter, searchTerm],
    queryFn: () =>
      invoiceService.getAllInvoices(currentPage, 10, {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Download invoice mutation
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

  // Fixed formatDate function with proper null/undefined handling
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date value:', dateString);
        return 'Invalid Date';
      }

      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Invalid Date';
    }
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

  const isOverdue = (dueDate: string | null | undefined, status: string) => {
    if (!dueDate) return false;
    try {
      return new Date(dueDate) < new Date() && !['paid', 'rejected'].includes(status);
    } catch {
      return false;
    }
  };

  if (companyLoading || invoicesLoading) {
    return <Loader />;
  }

  const company = companyResponse?.data?.company;
  const invoices = invoicesData?.invoices || [];
  const pagination = invoicesData?.pagination;

  // Filter invoices by company (if needed on frontend)
  const companyInvoices = invoices.filter(
    (inv) => inv.company_id === companyId || !inv.company_id
  );

  if (!company) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-3 text-danger opacity-50" />
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          Company not found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Invoices
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View and manage invoices for {company.company_name}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded border border-stroke py-2.5 pl-10 pr-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
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

      {/* Invoices Table */}
      <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-meta-4">
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Invoice
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Amount
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Due Date
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Status
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companyInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No invoices found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                companyInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className="py-5 px-6">
                      <div>
                        <h5 className="font-semibold text-black dark:text-white">
                          {invoice.invoice_number}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {formatDate(invoice.billing_period_start)}
                        </p>
                      </div>
                    </td>

                    <td className="py-5 px-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {invoice.currency}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {parseFloat(invoice.total_amount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        +${parseFloat(invoice.tax_amount).toFixed(2)} tax
                      </p>
                    </td>

                    <td className="py-5 px-6">
                      <p className="font-medium text-black dark:text-white">
                        {formatDate(invoice.due_date)}
                      </p>
                      {isOverdue(invoice.due_date, invoice.status) && (
                        <p className="text-xs text-danger font-semibold mt-1">
                          OVERDUE
                        </p>
                      )}
                    </td>

                    <td className="py-5 px-6">
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

                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewInvoiceModal(invoice)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(invoice.id)}
                          disabled={downloadMutation.isPending}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-success dark:hover:text-success disabled:opacity-50"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
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

      {/* Summary Stats */}
      {companyInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-stroke dark:border-strokedark">
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Invoices
            </p>
            <p className="text-2xl font-bold text-black dark:text-white mt-2">
              {companyInvoices.length}
            </p>
          </div>

          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Amount
            </p>
            <p className="text-2xl font-bold text-primary mt-2">
              {companyInvoices[0]?.currency}{' '}
              {companyInvoices
                .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
                .toFixed(2)}
            </p>
          </div>

          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Overdue Invoices
            </p>
            <p className="text-2xl font-bold text-danger mt-2">
              {companyInvoices.filter(
                (inv) => isOverdue(inv.due_date, inv.status)
              ).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}