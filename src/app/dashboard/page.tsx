'use client';

import { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import CardDataStats from '@/components/CardDataStats';
import { Typography } from '@/components/common/Typography';
import { Building, Users, UserCheck, UserX, TrendingUp, Calendar, Clock, BarChart3 } from 'lucide-react';
import { companyService } from '@/services/company.service';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAuthToken } from '@/lib/auth';
import { useSSE } from '@/hooks/useSSE';
import DateRangePicker from '@/components/common/DateRangePicker';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import { Company } from '@/types/company';
import Loader from '@/components/common/Loader'; // Import Common Loader

const parseNumeric = (value: any, defaultValue = 0) => {
    return Number(value) || defaultValue;
};

const CustomBarChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg bg-boxdark text-white border border-strokedark p-3 shadow-md text-sm">
        <Typography variant="body1" as="h6" className="font-bold mb-1">{data.full_name}</Typography>
        {payload.map((item: any) => (
            <Typography key={item.name} variant="body" style={{ color: item.color }}>
                {item.name}: {item.value.toLocaleString()}
            </Typography>
        ))}
      </div>
    );
  }
  return null;
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false); // Fix for hydration
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Ensure we only run client-specific logic after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  const companiesQueryKey = ['companies', { page: 1, limit: 10, recent: true }];
  const dashboardQueryKey = ['dashboard'];
  const usageQueryKey = ['usageReport', dateRange];

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: () => companyService.getDashboard(),
    enabled: !!token && isMounted, // Only fetch when mounted
  });

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: companiesQueryKey,
    queryFn: () => companyService.getCompanies({ page: 1, limit: 10 }),
    enabled: !!token && isMounted,
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: usageQueryKey,
    queryFn: () => companyService.getUsageReport(dateRange),
    enabled: !!token && !!dateRange.startDate && !!dateRange.endDate && isMounted,
  });

  useSSE('sa_company_list_refresh', companiesQueryKey);
  useSSE('sa_company_list_refresh', dashboardQueryKey);
  useSSE('sa_company_list_refresh', usageQueryKey);

  useSSE('sa_finance_update', dashboardQueryKey);

  const stats = dashboardData?.data?.stats || {
    total_companies: 0,
    active_companies: 0,
    inactive_companies: 0,
    new_companies_this_month: 0
  };

  const recentCompanies: Company[] = (companiesData?.data?.companies || []).slice(0, 5);
  const usageReport = usageData?.data?.report || [];
  const usageSummary = usageData?.data?.summary || { totalCompanies: 0, totalLeads: 0, totalActivities: 0 };

  const totalCompaniesCount = stats.total_companies;
  const activePercent = totalCompaniesCount > 0 ? Math.round((stats.active_companies / totalCompaniesCount) * 100) : 0;
  const inactivePercent = 100 - activePercent;

  const pieData = [
    { name: `Active (${activePercent}%)`, value: stats.active_companies, color: '#10B981' },
    { name: `Inactive (${inactivePercent}%)`, value: stats.inactive_companies, color: '#EF4444' }
  ];

  const processedUsageReport = usageReport
    .map(company => ({
        ...company,
        leads_count: parseNumeric(company.leads_count),
        activities_count: parseNumeric(company.activities_count),
        staff_count: parseNumeric(company.staff_count),
    }))
    .filter(company => company.leads_count > 0 || company.activities_count > 0 || company.staff_count > 0);

  const sortedUsageData = processedUsageReport
    .sort((a, b) => (b.leads_count + b.activities_count + b.staff_count) - (a.leads_count + a.activities_count + a.staff_count));

  const topCompaniesList = sortedUsageData.slice(0, 5);

  const barChartData = sortedUsageData
    .slice(0, 8)
    .map((company: any) => ({
        name: company.company_name.substring(0, 10) + '...',
        leads: company.leads_count,
        staff: company.staff_count,
        full_name: company.company_name
    }));

  const maxLeads = barChartData.reduce((max, item) => Math.max(max, item.leads), 0);
  const maxStaff = barChartData.reduce((max, item) => Math.max(max, item.staff), 0);
  const dataMax = Math.max(maxLeads, maxStaff);

  const isDataLoading = usageLoading || companiesLoading || dashboardLoading;

  // FIX: Replaced manual spinner with common Loader component
  if (!isMounted || dashboardLoading) {
    return (
      <DefaultLayout>
        <Loader variant="page" />
      </DefaultLayout>
    );
  }

  const recentCompaniesColumns: TableColumn<Company>[] = [
    {
      key: 'company_name',
      header: 'Company Name',
      headerClassName: 'min-w-[150px]',
      render: (company) => (
        <div className="flex flex-col">
          <Typography variant="value" className="font-medium text-black dark:text-white text-sm">{company.company_name}</Typography>
          <Typography variant="caption" className="text-xs text-gray-500">{company.unique_company_id}</Typography>
        </div>
      ),
    },
    {
      key: 'admin_name',
      header: 'Admin',
      headerClassName: 'min-w-[150px]',
      render: (company) => (
        <div className="flex flex-col">
          <Typography variant="body" className="text-black dark:text-white text-sm">{company.admin_name}</Typography>
          <Typography variant="caption" className="text-xs text-gray-500">{company.admin_email}</Typography>
        </div>
      ),
    },
    {
      key: 'package_name',
      header: 'Package',
      headerClassName: 'min-w-[80px]',
      render: (company) => (
        <span className="inline-flex rounded-full bg-primary/10 py-0.5 px-2 text-xs font-medium text-primary">
          {company.package_name}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      headerClassName: 'min-w-[60px]',
      render: (company) => (
        <span className={`inline-flex rounded-full py-0.5 px-2 text-xs font-medium ${
          company.is_active
            ? 'bg-success/10 text-success'
            : 'bg-danger/10 text-danger'
        }`}>
          {company.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      headerClassName: 'min-w-[100px]',
      render: (company) => (
        <Typography variant="body" className="text-black dark:text-white text-sm">
          {formatDate(company.created_at)}
        </Typography>
      ),
    },
  ];

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Typography variant="page-title" as="h2">
            Dashboard Overview
          </Typography>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setIsDatePickerOpen(true)} className="flex items-center gap-2 rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-meta-4">
              <Calendar size={16} />
              <span>
                {dateRange.startDate && dateRange.endDate ? `${dateRange.startDate} → ${dateRange.endDate}` : 'Select Date Range'}
              </span>
            </button>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="hidden"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="hidden"
            />
          </div>
        </div>

        {isDataLoading && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-primary rounded-lg bg-primary/10">
                <Clock size={16} className="animate-spin" />
                <Typography variant="body2">Loading usage report data...</Typography>
            </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats
            title="Total Companies"
            total={stats.total_companies.toLocaleString()}
            rate={stats.new_companies_this_month > 0 ? `+${stats.new_companies_this_month} this month` : '0'}
            levelUp={stats.new_companies_this_month > 0}
          >
            <Building className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="Active Companies"
            total={stats.active_companies.toLocaleString()}
            rate={stats.total_companies > 0 ? `${activePercent}%` : '0%'}
            levelUp
          >
            <UserCheck className="fill-success dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="Inactive Companies"
            total={stats.inactive_companies.toLocaleString()}
            rate={stats.total_companies > 0 ? `${inactivePercent}%` : '0%'}
            levelDown={stats.inactive_companies > 0}
          >
            <UserX className="fill-danger dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="Total Leads Tracked"
            total={usageSummary.totalLeads.toLocaleString()}
            rate={`Avg: ${usageSummary.totalCompanies > 0 ? Math.round(usageSummary.totalLeads / usageSummary.totalCompanies) : 0} / company`}
            levelUp={usageSummary.totalLeads > 0}
          >
            <Users className="fill-meta-5 dark:fill-white" size={22} />
          </CardDataStats>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <div className="col-span-12 xl:col-span-7">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <div className="flex items-center justify-between mb-6">
                <Typography variant="card-title" as="h4" className="text-black dark:text-white flex items-center gap-2">
                  <BarChart3 size={24} />
                  Top Company Performance (Leads vs Staff)
                </Typography>
              </div>

              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={75}
                    />
                    <YAxis
                      dataKey="leads"
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 1.15 : 100)]}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip content={<CustomBarChartTooltip />} />

                    <Bar dataKey="leads" fill="#3B82F6" name="Leads Created/Logged" radius={[8, 8, 0, 0]} />

                    <Bar dataKey="staff" fill="#10B981" name="Active Staff Count" radius={[8, 8, 0, 0]} />

                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
                  <Typography variant="body1">No activity data found for selected period.</Typography>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <Typography variant="card-title" as="h4" className="mb-6 text-black dark:text-white">
                Company Status Distribution
              </Typography>

              {stats.total_companies > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                      labelLine={false}
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ padding: '20px 0 0 0', fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
                  <Typography variant="body1">No companies data available</Typography>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 h-full">
              <Typography variant="card-title" as="h4" className="mb-6 text-black dark:text-white flex items-center gap-2">
                <TrendingUp size={24} />
                Top 5 Usage Leaders
              </Typography>

              {topCompaniesList.length > 0 ? (
                <div className="space-y-3">
                  {topCompaniesList.map((company: any, index: number) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <Typography variant="value" className="font-semibold text-black dark:text-white text-sm">{company.company_name}</Typography>
                          <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">{company.package_name}</Typography>
                        </div>
                      </div>
                      <div className="text-right">
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400 text-xs">Leads + Activities</Typography>
                          <Typography variant="value" as="h5" className="font-bold text-primary">{(company.leads_count + company.activities_count).toLocaleString()}</Typography>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                  <Typography variant="body1">No usage data available for selected period</Typography>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-7">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 h-full">
              <Typography variant="card-title" as="h4" className="mb-6 text-black dark:text-white flex items-center gap-2">
                <Calendar size={24} />
                Recently Added Companies
              </Typography>

              {recentCompanies.length > 0 ? (
                <DynamicTable<Company>
                  data={recentCompanies}
                  columns={recentCompaniesColumns}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  <Typography variant="body1">No companies found</Typography>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      <DateRangePicker isOpen={isDatePickerOpen} dateRange={dateRange} setDateRange={setDateRange} onClose={() => setIsDatePickerOpen(false)} />
    </DefaultLayout>
  );
}