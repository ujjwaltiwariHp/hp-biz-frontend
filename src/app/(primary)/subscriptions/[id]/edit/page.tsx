'use client';

import PackageForm from '@/components/forms/PackageForm';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import Loader from '@/components/common/Loader';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { UpdatePackageData, SubscriptionPackage } from '@/types/subscription';
import { use } from 'react';

interface EditSubscriptionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditSubscriptionPage({ params }: EditSubscriptionPageProps) {
  const resolvedParams = use(params);
  const packageId = parseInt(resolvedParams.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: packageResponse, isLoading, isError, error } = useQuery({
    queryKey: ['package', packageId],
    queryFn: () => subscriptionService.getPackageById(packageId),
    enabled: !isNaN(packageId),
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePackageData) =>
      subscriptionService.updatePackage(packageId, data),
    onSuccess: (data) => {
      toast.success(data.message || `Package '${data.data.package.name}' updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package', packageId] });
      router.push('/subscriptions');
    },
    onError: (mutationError: any) => {
      const errorMessage = mutationError.response?.data?.error || 'Failed to update package.';
      toast.error(errorMessage);
    },
  });

  if (isNaN(packageId)) {
    router.push('/subscriptions');
    return null;
  }

  const existingPackage = packageResponse?.data.package;

  const handleSubmit = (data: UpdatePackageData | any) => {
    updateMutation.mutate(data as UpdatePackageData);
  };

  if (isLoading) {
    return (
      <>
        <div className="mb-6">
          <SkeletonLoader type="text" width={300} height={32} />
        </div>
        <div className="w-full">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark h-[600px]">
            <div className="py-3 px-5 border-b border-stroke dark:border-strokedark">
              <SkeletonLoader type="text" width={200} height={24} />
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-1">
                  <SkeletonLoader type="text" width={100} className="mb-2" />
                  <SkeletonLoader type="rect" height={40} />
                </div>
                <div className="lg:col-span-2">
                  <SkeletonLoader type="text" width={100} className="mb-2" />
                  <SkeletonLoader type="rect" height={40} />
                </div>
              </div>
              <SkeletonLoader type="rect" height={300} />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError || !existingPackage) {
    toast.error(error?.message || `Package with ID ${packageId} not found.`);
    router.push('/subscriptions');
    return null;
  }

  return (
    <>
      <Breadcrumb pageName={`Edit Package: ${existingPackage.name}`} />
      <div className="w-full">
        <PackageForm
          title={`Edit Package: ${existingPackage.name}`}
          initialData={existingPackage as SubscriptionPackage}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          isEditMode={true}
        />
      </div>
    </>
  );
}