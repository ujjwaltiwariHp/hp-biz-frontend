'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useState } from 'react';
import { Company } from '@/types/company';
import { toast } from 'react-toastify';
import { UserCheck, UserX, Trash2, Building, Package, Plus, ArrowRight, Eye } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Typography } from '@/components/common/Typography';
import { useSSE } from '@/hooks/useSSE';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import DateRangePicker from '@/components/common/DateRangePicker';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import TableSkeleton from '@/components/common/TableSkeleton';
import { SkeletonRect } from '@/components/common/Skeleton';
import StandardSearchInput from '@/components/common/StandardSearchInput';
import Loader from '@/components/common/Loader'; // Import Common Loader
import Button from '@/components/common/Button';
import TableToolbar from '@/components/common/TableToolbar';

export default function CompaniesPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });

  const deleteDialog = useConfirmDialog();
  const toggleDialog = useConfirmDialog();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('deactivate');

  const queryClient = useQueryClient();

  const companiesQueryKey = ['companies', currentPage, appliedSearchTerm, statusFilter, dateRange];

  const { data: companiesData, isLoading, isPlaceholderData } = useQuery({
    queryKey: companiesQueryKey,
    queryFn: () => companyService.getCompanies({
      page: currentPage,
      limit: 10,
      search: appliedSearchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      startDate: dateRange.startDate ? new Date(dateRange.startDate).toISOString() : undefined,
      endDate: dateRange.endDate ? new Date(dateRange.endDate).toISOString() : undefined,
    }),
    placeholderData: keepPreviousData,
  });

  useSSE('sa_company_list_refresh', ['companies']);

  const activateMutation = useMutation({
    mutationFn: companyService.activateCompanyAccount,
    onSuccess: (data) => {
      toast.success(data.message || 'Company activated successfully');
      queryClient.invalidateQueries({ queryKey: companiesQueryKey });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate company');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: companyService.deactivateCompanyAccount,
    onSuccess: (data) => {
      toast.success(data.message || 'Company deactivated successfully');
      queryClient.invalidateQueries({ queryKey: companiesQueryKey });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate company');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: companyService.removeCompany,
    onSuccess: (data) => {
      toast.success(data.message || 'Company deleted successfully');
      queryClient.invalidateQueries({ queryKey: companiesQueryKey });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete company');
    },
  });

  const handleToggleStatus = (company: Company) => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: View-only access.');
      return;
    }
    setSelectedCompany(company);
    setActionType(company.is_active ? 'deactivate' : 'activate');
    toggleDialog.openDialog();
  };

  const confirmToggleStatus = () => {
    if (!selectedCompany) return;

    if (selectedCompany.is_active) {
      deactivateMutation.mutate(selectedCompany.id);
    } else {
      activateMutation.mutate(selectedCompany.id);
    }
    toggleDialog.closeDialog();
    setSelectedCompany(null);
  };

  const handleDelete = (company: Company) => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: View-only access.');
      return;
    }
    setSelectedCompany(company);
    deleteDialog.openDialog();
  };

  const confirmDelete = () => {
    if (!selectedCompany) return;
    deleteMutation.mutate(selectedCompany.id);
    deleteDialog.closeDialog();
    setSelectedCompany(null);
  };

  const handleViewCompany = (company: Company) => {
    router.push(`/companies/${company.id}`);
  };

  // Search Handlers
  const handleSearch = (term?: string) => {
    setAppliedSearchTerm(term !== undefined ? term : searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  // Filter Handlers
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isSubscriptionExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const companies = companiesData?.data?.companies || [];
  const pagination = companiesData?.data?.pagination;

  const activeFiltersCount = [
    appliedSearchTerm,
    statusFilter !== 'all',
    dateRange.startDate || dateRange.endDate
  ].filter(Boolean).length;

  const companyColumns: TableColumn<Company>[] = [
    {
      key: 'company_name',
      header: 'Company',
      headerClassName: 'min-w-[180px] xl:pl-7',
      className: 'xl:pl-7',
      render: (company) => (
        <div
          className="flex flex-col space-y-1 cursor-pointer"
          onClick={() => handleViewCompany(company)}
        >
          <Typography variant="value" as="h5" className="font-semibold text-black dark:text-white hover:text-primary transition-colors">
            {company.company_name}
          </Typography>
          <Typography variant="body" className="text-sm text-primary font-medium">
            ID: {company.unique_company_id}
          </Typography>
          <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
            {company.industry} • {company.company_size}
          </Typography>
        </div>
      ),
    },
    {
      key: 'admin_name',
      header: 'Admin',
      headerClassName: 'min-w-[150px]',
      render: (company) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" className="font-medium text-black dark:text-white">{company.admin_name}</Typography>
          <Typography variant="body" className="text-sm text-gray-600 dark:text-gray-400">{company.admin_email}</Typography>
          <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">{company.phone}</Typography>
        </div>
      ),
    },
    {
      key: 'package_name',
      header: 'Package',
      headerClassName: 'min-w-[120px]',
      render: (company) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" className="font-semibold text-black dark:text-white">
            {company.package_name || 'No Package'}
          </Typography>
          <Typography variant="body" className="text-sm text-primary font-medium">
            {company.package_price
              ? `$ ${company.package_price}/mo`
              : '-'}
          </Typography>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      headerClassName: 'min-w-[100px]',
      render: (company) => (
        <div className="flex flex-col space-y-2">
          <span
            className={`inline-flex w-fit rounded-full py-1.5 px-3 text-sm font-semibold ${company.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
          >
            <Typography variant="badge">{company.is_active ? 'Active' : 'Inactive'}</Typography>
          </span>
          {company.email_verified && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
              <Typography variant="caption">Email Verified</Typography>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'subscription_end_date',
      header: 'Subscription',
      headerClassName: 'min-w-[150px]',
      render: (company) => (
        <div className="flex flex-col space-y-1 text-sm">
          <Typography variant="body" className="text-black dark:text-white font-medium">
            <Typography variant="caption" as="span" className="font-normal text-gray-500 dark:text-gray-400">Start:</Typography> {formatDate(company.subscription_start_date)}
          </Typography>
          <Typography variant="body" className="text-black dark:text-white font-medium">
            <Typography variant="caption" as="span" className="font-normal text-gray-500 dark:text-gray-400">End:</Typography> {formatDate(company.subscription_end_date)}
          </Typography>
          <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold w-fit ${isSubscriptionExpired(company.subscription_end_date)
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isSubscriptionExpired(company.subscription_end_date)
              ? 'bg-red-600 dark:bg-red-400'
              : 'bg-green-600 dark:bg-green-400'
              }`}></span>
            <Typography variant="caption" as="span" className="font-semibold">{isSubscriptionExpired(company.subscription_end_date) ? 'Expired' : 'Active'}</Typography>
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'w-[140px] text-center',
      className: 'w-[140px] min-w-[140px]',
      render: (company) => (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewCompany(company)}
            className="!p-2 hover:bg-gray-100 dark:hover:bg-boxdark-2 text-primary"
            title="View Details"
          >
            <Eye size={18} />
          </Button>

          {isSuperAdmin && (
            <>
              <Link
                href={`/companies/${company.id}/subscriptions`}
                title="Update Subscription"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="!p-2 hover:bg-gray-100 dark:hover:bg-boxdark-2 text-warning"
                >
                  <Package size={18} />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleStatus(company)}
                disabled={activateMutation.isPending || deactivateMutation.isPending}
                className={`!p-2 hover:bg-gray-100 dark:hover:bg-boxdark-2 ${company.is_active ? 'text-red-500' : 'text-green-600'}`}
                title={company.is_active ? 'Deactivate Company' : 'Activate Company'}
              >
                {company.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(company)}
                disabled={deleteMutation.isPending}
                className="!p-2 hover:bg-gray-100 dark:hover:bg-boxdark-2 text-red-500"
                title="Delete Company"
              >
                <Trash2 size={18} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        {/* Header with Provisioning Button */}
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Typography variant="page-title" as="h4">
              Companies Management
            </Typography>
            <Typography variant="caption" className="mt-1">
              Manage all registered companies and their subscriptions
            </Typography>
          </div>
          {isSuperAdmin && (
            <Link href="/companies/create">
              <Button
                leftIcon={<Plus size={20} />}
                className="bg-primary text-white hover:bg-opacity-90 transition-colors"
                title="Provision a new company account and assign subscription"
              >
                Provision Company
              </Button>
            </Link>
          )}
        </div>

        {/* Table Toolbar (Filters & Search) */}
        <TableToolbar
          searchConfig={{
            value: searchTerm,
            onChange: setSearchTerm,
            onSearch: handleSearch,
            onClear: handleClearSearch,
            placeholder: "Name, Email, or ID...",
            isLoading: isLoading && !isPlaceholderData,
            minLength: 1,
          }}
          filterConfigs={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: (val) => {
                setStatusFilter(val as any);
                setCurrentPage(1);
              },
              options: [
                { label: 'All Status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ],
            },
          ]}
          dateRangeConfig={{
            value: dateRange,
            onChange: setDateRange,
            onApply: handleDateRangeApply,
          }}
          activeFilters={{
            count: activeFiltersCount,
            filters: [
              appliedSearchTerm ? { key: 'search', label: 'Search', value: appliedSearchTerm } : null,
              statusFilter !== 'all' ? { key: 'status', label: 'Status', value: statusFilter } : null,
              (dateRange.startDate || dateRange.endDate) ? { key: 'date', label: 'Date', value: `${dateRange.startDate} - ${dateRange.endDate}` } : null
            ].filter(Boolean) as any,
            onClearAll: handleClearFilters,
          }}
        />

        {/* Dynamic Table Component */}
        <DynamicTable
          data={companies}
          columns={companyColumns}
          isLoading={isLoading}
        />

        {/* Empty State */}
        {companies.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Building size={48} className="mx-auto mb-3 opacity-50" />
            <Typography variant="value" className="text-lg font-medium">No companies found</Typography>
            <Typography variant="caption" className="text-sm mt-1">Try adjusting your search or filters</Typography>
          </div>
        )}

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
                disabled={!pagination.hasPrev}
                className="px-4 py-2 text-sm font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-black dark:text-white">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasNext}
                className="px-4 py-2 text-sm font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        {...deleteDialog.confirmProps}
        type="danger"
        title="Delete Company"
        message={`Are you sure you want to permanently delete "${selectedCompany?.company_name}"? This action cannot be undone and will remove all associated data.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        {...toggleDialog.confirmProps}
        type={actionType === 'deactivate' ? 'warning' : 'success'}
        title={`${actionType === 'deactivate' ? 'Deactivate' : 'Activate'} Company`}
        message={`Are you sure you want to ${actionType} "${selectedCompany?.company_name}"? ${actionType === 'deactivate'
          ? 'The company will lose access to the platform.'
          : 'The company will regain full access to the platform.'
          }`}
        onConfirm={confirmToggleStatus}
        confirmText={actionType === 'deactivate' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        isLoading={activateMutation.isPending || deactivateMutation.isPending}
      />


    </>
  );
}