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
  Search, // Necessary for internal search logic
} from 'lucide-react';
import { format } from 'date-fns';

// NEW IMPORTS: Typography and Search Components/Hooks
import { PageTitle, Label } from '@/components/common/Typography';
import { useSearch } from '@/hooks/useSearch';
import { SearchInput } from '@/components/common/SearchInput';


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
  const MIN_SEARCH_LENGTH = 3;

  // Search Hook Integration
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
    error: searchError,
    // Note: handleSearchSubmit is not strictly needed here since debounce handles most cases,
    // but the search hook exposes it. We'll rely on debounce/min-length logic.
  } = useSearch(searchTrigger, 400, MIN_SEARCH_LENGTH);


  // Fetch company data
  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch activity logs (Updated dependency list)
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['company-logs', companyId, currentPage, filters, finalSearchQuery],
    queryFn: () =>
      logsService.getCompanyActivityLogs(companyId, {
        page: currentPage,
        limit: 20,
        action_type: filters.action_type || undefined,
        resource_type: filters.resource_type || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        search: finalSearchQuery || undefined, // ADDED search query
      }),
    staleTime: 5 * 60 * 1000,
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
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
        <p className="text-base font-medium text-gray-600 dark:text-gray-400">
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
          {/* Apply PageTitle component */}
          <PageTitle as="h2">
            Activity Logs
          </PageTitle>
          {/* Apply text-xs for description */}
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            All user and staff activities for {company.company_name}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Compact Buttons */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs border rounded-lg transition-colors ${
              showFilters
                ? 'bg-primary text-white border-primary'
                : 'border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4'
            }`}
          >
            <Filter size={14} />
            Filters
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters Block */}
      <div className="space-y-4">
        {/* Search Input (Replaced old input) */}
        <SearchInput
            placeholder={`Search by user, action, or resource (min ${MIN_SEARCH_LENGTH} chars)...`}
            value={searchInputQuery}
            onChange={handleSearch}
            onClear={handleClear}
            isLoading={isSearchDebouncing}
            error={searchError}
            minLength={MIN_SEARCH_LENGTH}
        />

        {showFilters && (
            <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Action Type Filter */}
                <div>
                  <Label className="mb-2">
                    Action Type
                  </Label>
                  <select
                    name="action_type"
                    value={filters.action_type}
                    onChange={handleFilterChange}
                    className="w-full rounded border border-stroke py-2 px-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                  </select>
                </div>

                {/* Resource Type Filter */}
                <div>
                  <Label className="mb-2">
                    Resource Type
                  </Label>
                  <select
                    name="resource_type"
                    value={filters.resource_type}
                    onChange={handleFilterChange}
                    className="w-full rounded border border-stroke py-2 px-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">All Resources</option>
                    <option value="LEAD">Lead</option>
                    <option value="STAFF">Staff</option>
                    <option value="ACTIVITY">Activity</option>
                    <option value="SETTINGS">Settings</option>
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <Label className="mb-2">
                    Start Date
                  </Label>
                  <input
                    type="date"
                    name="start_date"
                    value={filters.start_date}
                    onChange={handleFilterChange}
                    className="w-full rounded border border-stroke py-2 px-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <Label className="mb-2">
                    End Date
                  </Label>
                  <input
                    type="date"
                    name="end_date"
                    value={filters.end_date}
                    onChange={handleFilterChange}
                    className="w-full rounded border border-stroke py-2 px-3 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
                  />
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-meta-4">
                {/* Apply text-xs for compact headers */}
                <th className="py-4 px-6 text-xs font-semibold text-black dark:text-white">
                  Timestamp
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-black dark:text-white">
                  User
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-black dark:text-white">
                  Action
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-black dark:text-white">
                  Resource
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-black dark:text-white">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Activity size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-base font-medium">
                      {/* Accurate no results message based on search/filters */}
                      {finalSearchQuery || filters.action_type || filters.resource_type || filters.start_date || filters.end_date
                         ? 'No activities found matching filters.'
                         : `No activity logs recorded for ${company.company_name}.`}
                    </p>
                    <p className="text-xs mt-1">
                      Try adjusting or clearing your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={`log-${(log as any).id}-${index}`}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-xs">
                        {/* Apply text-xs for compact body text */}
                        <span className="text-black dark:text-white">
                          {formatDateTime((log as any).created_at)}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          {/* Apply text-sm for user name */}
                          <p className="text-sm font-medium text-black dark:text-white">
                            {(log as any).first_name
                              ? `${(log as any).first_name} ${(log as any).last_name || ''}`
                              : 'System'}
                          </p>
                          {/* REMOVED EMAIL display here */}
                        </div>
                      </div>
                    </td>


                    <td className="py-4 px-6">
                      {/* Apply text-xxs for tiny badge */}
                      <span
                        className={`inline-flex px-2.5 py-1 text-xxs font-semibold rounded-full ${
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
                        {/* Apply text-sm for resource type */}
                        <p className="text-sm font-medium text-black dark:text-white">
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
                      {/* Apply text-xs for body text */}
                      <p
                        className="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate"
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
          {/* Apply text-xs for pagination info */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
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
            {/* Apply text-xs for compact pagination buttons */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!pagination.has_prev}
              className="px-3 py-2 text-xs font-medium border border-stroke rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:hover:bg-boxdark dark:text-white transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-xs font-semibold text-black dark:text-white">
              Page {currentPage} of {pagination.total_pages}
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
  );
}