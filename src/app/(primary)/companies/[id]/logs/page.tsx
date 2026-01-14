'use client';

import React, { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  Download,
  AlertCircle,
  Activity,
  X,
  User,
  Mail,
  Shield,
  RefreshCw,
  Code
} from 'lucide-react';
import { Typography } from '@/components/common/Typography';
import DynamicTable from '@/components/common/DynamicTable';
import TableSkeleton from '@/components/common/TableSkeleton';
import { SkeletonRect } from '@/components/common/Skeleton';
import { TableColumn } from '@/types/table';
import { ActivityLog, LogFilters, SystemLog } from '@/types/logs';
import { useSSE } from '@/hooks/useSSE';
import TableToolbar from '@/components/common/TableToolbar';

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

const getLevelColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'ERROR':
    case 'CRITICAL':
      return 'bg-danger/10 text-danger border border-danger/20';
    case 'WARN':
    case 'WARNING':
      return 'bg-warning/10 text-warning border border-warning/20';
    case 'INFO':
      return 'bg-primary/10 text-primary border border-primary/20';
    case 'SUCCESS':
      return 'bg-success/10 text-success border border-success/20';
    case 'DEBUG':
      return 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-meta-4 dark:text-gray-300 dark:border-strokedark';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-meta-4 dark:text-gray-300 dark:border-strokedark';
  }
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
  const [logType, setLogType] = useState<'activity' | 'system'>('activity');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [filters, setFilters] = useState<LogFilters>({
    action_type: undefined,
    resource_type: '',
    log_level: ''
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

  const logsQueryKey = ['company-logs', companyId, logType, currentPage, filters, dateRange, appliedSearchTerm];

  const { data: logsData, isLoading: logsLoading, refetch } = useQuery({
    queryKey: logsQueryKey,
    queryFn: () => {
      const apiFilters: LogFilters = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        company_id: companyId,
        type: logType,
        action_type: filters.action_type || undefined,
        resource_type: logType === 'activity' ? filters.resource_type : undefined,
        log_level: logType === 'system' ? filters.log_level : undefined,
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
  const handleLogTypeChange = (newType: 'activity' | 'system') => {
    setLogType(newType);
    setCurrentPage(1);
    setSearchTerm('');
    setAppliedSearchTerm('');
    setFilters({ action_type: undefined, resource_type: '', log_level: '' });
  };

  // ... existing search handlers ...
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
    // ... logic handled inside Toolbar now mostly, but if used directly:
    // setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateRangeApply = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const handleClearFilters = () => {
    setFilters({ action_type: undefined, resource_type: '', log_level: '' });
    setDateRange({ startDate: '', endDate: '' });
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      const blob = await logsService.exportLogs({
        type: logType,
        company_id: companyId,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        log_level: filters.log_level || undefined,
        start_date: getIsoDate(dateRange.startDate),
        end_date: getIsoDate(dateRange.endDate, true),
        search: appliedSearchTerm || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyResponse?.data?.company?.company_name || 'company'}-${logType}-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  // UPDATED: Only show full page loader if initial company data is loading
  if (companyLoading) {
    return (
      <div className="space-y-4">
        <SkeletonRect className="h-12 w-full mb-4" /> {/* Header */}
        <SkeletonRect className="h-12 w-full mb-4" /> {/* Filter bar */}
        <TableSkeleton columns={5} />
      </div>
    );
  }

  const company = companyResponse?.data?.company;
  const logs = logsData?.data?.logs || [];
  const pagination = logsData?.data?.pagination;

  const activeFiltersCount = [
    appliedSearchTerm,
    filters.action_type,
    filters.resource_type,
    filters.log_level,
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

  const systemLogColumns: TableColumn<SystemLog>[] = [
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
      key: 'log_level',
      header: 'Level',
      headerClassName: 'min-w-[100px]',
      render: (log) => (
        <span className={`inline-flex items-center justify-center rounded-md border py-1 px-2.5 text-xs font-bold ${getLevelColor(log.log_level || '')}`}>
          {log.log_level?.toUpperCase() || 'N/A'}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Message & Category',
      headerClassName: 'min-w-[350px]',
      render: (log) => (
        <div className="flex flex-col gap-1.5">
          {log.log_category && (
            <span className="inline-flex self-start items-center rounded-[4px] text-[9px] font-semibold bg-primary/10 text-primary px-1 py-px uppercase tracking-wider border border-primary/10">
              {log.log_category}
            </span>
          )}
          <Typography variant="body2" className="text-sm text-gray-700 dark:text-gray-200 font-medium whitespace-normal break-words leading-relaxed">
            {log.message || 'No message provided'}
          </Typography>
        </div>
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
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center p-1 bg-gray-100 dark:bg-meta-4 rounded-lg">
            <button
              onClick={() => handleLogTypeChange('activity')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${logType === 'activity'
                ? 'bg-white dark:bg-boxdark text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <Activity size={16} />
              Activity Logs
            </button>
            <button
              onClick={() => handleLogTypeChange('system')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${logType === 'system'
                ? 'bg-white dark:bg-boxdark text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <Code size={16} />
              System Logs
            </button>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors shadow-sm"
            >
              <Download size={18} />
              Export CSV
            </button>
            <button
              onClick={() => refetch()}
              disabled={logsLoading}
              className="p-2.5 border border-stroke rounded-lg hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4 transition-colors text-gray-600 dark:text-gray-300"
              title="Refresh Logs"
            >
              <RefreshCw size={18} className={logsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <TableToolbar
          searchConfig={{
            value: searchTerm,
            onChange: setSearchTerm,
            onSearch: handleSearch,
            onClear: handleClearSearch,
            placeholder: "Search logs...",
            isLoading: logsLoading,
          }}
          filterConfigs={[
            logType === 'activity' ? {
              key: 'action_type',
              label: 'Action Type',
              value: filters.action_type || '',
              onChange: (val: string) => {
                setFilters(prev => ({ ...prev, action_type: val }));
                setCurrentPage(1);
              },
              options: [
                { label: 'All Actions', value: '' },
                { label: 'Create', value: 'CREATE' },
                { label: 'Update', value: 'UPDATE' },
                { label: 'Delete', value: 'DELETE' },
                { label: 'Login', value: 'LOGIN' },
                { label: 'Logout', value: 'LOGOUT' },
              ],
            } : {
              key: 'log_level',
              label: 'Log Level',
              value: filters.log_level || '',
              onChange: (val: string) => {
                setFilters(prev => ({ ...prev, log_level: val }));
                setCurrentPage(1);
              },
              options: [
                { label: 'All Levels', value: '' },
                ...['ERROR', 'WARN', 'INFO', 'DEBUG', 'SUCCESS', 'CRITICAL'].map(level => ({ label: level, value: level.toLowerCase() }))
              ],
            },
            // Resource Type filter only for activity logs
            logType === 'activity' ? {
              key: 'resource_type',
              label: 'Resource Type',
              value: filters.resource_type || '',
              onChange: (val: string) => {
                setFilters(prev => ({ ...prev, resource_type: val }));
                setCurrentPage(1);
              },
              options: [
                { label: 'All Resources', value: '' },
                { label: 'Company', value: 'COMPANY' },
                { label: 'User', value: 'USER' },
                { label: 'Product', value: 'PRODUCT' },
                { label: 'Subscription', value: 'SUBSCRIPTION' },
                { label: 'Invoice', value: 'INVOICE' },
                { label: 'Payment', value: 'PAYMENT' },
                { label: 'API Key', value: 'API_KEY' },
                { label: 'Webhook', value: 'WEBHOOK' },
              ],
            } : null,
          ].filter(Boolean) as any}
          dateRangeConfig={{
            value: dateRange,
            onChange: setDateRange,
            onApply: handleDateRangeApply,
          }}
          activeFilters={{
            count: activeFiltersCount,
            filters: [
              appliedSearchTerm ? { key: 'search', label: 'Search', value: appliedSearchTerm } : null,
              (filters.action_type && logType === 'activity') ? { key: 'action', label: 'Action', value: filters.action_type } : null,
              (filters.resource_type && logType === 'activity') ? { key: 'resource', label: 'Resource', value: filters.resource_type } : null,
              (filters.log_level && logType === 'system') ? { key: 'level', label: 'Level', value: filters.log_level } : null,
            ].filter(Boolean) as any,
            onClearAll: handleClearFilters,
          }}
        />

        {logs.length > 0 || logsLoading ? (
          logType === 'activity' ? (
            <DynamicTable<ActivityLog>
              data={logs as ActivityLog[]}
              columns={logColumns}
              isLoading={logsLoading}
              skeletonConfig={{ rows: 5, columnWidths: [150, 220, 120, 140, 300, 110] }}
            />
          ) : (
            <DynamicTable<SystemLog>
              data={logs as SystemLog[]}
              columns={systemLogColumns}
              isLoading={logsLoading}
              skeletonConfig={{ rows: 5, columnWidths: [150, 100, 400, 250, 110] }}
            />
          )
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {logType === 'activity' ? (
              <>
                <Activity size={48} className="mx-auto mb-3 opacity-50" />
                <Typography variant="body1" className="text-base font-medium">
                  {appliedSearchTerm || filters.action_type || filters.resource_type || dateRange.startDate || dateRange.endDate
                    ? 'No activity logs found matching filters.'
                    : `No activity logs recorded for ${company.company_name}.`}
                </Typography>
                <Typography variant="caption" className="text-xs mt-1">
                  Try adjusting or clearing your filters.
                </Typography>
              </>
            ) : (
              <>
                <Code size={48} className="mx-auto mb-3 opacity-50" />
                <Typography variant="body1" className="text-base font-medium">
                  {appliedSearchTerm || filters.log_level || dateRange.startDate || dateRange.endDate
                    ? 'No system logs found matching filters.'
                    : `No system logs recorded for ${company.company_name}.`}
                </Typography>
                <Typography variant="caption" className="text-xs mt-1">
                  Try adjusting or clearing your filters.
                </Typography>
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_records > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t border-stroke dark:border-strokedark">
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
      </div>
    </div>
  );
}