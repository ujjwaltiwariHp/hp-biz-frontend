'use client';

import React, { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import Loader from '@/components/common/Loader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface EditFormData {
  company_name: string;
  admin_name: string;
  admin_email: string;
  phone: string;
  address: string;
  website: string;
  industry: string;
  company_size: string;
}

export default function CompanyDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EditFormData>({
    company_name: '',
    admin_name: '',
    admin_email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    company_size: '',
  });
  const [isDirty, setIsDirty] = useState(false);

  // Fetch company data
  const { data: companyResponse, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId && !isNaN(companyId),
    staleTime: 5 * 60 * 1000,
  });

  // Initialize form with company data
  useEffect(() => {
    if (companyResponse?.data?.company) {
      const company = companyResponse.data.company;
      setFormData({
        company_name: company.company_name || '',
        admin_name: company.admin_name || '',
        admin_email: company.admin_email || '',
        phone: company.phone || '',
        address: company.address || '',
        website: company.website || '',
        industry: company.industry || '',
        company_size: company.company_size || '',
      });
    }
  }, [companyResponse?.data?.company]);

  // Note: For a full implementation, you would need an updateCompany endpoint
  // This is a placeholder showing the UI structure
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSuperAdmin) {
      toast.error('Permission Denied: Only Super Admin can edit company details.');
      return;
    }

    // Validate required fields
    if (!formData.company_name || !formData.admin_name || !formData.admin_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.admin_email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    toast.info('Update company details endpoint coming soon');
    // TODO: Implement actual update API call
  };

  const handleReset = () => {
    if (companyResponse?.data?.company) {
      const company = companyResponse.data.company;
      setFormData({
        company_name: company.company_name || '',
        admin_name: company.admin_name || '',
        admin_email: company.admin_email || '',
        phone: company.phone || '',
        address: company.address || '',
        website: company.website || '',
        industry: company.industry || '',
        company_size: company.company_size || '',
      });
      setIsDirty(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Edit Company Details
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Update company and administrator information
          </p>
        </div>
      </div>

      {/* Permission Notice */}
      {!isSuperAdmin && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
          <AlertCircle size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-warning">View-Only Mode</p>
            <p className="text-sm text-warning/80 mt-1">
              You don't have permission to edit company details. Only Super Admins can make changes.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information Section */}
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-6">
            Company Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Company Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                placeholder="e.g., Technology, Finance, Healthcare"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Company Size
              </label>
              <select
                name="company_size"
                value={formData.company_size}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-100">51-100 employees</option>
                <option value="101-500">101-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>

            {/* Website */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                placeholder="https://example.com"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                placeholder="Street address, city, state, zip"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Administrator Information Section */}
        <div className="rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark p-6">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-6">
            Administrator Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Name */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Admin Full Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="admin_name"
                value={formData.admin_name}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Admin Email */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Admin Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="admin_email"
                value={formData.admin_email}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || !isSuperAdmin}
            className="px-6 py-3 rounded-lg border border-stroke dark:border-strokedark font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Changes
          </button>

          <button
            type="submit"
            disabled={!isDirty || !isSuperAdmin}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-primary font-medium">
          💡 Tip: Changes made here will immediately update the company's profile information.
        </p>
      </div>
    </div>
  );
}