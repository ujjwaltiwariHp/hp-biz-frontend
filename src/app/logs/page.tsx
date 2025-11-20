'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import { ActivityLog, LogFilters, SystemLog } from '@/types/logs';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { Typography } from '@/components/common/Typography';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import { Download, RefreshCw, Filter, Zap, Code } from 'lucide-react';
import { toast } from 'react-toastify';
import DateRangePicker from '@/components/common/DateRangePicker';
import { useSSE } from '@/hooks/useSSE';
import GlobalSearchInput from '@/components/common/GlobalSearchInput';

type LogType = 'activity' | 'system';

const formatLogDate = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
  });
};

const getActionColor = (action: string) => {
  if (action.includes('CREATE') || action.includes('ADD')) return 'bg-success/10 text-success';
  if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-warning/10 text-warning';
  if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-danger/10 text-danger';
  return 'bg-primary/10 text-primary';
};

const getLevelColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'ERROR':
      return 'bg-danger/10 text-danger border border-danger/20';
    case 'WARN':
      return 'bg-warning/10 text-warning border border-warning/20';
    case 'INFO':
      return 'bg-primary/10 text-primary border border-primary/20';
    case 'DEBUG':
      return 'bg-meta-5/10 text-meta-5 border border-meta-5/20';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

const getDefaultDateRange = () => ({
  start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
});


const initialFilters: LogFilters = {
  search: '',
  resource_type: '',
  log_level: '',
  action_type: undefined,
  log_category: undefined,
  ip_address: undefined,
  ...getDefaultDateRange(),
};

export default function LogsPage() {
  const [logType, setLogType] = useState<LogType>('activity');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>(initialFilters);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [localSearchTerm, setLocalSearchTerm] = useState(filters.search || '');

  const logsQueryKey = [logType, currentPage, filters];

  const { data: logsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: logsQueryKey,
    queryFn: () => {
      const apiFilters: LogFilters = {
        ...filters,
        page: currentPage,
        limit: 10,
        resource_type: logType === 'activity' ? filters.resource_type : undefined,
        log_level: logType === 'system' ? filters.log_level : undefined,
        action_type: undefined,
        log_category: undefined,
        ip_address: undefined,
        search: filters.search || undefined,
      };

      return logsService.getLogs(logType, apiFilters);
    },
  });

  useSSE('sa_new_activity_log', logsQueryKey, { refetchQueries: true });
  useSSE('sa_new_system_log', logsQueryKey, { refetchQueries: true });

  const logs = logsData?.data?.logs || [];
  const pagination = logsData?.data?.pagination;

  const handleLogTypeChange = (newType: LogType) => {
    setLogType(newType);
    setCurrentPage(1);
    setFilters(initialFilters);
    setLocalSearchTerm(initialFilters.search || '');
  };

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleGlobalSearch = (newSearchTerm: string) => {
    setFilters(prev => ({ ...prev, search: newSearchTerm }));
    setCurrentPage(1);
  };

  const handleDateRangeChange = (newRange: { startDate: string, endDate: string }) => {
    setFilters(prev => ({ ...prev, start_date: newRange.startDate, end_date: newRange.endDate }));
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      toast.info(`Preparing ${logType} logs for export...`);
      const blob = await logsService.exportLogs(logType, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${logType}_logs_${filters.start_date}_to_${filters.end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setLocalSearchTerm(initialFilters.search || '');
    setCurrentPage(1);
  };

  const activityLogColumns: TableColumn<ActivityLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      headerClassName: 'min-w-[120px]',
      render: (log) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" className="font-medium text-black dark:text-white">{formatLogDate(log.created_at)}</Typography>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User & Company',
      headerClassName: 'min-w-[200px]',
      render: (log) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" className="font-semibold text-black dark:text-white">
            {log.first_name || 'System'} {log.last_name}
          </Typography>
          <Typography variant="body" className="text-sm text-gray-600 dark:text-gray-400">
            {log.company_name || 'Super Admin'}
          </Typography>
          {log.email && <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">{log.email}</Typography>}
        </div>
      ),
    },
    {
      key: 'action_type',
      header: 'Action',
      headerClassName: 'min-w-[100px]',
      render: (log) => (
        <span className={`inline-flex rounded-full py-1 px-3 text-xs font-medium ${getActionColor(log.action_type || '')}`}>
          <Typography variant="badge">{log.action_type || 'N/A'}</Typography>
        </span>
      ),
    },
    {
      key: 'resource_type',
      header: 'Resource',
      headerClassName: 'min-w-[120px]',
      render: (log) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" className="font-medium text-black dark:text-white">
            {log.resource_type || 'N/A'}
          </Typography>
          {log.resource_id && <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">ID: {log.resource_id}</Typography>}
        </div>
      ),
    },
    {
      key: 'action_details',
      header: 'Details',
      headerClassName: 'min-w-[300px]',
      render: (log) => (
        <Typography variant="body2" className="text-gray-600 dark:text-gray-300 max-w-lg whitespace-normal break-words">
          {log.action_details || 'No details provided'}
        </Typography>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      headerClassName: 'min-w-[100px]',
      render: (log) => (
        <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
          {log.ip_address || 'N/A'}
        </Typography>
      ),
    },
  ];

  const systemLogColumns: TableColumn<SystemLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      headerClassName: 'min-w-[120px]',
      render: (log) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="value" className="font-medium text-black dark:text-white">{formatLogDate(log.created_at)}</Typography>
        </div>
      ),
    },
    {
      key: 'log_level',
      header: 'Level',
      headerClassName: 'min-w-[80px]',
      render: (log) => (
        <span className={`inline-flex rounded-full py-1 px-3 text-xs font-semibold ${getLevelColor(log.log_level || '')}`}>
          <Typography variant="badge">{log.log_level?.toUpperCase() || 'N/A'}</Typography>
        </span>
      ),
    },
    {
      key: 'company',
      header: 'Company & Admin',
      headerClassName: 'min-w-[200px]',
      render: (log) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="body" className="font-medium text-black dark:text-white">
            {log.company_name || 'System'}
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
      key: 'message',
      header: 'Error Message & Details',
      headerClassName: 'min-w-[350px]',
      render: (log) => (
        <div className="flex flex-col space-y-1">
          <Typography variant="body2" className="text-gray-800 dark:text-gray-100 font-medium whitespace-normal break-words">
            {log.message || 'No message provided'}
          </Typography>
          {log.log_category && (
            <Typography variant="caption" className="text-xs text-primary font-medium">
              Category: {log.log_category}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      headerClassName: 'min-w-[100px]',
      render: (log) => (
        <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
          {log.ip_address || 'N/A'}
        </Typography>
      ),
    },
  ];

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 md:px-6 xl:px-7.5 py-6 bg-gray-50 dark:bg-meta-4">
      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Typography variant="label" as="span">Global Search</Typography>
        </label>
        <GlobalSearchInput
          searchTerm={localSearchTerm || ''}
          onSearchChange={(newTerm) => {
            setLocalSearchTerm(newTerm);
            handleGlobalSearch(newTerm);
          }}
          placeholder="Search all columns..."
        />
      </div>

      <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Typography variant="label" as="span">{logType === 'activity' ? 'Resource Type' : 'Log Level'}</Typography>
        </label>
        {logType === 'activity' ? (
          <input
            type="text"
            placeholder="e.g. COMPANY, USER"
            value={filters.resource_type || ''}
            onChange={(e) => handleFilterChange('resource_type', e.target.value)}
            className="w-full rounded border border-stroke py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm"
          />
        ) : (
          <select
            value={filters.log_level || ''}
            onChange={(e) => handleFilterChange('log_level', e.target.value)}
            className="w-full rounded border border-stroke py-2.5 px-4 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary text-sm"
          >
            <option value="">All Levels</option>
            {['ERROR', 'WARN', 'INFO', 'DEBUG'].map(level => (
              <option key={level} value={level.toLowerCase()}>{level}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-end md:col-span-1">
        <button
          onClick={() => setIsDatePickerOpen(true)}
          className="flex w-full items-center gap-2 rounded border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors justify-center"
        >
          <Filter size={16} />
          <Typography variant="body2">
            {filters.start_date && filters.end_date ? `${filters.start_date} → ${filters.end_date}` : 'Filter by Date'}
          </Typography>
        </button>
      </div>

      <div className="flex items-end md:col-span-1">
        <button
          onClick={handleClearFilters}
          className="w-full px-4 py-2.5 text-sm font-medium border border-stroke rounded hover:bg-white dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );

  const renderTable = () => {
    if (logType === 'activity') {
      return (
        <DynamicTable<ActivityLog>
          data={logs as ActivityLog[]}
          columns={activityLogColumns}
          isLoading={isLoading}
        />
      );
    }
    return (
      <DynamicTable<SystemLog>
        data={logs as SystemLog[]}
        columns={systemLogColumns}
        isLoading={isLoading}
      />
    );
  };

  const EmptyState = ({ type }: { type: LogType }) => (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      {type === 'activity' ? (
        <Zap size={48} className="mx-auto mb-3 opacity-50" />
      ) : (
        <Code size={48} className="mx-auto mb-3 opacity-50" />
      )}
      <Typography variant="value" className="text-lg font-medium">No {type} logs found</Typography>
      <Typography variant="caption" className="text-sm mt-1">Try adjusting your filters or date range</Typography>
    </div>
  );

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Logs Management" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLogTypeChange('activity')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                logType === 'activity'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-black hover:bg-gray-300 dark:bg-meta-4 dark:text-white dark:hover:bg-meta-5'
              }`}
            >
              <Zap size={20} />
              <Typography variant="body" as="span" className={logType === 'activity' ? 'text-white' : 'text-black dark:text-white'}>Activity Logs</Typography>
            </button>
            <button
              onClick={() => handleLogTypeChange('system')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                logType === 'system'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-black hover:bg-gray-300 dark:bg-meta-4 dark:text-white dark:hover:bg-meta-5'
              }`}
            >
              <Code size={20} />
              <Typography variant="body" as="span" className={logType === 'system' ? 'text-white' : 'text-black dark:text-white'}>System Logs</Typography>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
            >
              <Download size={20} />
              <Typography variant="body" as="span" className="text-white">Export</Typography>
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 border border-stroke rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {renderFilters()}

        {logs.length > 0 || isLoading ? (
          renderTable()
        ) : (
          <EmptyState type={logType} />
        )}

        {pagination && pagination.total_records > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stroke py-4 px-4 dark:border-strokedark md:px-6 xl:px-7.5 bg-gray-50 dark:bg-meta-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <Typography variant="caption">
                Showing <span className="font-semibold text-black dark:text-white">{((currentPage - 1) * 10) + 1}</span> to <span className="font-semibold text-black dark:text-white">{Math.min(currentPage * 10, pagination.total_records)}</span> of <span className="font-semibold text-black dark:text-white">{pagination.total_records}</span> results
              </Typography>
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
      <DateRangePicker
        isOpen={isDatePickerOpen}
        dateRange={{ startDate: filters.start_date || '', endDate: filters.end_date || '' }}
        setDateRange={handleDateRangeChange as any}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </DefaultLayout>
  );
}