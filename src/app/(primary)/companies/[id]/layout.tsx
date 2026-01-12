'use client';

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { SkeletonRect } from '@/components/common/Skeleton';
import { Company } from '@/types/company';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, Building, UserCheck, UserX, Trash2 } from 'lucide-react';
import { Typography } from '@/components/common/Typography';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default function CompanyDetailLayout({
  children,
  params,
}: LayoutProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();

  // Dialog State
  const toggleDialog = useConfirmDialog();
  const deleteDialog = useConfirmDialog();
  const [selectedAction, setSelectedAction] = useState<'activate' | 'deactivate' | null>(null);

  // Fetch company data
  const {
    data: companyResponse,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  // --- Mutation Logic (Moved from Page to Layout) ---

  const activateMutation = useMutation({
    mutationFn: () => companyService.activateCompanyAccount(companyId),
    onSuccess: (data) => {
      toast.success(data.message || 'Company activated successfully');
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toggleDialog.closeDialog();
      setSelectedAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate company');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => companyService.deactivateCompanyAccount(companyId),
    onSuccess: (data) => {
      toast.success(data.message || 'Company deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toggleDialog.closeDialog();
      setSelectedAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate company');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => companyService.removeCompany(companyId),
    onSuccess: (data) => {
      toast.success(data.message || 'Company deleted successfully');
      deleteDialog.closeDialog();
      router.push('/companies');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete company');
    },
  });

  // --- Handlers ---

  const handleToggleStatus = () => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only Super Admin can perform this action.');
      return;
    }
    const company = companyResponse?.data?.company;
    if (company) {
      setSelectedAction(company.is_active ? 'deactivate' : 'activate');
      toggleDialog.openDialog();
    }
  };

  const handleDelete = () => {
    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only Super Admin can perform this action.');
      return;
    }
    deleteDialog.openDialog();
  };

  const confirmToggleStatus = () => {
    if (selectedAction === 'activate') {
      activateMutation.mutate();
    } else if (selectedAction === 'deactivate') {
      deactivateMutation.mutate();
    }
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };


  // Handle errors
  React.useEffect(() => {
    if (isError) {
      toast.error(
        error instanceof Error ? error.message : `Company with ID ${companyId} not found`
      );
      router.push('/companies');
    }
  }, [isError, error, companyId, router]);

  if (isLoading) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <SkeletonRect className="h-10 w-full max-w-md mb-6" /> {/* Breadcrumbish */}
          <div className="flex gap-4 border-b border-stroke dark:border-strokedark pb-4">
            <SkeletonRect className="h-8 w-24" />
            <SkeletonRect className="h-8 w-24" />
            <SkeletonRect className="h-8 w-24" />
          </div>
          <SkeletonRect className="h-96 w-full" />
        </div>
      );
    }
  }

  if (isError || !companyResponse?.data?.company) {
    return null;
  }

  const company = companyResponse.data.company;

  return (
    <>
      {/* Company Info Header Bar */}
      <div className="mb-6 rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 md:px-6">

          {/* Title & Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/companies')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
              title="Back to Companies"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                <Building size={20} />
              </div>
              <div>
                <Typography variant="value" as="h1" className="text-lg font-bold text-black dark:text-white">
                  {company.company_name}
                </Typography>
                <div className="flex items-center gap-2">
                  <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {company.unique_company_id}
                  </Typography>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${company.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {company.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Visible only to SuperAdmin) */}
          {isSuperAdmin && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToggleStatus}
                disabled={activateMutation.isPending || deactivateMutation.isPending}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:shadow-md ${company.is_active
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50`}
              >
                {company.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                {company.is_active ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-danger text-white rounded-lg hover:bg-danger/90 transition-all hover:shadow-md disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="min-w-0">
        {children}
      </div>

      {/* Confirmation Dialogs (Placed in Layout to work across all sub-pages) */}
      <ConfirmDialog
        {...toggleDialog.confirmProps}
        type={selectedAction === 'deactivate' ? 'warning' : 'success'}
        title={`${selectedAction === 'deactivate' ? 'Deactivate' : 'Activate'} Company`}
        message={`Are you sure you want to ${selectedAction} "${company.company_name}"? ${selectedAction === 'deactivate'
          ? 'The company will lose access to the platform.'
          : 'The company will regain full access to the platform.'
          }`}
        onConfirm={confirmToggleStatus}
        confirmText={selectedAction === 'deactivate' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        isLoading={activateMutation.isPending || deactivateMutation.isPending}
      />

      <ConfirmDialog
        {...deleteDialog.confirmProps}
        type="danger"
        title="Delete Company"
        message={`Are you sure you want to permanently delete "${company.company_name}"? This action cannot be undone and will remove all associated data.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}