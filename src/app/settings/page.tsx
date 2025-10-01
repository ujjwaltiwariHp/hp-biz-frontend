'use client';

import { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Settings as SettingsIcon, User, Lock, Users, Mail, Eye, EyeOff, X } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showAllAdmins, setShowAllAdmins] = useState(false);

  const [profileData, setProfileData] = useState({ email: '', name: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [createAdminData, setCreateAdminData] = useState({ email: '', password: '', name: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  });

  const { data: adminsData, isLoading: adminsLoading } = useQuery({
    queryKey: ['allAdmins'],
    queryFn: authService.getAllAdmins,
    enabled: showAllAdmins,
  });

  useEffect(() => {
    if (profile?.success) {
      setProfileData({
        email: profile.superAdmin.email || '',
        name: profile.superAdmin.name || '',
      });
    }
  }, [profile]);

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
      setCreateAdminData({ email: '', password: '', name: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create admin');
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
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAdminData.email || !createAdminData.password || !createAdminData.name) {
      toast.error('Please fill all fields');
      return;
    }
    if (createAdminData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    createAdminMutation.mutate(createAdminData);
  };

  return (
    <DefaultLayout>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
            <SettingsIcon size={24} />
            Settings
          </h4>
        </div>

        <div className="p-4 md:p-6 xl:p-7.5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-lg border border-stroke p-6 dark:border-strokedark hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Profile Settings
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Update information and contact details.
              </p>
              <button
                onClick={() => setShowEditProfile(true)}
                className="w-full rounded bg-primary py-2 px-4 text-white hover:bg-primary/90 transition-colors"
              >
                Edit Profile
              </button>
            </div>

            <div className="rounded-lg border border-stroke p-6 dark:border-strokedark hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                  <Lock className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Security
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Change password for better security.
              </p>
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full rounded bg-warning py-2 px-4 text-white hover:bg-warning/90 transition-colors"
              >
                Change Password
              </button>
            </div>

            <div className="rounded-lg border border-stroke p-6 dark:border-strokedark hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Create Admin
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add new administrators to the system.
              </p>
              <button
                onClick={() => setShowCreateAdmin(true)}
                className="w-full rounded bg-success py-2 px-4 text-white hover:bg-success/90 transition-colors"
              >
                Create Admin
              </button>
            </div>

            <div className="rounded-lg border border-stroke p-6 dark:border-strokedark hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-meta-5/10">
                  <Users className="h-6 w-6 text-meta-5" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  View Admins
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View all system administrators.
              </p>
              <button
                onClick={() => setShowAllAdmins(true)}
                className="w-full rounded bg-meta-5 py-2 px-4 text-white hover:bg-meta-5/90 transition-colors"
              >
                View All Admins
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-stroke p-6 dark:border-strokedark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Account Information
            </h3>
            {profileLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-gray-2 dark:bg-meta-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                  <p className="text-base font-semibold text-black dark:text-white mt-1">
                    {profile?.superAdmin?.name || 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded bg-gray-2 dark:bg-meta-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-base font-semibold text-black dark:text-white mt-1">
                    {profile?.superAdmin?.email || 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded bg-gray-2 dark:bg-meta-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
                  <p className="text-base font-semibold text-black dark:text-white mt-1">
                    Administrator
                  </p>
                </div>
                <div className="p-4 rounded bg-gray-2 dark:bg-meta-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</label>
                  <p className="text-base font-semibold text-black dark:text-white mt-1">
                    {profile?.superAdmin?.created_at ? new Date(profile.superAdmin.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditProfile && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-black dark:text-white">Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-gray-500 hover:text-black dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label className="mb-2.5 block text-black dark:text-white">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                />
              </div>
              <div className="mb-6">
                <label className="mb-2.5 block text-black dark:text-white">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full rounded bg-primary py-3 px-6 text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-black dark:text-white">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-500 hover:text-black dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="mb-2.5 block text-black dark:text-white">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-4 top-4"
                  >
                    {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-2.5 block text-black dark:text-white">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-4 top-4"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <label className="mb-2.5 block text-black dark:text-white">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-4 top-4"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full rounded bg-warning py-3 px-6 text-white hover:bg-warning/90 disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCreateAdmin && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-black dark:text-white">Create Admin</h3>
              <button onClick={() => setShowCreateAdmin(false)} className="text-gray-500 hover:text-black dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div className="mb-4">
                <label className="mb-2.5 block text-black dark:text-white">Name</label>
                <input
                  type="text"
                  value={createAdminData.name}
                  onChange={(e) => setCreateAdminData({ ...createAdminData, name: e.target.value })}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2.5 block text-black dark:text-white">Email</label>
                <input
                  type="email"
                  value={createAdminData.email}
                  onChange={(e) => setCreateAdminData({ ...createAdminData, email: e.target.value })}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                />
              </div>
              <div className="mb-6">
                <label className="mb-2.5 block text-black dark:text-white">Password</label>
                <input
                  type="password"
                  value={createAdminData.password}
                  onChange={(e) => setCreateAdminData({ ...createAdminData, password: e.target.value })}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={createAdminMutation.isPending}
                className="w-full rounded bg-success py-3 px-6 text-white hover:bg-success/90 disabled:opacity-50"
              >
                {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAllAdmins && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-boxdark max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-black dark:text-white">All Administrators</h3>
              <button onClick={() => setShowAllAdmins(false)} className="text-gray-500 hover:text-black dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            {adminsLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Name</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Email</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminsData?.superAdmins?.map((admin: any) => (
                      <tr key={admin.id} className="border-b border-stroke dark:border-strokedark">
                        <td className="py-4 px-4 text-black dark:text-white">{admin.name}</td>
                        <td className="py-4 px-4 text-black dark:text-white">{admin.email}</td>
                        <td className="py-4 px-4 text-black dark:text-white">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}