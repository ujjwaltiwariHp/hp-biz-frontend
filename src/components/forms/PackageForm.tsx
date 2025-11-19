'use client';

import { useState, useEffect } from 'react';
import { CreatePackageData, UpdatePackageData, SubscriptionPackage } from '@/types/subscription';
import { toast } from 'react-toastify';
import { Plus, X, ToggleRight, Info } from 'lucide-react';
import { Typography } from '@/components/common/Typography';

// Define the shape of the form data, combining create and update fields
type PackageFormState = CreatePackageData & { is_active?: boolean };

interface PackageFormProps {
  title: string;
  initialData?: SubscriptionPackage;
  onSubmit: (data: CreatePackageData | UpdatePackageData) => void;
  isLoading: boolean;
  isEditMode: boolean;
}

const inputClasses = "w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white font-satoshi";

export default function PackageForm({
  title,
  initialData,
  onSubmit,
  isLoading,
  isEditMode,
}: PackageFormProps) {
  const [formData, setFormData] = useState<PackageFormState>({
    name: initialData?.name || '',
    price_monthly: initialData?.price_monthly || '0.00',
    price_quarterly: initialData?.price_quarterly || '0.00',
    price_yearly: initialData?.price_yearly || '0.00',
    yearly_discount_percent: initialData?.yearly_discount_percent || 0,
    max_custom_fields: initialData?.max_custom_fields || 0,
    max_staff_count: initialData?.max_staff_count || 10,
    max_leads_per_month: initialData?.max_leads_per_month || 500,
    features: initialData?.features || [''],
    is_active: initialData?.is_active ?? true,
    is_trial: initialData?.is_trial ?? false,
    trial_duration_days: initialData?.trial_duration_days || 7,
  });

  // Ensure price and limits are correctly mapped from initialData
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        price_monthly: String(initialData.price_monthly || '0.00'),
        price_quarterly: String(initialData.price_quarterly || '0.00'),
        price_yearly: String(initialData.price_yearly || '0.00'),
        yearly_discount_percent: Number(initialData.yearly_discount_percent) || 0,
        max_custom_fields: Number(initialData.max_custom_fields) || 0,
        max_staff_count: Number(initialData.max_staff_count) || 0,
        max_leads_per_month: Number(initialData.max_leads_per_month) || 0,
        trial_duration_days: Number(initialData.trial_duration_days) || 0,
        features: initialData.features || [''],
        is_active: initialData.is_active,
        is_trial: initialData.is_trial,
      }));
    }
  }, [initialData]);

  // If trial is enabled, force prices to 0
  useEffect(() => {
    if (formData.is_trial) {
        setFormData((prev) => ({
            ...prev,
            price_monthly: '0.00',
            price_quarterly: '0.00',
            price_yearly: '0.00',
            yearly_discount_percent: 0,
        }));
    }
  }, [formData.is_trial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === 'number') {
      newValue = Number(value);
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, features: newFeatures }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedFeatures = formData.features.filter(feature => feature.trim() !== '').map(f => f.trim());

    if (!formData.name.trim()) {
        toast.error('Package name is required.');
        return;
    }

    if (!formData.is_trial && (parseFloat(formData.price_monthly) < 0 || parseFloat(formData.price_quarterly) < 0 || parseFloat(formData.price_yearly) < 0)) {
         toast.error('Prices cannot be negative.');
         return;
    }

    if (formData.is_trial && (!formData.trial_duration_days || formData.trial_duration_days <= 0)) {
        toast.error('Trial duration must be a positive number if it is a trial package.');
        return;
    }

    let finalData: CreatePackageData | UpdatePackageData;

    if (isEditMode) {
      const dirtyData: { [key: string]: any } = {};

      (Object.keys(formData) as (keyof PackageFormState)[]).forEach((key) => {
        if (key === 'features') {
          if (JSON.stringify(cleanedFeatures) !== JSON.stringify(initialData?.features || [])) {
            dirtyData.features = cleanedFeatures;
          }
        } else if (key.startsWith('price_')) {
           // Compare string values for prices
           if (String(formData[key]) !== String((initialData as any)?.[key])) {
             dirtyData[key] = formData[key];
           }
        }
        else if (formData[key] !== (initialData as any)?.[key]) {
          dirtyData[key] = formData[key];
        }
      });
      finalData = dirtyData;

    } else {
      finalData = {
          ...formData,
          features: cleanedFeatures,
          price_monthly: formData.price_monthly,
          price_quarterly: formData.price_quarterly,
          price_yearly: formData.price_yearly,
          yearly_discount_percent: formData.yearly_discount_percent,
          max_custom_fields: formData.max_custom_fields,
          trial_duration_days: formData.is_trial ? formData.trial_duration_days : 0,
      } as CreatePackageData;
    }

    if (Object.keys(finalData).length === 0 && isEditMode) {
        toast.info('No changes detected.');
        return;
    }

    onSubmit(finalData);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark font-satoshi">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
        {/* Replaced H4 with Typography variant="card-title" or appropriate header style */}
        <Typography variant="page-title" as="h4" className="text-xl font-semibold text-black dark:text-white font-satoshi">
          {title}
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 xl:p-7.5">

        <div className="mb-5.5">
          {/* Replaced Body with Typography variant="label" */}
          <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Package Name</Typography>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClasses}
          />
        </div>

        <div className="mb-8 p-4 rounded-lg border border-indigo-400/20 bg-indigo-50/50 dark:bg-boxdark-2">
            <h5 className="text-md font-semibold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2 font-satoshi">
                Pricing Configuration (Currency: INR ₹)
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5.5">
                <div>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Monthly Price (₹)</Typography>
                    <input
                        type="number"
                        name="price_monthly"
                        value={formData.price_monthly}
                        onChange={handleChange}
                        required={!formData.is_trial}
                        min="0"
                        step="0.01"
                        className={inputClasses}
                        disabled={formData.is_trial}
                    />
                </div>

                <div>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Quarterly Price (₹)</Typography>
                    <input
                        type="number"
                        name="price_quarterly"
                        value={formData.price_quarterly}
                        onChange={handleChange}
                        required={!formData.is_trial}
                        min="0"
                        step="0.01"
                        className={inputClasses}
                        disabled={formData.is_trial}
                    />
                </div>

                <div>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Yearly Price (₹)</Typography>
                    <input
                        type="number"
                        name="price_yearly"
                        value={formData.price_yearly}
                        onChange={handleChange}
                        required={!formData.is_trial}
                        min="0"
                        step="0.01"
                        className={inputClasses}
                        disabled={formData.is_trial}
                    />
                </div>

                <div>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Yearly Discount (%)</Typography>
                    <input
                        type="number"
                        name="yearly_discount_percent"
                        value={formData.yearly_discount_percent}
                        onChange={handleChange}
                        required
                        min="0"
                        max="100"
                        className={inputClasses}
                        disabled={formData.is_trial}
                    />
                </div>
            </div>
        </div>

        <div className="mb-5.5">
            <h5 className="text-md font-semibold text-black dark:text-white mb-4 font-satoshi">Subscription Limits & Customization</h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5.5">
                <div>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Max Staff Count (0 for unlimited)</Typography>
                    <input
                        type="number"
                        name="max_staff_count"
                        value={formData.max_staff_count}
                        onChange={handleChange}
                        required
                        min="0"
                        className={inputClasses}
                    />
                </div>

                <div>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Max Leads per Month (0 for unlimited)</Typography>
                    <input
                        type="number"
                        name="max_leads_per_month"
                        value={formData.max_leads_per_month}
                        onChange={handleChange}
                        required
                        min="0"
                        className={inputClasses}
                    />
                </div>

                <div>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Max Custom Fields (Leads)</Typography>
                    <input
                        type="number"
                        name="max_custom_fields"
                        value={formData.max_custom_fields}
                        onChange={handleChange}
                        required
                        min="0"
                        max="50"
                        className={inputClasses}
                    />
                </div>
            </div>
        </div>

        <div className="mt-8 p-4 rounded-lg border border-primary/20 bg-primary/5 dark:bg-boxdark-2">
            <h5 className="text-md font-semibold text-primary mb-3 flex items-center gap-2 font-satoshi">
                <Info size={18} />
                Trial Configuration
            </h5>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
                <div className="flex items-center space-x-3 mt-1">
                    <label className="relative flex cursor-pointer select-none items-center">
                        <input
                            type="checkbox"
                            name="is_trial"
                            checked={formData.is_trial}
                            onChange={handleChange}
                            className="sr-only"
                        />
                        <div className={`h-6 w-10 rounded-full transition ${formData.is_trial ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                            <div className={`dot absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white transition ${formData.is_trial ? 'translate-x-full' : ''}`}>
                                <ToggleRight size={16} className={formData.is_trial ? 'text-indigo-600' : 'text-gray-400'} />
                            </div>
                        </div>
                    </label>
                    {/* Replaced Small with Typography variant="body" */}
                    <Typography variant="body" className="font-medium text-black dark:text-white font-satoshi">Enable Trial Package</Typography>
                </div>

                <div className={`${formData.is_trial ? 'block' : 'opacity-50 pointer-events-none'}`}>
                    <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Trial Duration (Days)</Typography>
                    <input
                        type="number"
                        name="trial_duration_days"
                        value={formData.trial_duration_days}
                        onChange={handleChange}
                        required={formData.is_trial}
                        min="1"
                        className={inputClasses}
                        disabled={!formData.is_trial}
                    />
                </div>
            </div>
        </div>

        <div className="mt-8">
          <Typography variant="label" as="label" className="mb-2.5 block font-medium font-satoshi">Features</Typography>
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2 mb-3 items-center">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder="Enter feature name (e.g., Lead Scoring, Email Automation)"
                className="flex-1 rounded border border-stroke py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white font-satoshi"
              />
              {formData.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="p-3 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="text-sm text-primary hover:underline flex items-center gap-1 mt-2 disabled:opacity-50 font-satoshi"
            disabled={isLoading}
          >
            <Plus size={16} /> Add Another Feature
          </button>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-stroke dark:border-strokedark">
            {isEditMode && (
                <div className="flex items-center space-x-3 mt-4">
                    <label className="relative flex cursor-pointer select-none items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="sr-only"
                        />
                        <div className={`h-6 w-10 rounded-full transition ${formData.is_active ? 'bg-success' : 'bg-danger'}`}>
                            <div className={`dot absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white transition ${formData.is_active ? 'translate-x-full' : ''}`}>
                                <ToggleRight size={16} />
                            </div>
                        </div>
                    </label>
                    <div className="flex flex-col">
                        <Typography variant="label" className="font-medium text-black dark:text-white font-satoshi">Package Status</Typography>
                        <Typography variant="caption" className="text-xs text-gray-500 font-satoshi">{formData.is_active ? 'Active' : 'Inactive'}</Typography>
                    </div>
                </div>
            )}
            <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-primary py-3 px-6 font-medium text-white hover:bg-opacity-90 disabled:opacity-50 font-satoshi"
            >
                {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update Package' : 'Create Package'}
            </button>
        </div>
      </form>
    </div>
  );
}