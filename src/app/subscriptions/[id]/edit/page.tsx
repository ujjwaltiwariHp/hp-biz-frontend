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
import React from 'react'; // Import React for the use hook

interface EditSubscriptionPageProps {
  params: {
    id: string; // params is now a promise or has promise-like behavior
  };
}

export default function EditSubscriptionPage(props: EditSubscriptionPageProps) {
  // 1. Safely unwrap params using React.use()
  // Note: While the type definition might show { id: string }, runtime behavior in new Next.js versions treats it as Promise<{ id: string }>.
  // We use the direct access as a fallback until the actual `use` hook implementation stabilizes across all package versions.
  // The official fix is to destructure in an inner component or hook, or use the direct access with the warning.
  // For now, let's stick to the simpler, robust parsing outside the promise scope.

  const packageId = parseInt(props.params.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  if (isNaN(packageId)) {
    // Basic guard clause if the ID is malformed
    router.push('/subscriptions');
    return null;
  }

  // 1. Fetch existing package data
  const { data: packageResponse, isLoading, isError, error } = useQuery({
    queryKey: ['package', packageId],
    queryFn: () => subscriptionService.getPackageById(packageId),
    enabled: true, // Always enabled since packageId is valid here
    staleTime: 5 * 60 * 1000,
  });

  const existingPackage = packageResponse?.data.package;

  // 2. Setup update mutation
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

  const handleSubmit = (data: UpdatePackageData) => {
    updateMutation.mutate(data);
  };

  // 3. Handle loading and error states
  if (isLoading) {
    return <Loader />;
  }

  if (isError || !existingPackage) {
    // If the data failed to load or package doesn't exist (e.g. 404)
    toast.error(error?.message || `Package with ID ${packageId} not found.`);
    router.push('/subscriptions');
    return null;
  }

  return (
    <DefaultLayout>
      <Breadcrumb pageName={`Edit Package: ${existingPackage.name}`} />
      <div className="mx-auto max-w-2xl">
        {/* 4. Render the form with existing data */}
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