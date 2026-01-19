'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import Loader from '@/components/common/Loader';
import { SkeletonRect, SkeletonText } from '@/components/common/Skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { SubscriptionUpdate } from '@/types/company';
import { SubscriptionPackage, PackagesResponse } from '@/types/subscription';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Package, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

import { Typography } from '@/components/common/Typography';
import DatePicker from '@/components/common/Calendar/DatePicker';

interface UpdatePageProps {
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

const SubscriptionUpdateSkeleton = () => (
  <>
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <SkeletonRect className="h-4 w-4 rounded" />
        <SkeletonText className="h-4 w-32" />
      </div>
      <SkeletonText className="h-8 w-64" />
    </div>
    <div className="mx-auto max-w-2xl">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-4 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark flex items-center gap-2">
          <SkeletonRect className="h-5 w-5 rounded" />
          <SkeletonText className="h-6 w-48" />
        </div>
        <div className="p-6.5">
          <div className="mb-6 space-y-2">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark">
              <SkeletonText className="h-3 w-24 mb-2" />
              <SkeletonText className="h-5 w-48 mb-2" />
              <SkeletonText className="h-3 w-64" />
            </div>
          </div>
          <div className="mb-6">
            <SkeletonText className="h-4 w-40 mb-2.5" />
            <SkeletonRect className="h-11 w-full rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SkeletonText className="h-4 w-24 mb-2.5" />
              <SkeletonRect className="h-11 w-full rounded" />
            </div>
            <div>
              <SkeletonText className="h-4 w-24 mb-2.5" />
              <SkeletonRect className="h-11 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

function UpdateSubscriptionContent({ params }: UpdatePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = parseInt(resolvedParams.id);

  const [formData, setFormData] = useState<SubscriptionUpdate>({
    subscription_package_id: 0,
    subscription_start_date: format(new Date(), 'yyyy-MM-dd'),
    subscription_end_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: companyResponse, isLoading: isCompanyLoading, isError: isCompanyError, error: companyError } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 60000,
  });

  const { data: packagesResponse, isLoading: isPackagesLoading } = useQuery<PackagesResponse>({
    queryKey: ['activePackages'],
    queryFn: () => subscriptionService.getPackages({ active_only: true }),
    staleTime: Infinity,
  });

  const updateMutation = useMutation({
    mutationFn: (data: SubscriptionUpdate) =>
      companyService.updateSubscription(companyId, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      router.push('/companies');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update subscription');
    },
  });

  const packages = useMemo(() => packagesResponse?.data.packages || [], [packagesResponse]);

  const packageMap = useMemo(() => {
    return packages.reduce((acc, pkg) => {
      acc[pkg.id] = pkg;
      return acc;
    }, {} as { [key: number]: SubscriptionPackage });
  }, [packages]);

  const currentCompany = companyResponse?.data.company;
  const selectedPackage = packageMap[formData.subscription_package_id] || null;

  useEffect(() => {
    if (currentCompany && packages.length > 0 && formData.subscription_package_id === 0) {
      const pkgId = currentCompany.subscription_package_id || packages[0].id;

      const startDate = currentCompany.subscription_start_date
        ? format(new Date(currentCompany.subscription_start_date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

      const endDate = currentCompany.subscription_end_date
        ? format(new Date(currentCompany.subscription_end_date), 'yyyy-MM-dd')
        : calculateEndDate(startDate, 'monthly');

      setFormData({
        subscription_package_id: pkgId,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
      });
    }
  }, [currentCompany, packages, packageMap, formData.subscription_package_id]);

  if ((isCompanyLoading && !currentCompany) || (isPackagesLoading && !packagesResponse)) {
    return <SubscriptionUpdateSkeleton />;
  }

  if (!currentCompany || isCompanyError) {
    toast.error(companyError?.message || `Company with ID ${companyId} not found or access denied.`);
    router.push('/companies');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: name === 'subscription_package_id' ? parseInt(value) : value } as SubscriptionUpdate;

    if (name === 'subscription_package_id' || name === 'subscription_start_date') {
      const pkgId = name === 'subscription_package_id' ? parseInt(value) : newFormData.subscription_package_id;
      const pkg = packageMap[pkgId];
      const startDate = name === 'subscription_start_date' ? value : newFormData.subscription_start_date;

      if (pkg && startDate) {
        newFormData.subscription_end_date = calculateEndDate(startDate, 'monthly');
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { subscription_package_id, subscription_start_date, subscription_end_date } = formData;

    if (subscription_package_id <= 0 || !subscription_start_date || !subscription_end_date) {
      toast.error('All subscription fields are required.');
      return;
    }

    if (new Date(subscription_end_date) <= new Date(subscription_start_date)) {
      toast.error('End date must be after start date.');
      return;
    }

    updateMutation.mutate(formData);
  };

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => router.push('/companies')}
          className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          <Typography variant="caption">Back to Companies</Typography>
        </button>
        <Breadcrumb pageName={`Update Subscription for ${currentCompany.company_name}`} />
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-4 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
            <Typography variant="card-title" as="h4" className="flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Update Subscription
            </Typography>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6.5">
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark">
                  <Typography variant="label">Current Package</Typography>
                  <Typography variant="value" as="h5" className="mt-1">
                    {currentCompany.package_name}
                  </Typography>
                  <Typography variant="caption" className="text-xs text-primary mt-1">
                    Current Period: {formatDate(currentCompany.subscription_start_date)} - {formatDate(currentCompany.subscription_end_date)}
                  </Typography>
                </div>

                <div>
                  <Typography variant="label" className="mb-2.5 block">New Subscription Package <span className="text-danger">*</span></Typography>
                  <select
                    name="subscription_package_id"
                    value={formData.subscription_package_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-5 text-sm text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  >
                    <option value={0} disabled>Select a package</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ($ {Number(pkg.price_monthly).toFixed(2)} / month)
                      </option>
                    ))}
                  </select>
                  {selectedPackage && (
                    <Typography variant="caption" className="text-xs text-gray-500 mt-2">
                      New Package Price: $ {Number(selectedPackage.price_monthly).toFixed(2)} / month
                    </Typography>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="label" className="mb-2.5 block">Start Date <span className="text-danger">*</span></Typography>
                    <DatePicker
                      name="subscription_start_date"
                      value={formData.subscription_start_date}
                      onChange={handleChange as any}
                    />
                  </div>
                  <div>
                    <Typography variant="label" className="mb-2.5 block">End Date <span className="text-danger">*</span></Typography>
                    <DatePicker
                      name="subscription_end_date"
                      value={formData.subscription_end_date}
                      onChange={handleChange as any}
                    />
                    {new Date(formData.subscription_end_date) <= new Date(formData.subscription_start_date) && (
                      <Typography variant="caption" className="text-xxs text-danger mt-2 flex items-center gap-1"><X size={12} /> End date must be after start date.</Typography>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-stroke dark:border-strokedark">
                <button
                  type="submit"
                  disabled={updateMutation.isPending || formData.subscription_package_id === 0 || (new Date(formData.subscription_end_date) <= new Date(formData.subscription_start_date))}
                  className="rounded bg-success py-2 px-4 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Subscription'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function UpdateSubscriptionPage({ params }: UpdatePageProps) {
  return (
    <Suspense fallback={<SubscriptionUpdateSkeleton />}>
      <UpdateSubscriptionContent params={params} />
    </Suspense>
  );
}