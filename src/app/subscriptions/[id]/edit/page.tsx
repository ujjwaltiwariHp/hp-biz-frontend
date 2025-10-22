'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import PackageForm from '@/components/forms/PackageForm';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { UpdatePackageData, SubscriptionPackage } from '@/types/subscription';
import React from 'react';

interface EditSubscriptionPageProps {
  params: {
    id: string;
  };
}

export default function EditSubscriptionPage({ params }: EditSubscriptionPageProps) {
  const packageId = parseInt(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: packageResponse, isLoading, isError, error } = useQuery({
    queryKey: ['package', packageId],
    queryFn: () => subscriptionService.getPackageById(packageId),
    enabled: !!packageId && !isNaN(packageId),
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

  const existingPackage = packageResponse?.data.package;

  const handleSubmit = (data: UpdatePackageData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !existingPackage || isNaN(packageId)) {
    toast.error(error?.message || `Package with ID ${packageId} not found.`);
    router.push('/subscriptions');
    return null;
  }

  return (
    <DefaultLayout>
      <Breadcrumb pageName={`Edit Package: ${existingPackage.name}`} />
      <div className="mx-auto max-w-2xl">
        <PackageForm
          title={`Edit Package: ${existingPackage.name}`}
          initialData={existingPackage as SubscriptionPackage}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          isEditMode={true}
        />
      </div>
    </DefaultLayout>
  );
}