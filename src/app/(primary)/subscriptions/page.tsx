'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useState, useMemo } from 'react';
import { SubscriptionPackage } from '@/types/subscription';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, CheckCircle, MinusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Typography } from '@/components/common/Typography';
import { useSSE } from '@/hooks/useSSE';
import Loader from '@/components/common/Loader';

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

  // Track loading state for specific package actions
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const packagesQueryKey = ['packages']; // Simplified key, we filter on client

  const { data: packagesData, isLoading } = useQuery({
    queryKey: packagesQueryKey,
    queryFn: () => subscriptionService.getPackages(), // Fetch all packages always
    staleTime: 60000,
  });

  useSSE('sa_subscription_status_update', ['packages']);

  // Filter logic applied on the client side to fix the backend "Inactive Only" issue
  const filteredPackages = useMemo(() => {
    const allPackages = packagesData?.data?.packages || [];
    // Always return a new array to prevent mutation issues
    if (activeFilter === 'all') return [...allPackages];
    if (activeFilter === 'active') return allPackages.filter(p => p.is_active);
    if (activeFilter === 'inactive') return allPackages.filter(p => !p.is_active);
    return [...allPackages];
  }, [packagesData, activeFilter]);

  const toggleStatusMutation = useMutation({
    mutationFn: subscriptionService.toggleStatus,
    onMutate: (id) => {
      setActionLoadingId(id);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Package status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toggleDialog.closeDialog();
      setSelectedPackage(null);
      setActionLoadingId(null);
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
      setActionLoadingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subscriptionService.removePackage,
    onMutate: (id) => {
      setActionLoadingId(id);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Package deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      deleteDialog.closeDialog();
      setSelectedPackage(null);
      setActionLoadingId(null);
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
      setActionLoadingId(null);
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



  const toggleDialogProps = selectedPackage
    ? {
      type: selectedPackage.is_active ? 'warning' : 'success' as 'warning' | 'success',
      title: `${selectedPackage.is_active ? 'Deactivate' : 'Activate'} Package`,
      message: `Are you sure you want to ${selectedPackage.is_active ? 'deactivate' : 'activate'} the package "${selectedPackage.name}"? This will affect its availability for new and existing company subscriptions.`,
      confirmText: selectedPackage.is_active ? 'Deactivate' : 'Activate',
    }
    : { type: 'warning' as 'warning' | 'success', title: '', message: '', confirmText: '' };


  return (
    <>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark font-satoshi">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center border-b border-stroke dark:border-strokedark">
          <div>
            <Typography variant="page-title" as="h4" className="text-xl font-semibold text-black dark:text-white">
              Subscription Packages
            </Typography>
            <Typography variant="caption" className="mt-1">
              Manage subscription packages and pricing
            </Typography>
          </div>
          {isSuperAdmin && (
            <Link
              href="/subscriptions/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors font-medium"
            >
              <Plus size={20} />
              <span>Create Package</span>
            </Link>
          )}
        </div>

        <div className="p-4 md:p-6 xl:p-7.5">
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${activeFilter === 'all'
                ? 'bg-primary text-white font-medium shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              All Packages <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'}`}>{packagesData?.data?.packages.length || 0}</span>
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${activeFilter === 'active'
                ? 'bg-primary text-white font-medium shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${activeFilter === 'inactive'
                ? 'bg-primary text-white font-medium shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              Inactive Only
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-0 overflow-hidden bg-white dark:bg-boxdark border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="mt-4 flex items-baseline gap-2">
                      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-16 bg-gray-50 dark:bg-meta-4 rounded-md animate-pulse" />
                        <div className="h-16 bg-gray-50 dark:bg-meta-4 rounded-md animate-pulse" />
                      </div>
                      <div className="h-10 bg-gray-50 dark:bg-meta-4 rounded-md animate-pulse" />
                      <div className="h-10 bg-gray-50 dark:bg-meta-4 rounded-md animate-pulse" />
                    </div>
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-boxdark-2 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3 h-16">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <MinusCircle className="text-gray-400" size={32} />
              </div>
              <Typography variant="body1" className="text-gray-500 text-lg mb-4">No packages found matching the filter.</Typography>
              {isSuperAdmin && activeFilter === 'all' && (
                <Link
                  href="/subscriptions/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors shadow-sm font-medium"
                >
                  <Plus size={18} />
                  <span>Create Your First Package</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg: SubscriptionPackage) => {
                const disableToggle = (actionLoadingId === pkg.id) || (pkg.is_active && pkg.company_count > 0);
                const disableDelete = (actionLoadingId === pkg.id) || pkg.company_count > 0;
                const isProcessing = actionLoadingId === pkg.id;

                // Ensure values are treated as numbers for formatting
                const monthlyPrice = parseFloat(pkg.price_monthly || '0');
                const yearlyPrice = parseFloat(pkg.price_yearly || '0');
                const currency = '$'; // Force currency display to $

                return (
                  <div
                    key={pkg.id}
                    className={`border rounded-lg p-0 overflow-hidden transition-all hover:shadow-lg flex flex-col h-full ${pkg.is_active
                      ? 'border-primary/30 bg-white dark:bg-boxdark ring-1 ring-primary/5'
                      : 'border-gray-200 bg-gray-50/50 dark:bg-boxdark-2 dark:border-gray-700 opacity-90'
                      }`}
                  >
                    <div className={`px-6 py-5 border-b ${pkg.is_active ? 'border-primary/10 bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Typography variant="value" as="h3" className="text-lg font-bold text-black dark:text-white line-clamp-1">
                            {pkg.name}
                          </Typography>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${pkg.is_active
                                ? 'bg-success/10 text-success'
                                : 'bg-danger/10 text-danger'
                                }`}
                            >
                              {pkg.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {pkg.is_trial && (
                              <span className="px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                TRIAL ({pkg.trial_duration_days} DAYS)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-baseline gap-1">
                          <Typography variant="value" as="p" className="text-3xl font-bold text-black dark:text-white">
                            {currency} {monthlyPrice.toFixed(2)}
                          </Typography>
                          <span className="text-sm text-gray-500 font-medium">/ mo</span>
                        </div>

                        {/* Show yearly price hint */}
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <span>{currency} {yearlyPrice.toFixed(2)} / yr</span>
                          {pkg.yearly_discount_percent > 0 && (
                            <span className="text-success bg-success/10 px-1.5 rounded text-[10px] font-bold">
                              SAVE {pkg.yearly_discount_percent}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex-grow">
                      <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-meta-4 p-3 rounded-md">
                            <span className="block text-xs text-gray-500 mb-1">Max Staff</span>
                            <span className="block font-semibold text-black dark:text-white text-sm">
                              {pkg.max_staff_count === 0 ? 'Unlimited' : pkg.max_staff_count}
                            </span>
                          </div>
                          <div className="bg-gray-50 dark:bg-meta-4 p-3 rounded-md">
                            <span className="block text-xs text-gray-500 mb-1">Leads/Mo</span>
                            <span className="block font-semibold text-black dark:text-white text-sm">
                              {pkg.max_leads_per_month === 0 ? 'Unlimited' : pkg.max_leads_per_month}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                          <span className="text-gray-500">Custom Fields</span>
                          <span className="font-medium text-black dark:text-white">
                            {pkg.max_custom_fields === 0 ? 'None' : `${pkg.max_custom_fields} Fields`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                          <span className="text-gray-500">Active Clients</span>
                          <span className={`font-bold ${pkg.company_count > 0 ? 'text-primary' : 'text-gray-400'}`}>
                            {pkg.company_count}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Typography variant="label" as="span" className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-3 block">Included Features</Typography>
                        <ul className="space-y-2">
                          {pkg.features.slice(0, 3).map((feature, index) => (
                            <FeatureItem key={index} feature={feature} />
                          ))}
                          {pkg.features.length > 3 && (
                            <li className="text-xs text-gray-500 mt-2 flex items-center pl-1 font-medium">
                              <Plus size={12} className="mr-1.5" />
                              {pkg.features.length - 3} more features
                            </li>
                          )}
                          {pkg.features.length === 0 && (
                            <li className="text-sm text-gray-400 italic">No specific features configured.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-boxdark-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-3 h-16">
                      {isProcessing ? (
                        <div className="flex items-center justify-center w-full text-primary text-xs font-medium animate-pulse">
                          <Loader size="sm" variant="inline" className="mr-2" />
                          Processing...
                        </div>
                      ) : isSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(pkg)}
                            className={`p-2 rounded-md hover:bg-white dark:hover:bg-boxdark shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all ${disableToggle ? 'opacity-50 cursor-not-allowed text-gray-400' : pkg.is_active ? 'text-danger hover:text-danger' : 'text-success hover:text-success'
                              }`}
                            disabled={disableToggle}
                            title={pkg.is_active
                              ? (pkg.company_count > 0 ? 'Deactivation blocked by active clients' : 'Deactivate Package')
                              : 'Activate Package'}
                          >
                            {pkg.is_active
                              ? <ToggleRight size={22} />
                              : <ToggleLeft size={22} />}
                          </button>

                          <div className="flex gap-2 ml-auto">
                            <Link
                              href={`/subscriptions/${pkg.id}/edit`}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-white dark:hover:bg-boxdark rounded-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all"
                              title="Edit Package"
                            >
                              <Edit size={18} />
                            </Link>

                            <button
                              onClick={() => handleDelete(pkg)}
                              className={`p-2 rounded-md hover:bg-white dark:hover:bg-boxdark border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all ${disableDelete ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-600 dark:text-gray-400 hover:text-danger'
                                }`}
                              disabled={disableDelete}
                              title={pkg.company_count > 0 ? `Cannot delete: ${pkg.company_count} active clients` : 'Delete Package'}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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
    </>
  );
}