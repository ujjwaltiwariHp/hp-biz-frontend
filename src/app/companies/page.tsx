'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useState } from 'react';
import { Company } from '@/types/company';
import { toast } from 'react-toastify';
import { UserCheck, UserX, Trash2, Building, Package, Plus, ArrowRight } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Typography } from '@/components/common/Typography';
import { useSSE } from '@/hooks/useSSE';

export default function CompaniesPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewCompanyModal, setViewCompanyModal] = useState<Company | null>(null);

  const deleteDialog = useConfirmDialog();
  const toggleDialog = useConfirmDialog();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('deactivate');

  const queryClient = useQueryClient();

  const companiesQueryKey = ['companies', currentPage, searchTerm, statusFilter];

  const { data: companiesData, isLoading } = useQuery({
    queryKey: companiesQueryKey,
    queryFn: () => companyService.getCompanies({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
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

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  const companies = companiesData?.data?.companies || [];
  const pagination = companiesData?.data?.pagination;

  return (
    <DefaultLayout>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        {/* Header with Provisioning Button */}
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark flex justify-between items-center">
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Typography variant="label" as="span">Search Companies</Typography>
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-stroke py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Typography variant="label" as="span">Filter by Status</Typography>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-stroke py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              {/* FIX 3: Apply styling to make the table header look like a box */}
              <tr className="bg-gray-100 text-left dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                <th className="py-4 px-4 xl:pl-7">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Company</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Admin</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Package</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Status</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Subscription</Typography>
                </th>
                <th className="py-4 px-4">
                  <Typography variant="value" as="span" className="text-sm font-bold text-black dark:text-white">Actions</Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Building size={48} className="mx-auto mb-3 opacity-50" />
                    <Typography variant="value" className="text-lg font-medium">No companies found</Typography>
                    <Typography variant="caption" className="text-sm mt-1">Try adjusting your search or filters</Typography>
                  </td>
                </tr>
              ) : (
                companies.map((company: Company) => (
                  <tr
                    key={company.id}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors cursor-pointer"
                    onClick={() => handleViewCompany(company)}
                  >
                    <td className="py-5 px-4 xl:pl-7">
                      {/* FIX: Stacking Company Name, ID, Industry/Size */}
                      <div className="flex flex-col space-y-1">
                        <Typography variant="value" as="h5" className="font-semibold text-black dark:text-white">
                          {company.company_name}
                        </Typography>
                        <Typography variant="body" className="text-sm text-primary font-medium">
                          ID: {company.unique_company_id}
                        </Typography>
                        <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
                          {company.industry} • {company.company_size}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      {/* FIX: Stacking Admin Name, Email, Phone */}
                      <div className="flex flex-col space-y-1">
                        <Typography variant="value" className="font-medium text-black dark:text-white">{company.admin_name}</Typography>
                        <Typography variant="body" className="text-sm text-gray-600 dark:text-gray-400">{company.admin_email}</Typography>
                        <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">{company.phone}</Typography>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      {/* FIX: Stacking Package Name and Price */}
                      <div className="flex flex-col space-y-1">
                        <Typography variant="value" className="font-semibold text-black dark:text-white">{company.package_name}</Typography>
                        <Typography variant="body" className="text-sm text-primary font-medium">
                          ${company.package_price}/{company.duration_type}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col space-y-2">
                        <span
                          className={`inline-flex w-fit rounded-full py-1.5 px-3 text-sm font-semibold ${
                            company.is_active
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
                    </td>
                    <td className="py-5 px-4">
                      {/* FIX: Stacking Start Date, End Date, and Status */}
                      <div className="flex flex-col space-y-1 text-sm">
                        <Typography variant="body" className="text-black dark:text-white font-medium">
                          <Typography variant="caption" as="span" className="font-normal text-gray-500 dark:text-gray-400">Start:</Typography> {formatDate(company.subscription_start_date)}
                        </Typography>
                        <Typography variant="body" className="text-black dark:text-white font-medium">
                          <Typography variant="caption" as="span" className="font-normal text-gray-500 dark:text-gray-400">End:</Typography> {formatDate(company.subscription_end_date)}
                        </Typography>
                        <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold w-fit ${
                          isSubscriptionExpired(company.subscription_end_date)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            isSubscriptionExpired(company.subscription_end_date)
                              ? 'bg-red-600 dark:bg-red-400'
                              : 'bg-green-600 dark:bg-green-400'
                          }`}></span>
                          <Typography variant="caption" as="span" className="font-semibold">{isSubscriptionExpired(company.subscription_end_date) ? 'Expired' : 'Active'}</Typography>
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewCompany(company)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                          title="View Details"
                        >
                          <ArrowRight size={18} />
                        </button>
                        {isSuperAdmin && (
                          <>
                            {/* Subscription Update Link */}
                            <Link
                                href={`/companies/${company.id}/subscriptions`}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-warning dark:hover:text-warning"
                                title="Update Subscription"
                            >
                                <Package size={18} />
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(company)}
                              className={`p-2 rounded-lg transition-colors ${
                                activateMutation.isPending || deactivateMutation.isPending
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                              } ${
                                company.is_active
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
                              className={`p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:text-red-700 ${
                                deleteMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={deleteMutation.isPending}
                              title="Delete Company"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
        message={`Are you sure you want to ${actionType} "${selectedCompany?.company_name}"? ${
          actionType === 'deactivate'
            ? 'The company will lose access to the platform.'
            : 'The company will regain full access to the platform.'
        }`}
        onConfirm={confirmToggleStatus}
        confirmText={actionType === 'deactivate' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        isLoading={activateMutation.isPending || deactivateMutation.isPending}
      />
    </DefaultLayout>
  );
}