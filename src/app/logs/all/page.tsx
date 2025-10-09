'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import { useState } from 'react';
import { ActivityLog } from '@/types/logs';
import { Filter, Download, Search, Calendar, User, FileText, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function AllLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    action_type: '',
    resource_type: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['all-activity-logs', currentPage, filters],
    queryFn: () => logsService.getAllActivityLogs({
      page: currentPage,
      limit: 20,
      action_type: filters.action_type || undefined,
      resource_type: filters.resource_type || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
    }),
  });

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      const blob = await logsService.exportLogs('activity', {
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const clearFilters = () => {
    setFilters({
      action_type: '',
      resource_type: '',
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

  const logs = (logsData?.data?.logs as ActivityLog[]) || [];
  const pagination = logsData?.data?.pagination;

  const filteredLogs = filters.search
    ? logs.filter(log =>
        log.company_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.action_type?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : logs;

  return (
    <DefaultLayout>
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white mb-2">
          All Activity Logs
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Comprehensive view of all activity logs across all companies
        </p>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Activity Logs
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
                  <option value="COMPANY">Company</option>
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

            {(filters.action_type || filters.resource_type || filters.start_date || filters.end_date) && (
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
              placeholder="Search by company, email, or action..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
                  Company
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  User
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Action
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Resource
                </th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white">
                  Details
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
                    <p className="text-lg font-medium">No logs found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={`log-${log.id}-${index}`} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="py-4 px-4 xl:pl-7">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-black dark:text-white">{formatDateTime(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-black dark:text-white">
                        {log.company_name || 'System'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          {log.first_name} {log.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{log.email}</p>
                        <span className="inline-flex mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {log.user_type}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        log.action_type === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        log.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        log.action_type === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        log.action_type === 'LOGIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-black dark:text-white">{log.resource_type}</p>
                        {log.resource_id && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {log.resource_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={log.action_details}>
                        {log.action_details || 'N/A'}
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