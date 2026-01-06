'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { AlertCircle, Mail, Phone, Globe, MapPin, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Typography } from '@/components/common/Typography';

interface PageProps {
  params: Promise<{ id: string }>;
}

const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <Typography variant="label" className="block mb-1">{label}</Typography>
    {/* Use Typography variant="value" for the main data, ensuring it handles ReactNode (like <a> tags) */}
    <Typography variant="value" as="p" className="break-words">{value}</Typography>
  </div>
);

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
  // NOTE: Company stats are usually fetched on the Overview page ([id]/page.tsx).
  // Since this page is "Details," we will simulate core stats for the KPI section visually.
  const mockStats = {
    total_staff: 12,
    total_leads: 567,
  };

  if (!company) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={40} className="mx-auto mb-2 text-danger opacity-50" />
        <Typography variant="body1" className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Company not found
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="page-title" as="h1">Company Profile Details</Typography>
          <Typography variant="caption" className="mt-0.5">
            Core information and contact details for {company.company_name}
          </Typography>
        </div>
      </div>

      {/* Permission Warning */}
      {!isSuperAdmin && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <AlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <Typography variant="body2" className="font-medium text-warning">View-Only Mode</Typography>
            <Typography variant="caption" className="text-[11px] text-warning/80 mt-0.5">
              You don&apos;t have permission to edit company details.
            </Typography>
          </div>
        </div>
      )}

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN (Company & Contact Info) */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Company Profile Card */}
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <Typography variant="card-title" as="h3" className="mb-6">Company Profile</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

              {/* Basic Info */}
              <InfoField label="Company Name" value={company.company_name || '-'} />
              <InfoField label="Unique ID" value={company.unique_company_id || '-'} />
              <InfoField label="Industry" value={company.industry || '-'} />
              <InfoField label="Company Size" value={company.company_size || '-'} />

              {/* Contact Info (Stacked Below Basic Info) */}
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-stroke dark:border-strokedark">
                <Typography variant="label" as="h4">Contact Information</Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="text-primary dark:text-white/70 mt-1" size={16} />
                    <InfoField
                      label="Admin Email"
                      value={(
                        <a
                          href={`mailto:${company.admin_email}`}
                          className="font-semibold text-primary hover:underline break-all"
                        >
                          {company.admin_email || '-'}
                        </a>
                      )}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="text-primary dark:text-white/70 mt-1" size={16} />
                    <InfoField
                      label="Phone Number"
                      value={company.phone || '-'}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="text-primary dark:text-white/70 mt-1" size={16} />
                    <InfoField
                      label="Website"
                      value={(
                        <a
                          href={company.website || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:underline break-all"
                        >
                          {company.website || '-'}
                        </a>
                      )}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary dark:text-white/70 mt-1" size={16} />
                    <InfoField
                      label="Address"
                      value={company.address || '-'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Administrator Information Card */}
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <Typography variant="card-title" as="h3" className="mb-4">Administrator Information</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Admin Full Name" value={company.admin_name || '-'} />
              <InfoField label="Admin Role" value="Company Admin" /> {/* Mock Role */}
              <div className="md:col-span-2">
                <InfoField
                  label="Status"
                  value={(
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${company.is_active ? 'bg-success' : 'bg-danger'}`}></span>
                      <Typography variant="value" className={`${company.is_active ? 'text-success' : 'text-danger'} font-semibold`}>
                        {company.is_active ? 'Account Active' : 'Account Inactive'}
                      </Typography>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>


        {/* RIGHT COLUMN (KPIs and Status) */}
        <div className="lg:col-span-1 space-y-6">

          {/* 3. Key Performance Indicators (KPIs) */}
          <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
            <Typography variant="card-title" as="h3" className="mb-4">Usage Snapshot</Typography>
            <div className="space-y-4">

              {/* Total Staff KPI */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-meta-4">
                <div>
                  <Typography variant="label" className="text-sm">Total Staff</Typography>
                  <Typography variant="page-title" className="text-xl font-bold text-black dark:text-white mt-1">
                    {mockStats.total_staff}
                  </Typography>
                </div>
                <Users size={24} className="text-primary/70 dark:text-white/30" />
              </div>

              {/* Total Leads KPI */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-meta-4">
                <div>
                  <Typography variant="label" className="text-sm">Total Leads Tracked</Typography>
                  <Typography variant="page-title" className="text-xl font-bold text-black dark:text-white mt-1">
                    {mockStats.total_leads}
                  </Typography>
                </div>
                <TrendingUp size={24} className="text-primary/70 dark:text-white/30" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}