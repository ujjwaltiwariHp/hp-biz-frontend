'use client';

import React, { use, useState, useMemo } from 'react';
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

import { Typography } from '@/components/common/Typography';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import DatePicker from '@/components/common/Calendar/DatePicker';
import { SubscriptionUpdate } from '@/types/company';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const calculateEndDate = (startDate: string, durationType: string = 'monthly'): string => {
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
      end.setMonth(start.getMonth() + 1);
      break;
  }
  end.setDate(end.getDate() - 1);
  return format(end, 'yyyy-MM-dd');
};

const InfoValue = ({ label, value, icon, className = '' }: { label: string, value: React.ReactNode, icon?: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col ${className}`}>
    <Typography variant="label" className="mb-1">{label}</Typography>
    <div className="flex items-center gap-2">
      {icon}
      <Typography variant="value" as="p" className="text-sm font-semibold break-words">
        {value}
      </Typography>
    </div>
  </div>
);


export default function CompanySubscriptionsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SubscriptionUpdate>({
    subscription_package_id: 0,
    subscription_start_date: format(new Date(), 'yyyy-MM-dd'),
    subscription_end_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: companyResponse, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: packagesResponse, isLoading: packagesLoading } = useQuery({
    queryKey: ['activePackages'],
    queryFn: () => subscriptionService.getPackages({ active_only: true }),
    staleTime: 10 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: SubscriptionUpdate) =>
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
    } as SubscriptionUpdate;

    if (
      name === 'subscription_package_id' ||
      name === 'subscription_start_date'
    ) {
      const pkgId =
        name === 'subscription_package_id'
          ? parseInt(value)
          : newFormData.subscription_package_id;
      const startDate =
        name === 'subscription_start_date'
          ? value
          : newFormData.subscription_start_date;

      if (startDate) {
        newFormData.subscription_end_date = calculateEndDate(
          startDate,
          'monthly'
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

  const isPageLoading = companyLoading || packagesLoading;

  if (!isPageLoading && !company) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-3 text-danger opacity-50" />
        <Typography variant="body1" className="text-base font-medium text-gray-600 dark:text-gray-400">
          Company not found
        </Typography>
      </div>
    );
  }

  const isSubscriptionExpired = company ? new Date(company.subscription_end_date) < new Date() : false;

  const daysRemaining = company ? Math.ceil(
    (new Date(company.subscription_end_date).getTime() -
      new Date().getTime()) /
    (1000 * 60 * 60 * 24)
  ) : 0;


  return (
    <div className="space-y-6">
      <div>
        <Typography variant="page-title" as="h2">
          Subscription Management
        </Typography>

        <Typography variant="caption" className="mt-1">
          {isPageLoading ? <SkeletonLoader type="text" width={250} /> : `Update subscription plan and dates for ${company?.company_name}`}
        </Typography>
      </div>


      {!isSuperAdmin && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
          <AlertCircle size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div>

            <Typography variant="body2" className="font-medium text-warning">View-Only Mode</Typography>

            <Typography variant="caption" className="text-xs text-warning/80 mt-1">
              You don&apos;t have permission to update subscription. Only Super Admins
              can make changes.
            </Typography>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1 space-y-6">

          <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <Typography variant="card-title" as="h3" className="mb-6 flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Current Status
            </Typography>

            <div className="space-y-4">

              <InfoValue
                label="Package Name"
                value={isPageLoading ? <SkeletonLoader type="text" width={120} /> : company?.package_name}
              />

              <InfoValue
                label="Price"
                value={isPageLoading ? <SkeletonLoader type="text" width={100} /> : `$ ${company?.package_price === null || company?.package_price === undefined
                  ? '0.00'
                  : typeof company?.package_price === 'string'
                    ? parseFloat(company.package_price).toFixed(2)
                    : company?.package_price?.toFixed(2)
                  } / month`}
                icon={!isPageLoading ? <DollarSign size={16} className="text-primary/70 dark:text-white/70" /> : undefined}
              />

              <div className="pt-4 border-t border-stroke dark:border-strokedark space-y-4">
                <InfoValue
                  label="Start Date"
                  value={isPageLoading ? <SkeletonLoader type="text" width={120} /> : (company?.subscription_start_date ? format(new Date(company.subscription_start_date), 'MMM dd, yyyy') : '-')}
                  icon={!isPageLoading ? <Calendar size={16} className="text-primary/70 dark:text-white/70" /> : undefined}
                />
                <InfoValue
                  label="End Date"
                  value={isPageLoading ? <SkeletonLoader type="text" width={120} /> : (company?.subscription_end_date ? format(new Date(company.subscription_end_date), 'MMM dd, yyyy') : '-')}
                  icon={!isPageLoading ? <Calendar size={16} className="text-primary/70 dark:text-white/70" /> : undefined}
                />
              </div>

              <div className="pt-4 border-t border-stroke dark:border-strokedark">
                <Typography variant="label" className="mb-2">
                  Subscription Status
                </Typography>
                {isPageLoading ? (
                  <SkeletonLoader type="text" width={150} />
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${isSubscriptionExpired ? 'bg-danger' : 'bg-success'
                        }`}
                    ></span>
                    <Typography variant="value" as="span" className={`font-semibold ${isSubscriptionExpired ? 'text-danger' : 'text-success'
                      }`}>
                      {isSubscriptionExpired ? 'Expired' : 'Active'}
                    </Typography>
                    {!isSubscriptionExpired && (
                      <Typography variant="caption" className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                        ({daysRemaining}{' '}
                        days remaining)
                      </Typography>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(isPageLoading || selectedPackage) && (
            <div className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
              <Typography variant="card-title" as="h3" className="mb-4">
                {isPageLoading ? <SkeletonLoader type="text" width={150} /> : `${selectedPackage.name} Features`}
              </Typography>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                {isPageLoading ? (
                  <>
                    <SkeletonLoader type="text" width="100%" count={3} />
                  </>
                ) : (
                  <>
                    <li className="flex justify-between items-center">
                      <Typography variant="body" as="span">Max Staff:</Typography>
                      <Typography variant="value" as="span" className="font-semibold">
                        {selectedPackage.max_staff_count === 0 ? 'Unlimited' : selectedPackage.max_staff_count}
                      </Typography>
                    </li>
                    <li className="flex justify-between items-center">
                      <Typography variant="body" as="span">Max Leads/Month:</Typography>
                      <Typography variant="value" as="span" className="font-semibold">
                        {selectedPackage.max_leads_per_month === 0 ? 'Unlimited' : selectedPackage.max_leads_per_month}
                      </Typography>
                    </li>
                    {selectedPackage.is_trial && (
                      <li className="flex justify-between items-center border-t border-stroke dark:border-strokedark pt-3">
                        <Typography variant="body" as="span" className="text-indigo-600 dark:text-indigo-400">Trial Duration:</Typography>
                        <Typography variant="value" as="span" className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {selectedPackage.trial_duration_days} days
                        </Typography>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          )}
        </div>


        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6 h-full">
            <Typography variant="card-title" as="h3" className="mb-6">
              Update Subscription
            </Typography>

            <div className="space-y-6">
              <div>
                <Typography variant="label" className="mb-2.5 block">
                  Select New Package <span className="text-danger">*</span>
                </Typography>
                <select
                  name="subscription_package_id"
                  value={formData.subscription_package_id}
                  onChange={handleChange}
                  disabled={!isSuperAdmin || isPageLoading}
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={0} disabled>
                    {isPageLoading ? 'Loading packages...' : 'Select a package'}
                  </option>
                  {!isPageLoading && packages.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ($ {pkg.price_monthly} / month)
                    </option>
                  ))}
                </select>

                {selectedPackage && (
                  <div className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <Typography variant="body2" className="font-medium text-primary mb-2">
                      <span className='font-bold'>New Plan:</span> {selectedPackage.name} ($ {selectedPackage.price_monthly} / month)
                    </Typography>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Typography variant="label" className="mb-2.5 block">
                    Start Date <span className="text-danger">*</span>
                  </Typography>
                  <DatePicker
                    name="subscription_start_date"
                    value={formData.subscription_start_date}
                    onChange={handleChange as any}
                    disabled={!isSuperAdmin}
                  />
                </div>

                <div>
                  <Typography variant="label" className="mb-2.5 block">
                    End Date <span className="text-danger">*</span>
                  </Typography>
                  <DatePicker
                    name="subscription_end_date"
                    value={formData.subscription_end_date}
                    onChange={handleChange as any}
                    disabled={!isSuperAdmin}
                  />

                  {new Date(formData.subscription_end_date) <=
                    new Date(formData.subscription_start_date) && (
                      <Typography variant="caption" className="text-xxs text-danger mt-2 flex items-center gap-1">
                        <X size={12} /> End date must be after start date.
                      </Typography>
                    )}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-stroke dark:border-strokedark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

              <div className="flex items-start gap-3 w-full sm:w-1/2">
                <CheckCircle size={20} className="text-success mt-0.5 flex-shrink-0" />
                <div>
                  <Typography variant="body2" className="font-medium text-success">Auto-Calculation Note</Typography>
                  <Typography variant="caption" className="text-xs text-success/80 mt-1">
                    The end date defaults to 1 month. You can adjust it manually for yearly plans.
                  </Typography>
                </div>
              </div>

              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 rounded-lg border border-stroke dark:border-strokedark font-medium text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                >
                  <Typography variant="body2">Cancel</Typography>
                </button>

                <button
                  type="submit"
                  disabled={updateMutation.isPending || !isSuperAdmin || formData.subscription_package_id === 0 || (new Date(formData.subscription_end_date) <= new Date(formData.subscription_start_date))}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-sm text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  <Typography variant="body2" className="text-white">
                    {updateMutation.isPending ? 'Updating...' : 'Update Subscription'}
                  </Typography>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}