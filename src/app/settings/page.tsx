'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Settings */}
            <div className="rounded-lg border border-stroke p-6 dark:border-strokedark">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Profile Settings
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manage your account information and preferences.
              </p>
              <button className="w-full rounded bg-primary py-2 px-4 text-white hover:bg-primary/90 transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Notifications */}
            <div className="rounded-lg border border-stroke p-6 dark:border-strokedark">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                  <Bell className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Notifications
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure your notification preferences.
              </p>
              <button className="w-full rounded bg-warning py-2 px-4 text-white hover:bg-warning/90 transition-colors">
                Configure
              </button>
            </div>

            {/* Security */}
            <div className="rounded-lg border border-stroke p-6 dark:border-strokedark">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Security
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manage your security settings and password.
              </p>
              <button className="w-full rounded bg-success py-2 px-4 text-white hover:bg-success/90 transition-colors">
                Security Settings
              </button>
            </div>
          </div>

          {/* Additional Settings Section */}
          <div className="mt-8 rounded-lg border border-stroke p-6 dark:border-strokedark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              System Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded bg-gray-2 dark:bg-gray-dark">
                <span className="text-sm font-medium">Email Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded bg-gray-2 dark:bg-gray-dark">
                <span className="text-sm font-medium">Push Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}