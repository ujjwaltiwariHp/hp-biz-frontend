'use client';

import { useState } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import CardDataStats from '@/components/CardDataStats';
import { Building, Users, UserCheck, UserX, TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';
import { companyService } from '@/services/company.service';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: companyService.getDashboard,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', { page: 1, limit: 5 }],
    queryFn: () => companyService.getCompanies({ page: 1, limit: 5 }),
  });

  const { data: usageData } = useQuery({
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

  const recentCompanies = companiesData?.data?.companies || [];
  const usageReport = usageData?.data?.report || [];
  const usageSummary = usageData?.data?.summary || { totalCompanies: 0, totalLeads: 0, totalActivities: 0 };

  const pieData = [
    { name: 'Active', value: stats.active_companies, color: '#10B981' },
    { name: 'Inactive', value: stats.inactive_companies, color: '#EF4444' }
  ];

  const topCompanies = usageReport
    .sort((a: any, b: any) => b.leads_count - a.leads_count)
    .slice(0, 5);

  const activityData = usageReport.map((company: any) => ({
    name: company.company_name.substring(0, 15),
    leads: company.leads_count,
    activities: company.activities_count,
    staff: company.staff_count
  }));

  if (dashboardLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats
            title="Total Companies"
            total={stats.total_companies.toString()}
            rate={stats.new_companies_this_month > 0 ? `+${stats.new_companies_this_month}` : '0'}
            levelUp={stats.new_companies_this_month > 0}
          >
            <Building className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="Active Companies"
            total={stats.active_companies.toString()}
            rate={stats.total_companies > 0 ? `${Math.round((stats.active_companies / stats.total_companies) * 100)}%` : '0%'}
            levelUp
          >
            <UserCheck className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="Inactive Companies"
            total={stats.inactive_companies.toString()}
            rate={stats.total_companies > 0 ? `${Math.round((stats.inactive_companies / stats.total_companies) * 100)}%` : '0%'}
            levelDown={stats.inactive_companies > 0}
          >
            <UserX className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="New This Month"
            total={stats.new_companies_this_month.toString()}
            rate="Current month"
            levelUp={stats.new_companies_this_month > 0}
          >
            <Users className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <div className="col-span-12 xl:col-span-8">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                  <BarChart3 size={24} />
                  Company Activity Overview
                </h4>
              </div>

              {activityData.length > 0 ? (
                                  <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="leads" fill="#3B82F6" name="Leads" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="activities" fill="#10B981" name="Activities" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="staff" fill="#F59E0B" name="Staff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
                  No activity data available for selected period
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Company Status
              </h4>

              {stats.total_companies > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  No companies data available
                </div>
              )}

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded bg-gray-2 dark:bg-meta-4">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold text-black dark:text-white">{stats.total_companies}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-success/10">
                  <span className="text-sm font-medium text-success">Active</span>
                  <span className="text-lg font-bold text-success">{stats.active_companies}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-danger/10">
                  <span className="text-sm font-medium text-danger">Inactive</span>
                  <span className="text-lg font-bold text-danger">{stats.inactive_companies}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <div className="col-span-12 xl:col-span-7">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <TrendingUp size={24} />
                Top Performing Companies
              </h4>

              {topCompanies.length > 0 ? (
                <div className="space-y-4">
                  {topCompanies.map((company: any, index: number) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-stroke dark:border-strokedark hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h5 className="font-semibold text-black dark:text-white">{company.company_name}</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{company.unique_company_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Leads</p>
                            <p className="text-lg font-bold text-primary">{company.leads_count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Activities</p>
                            <p className="text-lg font-bold text-success">{company.activities_count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Staff</p>
                            <p className="text-lg font-bold text-warning">{company.staff_count}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                  No performance data available for selected period
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <Activity size={24} />
                Usage Summary
              </h4>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">Total Companies</span>
                    <Building size={20} className="text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">{usageSummary.totalCompanies}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">In selected period</p>
                </div>

                <div className="p-4 rounded-lg bg-success/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-success">Total Leads</span>
                    <Users size={20} className="text-success" />
                  </div>
                  <p className="text-3xl font-bold text-success">{usageSummary.totalLeads}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Avg: {usageSummary.totalCompanies > 0 ? Math.round(usageSummary.totalLeads / usageSummary.totalCompanies) : 0} per company
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-warning/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-warning">Total Activities</span>
                    <Activity size={20} className="text-warning" />
                  </div>
                  <p className="text-3xl font-bold text-warning">{usageSummary.totalActivities}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Avg: {usageSummary.totalCompanies > 0 ? Math.round(usageSummary.totalActivities / usageSummary.totalCompanies) : 0} per company
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 2xl:mt-7.5">
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white flex items-center gap-2">
              <Calendar size={24} />
              Recently Added Companies
            </h4>

            {recentCompanies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Company Name</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Admin</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Package</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Status</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCompanies.map((company: any) => (
                      <tr key={company.id} className="border-b border-stroke dark:border-strokedark">
                        <td className="py-4 px-4">
                          <p className="font-medium text-black dark:text-white">{company.company_name}</p>
                          <p className="text-sm text-gray-500">{company.unique_company_id}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-black dark:text-white">{company.admin_name}</p>
                          <p className="text-sm text-gray-500">{company.admin_email}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex rounded-full bg-primary/10 py-1 px-3 text-sm font-medium text-primary">
                            {company.package_name}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                            company.is_active
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger'
                          }`}>
                            {company.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-black dark:text-white">
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
    </DefaultLayout>
  );
}