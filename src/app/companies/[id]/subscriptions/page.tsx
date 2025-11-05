'use client';

import React, { use, useState, useMemo } from 'react'; // ADDED: useMemo
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { subscriptionService } from '@/services/subscription.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  Package,
  Calendar,
  DollarSign,
  X,
  Save,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to calculate end date based on subscription type
const calculateEndDate = (startDate: string, durationType: string): string => {
  if (!startDate) return '';
  const start = new Date(startDate);
  let end = new Date(start);

  switch (durationType) {
    case 'weekly':
      end.setDate(start.getDate() + 7);
      break;
    case 'monthly':
      end.setMonth(start.getMonth() + 1);
      break;
    case 'quarterly':
      end.setMonth(start.getMonth() + 3);
      break;
    case 'yearly':
      end.setFullYear(start.getFullYear() + 1);
      break;
    default:
      return startDate;
  }
  end.setDate(end.getDate() - 1);
  return format(end, 'yyyy-MM-dd');
};

export default function CompanySubscriptionsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    subscription_package_id: 0,
    subscription_start_date: format(new Date(), 'yyyy-MM-dd'),
    subscription_end_date: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch company data
  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch packages
  const { data: packagesResponse, isLoading: packagesLoading } = useQuery({
    queryKey: ['activePackages'],
    queryFn: () => subscriptionService.getPackages({ active_only: true }),
    staleTime: 10 * 60 * 1000,
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      companyService.updateSubscription(companyId, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Failed to update subscription'
      );
    },
  });

  const packages = useMemo(
    () => packagesResponse?.data?.packages || [],
    [packagesResponse]
  );
  const packageMap = useMemo(
    () => Object.fromEntries(packages.map((pkg: any) => [pkg.id, pkg])),
    [packages]
  );
  const company = companyResponse?.data?.company;
  const selectedPackage = packageMap[formData.subscription_package_id];

  // Initialize form when company data loads
  React.useEffect(() => {
    if (company && packages.length > 0 && formData.subscription_package_id === 0) {
      const pkgId = company.subscription_package_id || packages[0].id;
      const startDate = format(
        new Date(company.subscription_start_date),
        'yyyy-MM-dd'
      );
      const endDate = format(
        new Date(company.subscription_end_date),
        'yyyy-MM-dd'
      );

      setFormData({
        subscription_package_id: pkgId,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
      });
    }
  }, [company, packages, formData.subscription_package_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]:
        name === 'subscription_package_id' ? parseInt(value) : value,
    };

    // Auto-calculate end date when package or start date changes
    if (
      name === 'subscription_package_id' ||
      name === 'subscription_start_date'
    ) {
      const pkgId =
        name === 'subscription_package_id'
          ? parseInt(value)
          : newFormData.subscription_package_id;
      const pkg = packageMap[pkgId];
      const startDate =
        name === 'subscription_start_date'
          ? value
          : newFormData.subscription_start_date;

      if (pkg && startDate) {
        newFormData.subscription_end_date = calculateEndDate(
          startDate,
          pkg.duration_type
        );
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only Super Admin can update subscription.');
      return;
    }

    const {
      subscription_package_id,
      subscription_start_date,
      subscription_end_date,
    } = formData;

    if (
      subscription_package_id <= 0 ||
      !subscription_start_date ||
      !subscription_end_date
    ) {
      toast.error('All subscription fields are required.');
      return;
    }

    if (new Date(subscription_end_date) <= new Date(subscription_start_date)) {
      toast.error('End date must be after start date.');
      return;
    }

    updateMutation.mutate(formData);
  };

  if (companyLoading || packagesLoading) {
    return <Loader />;
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Subscription Management
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Update subscription plan and dates for {company.company_name}
        </p>
      </div>


      {!isSuperAdmin && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
          <AlertCircle size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-warning">View-Only Mode</p>
            <p className="text-sm text-warning/80 mt-1">
              You don&apos;t have permission to update subscription. Only Super Admins
              can make changes.
            </p>
          </div>
        </div>
      )}

      {/* Current Subscription Info */}
      <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
          <Package size={20} className="text-primary" />
          Current Subscription
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Package Name
            </p>
            <p className="text-lg font-semibold text-black dark:text-white">
              {company.package_name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Price
            </p>
            <p className="text-lg font-semibold text-primary">
              ${typeof company.package_price === 'string' ? parseFloat(company.package_price).toFixed(2) : company.package_price.toFixed(2)} / {company.duration_type}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Start Date
            </p>
            <p className="text-base font-semibold text-black dark:text-white">
              {format(new Date(company.subscription_start_date), 'MMM dd, yyyy')}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              End Date
            </p>
            <p className="text-base font-semibold text-black dark:text-white">
              {format(new Date(company.subscription_end_date), 'MMM dd, yyyy')}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Status
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isSubscriptionExpired ? 'bg-danger' : 'bg-success'
                }`}
              ></span>
              <span
                className={`font-semibold ${
                  isSubscriptionExpired ? 'text-danger' : 'text-success'
                }`}
              >
                {isSubscriptionExpired ? 'Expired' : 'Active'}
              </span>
              {!isSubscriptionExpired && (
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  ({Math.ceil(
                    (new Date(company.subscription_end_date).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days remaining)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Update Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-6">
            Update Subscription
          </h3>

          <div className="space-y-6">
            {/* Package Selection */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Select New Package <span className="text-danger">*</span>
              </label>
              <select
                name="subscription_package_id"
                value={formData.subscription_package_id}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={0} disabled>
                  Select a package
                </option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} (${pkg.price.toFixed(2)} / {pkg.duration_type})
                  </option>
                ))}
              </select>

              {selectedPackage && (
                <div className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">
                    Package Features:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>
                      • Max Staff:{' '}
                      <span className="font-semibold">
                        {selectedPackage.max_staff_count === 0
                          ? 'Unlimited'
                          : selectedPackage.max_staff_count}
                      </span>
                    </li>
                    <li>
                      • Max Leads/Month:{' '}
                      <span className="font-semibold">
                        {selectedPackage.max_leads_per_month === 0
                          ? 'Unlimited'
                          : selectedPackage.max_leads_per_month}
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium">
                  Start Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  name="subscription_start_date"
                  value={formData.subscription_start_date}
                  onChange={handleChange}
                  disabled={!isSuperAdmin}
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium">
                  End Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  name="subscription_end_date"
                  value={formData.subscription_end_date}
                  onChange={handleChange}
                  disabled={!isSuperAdmin}
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {new Date(formData.subscription_end_date) <=
                  new Date(formData.subscription_start_date) && (
                  <p className="text-xs text-danger mt-2 flex items-center gap-1">
                    <X size={12} /> End date must be after start date.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg border border-stroke dark:border-strokedark font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={updateMutation.isPending || !isSuperAdmin}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {updateMutation.isPending ? 'Updating...' : 'Update Subscription'}
          </button>
        </div>
      </form>

      <div className="p-4 rounded-lg bg-success/5 border border-success/20 flex items-start gap-3">
        <CheckCircle size={20} className="text-success mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-success">Auto-Calculation</p>
          <p className="text-sm text-success/80 mt-1">
            The end date is automatically calculated based on the selected
            package&apos;s duration type. You can also manually adjust it if needed.
          </p>
        </div>
      </div>
    </div>
  );
}