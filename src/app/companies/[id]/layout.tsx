'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import CompanySidebar from '@/components/Sidebar/CompanySidebar';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, Building } from 'lucide-react';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    return <Loader />;
  }

  if (isError || !companyResponse?.data?.company) {
    return null; // Error handling will redirect
  }

  const company = companyResponse.data.company;

  return (
    <div className="min-h-screen bg-white dark:bg-boxdark-2">
      {/* Header Bar with Company Info */}
      <div className="sticky top-0 z-40 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark">
        <div className="flex items-center justify-between px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                <Building size={20} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-black dark:text-white">
                  {company.company_name}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {company.unique_company_id}
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
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
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Company Sidebar Navigation */}
        <CompanySidebar companyId={companyId} company={company} />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}