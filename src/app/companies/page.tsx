'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useState } from 'react';
import { Company } from '@/types/company';
import { toast } from 'react-toastify';
import { Eye, UserCheck, UserX, Trash2, X, Building, Mail, Phone, Globe, Calendar, Package, Plus } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function CompaniesPage() {
  const { isSuperAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewCompanyModal, setViewCompanyModal] = useState<Company | null>(null);

  // Dialog hooks
  const deleteDialog = useConfirmDialog();
  const toggleDialog = useConfirmDialog();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('deactivate');

  const queryClient = useQueryClient();

  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies', currentPage, searchTerm, statusFilter],
    queryFn: () => companyService.getCompanies({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

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

  // NEW HANDLER: Opens the toggle status confirmation dialog
  const handleToggleStatus = (company: Company) => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: View-only access.');
      return;
    }
    setSelectedCompany(company);
    setActionType(company.is_active ? 'deactivate' : 'activate');
    toggleDialog.openDialog();
  };

  // NEW HANDLER: Confirms and executes the status toggle action
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

  // UPDATED HANDLER: Opens the delete confirmation dialog
  const handleDelete = (company: Company) => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: View-only access.');
      return;
    }
    setSelectedCompany(company);
    deleteDialog.openDialog();
  };

  // NEW HANDLER: Confirms and executes the delete action
  const confirmDelete = () => {
    if (!selectedCompany) return;
    deleteMutation.mutate(selectedCompany.id);
    deleteDialog.closeDialog();
    setSelectedCompany(null);
  };

  const handleViewCompany = (company: Company) => {
    setViewCompanyModal(company);
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
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Companies Management
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all registered companies and their subscriptions
            </p>
          </div>
          {isSuperAdmin && (
            <Link
              href="/companies/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
              title="Provision a new company account and assign subscription"
            >
              <Plus size={20} />
              Provision Company
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Companies
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
              Filter by Status
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
              <tr className="bg-gray-100 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-semibold text-black dark:text-white xl:pl-7">
                  Company
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Admin
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Package
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Status
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Subscription
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Building size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No companies found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                companies.map((company: Company) => (
                  <tr key={company.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="py-5 px-4 xl:pl-7">
                      <div>
                        <h5 className="font-semibold text-black dark:text-white">
                          {company.company_name}
                        </h5>
                        <p className="text-sm text-primary font-medium mt-0.5">
                          ID: {company.unique_company_id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {company.industry} • {company.company_size}
                        </p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div>
                        <p className="font-medium text-black dark:text-white">{company.admin_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{company.admin_email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{company.phone}</p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div>
                        <p className="font-semibold text-black dark:text-white">{company.package_name}</p>
                        <p className="text-sm text-primary font-medium mt-0.5">
                          ${company.package_price}/{company.duration_type}
                        </p>
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
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {company.email_verified && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                            Email Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="text-sm">
                        <p className="text-black dark:text-white font-medium">
                          <span className="text-gray-500 dark:text-gray-400 font-normal">Start:</span> {formatDate(company.subscription_start_date)}
                        </p>
                        <p className="text-black dark:text-white font-medium mt-1">
                          <span className="text-gray-500 dark:text-gray-400 font-normal">End:</span> {formatDate(company.subscription_end_date)}
                        </p>
                        <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold ${
                          isSubscriptionExpired(company.subscription_end_date)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            isSubscriptionExpired(company.subscription_end_date)
                              ? 'bg-red-600 dark:bg-red-400'
                              : 'bg-green-600 dark:bg-green-400'
                          }`}></span>
                          {isSubscriptionExpired(company.subscription_end_date) ? 'Expired' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewCompany(company)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {isSuperAdmin && (
                          <>
                            {/* Subscription Update Link */}
                            <Link
                                href={`/companies/${company.id}/subscription-update`}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-warning dark:hover:text-warning"
                                title="Update Subscription"
                            >
                                <Package size={18} />
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(company)} // UPDATED to use new handler
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
                              onClick={() => handleDelete(company)} // UPDATED to use new handler (opens dialog)
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
              Showing <span className="font-semibold text-black dark:text-white">{((currentPage - 1) * 10) + 1}</span> to <span className="font-semibold text-black dark:text-white">{Math.min(currentPage * 10, pagination.totalCount)}</span> of <span className="font-semibold text-black dark:text-white">{pagination.totalCount}</span> results
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

      {/* View Company Modal - KEPT AS IS */}
      {viewCompanyModal && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-boxdark shadow-xl m-4">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white dark:bg-boxdark dark:border-strokedark p-6">
              <h3 className="text-xl font-semibold text-black dark:text-white">Company Details</h3>
              <button
                onClick={() => setViewCompanyModal(null)}
                className="text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <Building className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Company Name</p>
                      <p className="font-semibold text-black dark:text-white">{viewCompanyModal.company_name}</p>
                      <p className="text-sm text-primary font-medium mt-1">ID: {viewCompanyModal.unique_company_id}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <Mail className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Admin Email</p>
                      <p className="font-medium text-black dark:text-white break-all">{viewCompanyModal.admin_email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{viewCompanyModal.admin_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <Phone className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                      <p className="font-medium text-black dark:text-white">{viewCompanyModal.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <Globe className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Website</p>
                      <a
                        href={viewCompanyModal.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline break-all"
                      >
                        {viewCompanyModal.website}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Industry</p>
                    <p className="font-semibold text-black dark:text-white">{viewCompanyModal.industry}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Company Size</p>
                    <p className="font-semibold text-black dark:text-white">{viewCompanyModal.company_size}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Address</p>
                    <p className="font-medium text-black dark:text-white">{viewCompanyModal.address}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Account Status</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full py-1.5 px-3 text-sm font-semibold ${
                        viewCompanyModal.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          viewCompanyModal.is_active ? 'bg-green-700 dark:bg-green-400' : 'bg-red-700 dark:bg-red-400'
                        }`}></span>
                        {viewCompanyModal.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {viewCompanyModal.email_verified && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 py-1.5 px-3 text-sm font-semibold text-blue-700 dark:text-blue-400">
                          Email Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stroke dark:border-strokedark pt-6">
                <h4 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                  <Package size={20} className="text-primary" />
                  Subscription Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Package</p>
                    <p className="text-lg font-bold text-primary">{viewCompanyModal.package_name}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Price</p>
                    <p className="text-lg font-bold text-primary">${viewCompanyModal.package_price}/{viewCompanyModal.duration_type}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</p>
                    </div>
                    <p className="font-semibold text-black dark:text-white">{formatDate(viewCompanyModal.subscription_start_date)}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">End Date</p>
                    </div>
                    <p className="font-semibold text-black dark:text-white">{formatDate(viewCompanyModal.subscription_end_date)}</p>
                    <span className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold ${
                      isSubscriptionExpired(viewCompanyModal.subscription_end_date)
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isSubscriptionExpired(viewCompanyModal.subscription_end_date)
                          ? 'bg-red-600 dark:bg-red-400'
                          : 'bg-green-600 dark:bg-green-400'
                      }`}></span>
                      {isSubscriptionExpired(viewCompanyModal.subscription_end_date) ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-stroke dark:border-strokedark pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                    <p className="font-medium text-black dark:text-white">{formatDate(viewCompanyModal.created_at)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                    <p className="font-medium text-black dark:text-white">{formatDate(viewCompanyModal.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
              <button
                onClick={() => setViewCompanyModal(null)}
                className="w-full rounded-lg bg-primary py-3 px-6 font-medium text-white hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


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