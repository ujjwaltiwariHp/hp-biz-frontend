'use client';

import { useState } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import CardDataStats from '@/components/CardDataStats';
import { Building, Users, UserCheck, UserX, TrendingUp, Calendar, Activity, BarChart3, Clock, DollarSign, MinusCircle } from 'lucide-react';
import { companyService } from '@/services/company.service';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/lib/utils';

// Helper to handle potential string conversion from API response
const parseNumeric = (value: any, defaultValue = 0) => {
    return Number(value) || defaultValue;
};

// Custom Tooltip for Bar Chart (Updated to show Leads and Staff)
const CustomBarChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg bg-boxdark text-white border border-strokedark p-3 shadow-md text-sm">
        <p className="font-bold mb-1">{data.full_name}</p>
        {payload.map((item: any) => (
            <p key={item.name} style={{ color: item.color }}>
                {item.name}: {item.value.toLocaleString()}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: companyService.getDashboard,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { page: 1, limit: 10 }],
    queryFn: () => companyService.getCompanies({ page: 1, limit: 10 }),
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['usageReport', dateRange],
    queryFn: () => companyService.getUsageReport(dateRange),
    enabled: !!dateRange.startDate && !!dateRange.endDate,
  });

  const stats = dashboardData?.data?.stats || {
    total_companies: 0,
    active_companies: 0,
    inactive_companies: 0,
    new_companies_this_month: 0
  };

  const recentCompanies = (companiesData?.data?.companies || []).slice(0, 4);
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
        staff: company.staff_count, // Use staff count here
        full_name: company.company_name
    }));

  // Determine max value across leads and staff for Y-axis domain
  const maxLeads = barChartData.reduce((max, item) => Math.max(max, item.leads), 0);
  const maxStaff = barChartData.reduce((max, item) => Math.max(max, item.staff), 0);
  const dataMax = Math.max(maxLeads, maxStaff);


  if (dashboardLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      </DefaultLayout>
    );
  }

  const isDataLoading = usageLoading;

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Dashboard Overview
          </h2>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-sm"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white text-sm"
            />
          </div>
        </div>

        {isDataLoading && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-primary rounded-lg bg-primary/10">
                <Clock size={16} className="animate-spin" /> Loading usage report data...
            </div>
        )}

        {/* Global Stats Cards (Updated Card 3) */}
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
            // SWAP: Inactive Companies (Stable metric)
            title="Inactive Companies"
            total={stats.inactive_companies.toLocaleString()}
            rate={stats.total_companies > 0 ? `${inactivePercent}%` : '0%'}
            levelDown={stats.inactive_companies > 0}
          >
            <UserX className="fill-danger dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            // SWAP: Total Activities Logged (Unstable metric) -> Total Leads Tracked
            title="Total Leads Tracked"
            total={usageSummary.totalLeads.toLocaleString()}
            rate={`Avg: ${usageSummary.totalCompanies > 0 ? Math.round(usageSummary.totalLeads / usageSummary.totalCompanies) : 0} / company`}
            levelUp={usageSummary.totalLeads > 0}
          >
            <Users className="fill-meta-5 dark:fill-white" size={22} />
          </CardDataStats>
        </div>

        {/* Charts and Status */}
        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          {/* Top Company Activity Performance - Takes more space (7/12) */}
          <div className="col-span-12 xl:col-span-7">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                  <BarChart3 size={24} />
                  Top Company Performance (Leads vs Staff)
                </h4>
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
                      dataKey="leads" // YAxis is scaled based on Leads value (the largest number)
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      // Adjust domain based on calculated dataMax
                      domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 1.15 : 100)]}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip content={<CustomBarChartTooltip />} />

                    {/* BAR FIX 1: Leads (Blue) */}
                    <Bar dataKey="leads" fill="#3B82F6" name="Leads Created/Logged" radius={[8, 8, 0, 0]} />

                    {/* BAR FIX 2: Staff (Green) */}
                    <Bar dataKey="staff" fill="#10B981" name="Active Staff Count" radius={[8, 8, 0, 0]} />

                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
                  No activity data found for selected period.
                </div>
              )}
            </div>
          </div>

          {/* Company Status Distribution - Takes less space (5/12) */}
          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Company Status Distribution
              </h4>

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
                  No companies data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Summary and Recent Companies List - Same Size Fix */}
        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          {/* Top 5 Usage Leaders (Table) - Takes 5/12 space */}
          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 h-full">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <TrendingUp size={24} />
                Top 5 Usage Leaders
              </h4>

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
                        <div>
                          <h5 className="font-semibold text-black dark:text-white text-sm">{company.company_name}</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{company.package_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Leads + Activities</p>
                          <p className="text-lg font-bold text-primary">{(company.leads_count + company.activities_count).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                  No usage data available for selected period
                </div>
              )}
            </div>
          </div>

          {/* Recently Added Companies List - Takes 7/12 space */}
          <div className="col-span-12 xl:col-span-7">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 h-full">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <Calendar size={24} />
                Recently Added Companies
              </h4>

              {recentCompanies.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs">
                        <th className="py-3 px-3 font-medium text-black dark:text-white">Company Name</th>
                        <th className="py-3 px-3 font-medium text-black dark:text-white">Admin</th>
                        <th className="py-3 px-3 font-medium text-black dark:text-white">Package</th>
                        <th className="py-3 px-3 font-medium text-black dark:text-white">Status</th>
                        <th className="py-3 px-3 font-medium text-black dark:text-white">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCompanies.map((company: any) => (
                        <tr key={company.id} className="border-b border-stroke dark:border-strokedark">
                          <td className="py-3 px-3">
                            <p className="font-medium text-black dark:text-white text-sm">{company.company_name}</p>
                            <p className="text-xs text-gray-500">{company.unique_company_id}</p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-black dark:text-white text-sm">{company.admin_name}</p>
                            <p className="text-xs text-gray-500">{company.admin_email}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex rounded-full bg-primary/10 py-0.5 px-2 text-xs font-medium text-primary">
                              {company.package_name}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex rounded-full py-0.5 px-2 text-xs font-medium ${
                              company.is_active
                                ? 'bg-success/10 text-success'
                                : 'bg-danger/10 text-danger'
                            }`}>
                              {company.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-black dark:text-white text-sm">
                            {new Date(company.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  No companies found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}