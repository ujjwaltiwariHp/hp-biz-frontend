'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useState } from 'react';
import { Company } from '@/types/company';
import { toast } from 'react-toastify';
import { Eye, UserCheck, UserX, Trash2, Edit } from 'lucide-react';

export default function CompaniesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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

  const handleStatusToggle = (company: Company) => {
    if (company.is_active) {
      deactivateMutation.mutate(company.id);
    } else {
      activateMutation.mutate(company.id);
    }
  };

  const handleDelete = (companyId: number) => {
    if (confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      deleteMutation.mutate(companyId);
    }
  };

  const handleViewCompany = (companyId: number) => {
    // Navigate to company details page or open modal
    console.log('View company:', companyId);
    // You can implement this based on your routing needs
  };

  const handleEditCompany = (company: Company) => {
    // Navigate to edit page or open edit modal
    console.log('Edit company:', company);
    // You can implement this based on your needs
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
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Companies Management
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Manage all registered companies and their subscriptions
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-6 xl:px-7.5 pb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Companies
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-stroke py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded border border-stroke py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
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
              className="px-4 py-2 text-sm border border-stroke rounded hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                  Company
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Admin
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Package
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Status
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Subscription Period
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((company: Company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <div>
                        <h5 className="font-medium text-black dark:text-white">
                          {company.company_name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          ID: {company.unique_company_id}
                        </p>
                        <p className="text-xs text-gray-400">
                          {company.industry} • {company.company_size}
                        </p>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div>
                        <p className="text-black dark:text-white font-medium">{company.admin_name}</p>
                        <p className="text-sm text-gray-500">{company.admin_email}</p>
                        <p className="text-xs text-gray-400">{company.phone}</p>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div>
                        <p className="text-black dark:text-white font-medium">{company.package_name}</p>
                        <p className="text-sm text-gray-500">
                          ${company.package_price}/{company.duration_type}
                        </p>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-flex w-fit rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                            company.is_active
                              ? 'bg-success text-success'
                              : 'bg-danger text-danger'
                          }`}
                        >
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {company.email_verified && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ✓ Email Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="text-sm">
                        <p className="text-black dark:text-white">
                          <span className="text-gray-500">Start:</span> {new Date(company.subscription_start_date).toLocaleDateString()}
                        </p>
                        <p className="text-black dark:text-white">
                          <span className="text-gray-500">End:</span> {new Date(company.subscription_end_date).toLocaleDateString()}
                        </p>
                        <p className={`text-xs mt-1 ${
                          new Date(company.subscription_end_date) > new Date()
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {new Date(company.subscription_end_date) > new Date() ? 'Active' : 'Expired'}
                        </p>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <button
                          onClick={() => handleViewCompany(company.id)}
                          className="hover:text-primary transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(company)}
                          className={`hover:text-primary transition-colors ${
                            activateMutation.isPending || deactivateMutation.isPending
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          disabled={activateMutation.isPending || deactivateMutation.isPending}
                          title={company.is_active ? 'Deactivate Company' : 'Activate Company'}
                        >
                          {company.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="hover:text-primary transition-colors"
                          title="Edit Company"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className={`hover:text-danger transition-colors ${
                            deleteMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={deleteMutation.isPending}
                          title="Delete Company"
                        >
                          <Trash2 size={18} />
                        </button>
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
          <div className="flex items-center justify-between border-t border-stroke py-4 px-4 dark:border-strokedark md:px-6 xl:px-7.5">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalCount)} of {pagination.totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm border border-stroke rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm border border-stroke rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}