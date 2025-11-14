'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, Building } from 'lucide-react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Typography } from '@/components/common/Typography';

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
    // If the layout is loading, show a loader wrapped in the layout to prevent content flash
    return (
      <DefaultLayout>
        <Loader />
      </DefaultLayout>
    );
  }

  if (isError || !companyResponse?.data?.company) {
    return null; // Error handling will redirect via useEffect
  }

  const company = companyResponse.data.company;

  return (
    // THIS IS THE SOLE WRAPPER FOR THE DASHBOARD LAYOUT
    <DefaultLayout>
      {/* Company Info Header Bar (Displayed above all nested pages) */}
      <div className="mb-6 rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
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
                <Typography variant="caption" className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {company.unique_company_id}
                </Typography>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              company.is_active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {company.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Page Content: This renders the nested page ([id]/page.tsx, [id]/invoices/page.tsx, etc.) */}
      <div className="min-w-0">
          {children}
      </div>
    </DefaultLayout>
  );
}