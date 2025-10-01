'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import { useState } from 'react';
import { SubscriptionPackage, CreatePackageData, UpdatePackageData } from '@/types/subscription';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SubscriptionsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const queryClient = useQueryClient();

  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['packages', activeFilter],
    queryFn: () => subscriptionService.getPackages({
      active_only: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: subscriptionService.createPackage,
    onSuccess: (data) => {
      toast.success(data.message || 'Package created successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create package');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePackageData }) =>
      subscriptionService.updatePackage(id, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Package updated successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setShowEditModal(false);
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update package');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: subscriptionService.toggleStatus,
    onSuccess: (data) => {
      toast.success(data.message || 'Package status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update package status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subscriptionService.removePackage,
    onSuccess: (data) => {
      toast.success(data.message || 'Package deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    },
  });

  const handleToggleStatus = (packageId: number) => {
    toggleStatusMutation.mutate(packageId);
  };

  const handleDelete = (packageId: number, packageName: string) => {
    if (confirm(`Are you sure you want to delete the "${packageName}" package? This action cannot be undone.`)) {
      deleteMutation.mutate(packageId);
    }
  };

  const handleEdit = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  const packages = packagesData?.data?.packages || [];

  return (
    <DefaultLayout>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
          <div>
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Subscription Packages
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Manage subscription packages and pricing
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
          >
            <Plus size={20} />
            Create Package
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 md:px-6 xl:px-7.5 pb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Packages
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeFilter === 'active'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeFilter === 'inactive'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Inactive Only
            </button>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="px-4 md:px-6 xl:px-7.5 pb-6">
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No packages found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
              >
                Create Your First Package
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg: SubscriptionPackage) => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-6 transition-all hover:shadow-lg ${
                    pkg.is_active
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            pkg.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-200">
                          {pkg.duration_type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${pkg.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        per {pkg.duration_type.slice(0, -2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Max Staff:</span>
                      <span className="ml-2 font-medium text-black dark:text-white">
                        {pkg.max_staff_count}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Max Leads/Month:</span>
                      <span className="ml-2 font-medium text-black dark:text-white">
                        {pkg.max_leads_per_month}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Features:</span>
                      <ul className="mt-2 space-y-1">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                            <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(pkg.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(pkg.id)}
                        className={`hover:text-primary transition-colors ${
                          toggleStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={toggleStatusMutation.isPending}
                        title={pkg.is_active ? 'Deactivate Package' : 'Activate Package'}
                      >
                        {pkg.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="hover:text-primary transition-colors"
                        title="Edit Package"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id, pkg.name)}
                        className={`hover:text-danger transition-colors ${
                          deleteMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={deleteMutation.isPending}
                        title="Delete Package"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <PackageModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          title="Create New Package"
        />
      )}

      {showEditModal && selectedPackage && (
        <PackageModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPackage(null);
          }}
          onSubmit={(data) => updateMutation.mutate({ id: selectedPackage.id, data })}
          isLoading={updateMutation.isPending}
          title="Edit Package"
          initialData={selectedPackage}
        />
      )}
    </DefaultLayout>
  );
}

// Package Modal Component
interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePackageData) => void;
  isLoading: boolean;
  title: string;
  initialData?: SubscriptionPackage;
}

function PackageModal({ isOpen, onClose, onSubmit, isLoading, title, initialData }: PackageModalProps) {
  const [formData, setFormData] = useState<CreatePackageData>({
    name: initialData?.name || '',
    duration_type: initialData?.duration_type || 'monthly',
    price: initialData?.price || 0,
    features: initialData?.features || [''],
    max_staff_count: initialData?.max_staff_count || 1,
    max_leads_per_month: initialData?.max_leads_per_month || 100,
  });

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData({ ...formData, features: newFeatures });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedFeatures = formData.features.filter(feature => feature.trim() !== '');
    onSubmit({ ...formData, features: cleanedFeatures });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-boxdark rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">{title}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              Package Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Duration Type
              </label>
              <select
                value={formData.duration_type}
                onChange={(e) => setFormData({ ...formData, duration_type: e.target.value as 'monthly' | 'yearly' })}
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Price ($)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
                min="0"
                step="0.01"
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Max Staff Count
              </label>
              <input
                type="number"
                value={formData.max_staff_count}
                onChange={(e) => setFormData({ ...formData, max_staff_count: Number(e.target.value) })}
                required
                min="1"
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Max Leads/Month
              </label>
              <input
                type="number"
                value={formData.max_leads_per_month}
                onChange={(e) => setFormData({ ...formData, max_leads_per_month: Number(e.target.value) })}
                required
                min="1"
                className="w-full rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">
              Features
            </label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder="Enter feature"
                  className="flex-1 rounded border border-stroke py-2 px-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 text-danger hover:bg-red-50 rounded dark:hover:bg-red-900"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="text-sm text-primary hover:underline"
            >
              + Add Feature
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-stroke rounded hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}