'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { subscriptionService } from '@/services/subscription.service';
import { invoiceService } from '@/services/invoice.service';
import Loader from '@/components/common/Loader';
import { SkeletonRect } from '@/components/common/Skeleton';
import {
  Mail, Phone, Globe, MapPin, Users, TrendingUp, CreditCard,
  UserCheck, CheckCircle, AlertCircle, Activity, ArrowRight,
  Package, Building2, Calendar, DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Typography } from '@/components/common/Typography';
import DynamicTable from '@/components/common/DynamicTable';
import { TableColumn } from '@/types/table';
import { Invoice } from '@/types/invoice';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const InfoBlock = ({ label, value, className = '' }: { label: string, value: React.ReactNode, className?: string }) => (
  <div className={className}>
    <Typography variant="label" as="p" className="text-xs mb-1.5 block">{label}</Typography>
    <Typography as="div" variant="value" className="break-words block">
      {value}
    </Typography>
  </div>
);

const getInvoiceStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-success/10 text-success';
    case 'overdue': return 'bg-danger/10 text-danger';
    default: return 'bg-warning/10 text-warning';
  }
};

export default function CompanyOverviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id, 10);


  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: packageResponse } = useQuery({
    queryKey: ['package', companyResponse?.data?.company?.subscription_package_id],
    queryFn: () => subscriptionService.getPackageById(companyResponse?.data?.company?.subscription_package_id || 0),
    enabled: !!companyResponse?.data?.company?.subscription_package_id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: invoicesResponse } = useQuery({
    queryKey: ['company-invoices', companyId],
    queryFn: () => invoiceService.getAllInvoices(1, 5, { company_id: companyId }),
    staleTime: 5 * 60 * 1000,
    enabled: !!companyId,
  });

  if (companyLoading) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonRect className="h-32 w-full" />
          <SkeletonRect className="h-32 w-full" />
          <SkeletonRect className="h-32 w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <SkeletonRect className="h-64 w-full" />
            <SkeletonRect className="h-48 w-full" />
            <SkeletonRect className="h-96 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-5">
            <SkeletonRect className="h-64 w-full" />
            <SkeletonRect className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const company = companyResponse?.data?.company;
  const stats = companyResponse?.data?.stats || {
    total_staff: 0,
    total_leads: 0,
    leads_this_month: 0,
    total_activities: 0,
  };
  const pkg = packageResponse?.data?.package;
  const allInvoices = invoicesResponse?.invoices || [];

  const recentInvoices = allInvoices.filter(
    (inv) => inv.company_id === companyId
  ).slice(0, 5) as Invoice[];

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

  const isSubscriptionExpired = new Date(company.subscription_end_date) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(company.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const invoiceColumns: TableColumn<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      headerClassName: 'min-w-[100px] w-[25%]',
      render: (invoice) => <Typography variant="value" className="font-medium">{invoice.invoice_number}</Typography>,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      headerClassName: 'min-w-[100px] w-[25%]',
      render: (invoice) => <Typography variant="body" className="font-medium">{invoice.currency} {parseFloat(invoice.total_amount).toFixed(2)}</Typography>,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      headerClassName: 'min-w-[100px] w-[25%]',
      render: (invoice) => <Typography variant="body" className="text-xs text-gray-600 dark:text-gray-400">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</Typography>,
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'min-w-[100px] w-[25%]',
      render: (invoice) => (
        <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${getInvoiceStatusColor(invoice.status)}`}>
          {invoice.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">


      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">


          <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Users size={24} className="text-primary" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">Users</span>
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="value" as="p" className="text-3xl font-bold text-black dark:text-white">
                {stats.total_staff}
              </Typography>
              <Typography variant="label" as="p" className="text-sm text-gray-600 dark:text-gray-400">
                Total Staff Members
              </Typography>
            </div>
          </div>


          <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success/10 dark:bg-success/20">
                <TrendingUp size={24} className="text-success" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">Leads</span>
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="value" as="p" className="text-3xl font-bold text-black dark:text-white">
                {stats.total_leads}
              </Typography>
              <Typography variant="label" as="p" className="text-sm text-gray-600 dark:text-gray-400">
                Total Leads Generated
              </Typography>
            </div>
          </div>


          <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning/10 dark:bg-warning/20">
                <Activity size={24} className="text-warning" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">Activity</span>
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="value" as="p" className="text-3xl font-bold text-black dark:text-white">
                {stats.total_activities}
              </Typography>
              <Typography variant="label" as="p" className="text-sm text-gray-600 dark:text-gray-400">
                Total Activities Logged
              </Typography>
            </div>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-stroke dark:border-strokedark">
                <Building2 size={18} className="text-primary" />
                <Typography variant="card-title" as="h3" className="text-base">Company Profile</Typography>
              </div>
              <div className="space-y-4">
                <InfoBlock label="Company Name" value={<span className="font-semibold text-black dark:text-white">{company.company_name}</span>} />
                <InfoBlock label="Industry" value={company.industry || 'Not specified'} />
                <InfoBlock label="Company Size" value={company.company_size || 'Not specified'} />
                <div className="pt-3 border-t border-stroke dark:border-strokedark">
                  <div className="flex items-start gap-2 mb-3">
                    <Globe className="text-primary dark:text-white/70 mt-1 flex-shrink-0" size={16} />
                    <InfoBlock label="Website" value={<a href={company.website || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-sm">{company.website || 'Not provided'}</a>} />
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="text-primary dark:text-white/70 mt-1 flex-shrink-0" size={16} />
                    <InfoBlock label="Address" value={company.address || 'Not provided'} />
                  </div>
                </div>
              </div>
            </div>


            <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-stroke dark:border-strokedark">
                <UserCheck size={18} className="text-primary" />
                <Typography variant="card-title" as="h3" className="text-base">Administrator</Typography>
              </div>
              <div className="space-y-4">
                <InfoBlock label="Full Name" value={<span className="font-semibold text-black dark:text-white">{company.admin_name}</span>} />
                <InfoBlock label="Account Status" value={<div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${company.is_active ? 'bg-success' : 'bg-danger'} animate-pulse`}></span><span className={`text-sm font-semibold ${company.is_active ? 'text-success' : 'text-danger'}`}>{company.is_active ? 'Active' : 'Inactive'}</span></div>} />
                <div className="pt-3 border-t border-stroke dark:border-strokedark space-y-3">
                  <div className="flex items-start gap-2">
                    <Mail className="text-primary dark:text-white/70 mt-1 flex-shrink-0" size={16} />
                    <InfoBlock label="Email" value={<a href={`mailto:${company.admin_email}`} className="text-primary hover:underline break-all text-sm">{company.admin_email}</a>} />
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="text-primary dark:text-white/70 mt-1 flex-shrink-0" size={16} />
                    <InfoBlock label="Phone" value={company.phone || 'Not provided'} />
                  </div>
                  <InfoBlock label="Email Verification" value={<div className="flex items-center gap-2">{company.email_verified ? <><CheckCircle size={16} className="text-success" /><span className="text-sm text-success font-medium">Verified</span></> : <><AlertCircle size={16} className="text-warning" /><span className="text-sm text-warning font-medium">Pending</span></>}</div>} />
                </div>
              </div>
            </div>
          </div>


          {recentInvoices.length > 0 && (
            <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6 hover:shadow-lg transition-shadow">
              <div className='flex justify-between items-center mb-5 pb-3 border-b border-stroke dark:border-strokedark'>
                <div className="flex items-center gap-2"><CreditCard size={18} className="text-primary" /><Typography variant="card-title" as="h3" className="text-base">Recent Invoices</Typography></div>
                <Link href={`/companies/${companyId}/invoices`} className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium transition-all hover:gap-2">View all <ArrowRight size={16} /></Link>
              </div>
              <DynamicTable<Invoice> data={recentInvoices} columns={invoiceColumns} isLoading={false} />
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-5">

          <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-stroke dark:border-strokedark">
              <Package size={18} className="text-primary" />
              <Typography variant="card-title" as="h3" className="text-base">Current Subscription</Typography>
            </div>
            <div className="space-y-3">
              <div className="bg-white dark:bg-boxdark rounded-lg p-4 border border-stroke dark:border-strokedark flex flex-col">
                <Typography variant="label" as="p" className="text-xs mb-2 block">Package Name</Typography>
                <Typography variant="value" as="p" className="text-xl font-bold text-primary block">
                  {company.package_name}
                </Typography>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg">
                <DollarSign size={20} className="text-primary" />
                <div className="flex flex-col">
                  <Typography variant="label" className="text-xs mb-1.5">Pricing</Typography>
                  <Typography variant="value" className="text-lg font-bold text-black dark:text-white">
                    $ {parseFloat(String(company.package_price)).toFixed(2)}
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400"> / month</span>
                  </Typography>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-boxdark-2 rounded-lg">
                <Calendar size={20} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <Typography variant="label" className="text-xs mb-2">Subscription Period</Typography>
                  <div className="space-y-1">
                    <Typography variant="body" className="text-xs text-gray-600 dark:text-gray-400"><span className="font-medium">From:</span> {format(new Date(company.subscription_start_date), 'MMM dd, yyyy')}</Typography>
                    <Typography variant="body" className="text-xs text-gray-600 dark:text-gray-400"><span className="font-medium">To:</span> {format(new Date(company.subscription_end_date), 'MMM dd, yyyy')}</Typography>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stroke dark:border-strokedark">
                <Typography variant="label" className="text-xs mb-2">Subscription Status</Typography>
                <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold w-full justify-center ${isSubscriptionExpired ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                  <span className={`h-2 w-2 rounded-full ${isSubscriptionExpired ? 'bg-danger' : 'bg-success'} animate-pulse`}></span>
                  {isSubscriptionExpired ? 'EXPIRED' : 'ACTIVE'}
                  {!isSubscriptionExpired && ` • ${daysUntilExpiry} days left`}
                </span>
              </div>
            </div>
          </div>


          {pkg && (
            <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-stroke dark:border-strokedark">
                <CheckCircle size={18} className="text-primary" />
                <Typography variant="card-title" as="h3" className="text-base">Package Features</Typography>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-boxdark-2 rounded-lg">
                  <div className="flex items-center gap-2"><Users size={16} className="text-primary" /><Typography variant="label" className="text-xs">Max Staff</Typography></div>
                  <Typography variant="value" className="font-bold text-black dark:text-white">{pkg.max_staff_count === 0 ? '∞' : pkg.max_staff_count}</Typography>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-boxdark-2 rounded-lg">
                  <div className="flex items-center gap-2"><TrendingUp size={16} className="text-primary" /><Typography variant="label" className="text-xs">Max Leads/Month</Typography></div>
                  <Typography variant="value" className="font-bold text-black dark:text-white">{pkg.max_leads_per_month === 0 ? '∞' : pkg.max_leads_per_month}</Typography>
                </div>
                {pkg.is_trial && (
                  <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-2"><Calendar size={16} className="text-indigo-600 dark:text-indigo-400" /><Typography variant="label" className="text-xs text-indigo-900 dark:text-indigo-300">Trial Period</Typography></div>
                    <Typography variant="value" className="font-bold text-indigo-600 dark:text-indigo-400">{pkg.trial_duration_days} days</Typography>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}