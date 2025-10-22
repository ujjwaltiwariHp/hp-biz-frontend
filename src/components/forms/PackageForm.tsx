'use client';

import { useState, useEffect } from 'react';
import { CreatePackageData, UpdatePackageData, SubscriptionPackage } from '@/types/subscription';
import { toast } from 'react-toastify';
import { Plus, X, ToggleRight, Info } from 'lucide-react';

// Define the shape of the form data, combining create and update fields
type PackageFormState = CreatePackageData & { is_active?: boolean };

interface PackageFormProps {
  title: string;
  initialData?: SubscriptionPackage;
  onSubmit: (data: CreatePackageData | UpdatePackageData) => void;
  isLoading: boolean;
  isEditMode: boolean;
}

const DURATION_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'one_time', label: 'One-Time' },
];

export default function PackageForm({
  title,
  initialData,
  onSubmit,
  isLoading,
  isEditMode,
}: PackageFormProps) {
  const [formData, setFormData] = useState<PackageFormState>({
    name: initialData?.name || '',
    duration_type: initialData?.duration_type || 'monthly',
    price: initialData?.price || 0,
    features: initialData?.features || [''],
    max_staff_count: initialData?.max_staff_count || 10,
    max_leads_per_month: initialData?.max_leads_per_month || 500,
    is_active: initialData?.is_active ?? true,
    is_trial: initialData?.is_trial ?? false,
    trial_duration_days: initialData?.trial_duration_days || 7,
  });

  // Ensure price and limits are always numbers
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        price: Number(initialData.price) || 0,
        max_staff_count: Number(initialData.max_staff_count) || 0,
        max_leads_per_month: Number(initialData.max_leads_per_month) || 0,
      }));
    }
  }, [initialData]);

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

    if (formData.is_trial && (!formData.trial_duration_days || formData.trial_duration_days <= 0)) {
        toast.error('Trial duration must be a positive number if it is a trial package.');
        return;
    }

    const cleanedFeatures = formData.features.filter(feature => feature.trim() !== '').map(f => f.trim());

    // Prepare data based on mode (Edit mode only sends updated fields)
    let finalData: CreatePackageData | UpdatePackageData;

    if (isEditMode) {
      const dirtyData: { [key: string]: any } = {};

      // Check for changes against initialData
      (Object.keys(formData) as (keyof PackageFormState)[]).forEach((key) => {
        if (key === 'features') {
          // Send features array if it changed
          if (JSON.stringify(cleanedFeatures) !== JSON.stringify(initialData?.features || [])) {
            dirtyData.features = cleanedFeatures;
          }
        } else if (formData[key] !== (initialData as any)?.[key]) {
          dirtyData[key] = formData[key];
        }
      });
      finalData = dirtyData;
      // Ensure required trial fields are included if is_trial changed
      if (finalData.is_trial === true && !finalData.trial_duration_days) {
          finalData.trial_duration_days = formData.trial_duration_days;
      }

    } else {
      // Create mode sends all data
      finalData = {
          ...formData,
          features: cleanedFeatures,
          price: Number(formData.price),
          max_staff_count: Number(formData.max_staff_count),
          max_leads_per_month: Number(formData.max_leads_per_month),
          trial_duration_days: formData.is_trial ? Number(formData.trial_duration_days) : 0,
          is_active: formData.is_active,
      } as CreatePackageData;
    }

    if (Object.keys(finalData).length === 0 && isEditMode) {
        toast.info('No changes detected.');
        return;
    }

    onSubmit(finalData);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          {title}
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 xl:p-7.5">
        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
          {/* Package Name */}
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Package Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
          </div>

          {/* Duration Type */}
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Duration Type</label>
            <div className="relative z-20 bg-white dark:bg-form-input">
              <select
                name="duration_type"
                value={formData.duration_type}
                onChange={handleChange}
                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 mt-5">
          {/* Price */}
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
          </div>

          {/* Max Staff Count */}
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Max Staff Count (0 for unlimited)</label>
            <input
              type="number"
              name="max_staff_count"
              value={formData.max_staff_count}
              onChange={handleChange}
              required
              min="0"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 mt-5">
          {/* Max Leads per Month */}
          <div>
            <label className="mb-2.5 block text-black dark:text-white">Max Leads per Month (0 for unlimited)</label>
            <input
              type="number"
              name="max_leads_per_month"
              value={formData.max_leads_per_month}
              onChange={handleChange}
              required
              min="0"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
          </div>

          {/* Is Active Toggle (Edit Mode Only) */}
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
                    <p className="text-sm font-medium text-black dark:text-white">Package Status</p>
                    <span className="text-xs text-gray-500">{formData.is_active ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
          )}
        </div>


        <div className="mt-8 p-4 rounded-lg border border-primary/20 bg-primary/5 dark:bg-boxdark-2">
            <h5 className="text-md font-semibold text-primary mb-3 flex items-center gap-2">
                <Info size={18} />
                Trial Configuration
            </h5>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
                {/* Is Trial Toggle */}
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
                    <p className="text-sm font-medium text-black dark:text-white">Enable Trial Package</p>
                </div>

                {/* Trial Duration Days */}
                <div className={`${formData.is_trial ? 'block' : 'opacity-50 pointer-events-none'}`}>
                    <label className="mb-2.5 block text-black dark:text-white">Trial Duration (Days)</label>
                    <input
                        type="number"
                        name="trial_duration_days"
                        value={formData.trial_duration_days}
                        onChange={handleChange}
                        required={formData.is_trial}
                        min="1"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                        disabled={!formData.is_trial}
                    />
                </div>
            </div>
        </div>

        <div className="mt-8">
          <label className="mb-2.5 block text-black dark:text-white">Features</label>
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2 mb-3 items-center">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                placeholder="Enter feature name (e.g., Lead Scoring, Email Automation)"
                className="flex-1 rounded border border-stroke py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
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
            className="text-sm text-primary hover:underline flex items-center gap-1 mt-2 disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus size={16} /> Add Another Feature
          </button>
        </div>


        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-stroke dark:border-strokedark">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-primary py-3 px-6 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update Package' : 'Create Package'}
          </button>
        </div>
      </form>
    </div>
  );
}