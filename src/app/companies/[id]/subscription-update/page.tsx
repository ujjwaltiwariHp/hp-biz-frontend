'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Company, SubscriptionUpdate } from '@/types/company';
import { SubscriptionPackage, PackagesResponse } from '@/types/subscription';
import { useState, useEffect, useMemo, use } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Package, Calendar, DollarSign, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// PARAMS TYPE DEFINITION
interface UpdatePageProps {
  params: Promise<{
    id: string;
  }>;
}

// HELPER FUNCTION
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

// MAIN COMPONENT
export default function UpdateSubscriptionPage({ params }: UpdatePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = parseInt(resolvedParams.id);

  const [formData, setFormData] = useState<SubscriptionUpdate>({
    subscription_package_id: 0,
    subscription_start_date: format(new Date(), 'yyyy-MM-dd'),
    subscription_end_date: format(new Date(), 'yyyy-MM-dd'),
  });

  // FETCH COMPANY DATA
  const { data: companyResponse, isLoading: isCompanyLoading, isError: isCompanyError, error: companyError } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 60000,
  });

  // FETCH PACKAGES DATA
  const { data: packagesResponse, isLoading: isPackagesLoading } = useQuery<PackagesResponse>({
    queryKey: ['activePackages'],
    queryFn: () => subscriptionService.getPackages({ active_only: true }),
    staleTime: Infinity,
  });

  // UPDATE MUTATION
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

  // MEMOIZED PACKAGES
  const packages = useMemo(() => packagesResponse?.data.packages || [], [packagesResponse]);

  // MEMOIZED PACKAGE MAP
  const packageMap = useMemo(() => {
    return packages.reduce((acc, pkg) => {
      acc[pkg.id] = pkg;
      return acc;
    }, {} as { [key: number]: SubscriptionPackage });
  }, [packages]);

  const currentCompany = companyResponse?.data.company;
  const selectedPackage = packageMap[formData.subscription_package_id] || null;

  // INITIALIZE FORM WITH COMPANY DATA
  useEffect(() => {
    if (currentCompany && packages.length > 0 && formData.subscription_package_id === 0) {
      const pkgId = currentCompany.subscription_package_id || packages[0].id;

      const startDate = currentCompany.subscription_start_date
        ? format(new Date(currentCompany.subscription_start_date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

      const endDate = currentCompany.subscription_end_date
        ? format(new Date(currentCompany.subscription_end_date), 'yyyy-MM-dd')
        : calculateEndDate(startDate, packageMap[pkgId]?.duration_type || 'monthly');

      setFormData({
        subscription_package_id: pkgId,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
      });
    }
  }, [currentCompany, packages, packageMap, formData.subscription_package_id]);

  if (isCompanyLoading || isPackagesLoading) {
    return <Loader />;
  }

  if (!currentCompany || isCompanyError) {
    toast.error(companyError?.message || `Company with ID ${companyId} not found or access denied.`);
    router.push('/companies');
    return null;
  }

  // HANDLE INPUT CHANGES
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: name === 'subscription_package_id' ? parseInt(value) : value };

    if (name === 'subscription_package_id' || name === 'subscription_start_date') {
      const pkgId = name === 'subscription_package_id' ? parseInt(value) : newFormData.subscription_package_id;
      const pkg = packageMap[pkgId];
      const startDate = name === 'subscription_start_date' ? value : newFormData.subscription_start_date;

      if (pkg && startDate) {
        newFormData.subscription_end_date = calculateEndDate(startDate, pkg.duration_type);
      }
    }

    setFormData(newFormData);
  };

  // HANDLE FORM SUBMISSION
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
    <DefaultLayout>
      <div className="mb-6">
        <button
          onClick={() => router.push('/companies')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-4"
        >
          <ArrowLeft size={16} />
          Back to Companies
        </button>
        <Breadcrumb pageName={`Update Subscription for ${currentCompany.company_name}`} />
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
            <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <Package size={20} className="text-primary" />
                Update Subscription
            </h4>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6.5">
                <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Package</p>
                        <h5 className="text-lg font-semibold text-black dark:text-white">{currentCompany.package_name}</h5>
                        <p className="text-sm text-primary mt-1">
                            Current Period: {formatDate(currentCompany.subscription_start_date)} - {formatDate(currentCompany.subscription_end_date)}
                        </p>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">New Subscription Package <span className="text-danger">*</span></label>
                        <select
                            name="subscription_package_id"
                            value={formData.subscription_package_id}
                            onChange={handleChange}
                            required
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        >
                            <option value={0} disabled>Select a package</option>
                            {packages.map(pkg => (
                                <option key={pkg.id} value={pkg.id}>
                                    {pkg.name} (${pkg.price.toFixed(2)} / {pkg.duration_type})
                                </option>
                            ))}
                        </select>
                        {selectedPackage && (
                            <p className="text-xs text-gray-500 mt-2">
                                New Package Price: ${selectedPackage.price.toFixed(2)} / {selectedPackage.duration_type}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">Start Date <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                name="subscription_start_date"
                                value={formData.subscription_start_date}
                                onChange={handleChange}
                                required
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">End Date <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                name="subscription_end_date"
                                value={formData.subscription_end_date}
                                onChange={handleChange}
                                required
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                            />
                            {new Date(formData.subscription_end_date) <= new Date(formData.subscription_start_date) && (
                                <p className="text-xs text-danger mt-1 flex items-center gap-1"><X size={12} /> End date must be after start date.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-stroke dark:border-strokedark">
                    <button
                        type="submit"
                        disabled={updateMutation.isPending || formData.subscription_package_id === 0 || (new Date(formData.subscription_end_date) <= new Date(formData.subscription_start_date))}
                        className="rounded bg-success py-3 px-6 font-medium text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
                    >
                        {updateMutation.isPending ? 'Updating...' : 'Update Subscription'}
                    </button>
                </div>
            </div>
          </form>
        </div>
      </div>
    </DefaultLayout>
  );
}