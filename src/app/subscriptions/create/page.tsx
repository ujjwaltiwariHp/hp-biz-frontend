'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import PackageForm from '@/components/forms/PackageForm';
import { useMutation } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { CreatePackageData, UpdatePackageData } from '@/types/subscription';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';

export default function CreateSubscriptionPage() {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (data: CreatePackageData | UpdatePackageData) =>
      subscriptionService.createPackage(data as CreatePackageData),
    onSuccess: (data) => {
      toast.success(data.message || `Package '${data.data.package.name}' created successfully!`);
      // Navigate back to the list page on success
      router.push('/subscriptions');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to create package.';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (data: CreatePackageData | UpdatePackageData) => {
    createMutation.mutate(data);
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Create Subscription Package" />
      <div className="mx-auto max-w-2xl">
        <PackageForm
          title="New Subscription Package"
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          isEditMode={false}
          // Default data for creation: set is_active to true
          initialData={{ is_active: true } as any}
        />
      </div>
    </DefaultLayout>
  );
}