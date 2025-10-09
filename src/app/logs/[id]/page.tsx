'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import { companyService } from '@/services/company.service';
import { useState, use } from 'react';
import { ActivityLog } from '@/types/logs';
import { Filter, Download, Search, Calendar, ArrowLeft, Building, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function CompanyLogsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    action_type: '',
    resource_type: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: companyData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['company-logs', companyId, currentPage, filters],
    queryFn: () => logsService.getCompanyActivityLogs(companyId, {
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
        company_id: companyId,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyData?.data?.company?.company_name}-logs-${Date.now()}.csv`;
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

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  const company = companyData?.data?.company;
  const logs = (logsData?.data?.logs as ActivityLog[]) || [];
  const pagination = logsData?.data?.pagination;

  const filteredLogs = filters.search
    ? logs.filter(log =>
        log.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.action_type?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : logs;

  return (
    <DefaultLayout>
      <div className="mb-6">
        <button
          onClick={() => router.push('/logs')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-4"
        >
          <ArrowLeft size={16} />
          Back to Companies
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-title-md2 font-semibold text-black dark:text-white mb-2">
              Company Activity Logs
            </h2>
            {company && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-primary" />
                  <span className="font-semibold text-black dark:text-white">{company.company_name}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">ID: {company.unique_company_id}</span>
                <span className="text-gray-400">•</span>
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                  company.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {company.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Activity Timeline
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                All user and staff activities for this company
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

        <div className="p-4 md:p-6 xl:p-7.5 border-b border-stroke dark:border-strokedark">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by user, action, or resource..."
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
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <User size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No activity logs found</p>
                    <p className="text-sm mt-1">This company has no recorded activities yet</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={`company-log-${companyId}-${log.id}-${index}-${log.created_at}`} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="py-4 px-4 xl:pl-7">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-black dark:text-white">{formatDateTime(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {log.first_name?.charAt(0)}{log.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {log.first_name} {log.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{log.email}</p>
                          <span className="inline-flex mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {log.user_type}
                          </span>
                        </div>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate" title={log.action_details}>
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