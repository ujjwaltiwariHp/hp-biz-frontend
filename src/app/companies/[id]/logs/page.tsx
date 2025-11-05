'use client';

import React, { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  Filter,
  Download,
  Search,
  Calendar,
  AlertCircle,
  Activity,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompanyLogsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    action_type: '',
    resource_type: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch company data
  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch activity logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['company-logs', companyId, currentPage, filters],
    queryFn: () =>
      logsService.getCompanyActivityLogs(companyId, {
        page: currentPage,
        limit: 20,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      const blob = await logsService.exportLogs('activity', {
        company_id: companyId,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyResponse?.data?.company?.company_name}-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
  };

  if (companyLoading || logsLoading) {
    return <Loader />;
  }

  const company = companyResponse?.data?.company;
  const logs = logsData?.data?.logs || [];
  const pagination = logsData?.data?.pagination;

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Activity Logs
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            All user and staff activities for {company.company_name}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'bg-primary text-white border-primary'
                : 'border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action Type
              </label>
              <select
                value={filters.action_type}
                onChange={(e) => {
                  setFilters({ ...filters, action_type: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resource Type
              </label>
              <select
                value={filters.resource_type}
                onChange={(e) => {
                  setFilters({ ...filters, resource_type: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="">All Resources</option>
                <option value="LEAD">Lead</option>
                <option value="STAFF">Staff</option>
                <option value="ACTIVITY">Activity</option>
                <option value="SETTINGS">Settings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => {
                  setFilters({ ...filters, start_date: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => {
                  setFilters({ ...filters, end_date: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by user, action, or resource..."
          className="w-full rounded border border-stroke py-2.5 pl-10 pr-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-meta-4">
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Timestamp
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  User
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Action
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Resource
                </th>
                <th className="py-4 px-6 font-semibold text-black dark:text-white">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Activity size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No activity logs found</p>
                    <p className="text-sm mt-1">
                      This company has no recorded activities yet
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={`log-${log.id}-${index}`}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-black dark:text-white">
                          {formatDateTime((log as any).created_at)}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {(log as any).first_name?.charAt(0) || '?'}{(log as any).last_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {(log as any).first_name ? `${(log as any).first_name} ${(log as any).last_name || ''}` : 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(log as any).email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          (log as any).action_type === 'CREATE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : (log as any).action_type === 'UPDATE'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : (log as any).action_type === 'DELETE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : (log as any).action_type === 'LOGIN'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {(log as any).action_type || 'ACTION'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          {(log as any).resource_type || 'N/A'}
                        </p>
                        {(log as any).resource_id && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {(log as any).resource_id}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p
                        className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
                        title={(log as any).action_details || ''}
                      >
                        {(log as any).action_details || 'N/A'}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_records > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing{' '}
            <span className="font-semibold text-black dark:text-white">
              {(currentPage - 1) * 20 + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-black dark:text-white">
              {Math.min(currentPage * 20, pagination.total_records)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-black dark:text-white">
              {pagination.total_records}
            </span>{' '}
            results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!pagination.has_prev}
              className="px-4 py-2 text-sm font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-black dark:text-white">
              Page {currentPage} of {pagination.total_pages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))
              }
              disabled={!pagination.has_next}
              className="px-4 py-2 text-sm font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}