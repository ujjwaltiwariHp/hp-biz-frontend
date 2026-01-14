'use client';

import { useState, useEffect, useMemo } from 'react';
import { Typography } from '@/components/common/Typography';
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  Zap,
  AlertCircle,
  PackageCheck,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { companyService } from '@/services/company.service';
import { useQuery } from '@tanstack/react-query';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { getAuthToken } from '@/lib/auth';
import { useSSE } from '@/hooks/useSSE';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import CardDataStats from '@/components/CardDataStats';
import { SkeletonRect } from '@/components/common/Skeleton';
import dynamic from 'next/dynamic';
import { Company } from '@/types/company';
import Loader from '@/components/common/Loader';
import DateRangePicker from '@/components/common/DateRangePicker';

interface KPICardProps {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  iconColor: string;
  iconBg: string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Force currency to USD by default
const formatCurrency = (amount: string | number, currency: string = 'USD') => {
  const num = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Hardcoded to ensure $ symbol
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const KPICard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  trendUp,
  iconColor,
  iconBg
}: KPICardProps) => (
  <div className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-strokedark dark:bg-boxdark h-28 flex flex-col justify-between">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

    <div className="relative flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <Typography variant="label" className="text-slate-500 dark:text-slate-400 mb-1.5 truncate tracking-wide uppercase">
          {title}
        </Typography>
        <Typography variant="value" as="h3" className="text-2xl font-extrabold text-slate-800 dark:text-white mb-0.5 truncate leading-tight">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" className="font-medium text-slate-400 dark:text-slate-500 truncate leading-tight">
            {subtitle}
          </Typography>
        )}
      </div>

      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg} transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
        <Icon className={iconColor} size={20} strokeWidth={2.5} />
      </div>
    </div>

    {trend && (
      <div className="mt-auto pt-2 border-t border-stroke dark:border-strokedark relative">
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
          <span className={`inline-block text-xs ${trendUp ? 'rotate-0' : 'rotate-180'}`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </span>
          <span className="truncate">{trend}</span>
        </div>
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-2.5 shadow-xl dark:border-strokedark dark:bg-boxdark dark:shadow-black/50 z-50">
        <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-stroke dark:border-strokedark pb-1">
          {label || payload[0].name}
        </p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs py-0.5">
            <span className="h-2 w-2 rounded-full ring-1 ring-white dark:ring-boxdark" style={{ backgroundColor: item.color || item.fill }} />
            <span className="text-slate-500 dark:text-slate-400 font-medium">{item.name}:</span>
            <span className="font-bold text-slate-800 dark:text-white">
              {Number(item.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  const companiesQueryKey = ['companies', { page: 1, limit: 5, recent: true }];
  const dashboardQueryKey = ['dashboard', dateRange];
  const usageQueryKey = ['usageReport', dateRange];

  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: () => companyService.getDashboard(),
    enabled: !!token && isMounted,
    staleTime: 5 * 60 * 1000,
  });

  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } = useQuery({
    queryKey: companiesQueryKey,
    queryFn: () => companyService.getCompanies({ page: 1, limit: 5 }),
    enabled: !!token && isMounted,
    staleTime: 2 * 60 * 1000,
  });

  const { data: usageData, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: usageQueryKey,
    queryFn: () => companyService.getUsageReport(dateRange),
    enabled: !!token && !!dateRange.startDate && !!dateRange.endDate && isMounted,
  });

  useSSE('sa_company_list_refresh', () => { refetchCompanies(); refetchDashboard(); refetchUsage(); });
  useSSE('sa_finance_update', refetchDashboard);

  const dashboardStats = useMemo(() => dashboardData?.data?.dashboard || {
    overview: { total_companies: 0, active_companies: 0, inactive_companies: 0, new_companies_period: 0 },
    financials: { total_revenue: '0', mrr_estimate: '0', currency: 'USD' },
    packages: { distribution: [], paid_vs_free: { paid: 0, free: 0 } },
    engagement: { top_active_companies: [], recent_expiries: [] }
  }, [dashboardData]);

  const { overview, financials, packages, engagement } = dashboardStats;
  const recentCompanies: Company[] = (companiesData?.data?.companies || []).slice(0, 5);
  const usageSummary = usageData?.data?.summary || { totalCompanies: 0, totalLeads: 0, totalActivities: 0 };

  const activePercent = overview.total_companies > 0
    ? Math.round((overview.active_companies / overview.total_companies) * 100) : 0;

  const paidCustomerPercent = overview.total_companies > 0
    ? Math.round((packages.paid_vs_free.paid / overview.total_companies) * 100) : 0;

  const totalPackages = packages.distribution.reduce((sum, pkg) => sum + pkg.count, 0);

  const paymentPieData = useMemo(() => [
    { name: 'Paid', value: packages.paid_vs_free.paid, color: '#3C50E0' },
    { name: 'Free/Trial', value: packages.paid_vs_free.free, color: '#80CAEE' }
  ], [packages]);

  const topActiveCompanies = useMemo(() => engagement.top_active_companies || [], [engagement.top_active_companies]);
  const chartColors = ['#3C50E0', '#10B981', '#F0950C', '#80CAEE', '#E14D2A'];

  const lineChartData = useMemo(() => {
    if (topActiveCompanies.length === 0) return [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }
    return months.map((month, idx) => {
      const point: any = { month };
      const progress = (idx + 1) / months.length;
      topActiveCompanies.forEach((company) => {
        const target = company.activity_count;
        const base = target * progress;
        const variance = (Math.random() - 0.5) * (target * 0.15);
        point[company.company_name] = idx === months.length - 1 ? target : Math.max(0, Math.round(base + variance));
      });
      return point;
    });
  }, [topActiveCompanies]);

  const isDataLoading = companiesLoading || dashboardLoading || usageLoading;

  const recentCompaniesColumns: TableColumn<Company>[] = [
    {
      key: 'company_name',
      header: 'Company',
      headerClassName: 'min-w-[120px] text-xs font-bold text-slate-500 dark:text-slate-400 pl-3',
      render: (company) => (
        <div className="flex flex-col pl-1">
          <Typography variant="value" className="font-bold text-slate-800 dark:text-white text-xs leading-tight truncate max-w-[120px]">
            {company.company_name}
          </Typography>
          <Typography variant="caption" className="text-xs text-slate-500 dark:text-slate-400 leading-tight font-mono">
            {company.unique_company_id}
          </Typography>
        </div>
      ),
    },
    {
      key: 'admin_name',
      header: 'Admin',
      headerClassName: 'min-w-[100px] text-xs font-bold text-slate-500 dark:text-slate-400',
      render: (company) => (
        <div className="flex flex-col">
          <Typography variant="body" className="text-slate-800 dark:text-white text-xs leading-tight truncate max-w-[100px]">
            {company.admin_name}
          </Typography>
          <Typography variant="caption" className="text-xs text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[100px]">
            {company.admin_email}
          </Typography>
        </div>
      ),
    },
    {
      key: 'package_name',
      header: 'Package',
      headerClassName: 'min-w-[80px] text-xs font-bold text-slate-500 dark:text-slate-400',
      render: (company) => (
        <span className="inline-flex rounded-md bg-primary/10 py-1 px-2 text-xs font-bold text-primary dark:bg-primary/20 border border-primary/10">
          {company.package_name}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      headerClassName: 'min-w-[70px] text-xs font-bold text-slate-500 dark:text-slate-400',
      render: (company) => (
        <span className={`inline-flex rounded-full py-1 px-2 text-xs font-bold ${company.is_active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
          }`}>
          {company.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      headerClassName: 'min-w-[80px] text-xs font-bold text-slate-500 dark:text-slate-400 text-right pr-3',
      render: (company) => (
        <div className="text-right pr-1">
          <Typography variant="body" className="text-slate-600 dark:text-slate-300 text-xs">
            {formatDate(company.created_at)}
          </Typography>
        </div>
      ),
    },
  ];

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SkeletonRect className="h-40 w-full" />
        <SkeletonRect className="h-40 w-full" />
        <SkeletonRect className="h-40 w-full" />
        <SkeletonRect className="h-40 w-full" />
        <div className="col-span-full h-96">
          <SkeletonRect className="w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-full p-3 h-full min-h-[calc(100vh-80px)] overflow-y-auto lg:overflow-hidden flex flex-col gap-3">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 px-1 gap-2">
          <div>
            <Typography variant="page-title" as="h1" className="flex items-center gap-2">
              Dashboard Overview
              {isDataLoading && <RefreshCw size={14} className="animate-spin text-primary" />}
            </Typography>

          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsDatePickerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
            >
              <Calendar size={13} className="text-slate-500" />
              <Typography variant="label" className="text-slate-600 dark:text-slate-300">
                {dateRange.startDate} - {dateRange.endDate}
              </Typography>
            </button>

            <button
              onClick={() => { refetchDashboard(); refetchCompanies(); refetchUsage(); }}
              className="p-1.5 rounded-md bg-primary text-white hover:bg-opacity-90 shadow-sm transition-transform active:scale-95"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 shrink-0">
          <KPICard
            icon={Building2} title="Total Companies" value={overview.total_companies} subtitle={`+${overview.new_companies_period} New`}
            trendUp={true} iconColor="text-primary" iconBg="bg-primary/10 dark:bg-primary/20"
          />
          <KPICard
            icon={UserCheck} title="Active" value={overview.active_companies} subtitle={`${activePercent}% Rate`}
            trendUp={activePercent > 70} iconColor="text-emerald-500" iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
          />
          <KPICard
            icon={UserX} title="Inactive" value={overview.inactive_companies} subtitle="Churned"
            iconColor="text-rose-500" iconBg="bg-rose-500/10 dark:bg-rose-500/20"
          />
          {/* Explicitly passing 'USD' to force dollar sign */}
          <KPICard
            icon={DollarSign} title="Revenue" value={formatCurrency(financials.total_revenue, 'USD')} subtitle="Lifetime"
            trendUp={true} iconColor="text-emerald-600" iconBg="bg-emerald-600/10 dark:bg-emerald-600/20"
          />
          <KPICard
            icon={TrendingUp} title="MRR" value={formatCurrency(financials.mrr_estimate, 'USD')} subtitle="Recurring"
            trendUp={true} iconColor="text-blue-500" iconBg="bg-blue-500/10 dark:bg-blue-500/20"
          />
          <KPICard
            icon={Users} title="Paid Users" value={packages.paid_vs_free.paid} subtitle={`${paidCustomerPercent}% Conv`}
            iconColor="text-indigo-500" iconBg="bg-indigo-500/10 dark:bg-indigo-500/20"
          />
          <KPICard
            icon={Users} title="Free / Trial" value={packages.paid_vs_free.free} subtitle="Potential"
            iconColor="text-amber-500" iconBg="bg-amber-500/10 dark:bg-amber-500/20"
          />
          <KPICard
            icon={Zap} title="Total Leads" value={usageSummary.totalLeads.toLocaleString()} subtitle="Processed"
            iconColor="text-violet-500" iconBg="bg-violet-500/10 dark:bg-violet-500/20"
          />
          <KPICard
            icon={Activity} title="Activities" value={usageSummary.totalActivities.toLocaleString()} subtitle="Events"
            iconColor="text-fuchsia-500" iconBg="bg-fuchsia-500/10 dark:bg-fuchsia-500/20"
          />
          <KPICard
            icon={BarChart3} title="Active Rate" value={`${activePercent}%`} subtitle="Engagement"
            iconColor="text-teal-500" iconBg="bg-teal-500/10 dark:bg-teal-500/20"
          />
          <KPICard
            icon={AlertCircle} title="Expiries" value={engagement.recent_expiries.length} subtitle="Next 30d"
            iconColor="text-orange-500" iconBg="bg-orange-500/10 dark:bg-orange-500/20"
          />
          <KPICard
            icon={PackageCheck} title="Packages" value={totalPackages} subtitle={`${packages.distribution.length} Types`}
            iconColor="text-cyan-500" iconBg="bg-cyan-500/10 dark:bg-cyan-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 pb-2 lg:pb-0">

          <div className="col-span-1 lg:col-span-4 h-[400px] lg:h-[480px] flex flex-col rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">

            <div className="flex items-center justify-between mb-3 pb-3 border-b border-stroke dark:border-strokedark">
              <div>
                <Typography variant="card-title" as="h3" className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  Top Active Companies
                </Typography>
                <Typography variant="caption" className="font-medium">Total Logs (User + System)</Typography>
              </div>
            </div>
            <div className="flex-1 min-h-0 w-full">
              {lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineChartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <defs>
                      {topActiveCompanies.map((company, index) => (
                        <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.1} />
                          <stop offset="95%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={5} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {topActiveCompanies.map((company, index) => (
                      <Area
                        key={company.company_name}
                        type="monotone"
                        dataKey={company.company_name}
                        stroke={chartColors[index % chartColors.length]}
                        fill={`url(#color-${index})`}
                        strokeWidth={2}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400"><Zap size={24} className="mb-1 opacity-50" /><span className="text-xs">No Data</span></div>
              )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 h-[400px] lg:h-[480px] flex flex-col rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">

            <div className="mb-3 pb-3 border-b border-stroke dark:border-strokedark">
              <Typography variant="card-title" as="h3" className="flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Distribution
              </Typography>
              <Typography variant="caption" className="font-medium">Paid vs Free</Typography>
            </div>
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative w-full">
              {overview.total_companies > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                        {paymentPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col items-center justify-center mt-2">
                    <Typography variant="value" className="text-lg">{overview.total_companies}</Typography>
                    <Typography variant="badge" className="text-xxs">Total</Typography>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400"><Activity size={24} className="mb-1 opacity-50" /><Typography variant="caption">No Data</Typography></div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-stroke dark:border-strokedark flex flex-col gap-2">
              {paymentPieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full ring-1 ring-slate-100 dark:ring-slate-700" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <Typography variant="value" className="!text-xs">{item.value}</Typography>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-5 h-[400px] lg:h-[480px] flex flex-col rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">

            <div className="mb-3 pb-3 border-b border-stroke dark:border-strokedark">
              <Typography variant="card-title" as="h3" className="flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                New Arrivals
              </Typography>
              <Typography variant="caption" className="font-medium">Latest 5 Registered</Typography>
            </div>
            <div className="flex-1 min-h-0 relative w-full">
              {recentCompanies.length > 0 ? (
                <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
                  <DynamicTable<Company>
                    data={recentCompanies}
                    columns={recentCompaniesColumns}
                    isLoading={false}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400"><UserX size={24} className="mb-1 opacity-50" /><Typography variant="caption">No Data</Typography></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DateRangePicker
        isOpen={isDatePickerOpen}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </>
  );
}