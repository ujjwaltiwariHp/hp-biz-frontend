'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import React, { useState } from 'react';
import { SystemLog } from '@/types/logs';
import { Filter, Download, Search, Calendar, FileText, X, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function SystemLogsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    log_level: '',
    log_category: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(''); // <-- new state

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['system-logs', currentPage, filters],
    queryFn: () => logsService.getAllSystemLogs({
      page: currentPage,
      limit: 20,
      log_level: filters.log_level || undefined,
      log_category: filters.log_category || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
    }),
  });

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      const blob = await logsService.exportLogs('system', {
        log_level: filters.log_level || undefined,
        log_category: filters.log_category || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('System logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const clearFilters = () => {
    setFilters({
      log_level: '',
      log_category: '',
      start_date: '',
      end_date: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
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

  const logs = (logsData?.data?.logs as SystemLog[]) || [];
  const pagination = logsData?.data?.pagination;

  // REMOVE client-side filtering
  const filteredLogs = logs;

  return (
    <DefaultLayout>
      <div className="mb-6">
        <button
          onClick={() => router.push('/logs')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-4"
        >
          <ArrowLeft size={16} />
          Back to Logs
        </button>
        <h2 className="text-title-md2 font-semibold text-black dark:text-white mb-2">
          System Logs
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Monitor system-level events, errors, and diagnostics
        </p>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              System Event Logs
            </h4>
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
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 md:p-6 xl:p-7.5 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Log Level
                </label>
                <select
                  value={filters.log_level}
                  onChange={(e) => {
                    setFilters({ ...filters, log_level: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                >
                  <option value="">All Levels</option>
                  <option value="ERROR">Error</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                  <option value="DEBUG">Debug</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.log_category}
                  onChange={(e) => {
                    setFilters({ ...filters, log_category: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="AUTH">Authentication</option>
                  <option value="API">API</option>
                  <option value="DATABASE">Database</option>
                  <option value="SYSTEM">System</option>
                  <option value="SECURITY">Security</option>
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

            {(filters.log_level || filters.log_category || filters.start_date || filters.end_date) && (
              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-stroke rounded-lg hover:bg-white dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        <div className="p-4 md:p-6 xl:p-7.5 border-b border-stroke dark:border-strokedark">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company, category, or message..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setFilters({ ...filters, search: searchInput });
                  setCurrentPage(1);
                }
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
                  Timestamp
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Level
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Category
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Company
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  User
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Message
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No system logs found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="py-4 px-4 xl:pl-7">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-black dark:text-white">{formatDateTime(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        log.log_level === 'ERROR' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        log.log_level === 'WARNING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        log.log_level === 'INFO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {log.log_level}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                        {log.log_category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-black dark:text-white">
                        {log.company_name || 'System'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {log.first_name && log.last_name ? (
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {log.first_name} {log.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{log.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">System</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md" title={log.message}>
                        {log.message}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {log.ip_address || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total_records > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stroke py-4 px-4 dark:border-strokedark md:px-6 xl:px-7.5 bg-gray-50 dark:bg-meta-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-black dark:text-white">{((currentPage - 1) * 20) + 1}</span> to <span className="font-semibold text-black dark:text-white">{Math.min(currentPage * 20, pagination.total_records)}</span> of <span className="font-semibold text-black dark:text-white">{pagination.total_records}</span> results
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
                onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                disabled={!pagination.has_next}
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
