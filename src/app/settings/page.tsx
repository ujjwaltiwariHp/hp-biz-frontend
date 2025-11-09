'use client';

import { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { billingService } from '@/services/billing.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import { SettingsIcon, DollarSign, User, Lock, UserPlus, Users } from 'lucide-react';
import { PageTitle, Label, Value } from '@/components/common/Typography';
import ActionCard from '@/components/common/ActionCard';
import BillingSettingsModal from '@/components/forms/BillingSettingsModal';
import { EditProfileModal } from '@/components/modal/EditProfileModal';
import { ChangePasswordModal } from '@/components/modal/ChangePasswordModal';
import { CreateAdminModal } from '@/components/modal/CreateAdminModal';
import { ViewAdminsModal } from '@/components/modal/ViewAdminsModal';
import { hasPermission } from '@/utils/adminHelpers';
import { UpdateProfileData, ChangePasswordData } from '@/types/auth';
import { BillingSettings } from '@/types/billing';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { profile, permissions, isInitialized, isAuthenticated } = useAuth();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showViewAdmins, setShowViewAdmins] = useState(false);
  const [showBillingSettings, setShowBillingSettings] = useState(false);

  const [profileData, setProfileData] = useState<UpdateProfileData>({
    email: '',
    name: '',
  });
  const [passwordData, setPasswordData] = useState<
    ChangePasswordData & { confirmPassword: string }
  >({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (profile) {
      setProfileData({
        email: profile.email || '',
        name: profile.name || '',
      });
    }
  }, [profile]);

  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ['superAdminRoles'],
    queryFn: authService.getRoles,
    enabled: isInitialized && isAuthenticated,
  });

  const { data: adminsResponse, isLoading: adminsLoading } = useQuery({
    queryKey: ['allAdmins'],
    queryFn: authService.getAllAdmins,
    enabled: showViewAdmins && hasPermission(permissions, 'super_admins', 'view'),
  });

  const { data: billingResponse, isLoading: billingLoading } =
    useQuery<BillingSettings>({
      queryKey: ['billingSettings'],
      queryFn: billingService.getBillingSettings,
      enabled: isInitialized && isAuthenticated,
      retry: 1,
    });

  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setShowEditProfile(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: authService.createAdmin,
    onSuccess: () => {
      toast.success('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['allAdmins'] });
      setShowCreateAdmin(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    },
  });

  const updateBillingMutation = useMutation({
    mutationFn: billingService.updateBillingSettings,
    onSuccess: () => {
      toast.success('Billing Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['billingSettings'] });
      setShowBillingSettings(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update billing settings');
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.email || !profileData.name) {
      toast.error('Please fill all fields');
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleCreateAdmin = (data: any) => {
    createAdminMutation.mutate(data);
  };

  if (!isInitialized || !profile) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      </DefaultLayout>
    );
  }

  const isViewAllowed = hasPermission(permissions, 'super_admins', 'view');
  const isCreateAllowed = hasPermission(permissions, 'super_admins', 'create');
  const roles = rolesResponse?.data?.roles || [];
  const admins = adminsResponse?.data?.superAdmins;
  const billingSettings = billingResponse;

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Settings
          </h2>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="py-4 px-4 sm:px-6 border-b border-stroke dark:border-strokedark">
              <h4 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                <SettingsIcon size={24} className="text-primary" />
                Admin Panel Settings
              </h4>
            </div>

            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-black dark:text-white mb-4">
                Admin Actions
              </h3>
              {rolesLoading ? (
                <Loader size="md" variant="modal" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <ActionCard
                    title="Profile"
                    description="Update your personal details."
                    icon={<User size={24} className="text-primary" />}
                    color="primary"
                    onClick={() => setShowEditProfile(true)}
                    buttonText="Edit Profile"
                  />
                  <ActionCard
                    title="Security"
                    description="Change your account password."
                    icon={<Lock size={24} className="text-warning" />}
                    color="warning"
                    onClick={() => setShowChangePassword(true)}
                    buttonText="Change Password"
                  />
                  <ActionCard
                    title="New Admin"
                    description="Add a new administrator."
                    icon={<UserPlus size={24} className="text-success" />}
                    color="success"
                    onClick={() => setShowCreateAdmin(true)}
                    buttonText="Create Admin"
                    disabled={!isCreateAllowed}
                  />
                  <ActionCard
                    title="Manage Admins"
                    description="View and manage administrators."
                    icon={<Users size={24} className="text-meta-5" />}
                    color="danger"
                    onClick={() => setShowViewAdmins(true)}
                    buttonText="View/Manage"
                    disabled={!isViewAllowed}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="py-4 px-4 sm:px-6 border-b border-stroke dark:border-strokedark">
              <h4 className="text-lg font-semibold text-black dark:text-white">
                Your Account Information
              </h4>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard title="Name" value={profile?.name} />
                <InfoCard title="Email" value={profile?.email} />
                <InfoCard title="Created At" value={profile?.created_at} isDate />
                <InfoCard title="Last Updated" value={profile?.updated_at} isDate />
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="py-4 px-4 sm:px-6 border-b border-stroke dark:border-strokedark">
              <h4 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <DollarSign size={20} className="text-success" />
                Billing & Invoice Settings
              </h4>
            </div>
            <div className="p-4 sm:p-6">
              {billingLoading ? (
                <Loader size="md" variant="modal" />
              ) : !billingSettings ? (
                <div className="text-center py-8 text-danger">
                  <p className="text-sm font-medium">Failed to load billing settings.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <InfoCard title="Company Name" value={billingSettings.company_name} />
                    <InfoCard title="Email" value={billingSettings.email} />
                    <InfoCard title="Phone" value={billingSettings.phone} />
                    <InfoCard title="Currency" value={billingSettings.currency} />
                    <InfoCard
                      title="Tax Rate"
                      value={`${(billingSettings.tax_rate * 100).toFixed(2)}%`}
                    />
                    <InfoCard
                      title="Bank Name"
                      value={billingSettings.bank_details?.bank_name || 'N/A'}
                    />
                    <InfoCard
                      title="QR Code"
                      value={billingSettings.qr_code_image_url ? 'Available' : 'N/A'}
                    />
                    <InfoCard title="Last Updated" value={billingSettings.updated_at} isDate />
                  </div>
                  <div className="border-t border-stroke dark:border-strokedark pt-4 flex justify-end">
                    <button
                      onClick={() => setShowBillingSettings(true)}
                      className="rounded bg-success py-2 px-6 text-white hover:bg-success/90 transition-colors text-sm font-medium"
                    >
                      Edit Billing Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileData={profileData}
        setProfileData={setProfileData}
        onSubmit={handleUpdateProfile}
        isLoading={updateProfileMutation.isPending}
      />

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
        isLoading={changePasswordMutation.isPending}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
      />

      <CreateAdminModal
        isOpen={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        roles={roles}
        permissions={permissions}
        rolesLoading={rolesLoading}
        onSubmit={handleCreateAdmin}
        isLoading={createAdminMutation.isPending}
      />

      <ViewAdminsModal
        isOpen={showViewAdmins}
        onClose={() => setShowViewAdmins(false)}
        admins={admins}
        profile={profile}
        roles={roles}
        permissions={permissions}
        isLoading={adminsLoading}
      />

      {billingSettings && showBillingSettings && (
        <BillingSettingsModal
          settings={billingSettings}
          mutation={updateBillingMutation}
          onClose={() => setShowBillingSettings(false)}
        />
      )}
    </DefaultLayout>
  );
}

function InfoCard({
  title,
  value,
  isDate = false,
}: {
  title: string;
  value?: string;
  isDate?: boolean;
}) {
  let displayValue = value?.toString() || 'N/A';
  if (isDate && value) {
    displayValue = new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return (
    <div className="p-3 rounded bg-gray-2 dark:bg-meta-4/50 border border-stroke dark:border-strokedark/50">
      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 block truncate">
        {title}
      </Label>
      <Value className="text-sm mt-0.5 break-words font-semibold">{displayValue}</Value>
    </div>
  );
}