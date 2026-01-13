'use client';

import { useState, useEffect } from 'react';
import { CreatePackageData, UpdatePackageData, SubscriptionPackage, SubscriptionFeature } from '@/types/subscription';
import { toast } from 'react-toastify';
import { Info, AlertCircle } from 'lucide-react';
import { Typography } from '@/components/common/Typography';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import Loader from '@/components/common/Loader';

// Define the shape of the form data, combining create and update fields
type PackageFormState = CreatePackageData & { is_active?: boolean };

interface PackageFormProps {
  title: string;
  initialData?: SubscriptionPackage;
  onSubmit: (data: CreatePackageData | UpdatePackageData) => void;
  isLoading: boolean;
  isEditMode: boolean;
}

const inputClasses =
  'w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white font-satoshi text-sm';

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
    features: initialData?.features || [],
    is_active: initialData?.is_active ?? true,
    is_trial: initialData?.is_trial ?? false,
    trial_duration_days: initialData?.trial_duration_days || 7,
  });

  // Fetch available features from the backend
  const { data: featuresResponse, isLoading: isFeaturesLoading } = useQuery({
    queryKey: ['subscription-features'],
    queryFn: subscriptionService.getFeatures,
    staleTime: Infinity, // Features config rarely changes
  });

  const availableFeatures = featuresResponse?.data?.features || [];

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
        features: initialData.features || [],
        is_active: initialData.is_active,
        is_trial: initialData.is_trial,
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === 'number') {
      // keep as string so decimal typing works smoothly
      newValue = value;
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleFeatureToggle = (featureKey: string) => {
    setFormData((prev) => {
      const currentFeatures = prev.features || [];
      if (currentFeatures.includes(featureKey)) {
        return { ...prev, features: currentFeatures.filter((f) => f !== featureKey) };
      } else {
        return { ...prev, features: [...currentFeatures, featureKey] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Package name is required.');
      return;
    }

    if (
      !formData.is_trial &&
      (parseFloat(formData.price_monthly) < 0 ||
        parseFloat(formData.price_quarterly) < 0 ||
        parseFloat(formData.price_yearly) < 0)
    ) {
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
          // Compare sorted arrays to check equality independent of order
          const currentFeatures = [...formData.features].sort();
          const initialFeatures = [...(initialData?.features || [])].sort();
          if (JSON.stringify(currentFeatures) !== JSON.stringify(initialFeatures)) {
            dirtyData.features = formData.features;
          }
        } else if (key.startsWith('price_')) {
          // Compare string values for prices
          if (String(formData[key]) !== String((initialData as any)?.[key])) {
            dirtyData[key] = formData[key];
          }
        } else if (formData[key] !== (initialData as any)?.[key]) {
          dirtyData[key] = formData[key];
        }
      });
      finalData = dirtyData;
    } else {
      finalData = {
        ...formData,
        features: formData.features,
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

  // Group features by category for display
  const groupedFeatures = availableFeatures.reduce((acc, feature) => {
    const category = feature.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, SubscriptionFeature[]>);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark shadow-default font-satoshi w-full">
      {/* Header */}
      <div className="py-3 px-5 border-b border-stroke dark:border-strokedark flex justify-between items-center shrink-0">
        <Typography
          variant="page-title"
          as="h4"
          className="text-lg font-semibold text-black dark:text-white"
        >
          {title}
        </Typography>
        {isEditMode && (
          <div className="flex items-center space-x-3">
            <label className="relative flex cursor-pointer select-none items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                className={`h-6 w-11 rounded-full transition shadow-inner ${formData.is_active ? 'bg-green-500' : 'bg-blue-500'
                  }`}
              >
                <div
                  className={`dot absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white transition shadow-sm ${formData.is_active ? 'translate-x-full' : ''
                    }`}
                ></div>
              </div>
            </label>
            <div className="flex flex-col">
              <Typography
                variant="caption"
                className="text-xs font-medium text-gray-500 dark:text-gray-300"
              >
                {formData.is_active ? 'Active' : 'Inactive'}
              </Typography>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 overflow-hidden">
        <form id="package-form" onSubmit={handleSubmit} className="h-full">
          {/* Compact Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Package Name */}
            <div className="lg:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                Package Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Starter Plan"
                className={inputClasses}
              />
            </div>

            {/* Pricing Section */}
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-primary">
                Pricing (USD $)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Monthly ($)
                  </label>
                  <input
                    type="number"
                    name="price_monthly"
                    value={formData.price_monthly}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={inputClasses}
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Quarterly ($)
                  </label>
                  <input
                    type="number"
                    name="price_quarterly"
                    value={formData.price_quarterly}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={inputClasses}
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Yearly ($)
                  </label>
                  <input
                    type="number"
                    name="price_yearly"
                    value={formData.price_yearly}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={inputClasses}
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="yearly_discount_percent"
                    value={formData.yearly_discount_percent}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={inputClasses}
                    step="0.01"
                    min="0"
                    max="100"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Usage Limits & Trial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded border border-stroke bg-gray-50/50 dark:bg-boxdark-2 dark:border-strokedark">
              <h5 className="text-sm font-semibold text-black dark:text-white mb-2.5">
                Usage Limits
              </h5>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Max Staff
                  </label>
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
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Leads/Mo
                  </label>
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
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Custom Fields
                  </label>
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

            <div className="p-3 rounded border border-primary/30 bg-primary/5 dark:bg-boxdark-2">
              <div className="flex items-center justify-between mb-2.5">
                <h5 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                  <Info size={14} /> Trial Mode
                </h5>
                <label className="relative flex cursor-pointer select-none items-center">
                  <input
                    type="checkbox"
                    name="is_trial"
                    checked={formData.is_trial}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`h-6 w-11 rounded-full transition shadow-inner ${formData.is_trial ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                  >
                    <div
                      className={`dot absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white transition shadow-sm ${formData.is_trial ? 'translate-x-full' : ''
                        }`}
                    ></div>
                  </div>
                </label>
              </div>
              <div
                className={`transition-opacity duration-200 ${formData.is_trial ? 'opacity-100' : 'opacity-40 pointer-events-none'
                  }`}
              >
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  name="trial_duration_days"
                  value={formData.trial_duration_days}
                  onChange={handleChange}
                  required={formData.is_trial}
                  min="1"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Feature Entitlements - 3 Per Row */}
          <div>
            <h5 className="text-sm font-semibold text-black dark:text-white mb-3 pb-1.5 border-b border-stroke dark:border-strokedark uppercase tracking-wide">
              Feature Entitlements
            </h5>

            {isFeaturesLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-500 text-sm">
                <Loader size="sm" variant="inline" className="mr-2" />
                Loading features...
              </div>
            ) : availableFeatures.length === 0 ? (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded border border-yellow-200 dark:border-yellow-700 flex items-center text-sm">
                <AlertCircle size={16} className="mr-2" />
                <span>No feature definitions found.</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
                {Object.entries(groupedFeatures).map(([category, features]) => (
                  <div key={category}>
                    <h6 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2.5">
                      {category}
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {features.map((feature) => {
                        const isEnabled = formData.features.includes(feature.key);
                        return (
                          <div
                            key={feature.key}
                            onClick={() => handleFeatureToggle(feature.key)}
                            className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 ${isEnabled
                                ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 shadow-sm'
                                : 'border-stroke bg-white dark:bg-boxdark dark:border-strokedark hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'
                              }`}
                          >
                            <div className="flex-1 pr-3">
                              <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                {feature.label}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                {feature.description}
                              </p>
                            </div>

                            {/* Toggle Switch - Blue/Green Only */}
                            <div
                              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${isEnabled ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-5' : ''
                                  }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="py-3 px-5 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-boxdark-2 flex justify-end gap-3 shrink-0 rounded-b-sm">
        <button
          type="submit"
          form="package-form"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 shadow-sm transition-all text-sm"
        >
          {isLoading && (
            <Loader size="xs" variant="inline" className="mr-2" />
          )}
          {isEditMode ? 'Save Changes' : 'Create Package'}
        </button>
      </div>
    </div>
  );
}