'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsService } from '@/services/logs.service';
import { ActivityLog, LogFilters, SystemLog } from '@/types/logs';
import { Typography } from '@/components/common/Typography';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import { Download, RefreshCw, Zap, Code, User, Building2, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSSE } from '@/hooks/useSSE';
import TableToolbar from '@/components/common/TableToolbar';

type LogType = 'activity' | 'system';

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
  if (safeAction.includes('CREATE') || safeAction.includes('ADD') || safeAction.includes('REGISTER')) return 'bg-success/10 text-success border-success/20';
  if (safeAction.includes('UPDATE') || safeAction.includes('EDIT') || safeAction.includes('CHANGE')) return 'bg-warning/10 text-warning border-warning/20';
  if (safeAction.includes('DELETE') || safeAction.includes('REMOVE')) return 'bg-danger/10 text-danger border-danger/20';
  if (safeAction.includes('LOGIN') || safeAction.includes('LOGOUT')) return 'bg-primary/10 text-primary border-primary/20';
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

const getDateString = (date: string | Date | undefined): string => {
  if (!date) return '';
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return date;
};

export default function LogsPage() {
  const [logType, setLogType] = useState<LogType>('activity');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    resource_type: '',
    log_level: '',
    action_type: undefined,
    start_date: '',
    end_date: '',
  });

  const logsQueryKey = [logType, currentPage, appliedSearchTerm, filters];

  const { data: logsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: logsQueryKey,
    queryFn: () => {
      const apiFilters: LogFilters = {
        ...filters,
        page: currentPage,
        limit: 10,
        resource_type: logType === 'activity' ? filters.resource_type : undefined,
        log_level: logType === 'system' ? filters.log_level : undefined,
        search: appliedSearchTerm || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        type: logType === 'system' ? 'system' : 'activity',
      };
      return logsService.getLogs(apiFilters);
    },
  });

  useSSE('sa_new_activity_log', logsQueryKey, { refetchQueries: true });
  useSSE('sa_new_system_log', logsQueryKey, { refetchQueries: true });

  const logs = logsData?.data?.logs || [];
  const pagination = logsData?.data?.pagination;

  const handleLogTypeChange = (newType: LogType) => {
    setLogType(newType);
    setCurrentPage(1);
    setSearchTerm('');
    setAppliedSearchTerm('');
    setFilters({
      resource_type: '',
      log_level: '',
      action_type: undefined,
      start_date: '',
      end_date: '',
    });
  };

  const handleSearch = (term?: string) => {
    setAppliedSearchTerm(term !== undefined ? term : searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDateRangeApply = (range: { startDate: string; endDate: string }) => {
    setFilters(prev => ({
      ...prev,
      start_date: range.startDate,
      end_date: range.endDate
    }));
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const handleClearFilters = () => {
    setFilters({
      resource_type: '',
      log_level: '',
      action_type: undefined,
      start_date: '',
      end_date: '',
    });
    setSearchTerm('');
    setAppliedSearchTerm('');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      toast.info(`Preparing ${logType} logs for export...`);
      const filtersForExport: LogFilters = {
        ...filters,
        search: appliedSearchTerm || undefined,
        type: logType === 'system' ? 'system' : 'activity'
      };
      const blob = await logsService.exportLogs(filtersForExport);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const startStr = getDateString(filters.start_date) || 'all';
      const endStr = getDateString(filters.end_date) || 'current';
      a.download = `${logType}_logs_${startStr}_to_${endStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const activityLogColumns: TableColumn<ActivityLog>[] = [
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
      header: 'User & Company',
      headerClassName: 'min-w-[220px]',
      render: (log) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2" title={log.company_name || 'System'}>
            <Building2 size={14} className="shrink-0 text-primary" />
            <Typography variant="value" className="text-sm font-bold text-black dark:text-white truncate max-w-[180px]">
              {log.company_name || 'System'}
            </Typography>
          </div>
          {log.email && log.email !== 'System' && (
            <div className="flex items-center gap-2" title={log.email}>
              <Mail size={14} className="shrink-0 text-gray-400" />
              <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {log.email}
              </Typography>
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5" title={log.user_name || 'System'}>
            <User size={14} className="shrink-0 text-gray-400" />
            <Typography variant="caption" className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
              {log.user_name || 'System'}
              <span className="ml-1 text-gray-400">
                ({log.user_type === 'Super Admin' ? 'Super Admin' : (log.user_type || 'User')})
              </span>
            </Typography>
          </div>
        </div>
      ),
    },
    {
      key: 'action_type',
      header: 'Action',
      headerClassName: 'min-w-[130px]',
      render: (log) => (
        <span className={`inline-flex items-center justify-center rounded-md border py-1 px-2.5 text-xs font-medium ${getActionColor(log.action_type || '')}`}>
          {log.action_type || 'N/A'}
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
      key: 'company_name',
      header: 'Source',
      headerClassName: 'min-w-[200px]',
      render: (log) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2" title={log.company_name || 'System'}>
            <Building2 size={14} className="shrink-0 text-primary" />
            <Typography variant="value" className="text-sm font-bold text-black dark:text-white truncate max-w-[180px]">
              {log.company_name || 'System'}
            </Typography>
          </div>
          {log.email && log.email !== 'System' && (
            <div className="flex items-center gap-2" title={log.email}>
              <Mail size={14} className="shrink-0 text-gray-400" />
              <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {log.email}
              </Typography>
            </div>
          )}
          {log.user_name && log.user_name !== 'System' && (
            <div className="flex items-center gap-2 mt-0.5" title={log.user_name}>
              <User size={14} className="shrink-0 text-gray-400" />
              <Typography variant="caption" className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                {log.user_name}
              </Typography>
            </div>
          )}
        </div>
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

  const activeFiltersCount = [
    appliedSearchTerm,
    filters.resource_type,
    filters.log_level,
    filters.start_date || filters.end_date,
  ].filter(Boolean).length;

  const renderFilters = () => (
    <TableToolbar
      searchConfig={{
        value: searchTerm,
        onChange: setSearchTerm,
        onSearch: handleSearch,
        onClear: handleClearSearch,
        placeholder: "Search logs...",
        isLoading: isLoading,
      }}
      filterConfigs={[
        logType === 'activity' ? {
          key: 'resource_type',
          label: 'Resource Type',
          value: filters.resource_type || '',
          onChange: (val) => handleFilterChange('resource_type', val),
          type: 'input',
          placeholder: "e.g. COMPANY, USER",
        } : {
          key: 'log_level',
          label: 'Log Level',
          value: filters.log_level || '',
          onChange: (val) => handleFilterChange('log_level', val),
          options: [
            { label: 'All Levels', value: '' },
            ...['ERROR', 'WARN', 'INFO', 'DEBUG', 'SUCCESS', 'CRITICAL'].map(level => ({ label: level, value: level.toLowerCase() }))
          ],
        }
      ]}
      dateRangeConfig={{
        value: { startDate: (filters.start_date as string) || '', endDate: (filters.end_date as string) || '' },
        onChange: (range) => setFilters(prev => ({ ...prev, start_date: range.startDate, end_date: range.endDate })),
        onApply: (range) => {
          setFilters(prev => ({ ...prev, start_date: range.startDate, end_date: range.endDate }));
          setCurrentPage(1);
          setShowDatePicker(false);
        },
      }}
      activeFilters={{
        count: activeFiltersCount,
        filters: [
          appliedSearchTerm ? { key: 'search', label: 'Search', value: appliedSearchTerm } : null,
          filters.resource_type ? { key: 'resource', label: 'Resource', value: filters.resource_type } : null,
          filters.log_level ? { key: 'level', label: 'Level', value: filters.log_level } : null,
          (filters.start_date || filters.end_date) ? { key: 'date', label: 'Date', value: `${getDateString(filters.start_date)} - ${getDateString(filters.end_date)}` } : null
        ].filter(Boolean) as any,
        onClearAll: handleClearFilters,
      }}
    />
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-meta-4 rounded-full flex items-center justify-center mb-4">
        {type === 'activity' ? (
          <Zap size={32} className="text-gray-400 dark:text-gray-500" />
        ) : (
          <Code size={32} className="text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
        No {type} logs found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
        We couldn&apos;t find any logs matching your current filters. Try adjusting your search criteria.
      </p>
    </div>
  );

  return (
    <>

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
              <Zap size={16} />
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
              disabled={isFetching}
              className="p-2.5 border border-stroke rounded-lg hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4 transition-colors text-gray-600 dark:text-gray-300"
              title="Refresh Logs"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
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
              Showing <span className="font-semibold text-black dark:text-white">{((currentPage - 1) * 10) + 1}</span> to <span className="font-semibold text-black dark:text-white">{Math.min(currentPage * 10, pagination.total_records)}</span> of <span className="font-semibold text-black dark:text-white">{pagination.total_records}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.has_prev}
                className="px-4 py-2 text-sm font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-black dark:text-white bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg">
                {currentPage} / {pagination.total_pages}
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


    </>
  );
}