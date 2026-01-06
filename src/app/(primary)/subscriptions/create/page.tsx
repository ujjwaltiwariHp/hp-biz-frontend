'use client';

import PackageForm from '@/components/forms/PackageForm';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { CreatePackageData } from '@/types/subscription';

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: subscriptionService.createPackage,
    onSuccess: (data) => {
      toast.success(data.message || 'Package created successfully!');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      router.push('/subscriptions');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to create package.';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (data: CreatePackageData | any) => {
    createMutation.mutate(data as CreatePackageData);
  };

  return (
    <>
      <Breadcrumb pageName="Create Subscription Package" />
      <div className="mx-auto max-w-4xl">
        <PackageForm
          title="Create New Package"
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          isEditMode={false}
        />
      </div>
    </>
  );
}