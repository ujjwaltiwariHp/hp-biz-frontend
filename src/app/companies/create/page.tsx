'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { subscriptionService } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { CreateCompanyData, CreateCompanyResponse } from '@/types/company';
import { SubscriptionPackage, PackagesResponse } from '@/types/subscription';
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Shield, User, DollarSign, ToggleRight, X, XCircle } from 'lucide-react';
import { format } from 'date-fns';

// --- Type assertion for companyService to fix TS error ---
// We assert the type locally using the module's structure
const typedCompanyService: typeof companyService = companyService as typeof companyService;
// ---------------------------------------------------------


// Helper functions (omitted for brevity, assume correct existence)
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
      return startDate;
  }
  end.setDate(end.getDate() - 1);
  return format(end, 'yyyy-MM-dd');
};

const getDefaultFormData = (selectedPackage: SubscriptionPackage | null): CreateCompanyData => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const duration = selectedPackage?.duration_type || 'monthly';
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
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateCompanyData>(getDefaultFormData(null));
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const {
    data: packagesResponse,
    isLoading: packagesLoading,
    isError: packagesError
  } = useQuery<PackagesResponse>({
    queryKey: ['activePackages'],
    queryFn: () => subscriptionService.getPackages({ active_only: true }),
    staleTime: Infinity,
  });

  const packages = packagesResponse?.data.packages || [];

  useEffect(() => {
    // ... existing logic ...
    const pkg = packages.find(p => p.id === formData.subscription_package_id);
    setSelectedPackage(pkg || null);

    if (pkg) {
      const newEndDate = calculateEndDate(formData.subscription_start_date, pkg.duration_type);
      setFormData(prev => ({
        ...prev,
        subscription_end_date: newEndDate,
        subscription_package_id: pkg.id,
      }));
    }
  }, [formData.subscription_package_id, formData.subscription_start_date, packages]);

  useEffect(() => {
    // ... existing logic ...
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
    // Using the locally asserted type to fix the compilation error
    mutationFn: (data: CreateCompanyData) => typedCompanyService.createCompanyByAdmin(data),
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
    // ... existing logic ...
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


  const handleNext = () => {
    // ... existing validation logic ...
      const { company_name, admin_email, admin_name, password } = formData;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!company_name || !admin_email || !admin_name || !password) {
          toast.error('Please fill all required Company Admin fields.');
          return;
      }
      if (!emailRegex.test(admin_email)) {
          toast.error('Please provide a valid Admin Email.');
          return;
      }
      if (password.length < 6) {
          toast.error('Password must be at least 6 characters long.');
          return;
      }
      setStep(2);
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

  if (packagesLoading) {
    return <Loader />;
  }

  if (packagesError || packages.length === 0) {
      return (
        <DefaultLayout>
            <Breadcrumb pageName="Create Company" />
            <div className="p-6 text-center border border-danger/50 bg-danger/10 rounded-lg">
                <XCircle size={32} className="text-danger mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-black dark:text-white">Error Loading Packages</h3>
                <p className="text-danger mt-2">
                    Could not fetch active subscription packages. Please ensure packages are configured in the backend.
                </p>
                <button
                    onClick={() => router.push('/subscriptions')}
                    className="mt-4 text-primary hover:underline text-sm"
                >
                    Go to Subscriptions Page
                </button>
            </div>
        </DefaultLayout>
      );
  }

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Provision New Company" />
      <div className="mx-auto max-w-3xl">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Company Provisioning Wizard (Step {step} of 2)
            </h4>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6.5">

              {/* Step 1: Company & Admin Details */}
              <div className={step === 1 ? 'block' : 'hidden'}>
                <h5 className="text-lg font-medium text-primary mb-5 flex items-center gap-2"><User size={18} /> Company & Admin Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Company Name <span className="text-danger">*</span></label>
                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                    </div>
                    {/* Industry (Optional) */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Industry</label>
                        <input type="text" name="industry" value={formData.industry || ''} onChange={handleChange} className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                    </div>
                    {/* Admin Name */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Admin Full Name <span className="text-danger">*</span></label>
                        <input type="text" name="admin_name" value={formData.admin_name} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                    </div>
                    {/* Phone (Optional) */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Phone</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                    </div>
                    {/* Admin Email */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Admin Email <span className="text-danger">*</span></label>
                        <input type="email" name="admin_email" value={formData.admin_email} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                    </div>
                    {/* Password */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Temporary Password <span className="text-danger">*</span></label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-500 hover:text-black dark:hover:text-white">
                                {showPassword ? <X size={20} /> : <Shield size={20} />}
                            </button>
                        </div>
                        {formData.password.length > 0 && formData.password.length < 6 && (
                            <p className="text-xs text-danger mt-1">Password must be at least 6 characters long.</p>
                        )}
                    </div>
                </div>
              </div>

              {/* Step 2: Subscription Details */}
              <div className={step === 2 ? 'block' : 'hidden'}>
                <h5 className="text-lg font-medium text-primary mb-5 flex items-center gap-2"><DollarSign size={18} /> Subscription & Billing</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Package Selection */}
                    <div className="md:col-span-2">
                        <label className="mb-2.5 block text-black dark:text-white">Subscription Package <span className="text-danger">*</span></label>
                        <div className="relative z-20 bg-white dark:bg-form-input">
                            <select name="subscription_package_id" value={formData.subscription_package_id} onChange={handleChange} required className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white">
                                <option value={0} disabled>Select a package</option>
                                {packages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name} (${pkg.price.toFixed(2)} / {pkg.duration_type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Package Info Card */}
                    {selectedPackage && (
                        <div className="md:col-span-2 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                            <h6 className="font-semibold text-primary mb-2">Package: {selectedPackage.name}</h6>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Max Staff: **{selectedPackage.max_staff_count === 0 ? 'Unlimited' : selectedPackage.max_staff_count}** |
                                Max Leads: **{selectedPackage.max_leads_per_month === 0 ? 'Unlimited' : selectedPackage.max_leads_per_month}**
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                *Note: Since this is a manual provisioning, the dates below determine the subscription cycle.
                            </p>
                        </div>
                    )}

                    {/* Subscription Start Date */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">Start Date <span className="text-danger">*</span></label>
                        <input type="date" name="subscription_start_date" value={formData.subscription_start_date} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                    </div>
                    {/* Subscription End Date */}
                    <div>
                        <label className="mb-2.5 block text-black dark:text-white">End Date <span className="text-danger">*</span></label>
                        <input type="date" name="subscription_end_date" value={formData.subscription_end_date} onChange={handleChange} required className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white" />
                        {new Date(formData.subscription_end_date) <= new Date(formData.subscription_start_date) && (
                            <p className="text-xs text-danger mt-1">End date must be after start date.</p>
                        )}
                    </div>

                    {/* Send Welcome Email Toggle */}
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
                            <p className="text-sm font-medium text-black dark:text-white">Send Activation Email</p>
                            <span className="text-xs text-gray-500">Sends the Admin an OTP to set their permanent password.</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* Navigation and Submission */}
              <div className="flex justify-between pt-6 mt-6 border-t border-stroke dark:border-strokedark">
                  {step === 2 && (
                      <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex items-center gap-2 rounded bg-gray-300 py-3 px-6 text-black hover:bg-gray-400 transition-colors"
                      >
                          <ArrowLeft size={18} /> Previous
                      </button>
                  )}

                  {step === 1 && (
                      <button
                          type="button"
                          onClick={handleNext}
                          className="ml-auto flex items-center gap-2 rounded bg-primary py-3 px-6 font-medium text-white hover:bg-primary/90 transition-colors"
                      >
                          Next <ArrowRight size={18} />
                      </button>
                  )}

                  {step === 2 && (
                      <button
                          type="submit"
                          disabled={createCompanyMutation.isPending || !isFormValid}
                          className="rounded bg-success py-3 px-6 font-medium text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
                      >
                          {createCompanyMutation.isPending ? 'Provisioning...' : 'Provision Company'}
                      </button>
                  )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </DefaultLayout>
  );
}