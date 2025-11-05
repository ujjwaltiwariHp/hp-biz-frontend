'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompanyDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id, 10);
  const { isSuperAdmin } = useAuth();

  const { data: companyResponse, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <Loader />;
  }

  const company = companyResponse?.data?.company;

  if (!company) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-3 text-danger opacity-50" />
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          Company not found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Company Details
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View company and administrator information
          </p>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
          <AlertCircle size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-warning">View-Only Mode</p>
            <p className="text-sm text-warning/80 mt-1">
              You don't have permission to edit company details.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-6">
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Company Name
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.company_name || '-'}
              </p>
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Industry
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.industry || '-'}
              </p>
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Company Size
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.company_size || '-'}
              </p>
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Website
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.website || '-'}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Address
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.address || '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-6">
            Administrator Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Admin Full Name
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.admin_name || '-'}
              </p>
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Admin Email
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.admin_email || '-'}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Phone Number
              </label>
              <p className="text-gray-700 dark:text-gray-300">
                {company.phone || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
