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
  AlertCircle,
  Activity,
  X,
  User,
  Mail,
  Shield
} from 'lucide-react';
import { Typography } from '@/components/common/Typography';
import StandardSearchInput from '@/components/common/StandardSearchInput';
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

const getFormattedDateTime = (dateString: string) => {
  if (!dateString) return { date: 'N/A', time: '' };

  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return { date: 'Invalid Date', time: '' };

  const date = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const time = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return { date, time };
};

const getActionColor = (action: string) => {
    const safeAction = action?.toUpperCase() || '';
    if (safeAction.includes('CREATE') || safeAction.includes('ADD')) return 'bg-success/10 text-success border-success/20';
    if (safeAction.includes('UPDATE') || safeAction.includes('EDIT')) return 'bg-warning/10 text-warning border-warning/20';
    if (safeAction.includes('DELETE') || safeAction.includes('REMOVE')) return 'bg-danger/10 text-danger border-danger/20';
    if (safeAction.includes('LOGIN')) return 'bg-primary/10 text-primary border-primary/20';
    return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-meta-4 dark:text-gray-300 dark:border-strokedark';
};

const getIsoDate = (dateInput: string | Date | undefined, endOfDay: boolean = false) => {
    if (!dateInput) return undefined;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return undefined;

    if (endOfDay) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);

    return d.toISOString();
};

export default function CompanyLogsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id);
  const router = useRouter();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action_type: '',
    resource_type: '',
  });
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const logsQueryKey = ['company-logs', companyId, currentPage, filters, dateRange, appliedSearchTerm];

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: logsQueryKey,
    queryFn: () => {
      const apiFilters: LogFilters = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        company_id: companyId,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: getIsoDate(dateRange.startDate),
        end_date: getIsoDate(dateRange.endDate, true),
        search: appliedSearchTerm || undefined,
      };
      return logsService.getLogs(apiFilters);
    },
    staleTime: 30 * 1000,
  });

  useSSE('new_activity_log', logsQueryKey, { refetchQueries: true });

  // Handlers
  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDateRangeApply = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const handleClearFilters = () => {
    setFilters({ action_type: '', resource_type: '' });
    setDateRange({ startDate: '', endDate: '' });
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      const blob = await logsService.exportLogs({
        type: 'activity',
        company_id: companyId,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: getIsoDate(dateRange.startDate),
        end_date: getIsoDate(dateRange.endDate, true),
        search: appliedSearchTerm || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyResponse?.data?.company?.company_name || 'company'}-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  // UPDATED: Using consistent Common Loader Component
  if (companyLoading || logsLoading) {
    return <Loader variant="page" />;
  }

  const company = companyResponse?.data?.company;
  const logs = logsData?.data?.logs || [];
  const pagination = logsData?.data?.pagination;

  const activeFiltersCount = [
    appliedSearchTerm,
    filters.action_type,
    filters.resource_type,
    dateRange.startDate || dateRange.endDate
  ].filter(Boolean).length;

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
      headerClassName: 'min-w-[150px] pl-4',
      render: (log) => {
        const { date, time } = getFormattedDateTime(log.created_at);
        return (
          <div className="pl-4 flex flex-col">
            <Typography variant="value" className="text-sm font-bold text-black dark:text-white whitespace-nowrap">
              {date}
            </Typography>
            <Typography variant="value" className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {time}
            </Typography>
          </div>
        );
      },
    },
    {
      key: 'user_name',
      header: 'User',
      headerClassName: 'min-w-[220px]',
      render: (log) => (
        <div className="flex flex-col gap-1.5 py-1">
          {/* Row 1: User Name */}
          <div className="flex items-center gap-2">
            <User size={14} className="shrink-0 text-gray-400" />
            <div title={log.user_name || 'System'}>
                <Typography variant="value" className="text-sm font-bold text-black dark:text-white truncate max-w-[180px]">
                {log.user_name || 'System'}
                </Typography>
            </div>
          </div>

          {/* Row 2: Email */}
          {log.email && log.email !== 'System' && (
            <div className="flex items-center gap-2" title={log.email}>
              <Mail size={14} className="shrink-0 text-gray-400" />
              <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {log.email}
              </Typography>
            </div>
          )}

          {/* Row 3: Role Badge */}
          <div className="flex items-center gap-2">
             <Shield size={14} className="shrink-0 text-gray-400" />
             <span className={`
               inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border
               ${log.super_admin_id || log.user_type === 'Super Admin'
                 ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                 : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}
             `}>
               {log.super_admin_id || log.user_type === 'Super Admin' ? 'Super Admin' : (log.user_type || 'Staff')}
             </span>
          </div>
        </div>
      ),
    },
    {
      key: 'action_type',
      header: 'Action',
      headerClassName: 'min-w-[120px]',
      render: (log) => (
        <span className={`inline-flex items-center justify-center rounded-md border py-1 px-2.5 text-xs font-medium ${getActionColor(log.action_type || '')}`}>
          {log.action_type || 'ACTION'}
        </span>
      ),
    },
    {
      key: 'resource_type',
      header: 'Resource',
      headerClassName: 'min-w-[140px]',
      render: (log) => (
        <div className="flex flex-col">
          <Typography variant="value" className="text-sm font-medium text-black dark:text-white capitalize">
            {log.resource_type?.replace(/_/g, ' ') || 'N/A'}
          </Typography>
          {log.resource_id && (
            <Typography variant="caption" className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
              ID: {log.resource_id}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: 'action_details',
      header: 'Details',
      headerClassName: 'min-w-[300px]',
      render: (log) => (
        <Typography variant="body2" className="text-sm text-gray-600 dark:text-gray-300 whitespace-normal break-words leading-relaxed">
          {log.action_details || 'No details provided'}
        </Typography>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      headerClassName: 'min-w-[110px]',
      render: (log) => (
        <Typography variant="value" className="text-xs font-bold font-mono text-gray-600 dark:text-gray-300">
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
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Search User/Details
                </label>
                <StandardSearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    placeholder="Search logs..."
                    isLoading={logsLoading}
                />
            </div>

            {/* 2. Action Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Action Type
              </label>
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
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Date Range
              </label>
              <button
                onClick={() => setShowDatePicker(true)}
                className="inline-flex items-center justify-between gap-2 px-3 py-2.5 text-sm border border-stroke rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-meta-4 w-full text-left"
              >
                <span className="truncate text-black dark:text-white">
                    {dateRange.startDate && dateRange.endDate ? `${dateRange.startDate} - ${dateRange.endDate}` : 'Filter by Date'}
                </span>
                <Filter size={16} className="text-gray-500" />
              </button>
            </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-primary">
                        Active Filters ({activeFiltersCount}):
                    </span>
                    {appliedSearchTerm && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                            Search: {appliedSearchTerm}
                        </span>
                    )}
                    {filters.action_type && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                            Action: {filters.action_type}
                        </span>
                    )}
                    {(dateRange.startDate || dateRange.endDate) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-boxdark rounded text-xs border border-stroke dark:border-strokedark">
                            Date: {dateRange.startDate} - {dateRange.endDate}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
                >
                    <X size={16} />
                    Clear All
                </button>
            </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden shadow-sm bg-white dark:bg-boxdark">
        {logs.length > 0 || logsLoading ? (
            <DynamicTable<ActivityLog>
                data={logs as ActivityLog[]}
                columns={logColumns}
                isLoading={logsLoading}
            />
        ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Activity size={48} className="mx-auto mb-3 opacity-50" />
                <Typography variant="body1" className="text-base font-medium">
                    {appliedSearchTerm || filters.action_type || filters.resource_type || dateRange.startDate || dateRange.endDate
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
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-black dark:text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total_records)}
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
            <span className="px-3 py-2 text-xs font-semibold text-black dark:text-white bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg">
              {currentPage} / {pagination.total_pages}
            </span>
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
        dateRange={dateRange}
        setDateRange={setDateRange}
        onClose={() => setShowDatePicker(false)}
        onApply={handleDateRangeApply}
    />
    </div>
  );
}