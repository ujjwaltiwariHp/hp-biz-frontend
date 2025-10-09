'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { useState } from 'react';
import { Company } from '@/types/company';
import { useRouter } from 'next/navigation';
import { Building, Eye, Activity, Calendar, FileText, Search } from 'lucide-react';

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies-for-logs', currentPage, searchTerm],
    queryFn: () => companyService.getCompanies({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
    }),
  });

  const handleViewLogs = (companyId: number) => {
    router.push(`/logs/${companyId}`);
  };

  const handleViewAllLogs = () => {
    router.push('/logs/all');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white mb-2">
          Activity Logs
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View and monitor activity logs for all companies
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleViewAllLogs}
          className="p-6 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Activity size={24} />
                </div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  View All Activity Logs
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access comprehensive activity logs across all companies
              </p>
            </div>
            <Eye className="text-primary group-hover:translate-x-1 transition-transform" size={20} />
          </div>
        </button>

        <button
          onClick={() => router.push('/logs/system')}
          className="p-6 rounded-lg border-2 border-stroke dark:border-strokedark hover:border-primary hover:bg-primary/5 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  View System Logs
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor system-level events and errors
              </p>
            </div>
            <Eye className="text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
          </div>
        </button>
      </div>

      {/* Companies List */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Company Activity Logs
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select a company to view their detailed activity logs
          </p>
        </div>

        <div className="px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search companies by name or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded border border-stroke py-2.5 pl-10 pr-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
            />
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
                  Status
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Last Updated
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Building size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No companies found</p>
                    <p className="text-sm mt-1">Try adjusting your search</p>
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
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div>
                        <p className="font-medium text-black dark:text-white">{company.admin_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{company.admin_email}</p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <span
                        className={`inline-flex rounded-full py-1.5 px-3 text-sm font-semibold ${
                          company.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {company.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={16} />
                        {formatDate(company.updated_at)}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <button
                        onClick={() => handleViewLogs(company.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Activity size={16} />
                        View Logs
                      </button>
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
    </DefaultLayout>
  );
}