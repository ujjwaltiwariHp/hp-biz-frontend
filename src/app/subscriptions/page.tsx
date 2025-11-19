'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useState } from 'react';
import { SubscriptionPackage } from '@/types/subscription';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, CheckCircle, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Typography } from '@/components/common/Typography';
import { useSSE } from '@/hooks/useSSE';

// Removed outdated formatDurationType function as duration_type no longer exists

const FeatureItem = ({ feature, Icon = CheckCircle }: { feature: string, Icon?: any }) => (
    <li className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
        <Icon size={14} className={`mr-2 flex-shrink-0 mt-0.5 ${Icon === CheckCircle ? 'text-green-500' : 'text-gray-500'}`} />
        <Typography variant="body" as="span">{feature.replace(/_/g, ' ')}</Typography>
    </li>
);

export default function SubscriptionsPage() {
  const { isSuperAdmin } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const queryClient = useQueryClient();

  const deleteDialog = useConfirmDialog();
  const toggleDialog = useConfirmDialog();
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('deactivate');

  const packagesQueryKey = ['packages', activeFilter];

  const { data: packagesData, isLoading } = useQuery({
    queryKey: packagesQueryKey,
    queryFn: () => subscriptionService.getPackages({
      active_only: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
    }),
    staleTime: 60000,
  });

  useSSE('sa_subscription_status_update', ['packages']);

  const toggleStatusMutation = useMutation({
    mutationFn: subscriptionService.toggleStatus,
    onSuccess: (data) => {
      toast.success(data.message || 'Package status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toggleDialog.closeDialog();
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to update package status.';
      if (errorMessage.includes("subscribed to it")) {
          toast.error("Cannot deactivate: Package is currently used by active companies.");
      } else {
          toast.error(errorMessage);
      }
      toggleDialog.closeDialog();
      setSelectedPackage(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subscriptionService.removePackage,
    onSuccess: (data) => {
      toast.success(data.message || 'Package deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      deleteDialog.closeDialog();
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete package.';
      if (errorMessage.includes("assigned to companies")) {
        toast.error("Cannot delete: Package is currently assigned to companies.");
      } else {
        toast.error(errorMessage);
      }
      deleteDialog.closeDialog();
      setSelectedPackage(null);
    },
  });

  const handleToggleStatus = (pkg: SubscriptionPackage) => {
    if (!isSuperAdmin) {
        toast.error('Permission Denied: View-only access.');
        return;
    }
    if (pkg.is_active && pkg.company_count > 0) {
        toast.error("Cannot deactivate: Package is currently used by active companies.");
        return;
    }
    setSelectedPackage(pkg);
    setActionType(pkg.is_active ? 'deactivate' : 'activate');
    toggleDialog.openDialog();
  };

  const confirmToggleStatus = () => {
    if (!selectedPackage) return;
    toggleStatusMutation.mutate(selectedPackage.id);
  };

  const handleDelete = (pkg: SubscriptionPackage) => {
    if (!isSuperAdmin) {
        toast.error('Permission Denied: View-only access.');
        return;
    }
    if (pkg.company_count > 0) {
      toast.error(`Cannot delete ${pkg.name}. It is currently assigned to ${pkg.company_count} active companies.`);
      return;
    }
    setSelectedPackage(pkg);
    deleteDialog.openDialog();
  };

  const confirmDelete = () => {
    if (!selectedPackage) return;
    deleteMutation.mutate(selectedPackage.id);
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  const packages = packagesData?.data?.packages || [];

  const toggleDialogProps = selectedPackage
    ? {
        type: selectedPackage.is_active ? 'warning' : 'success' as 'warning' | 'success',
        title: `${selectedPackage.is_active ? 'Deactivate' : 'Activate'} Package`,
        message: `Are you sure you want to ${selectedPackage.is_active ? 'deactivate' : 'activate'} the package "${selectedPackage.name}"? This will affect its availability for new and existing company subscriptions.`,
        confirmText: selectedPackage.is_active ? 'Deactivate' : 'Activate',
      }
    : { type: 'warning' as 'warning' | 'success', title: '', message: '', confirmText: '' };


  return (
    <DefaultLayout>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
          <div>
            <Typography variant="page-title" as="h4">
              Subscription Packages
            </Typography>
            <Typography variant="caption" className="mt-1">
              Manage subscription packages and pricing
            </Typography>
          </div>
          {isSuperAdmin && (
            <Link
              href="/subscriptions/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
            >
              <Plus size={20} />
              <Typography variant="body" as="span" className="text-white">Create Package</Typography>
            </Link>
          )}
        </div>

        <div className="px-4 md:px-6 xl:px-7.5 pb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Packages (<Typography variant="caption" as="span" className={activeFilter !== 'all' ? 'text-black dark:text-white' : 'text-white'}>{packages.length}</Typography>)
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeFilter === 'active'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeFilter === 'inactive'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Inactive Only
            </button>
          </div>
        </div>

        <div className="px-4 md:px-6 xl:px-7.5 pb-6">
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <Typography variant="body1" className="text-gray-500 text-lg mb-4">No packages found matching the filter.</Typography>
              {isSuperAdmin && (
                  <Link
                    href="/subscriptions/create"
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
                  >
                    <Typography variant="body" as="span" className="text-white">Create Your First Package</Typography>
                  </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg: SubscriptionPackage) => {
                const disableToggle = toggleStatusMutation.isPending || (pkg.is_active && pkg.company_count > 0);
                const disableDelete = deleteMutation.isPending || pkg.company_count > 0;

                // Ensure values are treated as numbers for formatting
                const monthlyPrice = parseFloat(pkg.price_monthly || '0');
                const yearlyPrice = parseFloat(pkg.price_yearly || '0');
                const currency = pkg.currency || 'USD';

                return (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-6 transition-all hover:shadow-lg ${
                    pkg.is_active
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Typography variant="value" as="h3" className="text-lg font-semibold text-black dark:text-white">
                        {pkg.name}
                      </Typography>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            pkg.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          <Typography variant="badge">{pkg.is_active ? 'Active' : 'Inactive'}</Typography>
                        </span>
                        {pkg.is_trial && (
                            <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full dark:bg-indigo-900 dark:text-indigo-200 font-bold">
                                <Typography variant="badge">TRIAL ({pkg.trial_duration_days} DAYS)</Typography>
                            </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {/* NEW PRICING DISPLAY */}
                      <Typography variant="value" as="p" className="text-2xl font-bold text-primary">
                        {currency} {monthlyPrice.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" className="text-sm text-gray-500">
                        / month
                      </Typography>
                      {/* Show yearly price hint */}
                      <div className="text-xs text-gray-500 mt-1">
                        {currency} {yearlyPrice.toFixed(2)} / year
                        {pkg.yearly_discount_percent > 0 && (
                           <span className="text-green-600 ml-1 font-medium">
                             (-{pkg.yearly_discount_percent}%)
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="text-sm flex justify-between">
                      <Typography variant="caption" as="span">Max Staff:</Typography>
                      <Typography variant="body" as="span" className="ml-2 font-medium text-black dark:text-white">
                        {pkg.max_staff_count === 0 ? 'Unlimited' : pkg.max_staff_count}
                      </Typography>
                    </div>
                    <div className="text-sm flex justify-between">
                      <Typography variant="caption" as="span">Max Leads/Month:</Typography>
                      <Typography variant="body" as="span" className="ml-2 font-medium text-black dark:text-white">
                        {pkg.max_leads_per_month === 0 ? 'Unlimited' : pkg.max_leads_per_month}
                      </Typography>
                    </div>
                    <div className="text-sm flex justify-between">
                      <Typography variant="caption" as="span">Max Custom Fields:</Typography>
                      <Typography variant="body" as="span" className="ml-2 font-medium text-black dark:text-white">
                        {pkg.max_custom_fields === 0 ? 'None' : pkg.max_custom_fields}
                      </Typography>
                    </div>
                    <div className="text-sm flex justify-between">
                      <Typography variant="caption" as="span">Clients Using:</Typography>
                      <Typography variant="body" as="span" className={`ml-2 font-medium ${pkg.company_count > 0 ? 'text-danger' : 'text-success'}`}>
                        {pkg.company_count}
                      </Typography>
                    </div>

                    <div>
                      <Typography variant="label" as="span" className="font-medium">Key Features:</Typography>
                      <ul className="mt-2 space-y-1">
                        {pkg.features.slice(0, 4).map((feature, index) => (
                          <FeatureItem key={index} feature={feature} />
                        ))}
                        {pkg.features.length > 4 && (
                            <li className="text-xs text-gray-500 mt-1 flex items-center">
                                <MinusCircle size={14} className="text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                                <Typography variant="caption" as="span">+ {pkg.features.length - 4} more features</Typography>
                            </li>
                        )}
                      </ul>
                      {pkg.features.length === 0 && (
                          <Typography variant="caption" className="text-xs text-gray-500 mt-1">No features defined.</Typography>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <Typography variant="caption" className="text-xs text-gray-500">
                      Created: {new Date(pkg.created_at).toLocaleDateString()}
                    </Typography>
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(pkg)}
                            className={`hover:text-primary transition-colors ${
                              disableToggle ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={disableToggle}
                            title={pkg.is_active
                                ? (pkg.company_count > 0 ? 'Deactivation blocked by active clients' : 'Deactivate Package')
                                : 'Activate Package'}
                          >
                            {pkg.is_active
                                ? <ToggleRight size={24} className={pkg.company_count > 0 ? 'text-gray-500' : 'text-danger'}/>
                                : <ToggleLeft size={24} className='text-success'/>}
                          </button>
                          <Link
                            href={`/subscriptions/${pkg.id}/edit`}
                            className="hover:text-primary transition-colors"
                            title="Edit Package"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(pkg)}
                            className={`hover:text-danger transition-colors ${
                              disableDelete ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={disableDelete}
                            title={pkg.company_count > 0 ? `Cannot delete: ${pkg.company_count} active clients` : 'Delete Package'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                    )}
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        {...deleteDialog.confirmProps}
        type="danger"
        title="Delete Package"
        message={`Are you sure you want to permanently delete the package "${selectedPackage?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        {...toggleDialog.confirmProps}
        type={toggleDialogProps.type}
        title={toggleDialogProps.title}
        message={toggleDialogProps.message}
        onConfirm={confirmToggleStatus}
        confirmText={toggleDialogProps.confirmText}
        isLoading={toggleStatusMutation.isPending}
      />
    </DefaultLayout>
  );
}