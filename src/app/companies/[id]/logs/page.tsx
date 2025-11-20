'use client';

import React, { use, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  Filter,
  Download,
  AlertCircle,
  Activity,
  X,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { Typography } from '@/components/common/Typography';
import { useSearch } from '@/hooks/useSearch';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import { ActivityLog, LogFilters } from '@/types/logs';
import DateRangePicker from '@/components/common/DateRangePicker';
import { useSSE } from '@/hooks/useSSE';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
};

export default function CompanyLogsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>({
    action_type: '',
    resource_type: '',
    start_date: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    ip_address: '',
    search: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const MIN_SEARCH_LENGTH = 3;

  const [finalSearchQuery, setFinalSearchQuery] = useState('');

  const searchTrigger = useCallback(
    async (q: string) => {
      setFinalSearchQuery(q);
      setCurrentPage(1);
      return [];
    },
    []
  );

  const {
    query: searchInputQuery,
    handleSearch,
    handleClear,
    isLoading: isSearchDebouncing,
    handleSearchSubmit,
  } = useSearch(searchTrigger, 400, MIN_SEARCH_LENGTH);

  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const logsQueryKey = ['company-logs', companyId, currentPage, filters, finalSearchQuery];

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: logsQueryKey,
    queryFn: () =>
      logsService.getCompanyActivityLogs(companyId, {
        page: currentPage,
        limit: 20,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        search: finalSearchQuery || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Real-time updates for company logs
  useSSE('new_activity_log', logsQueryKey, { refetchQueries: true });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDateRangeChange = (newRange: { startDate: string, endDate: string }) => {
    setFilters(prev => ({ ...prev, start_date: newRange.startDate, end_date: newRange.endDate }));
    setCurrentPage(1);
  };

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
        <Typography variant="body1" className="text-base font-medium text-gray-600 dark:text-gray-400">
          Company not found
        </Typography>
      </div>
    );
  }

  const logColumns: TableColumn<ActivityLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      headerClassName: 'min-w-[140px] w-[14%]',
      render: (log) => (
        <Typography variant="caption" className="text-black dark:text-white">
          {formatDateTime(log.created_at)}
        </Typography>
      ),
    },
    {
      key: 'user',
      header: 'User',
      headerClassName: 'min-w-[180px] w-[20%]',
      render: (log) => (
        <div>
          <Typography variant="body" className="font-medium text-black dark:text-white">
            {log.first_name ? `${log.first_name} ${log.last_name || ''}` : 'System'}
          </Typography>
          {log.email && (
            <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
              {log.email}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: 'action_type',
      header: 'Action',
      headerClassName: 'min-w-[120px] w-[10%]',
      render: (log) => (
        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action_type || '')}`}>
          {log.action_type || 'ACTION'}
        </span>
      ),
    },
    {
      key: 'resource_type',
      header: 'Resource',
      headerClassName: 'min-w-[120px] w-[10%]',
      render: (log) => (
        <div>
          <Typography variant="body" className="font-medium text-black dark:text-white">
            {log.resource_type || 'N/A'}
          </Typography>
          {log.resource_id && (
            <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
              ID: {log.resource_id}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: 'action_details',
      header: 'Details',
      headerClassName: 'min-w-[300px] w-[30%]',
      className: 'whitespace-normal break-words',
      render: (log) => (
        <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
          {log.action_details || 'N/A'}
        </Typography>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP',
      headerClassName: 'min-w-[100px] w-[10%]',
      render: (log) => (
        <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
          {log.ip_address || 'N/A'}
        </Typography>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="page-title" as="h2">
            Activity Logs
          </Typography>
          <Typography variant="caption" className="text-gray-600 dark:text-gray-400 mt-1">
            All user and staff activities for {company.company_name}
          </Typography>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download size={14} />
            <Typography variant="body2" className="text-white">Export</Typography>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Search */}
            <div>
                <Typography variant="label" className="mb-2">
                    Search User, Action, or Details
                </Typography>
                <div className="relative">
                    <input
                        type="text"
                        placeholder={`Search logs (min ${MIN_SEARCH_LENGTH} chars)...`}
                        value={searchInputQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        className="w-full rounded border border-stroke py-2.5 pl-10 pr-10 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
                    />
                    <Search
                        size={18}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                            isSearchDebouncing ? 'text-primary animate-spin' : 'text-gray-400'
                        }`}
                    />
                    {searchInputQuery && (
                        <X
                            size={18}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-danger"
                            onClick={handleClear}
                        />
                    )}
                </div>
            </div>

            {/* 2. Action Type */}
            <div>
              <Typography variant="label" className="mb-2">
                Action Type
              </Typography>
              <select
                name="action_type"
                value={filters.action_type}
                onChange={handleFilterChange}
                className="w-full rounded border border-stroke py-2.5 px-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>

            {/* 3. Date Range */}
            <div className="flex items-end">
              <button
                onClick={() => setShowDatePicker(true)}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-sm border border-stroke rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-meta-4 w-full justify-center"
              >
                <Filter size={16} />
                <Typography variant="body2">
                    Date Range
                </Typography>
              </button>
            </div>

             {/* 4. Clear Filters */}
            <div className="flex items-end">
                <button
                    onClick={() => {
                        setFilters({ action_type: '', resource_type: '', start_date: '', end_date: '', ip_address: '', search: '' });
                        setFinalSearchQuery('');
                        handleClear();
                    }}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-stroke rounded hover:bg-white dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
                >
                    Clear Filters
                </button>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
        {logs.length > 0 || logsLoading ? (
            <DynamicTable<ActivityLog>
                data={logs as ActivityLog[]}
                columns={logColumns}
                isLoading={logsLoading}
            />
        ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-boxdark">
                <Activity size={48} className="mx-auto mb-3 opacity-50" />
                <Typography variant="body1" className="text-base font-medium">
                    {finalSearchQuery || filters.action_type || filters.resource_type || filters.start_date || filters.end_date
                         ? 'No activities found matching filters.'
                         : `No activity logs recorded for ${company.company_name}.`}
                </Typography>
                <Typography variant="caption" className="text-xs mt-1">
                    Try adjusting or clearing your filters.
                </Typography>
            </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_records > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <Typography variant="caption" className="text-xs text-gray-600 dark:text-gray-400">
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
          </Typography>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!pagination.has_prev}
              className="px-3 py-2 text-xs font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Previous
            </button>
            <Typography variant="body" className="px-3 py-2 text-xs font-semibold text-black dark:text-white">
              Page {currentPage} of {pagination.total_pages}
            </Typography>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))
              }
              disabled={!pagination.has_next}
              className="px-3 py-2 text-xs font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

    <DateRangePicker
        isOpen={showDatePicker}
        dateRange={{ startDate: filters.start_date ?? '', endDate: filters.end_date ?? '' }}
        setDateRange={handleDateRangeChange as any}
        onClose={() => setShowDatePicker(false)}
    />
    </div>
  );
}