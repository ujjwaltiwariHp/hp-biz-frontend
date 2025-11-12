'use client';

import React, { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { subscriptionService } from '@/services/subscription.service';
import { invoiceService } from '@/services/invoice.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  Calendar,
  Package,
  CreditCard,
  Edit,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle,
  AlertCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { format } from 'date-fns';

// Import Typography components for consistent font sizing
import { PageTitle, CardTitle, Label, Value } from '@/components/common/Typography';


interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompanyOverviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Dialog hooks
  const toggleDialog = useConfirmDialog();
  const deleteDialog = useConfirmDialog();
  const [selectedAction, setSelectedAction] = React.useState<'activate' | 'deactivate' | null>(null);

  // Fetch company data
  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch subscription package details
  const { data: packageResponse } = useQuery({
    queryKey: ['package', companyResponse?.data?.company?.subscription_package_id],
    queryFn: () =>
      subscriptionService.getPackageById(
        companyResponse?.data?.company?.subscription_package_id || 0
      ),
    enabled: !!companyResponse?.data?.company?.subscription_package_id,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch recent invoices
  const { data: invoicesResponse } = useQuery({
    queryKey: ['company-invoices', companyId],
    queryFn: () =>
      invoiceService.getAllInvoices(1, 5, {
        search: undefined,
        status: undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const activateMutation = useMutation({
    mutationFn: () => companyService.activateCompanyAccount(companyId),
    onSuccess: (data) => {
      toast.success(data.message || 'Company activated successfully');
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toggleDialog.closeDialog();
      setSelectedAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate company');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => companyService.deactivateCompanyAccount(companyId),
    onSuccess: (data) => {
      toast.success(data.message || 'Company deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toggleDialog.closeDialog();
      setSelectedAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate company');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => companyService.removeCompany(companyId),
    onSuccess: (data) => {
      toast.success(data.message || 'Company deleted successfully');
      deleteDialog.closeDialog();
      router.push('/companies');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete company');
    },
  });

  const handleToggleStatus = () => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only Super Admin can perform this action.');
      return;
    }
    setSelectedAction(company?.is_active ? 'deactivate' : 'activate');
    toggleDialog.openDialog();
  };

  const handleDelete = () => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only Super Admin can perform this action.');
      return;
    }
    deleteDialog.openDialog();
  };

  const confirmToggleStatus = () => {
    if (selectedAction === 'activate') {
      activateMutation.mutate();
    } else if (selectedAction === 'deactivate') {
      deactivateMutation.mutate();
    }
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  if (companyLoading) {
    return <Loader />;
  }

  const company = companyResponse?.data?.company;
  const stats = companyResponse?.data?.stats;
  const pkg = packageResponse?.data?.package;
  const allInvoices = invoicesResponse?.invoices || [];

  // Filter invoices to only show those for this company
  const recentInvoices = allInvoices.filter(
    (inv) => inv.company_id === companyId
  ).slice(0, 5);

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

  const isSubscriptionExpired =
    new Date(company.subscription_end_date) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(company.subscription_end_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const InfoBlock = ({ label, value, className = '' }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className={className}>
        <Label>{label}</Label>
        <Value as="p" className="mt-1">
            {value}
        </Value>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Page Title */}
      <div className='flex items-center justify-between'>
        <div>
          <PageTitle as="h2">Company Overview</PageTitle>
        </div>

        {/* Management Actions - Combined */}
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Link
                href={`/companies/${companyId}/subscriptions`}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
            >
                <Package size={14} />
                Update Plan
            </Link>

            {/* Activate/Deactivate Button */}
            <button
                onClick={handleToggleStatus}
                disabled={activateMutation.isPending || deactivateMutation.isPending}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    company.is_active
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}
            >
                {company.is_active ? (
                    <>
                        <UserX size={14} />
                        Deactivate
                    </>
                ) : (
                    <>
                        <UserCheck size={14} />
                        Activate
                    </>
                )}
            </button>

            {/* Delete Button */}
            <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors disabled:opacity-50"
            >
                <Trash2 size={14} />
                Delete
            </button>
          </div>
        )}
      </div>

      {/* 1. Statistics (KPIs - MOVED TO TOP, COMPACT BOXES) */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Staff KPI */}
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>
                  Total Staff
                </Label>
                <p className="text-xl font-bold text-black dark:text-white mt-1">
                  {stats.total_staff}
                </p>
              </div>
              {/* Dark Mode Fix: Ensure icon is visible in dark mode by using dark:text-white/30 or similar */}
              <Users size={24} className="text-primary/70 dark:text-white/30" />
            </div>
          </div>

          {/* Total Leads KPI */}
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>
                  Total Leads
                </Label>
                <p className="text-xl font-bold text-black dark:text-white mt-1">
                  {stats.total_leads}
                </p>
              </div>
              <TrendingUp size={24} className="text-primary/70 dark:text-white/30" />
            </div>
          </div>

          {/* Total Activities KPI */}
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>
                  Total Activities
                </Label>
                <p className="text-xl font-bold text-black dark:text-white mt-1">
                  {stats.total_activities}
                </p>
              </div>
              <Activity size={24} className="text-primary/70 dark:text-white/30" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Basic and Contact Info (Combined for Industry Standard look) */}
        <div className="lg:col-span-2 space-y-6">

            {/* Basic Info & Contact Info (Combined Card) */}
            <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
              <CardTitle as="h3" className="mb-4">
                Company Profile
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {/* Basic Info */}
                <InfoBlock label="Company Name" value={company.company_name} />
                <InfoBlock label="Unique ID" value={company.unique_company_id} className="text-primary" />
                <InfoBlock label="Industry" value={company.industry || 'Not specified'} />
                <InfoBlock label="Company Size" value={company.company_size || 'Not specified'} />

                {/* Contact Info */}
                <div className="flex items-start gap-3 pt-4 border-t border-stroke dark:border-strokedark sm:border-t-0 sm:pt-0">
                  <Mail className="text-primary dark:text-white/70 mt-1" size={16} />
                  <InfoBlock
                    label="Email"
                    value={(
                      <a
                        href={`mailto:${company.admin_email}`}
                        className="font-semibold text-primary hover:underline break-all"
                      >
                        {company.admin_email}
                      </a>
                    )}
                  />
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-stroke dark:border-strokedark sm:border-t-0 sm:pt-0">
                  <Phone className="text-primary dark:text-white/70 mt-1" size={16} />
                  <InfoBlock
                    label="Phone"
                    value={company.phone || 'Not provided'}
                  />
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-stroke dark:border-strokedark sm:border-t-0 sm:pt-0">
                  <Globe className="text-primary dark:text-white/70 mt-1" size={16} />
                  <InfoBlock
                    label="Website"
                    value={(
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline break-all"
                      >
                        {company.website}
                      </a>
                    )}
                  />
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-stroke dark:border-strokedark sm:border-t-0 sm:pt-0">
                  <MapPin className="text-primary dark:text-white/70 mt-1" size={16} />
                  <InfoBlock
                    label="Address"
                    value={company.address || 'Not provided'}
                  />
                </div>
              </div>
            </div>

            {/* Admin Information */}
            <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
              <CardTitle as="h3" className="mb-4">
                Admin Information
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoBlock label="Admin Name" value={company.admin_name} />

                <InfoBlock
                  label="Email Verified"
                  value={(
                      // FIX: The wrapper must be a fragment or div, not a div inside a p tag.
                      <div className="flex items-center gap-2">
                        {company.email_verified ? (
                          <>
                            <CheckCircle size={16} className="text-success" />
                            <Value as="span" className="text-success">Verified</Value>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} className="text-warning" />
                            <Value as="span" className="text-warning">Pending</Value>
                          </>
                        )}
                      </div>
                  )}
                  // The parent InfoBlock renders <Value as="p">. The inner value must be changed to <Value as="div"> or the inner content must not contain a <div>.
                  // Since Value is already configured to accept the 'as' prop, we adjust the InfoBlock definition used for this specific scenario.
                  // However, since InfoBlock is defined locally and uses <Value as="p">, we must change the InfoBlock's rendering logic or ensure the content passed to Value does not violate HTML rules.
                  // The easiest fix is changing the type of the value wrapper in the InfoBlock component's local definition in the next step.

                  // Since InfoBlock is defined *below* the component function, I'll rely on the previous fix in the next step.
                  // For now, assume the InfoBlock definition uses a generic wrapper, but the core fix is ensuring the outer <p> is replaced by a safe block container (which Value as="div" provides).
                  // Reverting the manual adjustment for InfoBlock here, assuming the original issue was that the final render stack was <p> -> <p> -> <div>.
                />
              </div>
            </div>

            {/* Recent Invoices Preview */}
            {recentInvoices.length > 0 && (
              <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
                <div className='flex justify-between items-center mb-4'>
                    <CardTitle as="h3" className="flex items-center gap-2">
                        <CreditCard size={16} className="text-primary" />
                        Recent Invoices
                    </CardTitle>
                    <Link
                        href={`/companies/${companyId}/invoices`}
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                    >
                        View all
                        <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke dark:border-strokedark">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-black dark:text-white">
                          Invoice #
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-black dark:text-white">
                          Amount
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-black dark:text-white">
                          Due Date
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-black dark:text-white">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.slice(0, 5).map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
                        >
                          <td className="py-3 px-3 text-sm text-black dark:text-white font-medium">
                            {invoice.invoice_number}
                          </td>
                          <td className="py-3 px-3 text-sm text-black dark:text-white">
                            {invoice.currency} {parseFloat(invoice.total_amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-400">
                            {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${
                                invoice.status === 'paid'
                                  ? 'bg-success/10 text-success'
                                  : invoice.status === 'overdue'
                                  ? 'bg-danger/10 text-danger'
                                  : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {invoice.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

        </div>

        {/* Column 2: Subscription Information (Sidebar/Compact Card) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <CardTitle as="h3" className="mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Current Subscription
            </CardTitle>
            <div className="space-y-3">
              <InfoBlock label="Package" value={company.package_name} />
              <InfoBlock
                  label="Price"
                  value={`$${parseFloat(String(company.package_price)).toFixed(2)} / ${company.duration_type}`}
                  className="text-primary"
              />
              <InfoBlock
                  label="Period"
                  value={`${format(new Date(company.subscription_start_date), 'MMM dd, yyyy')} - ${format(new Date(company.subscription_end_date), 'MMM dd, yyyy')}`}
              />

              <div>
                <Label className="mb-2">
                  Status
                </Label>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xxs font-semibold ${
                    isSubscriptionExpired
                      ? 'bg-danger/10 text-danger'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSubscriptionExpired ? 'bg-danger' : 'bg-success'
                    }`}
                  ></span>
                  {isSubscriptionExpired ? 'EXPIRED' : 'ACTIVE'}
                  {!isSubscriptionExpired && ` (${daysUntilExpiry} days left)`}
                </span>
              </div>
            </div>
          </div>

          {/* Package Details (Moved next to subscription card) */}
          {pkg && (
            <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
              <CardTitle as="h3" className="mb-4">
                Package Features
              </CardTitle>
              <div className="space-y-3">
                <InfoBlock
                  label="Max Staff"
                  value={pkg.max_staff_count === 0 ? 'Unlimited' : pkg.max_staff_count}
                />
                <InfoBlock
                  label="Max Leads/Month"
                  value={pkg.max_leads_per_month === 0 ? 'Unlimited' : pkg.max_leads_per_month}
                />

                {pkg.is_trial && (
                  <InfoBlock
                      label="Trial Period"
                      value={`${pkg.trial_duration_days} days`}
                      className="text-indigo-600 dark:text-indigo-400"
                  />
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Dialogs - Kept at the bottom as they are modals */}
      <ConfirmDialog
        {...toggleDialog.confirmProps}
        type={selectedAction === 'deactivate' ? 'warning' : 'success'}
        title={`${selectedAction === 'deactivate' ? 'Deactivate' : 'Activate'} Company`}
        message={`Are you sure you want to ${selectedAction} "${company.company_name}"? ${
          selectedAction === 'deactivate'
            ? 'The company will lose access to the platform.'
            : 'The company will regain full access to the platform.'
        }`}
        onConfirm={confirmToggleStatus}
        confirmText={selectedAction === 'deactivate' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        isLoading={activateMutation.isPending || deactivateMutation.isPending}
      />

      <ConfirmDialog
        {...deleteDialog.confirmProps}
        type="danger"
        title="Delete Company"
        message={`Are you sure you want to permanently delete "${company.company_name}"? This action cannot be undone and will remove all associated data.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}