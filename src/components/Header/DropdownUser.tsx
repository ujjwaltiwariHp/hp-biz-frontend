'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown, Mail, Calendar, Shield } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import ClickOutside from '../ClickOutside';

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    staleTime: 5 * 60 * 1000,
  });

  const profile = profileData?.superAdmin;

  const handleLogout = () => {
    authService.logout();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
      >
        <span className="hidden text-right lg:block">
          <span className="block text-sm font-medium text-black dark:text-white">
            {isLoading ? 'Loading...' : profile?.name || 'Super Admin'}
          </span>
          <span className="block text-xs text-gray-500">Administrator</span>
        </span>

        <span className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
          {isLoading ? '...' : profile?.name?.charAt(0).toUpperCase() || 'A'}
        </span>

        <ChevronDown
          className={`hidden fill-current sm:block transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
          width="12"
          height="8"
        />
      </button>

      <div
        className={`absolute right-0 mt-4 w-80 flex-col rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark ${
          dropdownOpen ? 'flex' : 'hidden'
        }`}
      >
        <div className="px-6 py-5 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {profile?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-black dark:text-white">
                {profile?.name || 'Super Admin'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3 border-b border-stroke dark:border-strokedark">
          <div className="flex items-start gap-3">
            <Mail size={18} className="text-gray-500 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-black dark:text-white break-all">
                {profile?.email || 'N/A'}
              </p>
            </div>
          </div>

<div className="flex items-start gap-3">
  <Calendar size={18} className="text-gray-500 dark:text-gray-400 mt-0.5" />
  <div className="flex-1">
    <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
    <p className="text-sm font-medium text-black dark:text-white">
      {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
    </p>
  </div>
</div>

          <div className="flex items-start gap-3">
            <Shield size={18} className="text-gray-500 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 py-1 px-2.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <Link
            href="/settings"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary"
          >
            <Settings size={20} />
            Account Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-danger text-left"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </div>
    </ClickOutside>
  );
};

export default DropdownUser;