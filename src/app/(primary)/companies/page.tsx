'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useState } from 'react';
import { Company } from '@/types/company';
import { toast } from 'react-toastify';
import { UserCheck, UserX, Trash2, Building, Package, Plus, ArrowRight, Filter, X } from 'lucide-react';
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

  const { data: companiesData, isLoading } = useQuery({
    queryKey: companiesQueryKey,
    queryFn: () => companyService.getCompanies({
      page: currentPage,
      limit: 10,
      search: appliedSearchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      startDate: dateRange.startDate ? new Date(dateRange.startDate).toISOString() : undefined,
      endDate: dateRange.endDate ? new Date(dateRange.endDate).toISOString() : undefined,
    }),
  });

  useSSE('sa_company_list_refresh', ['companies']);

  const activateMutation = useMutation({
    mutationFn: companyService.activateCompanyAccount,
    onSuccess: (data) => {
      toast.success(data.message || 'Company activated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate company');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: companyService.deactivateCompanyAccount,
    onSuccess: (data) => {
      toast.success(data.message || 'Company deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate company');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: companyService.removeCompany,
    onSuccess: (data) => {
      toast.success(data.message || 'Company deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
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
  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
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
      headerClassName: 'w-[100px] text-center',
      className: 'w-[100px] text-center',
      render: (company) => (
        <div className="flex items-center space-x-2 justify-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewCompany(company)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            title="View Details"
          >
            <ArrowRight size={18} />
          </button>
          {isSuperAdmin && (
            <>
              <Link
                href={`/companies/${company.id}/subscriptions`}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-warning dark:hover:text-warning"
                title="Update Subscription"
              >
                <Package size={18} />
              </Link>
              <button
                onClick={() => handleToggleStatus(company)}
                className={`p-2 rounded-lg transition-colors ${activateMutation.isPending || deactivateMutation.isPending
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  } ${company.is_active
                    ? 'text-red-600 dark:text-red-400 hover:text-red-700'
                    : 'text-green-600 dark:text-green-400 hover:text-green-700'
                  }`}
                disabled={activateMutation.isPending || deactivateMutation.isPending}
                title={company.is_active ? 'Deactivate Company' : 'Activate Company'}
              >
                {company.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
              </button>
              <button
                onClick={() => handleDelete(company)}
                className={`p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:text-red-700 ${deleteMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                disabled={deleteMutation.isPending}
                title="Delete Company"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // UPDATED: Using consistent Common Loader Component
  if (isLoading) {
    if (isLoading) {
      return (
        <>
          <Breadcrumb pageName="Companies" />
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-boxdark p-4 rounded-sm border border-stroke dark:border-strokedark">
              <SkeletonRect className="h-10 w-64" />
              <SkeletonRect className="h-10 w-32" />
            </div>
            <TableSkeleton columns={7} />
          </div>
        </>
      );
    }
  }

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
            <Link
              href="/companies/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
              title="Provision a new company account and assign subscription"
            >
              <Plus size={20} />
              <Typography variant="body" as="span" className="text-white">Provision Company</Typography>
            </Link>
          )}
        </div>

        {/* Filters Section */}
        <div className="px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* 1. Global Search */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Typography variant="label" as="span">Search</Typography>
              </label>
              <StandardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Name, Email, or ID..."
                isLoading={isLoading}
              />
            </div>

            {/* 2. Status Filter */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Typography variant="label" as="span">Status</Typography>
              </label>
              <div className="relative z-20 bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="relative z-20 w-full appearance-none rounded border-none bg-transparent py-2.5 px-4 h-11 outline-none transition focus:border-primary active:border-primary dark:bg-boxdark dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.8">
                      <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#637381"></path>
                    </g>
                  </svg>
                </span>
              </div>
            </div>

            {/* 3. Date Range Filter */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Typography variant="label" as="span">Date Range</Typography>
              </label>
              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center justify-between w-full h-11 px-4 text-sm border border-stroke bg-white dark:bg-boxdark rounded dark:border-strokedark transition-colors text-left"
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

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-primary">
                  Active Filters ({activeFiltersCount}):
                </span>
                {appliedSearchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                    Search: {appliedSearchTerm}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                    Status: {statusFilter}
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

      {/* Date Range Picker Modal */}
      <DateRangePicker
        isOpen={showDatePicker}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onClose={() => setShowDatePicker(false)}
        onApply={handleDateRangeApply}
      />
    </>
  );
}