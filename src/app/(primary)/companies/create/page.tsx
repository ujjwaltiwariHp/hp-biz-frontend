'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Loader from '@/components/common/Loader';
import Button from '@/components/common/Button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { CreateCompanyData, CreateCompanyResponse } from '@/types/company';
import { SubscriptionPackage, PackagesResponse } from '@/types/subscription';
import { ArrowLeft, ArrowRight, Shield, User, DollarSign, ToggleRight, X, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Typography } from '@/components/common/Typography';

const calculateEndDate = (startDate: string, durationType: string): string => {
  if (!startDate) return '';
  const start = new Date(startDate);
  let end = new Date(start);

  switch (durationType) {
    case 'weekly':
      end.setDate(start.getDate() + 7);
      break;
    case 'monthly':
      end.setMonth(start.getMonth() + 1);
      break;
    case 'quarterly':
      end.setMonth(start.getMonth() + 3);
      break;
    case 'yearly':
      end.setFullYear(start.getFullYear() + 1);
      break;
    default:
      end.setMonth(start.getMonth() + 1);
      break;
  }
  end.setDate(end.getDate() - 1);
  return format(end, 'yyyy-MM-dd');
};

const getDefaultFormData = (selectedPackage: SubscriptionPackage | null): CreateCompanyData => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const duration = 'monthly';
  const endDate = calculateEndDate(today, duration);

  return {
    company_name: '',
    admin_email: '',
    admin_name: '',
    password: '',
    subscription_package_id: selectedPackage?.id || 0,
    subscription_start_date: today,
    subscription_end_date: endDate,
    send_welcome_email: true,
  };
};

export default function CreateCompanyPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateCompanyData>(getDefaultFormData(null));
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // ... (keeping query logic) ... 


  const {
    data: packagesResponse,
    isLoading: packagesLoading,
    isError: packagesError
  } = useQuery<PackagesResponse>({
    queryKey: ['activePackages'],
    queryFn: () => subscriptionService.getPackages({ active_only: true }),
    staleTime: Infinity,
  });

  const packages = useMemo(() => packagesResponse?.data.packages || [], [packagesResponse]);

  useEffect(() => {
    const pkg = packages.find(p => p.id === formData.subscription_package_id);
    setSelectedPackage(pkg || null);

    if (pkg) {
      const newEndDate = calculateEndDate(formData.subscription_start_date, 'monthly');
      setFormData(prev => ({
        ...prev,
        subscription_end_date: newEndDate,
        subscription_package_id: pkg.id,
      }));
    }
  }, [formData.subscription_package_id, formData.subscription_start_date, packages]);

  useEffect(() => {
    const { company_name, admin_email, admin_name, password, subscription_package_id, subscription_end_date } = formData;

    let valid = !!company_name && !!admin_email && !!admin_name && !!password && subscription_package_id > 0;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) valid = false;

    if (password.length < 6) valid = false;

    const startDate = new Date(formData.subscription_start_date);
    const endDate = new Date(subscription_end_date);
    if (endDate <= startDate) valid = false;

    setIsFormValid(valid);
  }, [formData]);

  const createCompanyMutation = useMutation<CreateCompanyResponse, Error, CreateCompanyData>({
    mutationFn: (data: CreateCompanyData) => companyService.createCompanyByAdmin(data),
    onSuccess: (data: CreateCompanyResponse) => {
      toast.success(data.message || 'Company provisioned successfully! Admin OTP sent.');
      router.push('/companies');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to provision company.';
      toast.error(errorMessage);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      newValue = Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fix all validation errors before submitting.');
      return;
    }

    const dataToSend = {
      ...formData,
      subscription_package_id: Number(formData.subscription_package_id),
      subscription_start_date: formData.subscription_start_date,
      subscription_end_date: formData.subscription_end_date,
    };

    createCompanyMutation.mutate(dataToSend);
  };

  // REMOVED: Blocking skeleton loader. Form structure should be visible immediately.
  // if (packagesLoading) { ... }

  if (!packagesLoading && (packagesError || packages.length === 0)) {
    return (
      <>
        {/* Breadcrumb removed */}
        <div className="p-6 text-center border border-danger/50 bg-danger/10 rounded-lg">
          <XCircle size={32} className="text-danger mx-auto mb-3" />
          <Typography variant="page-title" as="h3">Error Loading Packages</Typography>
          <Typography variant="body" className="text-danger mt-2">
            Could not fetch active subscription packages. Please ensure packages are configured in the backend.
          </Typography>
          <button
            onClick={() => router.push('/subscriptions')}
            className="mt-4 text-primary hover:underline text-sm"
          >
            <Typography variant="body2" as="span">Go to Subscriptions Page</Typography>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb removed */}
      <div className="w-full">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
            <Typography variant="card-title" as="h4">
              Company and Subscription Details
            </Typography>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6.5">

              {/* SECTION 1: Company & Admin Information */}
              <div className="mb-10">
                <Typography variant="body2" as="h5" className="text-primary mb-5 flex items-center gap-2 font-medium bg-primary/5 p-2 rounded w-fit px-4">
                  <User size={18} /> Company & Admin Information
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="label" className="mb-2.5 block">Company Name <span className="text-danger">*</span></Typography>
                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                  </div>
                  <div>
                    <Typography variant="label" className="mb-2.5 block">Industry</Typography>
                    <input type="text" name="industry" value={formData.industry || ''} onChange={handleChange} placeholder="e.g. Tech, E-commerce" className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                  </div>
                  <div>
                    <Typography variant="label" className="mb-2.5 block">Admin Full Name <span className="text-danger">*</span></Typography>
                    <input type="text" name="admin_name" value={formData.admin_name} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                  </div>
                  <div>
                    <Typography variant="label" className="mb-2.5 block">Phone</Typography>
                    <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                  </div>
                  <div>
                    <Typography variant="label" className="mb-2.5 block">Admin Email <span className="text-danger">*</span></Typography>
                    <input type="email" name="admin_email" value={formData.admin_email} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                  </div>
                  <div>
                    <Typography variant="label" className="mb-2.5 block">Temporary Password <span className="text-danger">*</span></Typography>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-500 hover:text-black dark:hover:text-white">
                        {showPassword ? <X size={20} /> : <Shield size={20} />}
                      </button>
                    </div>
                    {formData.password.length > 0 && formData.password.length < 6 && (
                      <Typography variant="caption" className="text-xs text-danger mt-1">Password must be at least 6 characters long.</Typography>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Subscription & Billing */}
              <div className="mb-6">
                <Typography variant="body2" as="h5" className="text-primary mb-5 flex items-center gap-2 font-medium bg-primary/5 p-2 rounded w-fit px-4">
                  <DollarSign size={18} /> Subscription & Billing
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Typography variant="label" className="mb-2.5 block">Subscription Package <span className="text-danger">*</span></Typography>
                    <div className="relative z-20 bg-white dark:bg-form-input">
                      {packagesLoading ? (
                        <div className="h-[50px] w-full rounded border border-stroke bg-gray-100 dark:border-strokedark dark:bg-meta-4 animate-pulse" />
                      ) : (
                        <select name="subscription_package_id" value={formData.subscription_package_id} onChange={handleChange} required className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white">
                          <option value={0} disabled>Select a package</option>
                          {packages.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ($ {Number(pkg.price_monthly).toFixed(2)} / month)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  {selectedPackage && (
                    <div className="md:col-span-2 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                      <Typography variant="body2" as="h6" className="font-semibold text-primary mb-2">Package: {selectedPackage.name}</Typography>
                      <Typography variant="body" className="text-gray-600 dark:text-gray-400">
                        Max Staff: <strong className="font-semibold">{selectedPackage.max_staff_count === 0 ? 'Unlimited' : selectedPackage.max_staff_count}</strong> |
                        Max Leads: <strong className="font-semibold">{selectedPackage.max_leads_per_month === 0 ? 'Unlimited' : selectedPackage.max_leads_per_month}</strong>
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 mt-2">
                        *Note: Since this is a manual provisioning, the dates below determine the subscription cycle.
                      </Typography>
                    </div>
                  )}

                  <div>
                    <Typography variant="label" className="mb-2.5 block">Start Date <span className="text-danger">*</span></Typography>
                    <input type="date" name="subscription_start_date" value={formData.subscription_start_date} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                  </div>
                  <div>
                    <Typography variant="label" className="mb-2.5 block">End Date <span className="text-danger">*</span></Typography>
                    <input type="date" name="subscription_end_date" value={formData.subscription_end_date} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                    {new Date(formData.subscription_end_date) <= new Date(formData.subscription_start_date) && (
                      <Typography variant="caption" className="text-xs text-danger mt-1">End date must be after start date.</Typography>
                    )}
                  </div>

                  <div className="md:col-span-2 flex items-center space-x-3 mt-4">
                    <label className="relative flex cursor-pointer select-none items-center">
                      <input
                        type="checkbox"
                        name="send_welcome_email"
                        checked={formData.send_welcome_email}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`h-6 w-10 rounded-full transition ${formData.send_welcome_email ? 'bg-success' : 'bg-gray-400'}`}>
                        <div className={`dot absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white transition ${formData.send_welcome_email ? 'translate-x-full' : ''}`}>
                          <ToggleRight size={16} className={formData.send_welcome_email ? 'text-success' : 'text-gray-400'} />
                        </div>
                      </div>
                    </label>
                    <div className="flex flex-col">
                      <Typography variant="body" className="font-medium text-black dark:text-white">Send Activation Email</Typography>
                      <Typography variant="caption" className="text-gray-500">Sends the Admin an OTP to set their permanent password.</Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 mt-6 border-t border-stroke dark:border-strokedark">
                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  isLoading={createCompanyMutation.isPending}
                  disabled={!isFormValid || createCompanyMutation.isPending}
                  className="px-8 min-w-[200px]"
                >
                  Provision Company
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}