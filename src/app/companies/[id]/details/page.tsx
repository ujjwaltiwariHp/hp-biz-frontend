'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageTitle, CardTitle, Label, Value } from '@/components/common/Typography';

interface PageProps {
  params: Promise<{ id: string }>;
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

  if (isLoading) return <Loader />;

  const company = companyResponse?.data?.company;

  if (!company) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={40} className="mx-auto mb-2 text-danger opacity-50" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Company not found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Company Details</PageTitle>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            View company and administrator information
          </p>
        </div>
      </div>

      {/* Permission Warning */}
      {!isSuperAdmin && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <AlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-warning">View-Only Mode</p>
            <p className="text-[11px] text-warning/80 mt-0.5">
              You don&apos;t have permission to edit company details.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Company Information */}
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
          <CardTitle className="mb-4">Company Information</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="Company Name" value={company.company_name || '-'} />
            <InfoField label="Industry" value={company.industry || '-'} />
            <InfoField label="Company Size" value={company.company_size || '-'} />
            <InfoField label="Website" value={company.website || '-'} />
            <div className="md:col-span-2">
              <InfoField label="Address" value={company.address || '-'} />
            </div>
          </div>
        </div>

        {/* Administrator Information */}
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-4">
          <CardTitle className="mb-4">Administrator Information</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="Admin Full Name" value={company.admin_name || '-'} />
            <InfoField label="Admin Email" value={company.admin_email || '-'} />
            <div className="md:col-span-2">
              <InfoField label="Phone Number" value={company.phone || '-'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Info Field Component
const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <Label className="block mb-1">{label}</Label>
    <Value className="break-words">{value}</Value>
  </div>
);