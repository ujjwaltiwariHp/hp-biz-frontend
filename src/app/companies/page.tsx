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
    mutationFn: companyService.activateCompany,
    onSuccess: () => {
      toast.success('Company activated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: companyService.deactivateCompany,
    onSuccess: () => {
      toast.success('Company deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: companyService.deleteCompany,
    onSuccess: () => {
      toast.success('Company deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
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
    if (confirm('Are you sure you want to delete this company?')) {
      deleteMutation.mutate(companyId);
    }
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
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-6 xl:px-7.5 pb-6">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded border border-stroke py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded border border-stroke py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
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
                  Subscription
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company: Company) => (
                <tr key={company.id}>
                  <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <div>
                      <h5 className="font-medium text-black dark:text-white">
                        {company.company_name}
                      </h5>
                      <p className="text-sm text-gray-500">
                        ID: {company.unique_company_id}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div>
                      <p className="text-black dark:text-white">{company.admin_name}</p>
                      <p className="text-sm text-gray-500">{company.admin_email}</p>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div>
                      <p className="text-black dark:text-white">{company.package_name}</p>
                      <p className="text-sm text-gray-500">
                        ${company.package_price}/{company.duration_type}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <span
                      className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                        company.is_active
                          ? 'bg-success text-success'
                          : 'bg-danger text-danger'
                      }`}
                    >
                      {company.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div>
                      <p className="text-sm text-black dark:text-white">
                        Start: {new Date(company.subscription_start_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-black dark:text-white">
                        End: {new Date(company.subscription_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button className="hover:text-primary">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleStatusToggle(company)}
                        className="hover:text-primary"
                        disabled={activateMutation.isPending || deactivateMutation.isPending}
                      >
                        {company.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                      <button className="hover:text-primary">
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="hover:text-danger"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between border-t border-stroke py-4 px-4 dark:border-strokedark md:px-6 xl:px-7.5">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalCount)} of {pagination.totalCount} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm border border-stroke rounded disabled:opacity-50 dark:border-strokedark"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm border border-stroke rounded disabled:opacity-50 dark:border-strokedark"
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