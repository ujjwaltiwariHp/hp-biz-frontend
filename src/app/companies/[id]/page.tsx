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
  DollarSign,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { format } from 'date-fns';

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
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
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

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/companies/${companyId}/details`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Edit size={18} />
          Edit Details
        </Link>

        <Link
          href={`/companies/${companyId}/subscriptions`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
        >
          <Package size={18} />
          Update Subscription
        </Link>

        {isSuperAdmin && (
          <>
            <button
              onClick={handleToggleStatus}
              disabled={activateMutation.isPending || deactivateMutation.isPending}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                company.is_active
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {company.is_active ? (
                <>
                  <UserX size={18} />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  Activate
                </>
              )}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors disabled:opacity-50"
            >
              <Trash2 size={18} />
              Delete Company
            </button>
          </>
        )}
      </div>

      {/* Company Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Company Name
              </p>
              <p className="text-base font-semibold text-black dark:text-white mt-1">
                {company.company_name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Unique ID
              </p>
              <p className="text-base font-semibold text-primary mt-1">
                {company.unique_company_id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Industry
              </p>
              <p className="text-base font-semibold text-black dark:text-white mt-1">
                {company.industry || 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Company Size
              </p>
              <p className="text-base font-semibold text-black dark:text-white mt-1">
                {company.company_size || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            Contact Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="text-primary mt-1" size={18} />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <a
                  href={`mailto:${company.admin_email}`}
                  className="text-base font-semibold text-primary hover:underline mt-1 break-all"
                >
                  {company.admin_email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="text-primary mt-1" size={18} />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="text-base font-semibold text-black dark:text-white mt-1">
                  {company.phone || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="text-primary mt-1" size={18} />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Website
                </p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-primary hover:underline mt-1 break-all"
                >
                  {company.website}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="text-primary mt-1" size={18} />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Address
                </p>
                <p className="text-base font-semibold text-black dark:text-white mt-1">
                  {company.address || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Information */}
      <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Admin Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Admin Name
            </p>
            <p className="text-base font-semibold text-black dark:text-white mt-2">
              {company.admin_name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Email Verified
            </p>
            <div className="flex items-center gap-2 mt-2">
              {company.email_verified ? (
                <>
                  <CheckCircle size={18} className="text-success" />
                  <span className="font-semibold text-success">Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle size={18} className="text-warning" />
                  <span className="font-semibold text-warning">Pending</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <Package size={20} className="text-primary" />
            Current Subscription
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Package
              </p>
              <p className="text-base font-semibold text-black dark:text-white mt-1">
                {company.package_name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Price
              </p>
              <p className="text-base font-semibold text-primary mt-1">
                ${parseFloat(String(company.package_price)).toFixed(2)} / {company.duration_type}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Period
              </p>
              <p className="text-base font-semibold text-black dark:text-white mt-1">
                {format(new Date(company.subscription_start_date), 'MMM dd, yyyy')} -{' '}
                {format(new Date(company.subscription_end_date), 'MMM dd, yyyy')}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Status
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
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
                {isSubscriptionExpired ? 'Expired' : 'Active'}
                {!isSubscriptionExpired && ` (${daysUntilExpiry} days left)`}
              </span>
            </div>
          </div>
        </div>

        {/* Package Details */}
        {pkg && (
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Package Features
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Max Staff
                </p>
                <p className="text-base font-semibold text-black dark:text-white mt-1">
                  {pkg.max_staff_count === 0 ? 'Unlimited' : pkg.max_staff_count}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Max Leads/Month
                </p>
                <p className="text-base font-semibold text-black dark:text-white mt-1">
                  {pkg.max_leads_per_month === 0 ? 'Unlimited' : pkg.max_leads_per_month}
                </p>
              </div>

              {pkg.is_trial && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Trial Period
                  </p>
                  <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                    {pkg.trial_duration_days} days
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Staff
                </p>
                <p className="text-2xl font-bold text-black dark:text-white mt-2">
                  {stats.total_staff}
                </p>
              </div>
              <Users size={32} className="text-primary opacity-20" />
            </div>
          </div>

          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Leads
                </p>
                <p className="text-2xl font-bold text-black dark:text-white mt-2">
                  {stats.total_leads}
                </p>
              </div>
              <TrendingUp size={32} className="text-primary opacity-20" />
            </div>
          </div>

          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Activities
                </p>
                <p className="text-2xl font-bold text-black dark:text-white mt-2">
                  {stats.total_activities}
                </p>
              </div>
              <Activity size={32} className="text-primary opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Invoices Preview */}
      {recentInvoices.length > 0 && (
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Recent Invoices
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="text-left py-3 px-3 font-semibold text-black dark:text-white">
                    Invoice #
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-black dark:text-white">
                    Amount
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-black dark:text-white">
                    Due Date
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-black dark:text-white">
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
                    <td className="py-3 px-3 text-black dark:text-white font-medium">
                      {invoice.invoice_number}
                    </td>
                    <td className="py-3 px-3 text-black dark:text-white">
                      {invoice.currency} {parseFloat(invoice.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
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
          <Link
            href={`/companies/${companyId}/invoices`}
            className="mt-4 inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            View all invoices
            <TrendingUp size={16} />
          </Link>
        </div>
      )}

      {/* Confirmation Dialogs */}
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