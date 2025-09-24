'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import CardDataStats from '@/components/CardDataStats';
import { Building, Users, UserCheck, UserX, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  // Dummy data for the dashboard
  const stats = {
    total_companies: 24,
    active_companies: 18,
    inactive_companies: 6,
    new_companies_this_month: 3,
    total_revenue: 125000,
    monthly_growth: 12.5
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Dashboard
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats
            title="Total Companies"
            total={stats.total_companies.toString()}
            rate="+2.5%"
            levelUp
          >
            <Building className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="Active Companies"
            total={stats.active_companies.toString()}
            rate="+1.2%"
            levelUp
          >
            <UserCheck className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="Inactive Companies"
            total={stats.inactive_companies.toString()}
            rate="-0.5%"
            levelDown
          >
            <UserX className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>

          <CardDataStats
            title="New This Month"
            total={stats.new_companies_this_month.toString()}
            rate="+3.1%"
            levelUp
          >
            <Users className="fill-primary dark:fill-white" size={22} />
          </CardDataStats>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <div className="col-span-12 xl:col-span-8">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Company Overview
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-stroke dark:border-strokedark rounded">
                  <h5 className="text-2xl font-bold text-primary">{stats.total_companies}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Companies</p>
                </div>

                <div className="text-center p-4 border border-stroke dark:border-strokedark rounded">
                  <h5 className="text-2xl font-bold text-green-600">{stats.active_companies}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Companies</p>
                </div>

                <div className="text-center p-4 border border-stroke dark:border-strokedark rounded">
                  <h5 className="text-2xl font-bold text-red-600">{stats.inactive_companies}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inactive Companies</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Revenue Overview
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-green-600" size={20} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                  </div>
                  <span className="text-lg font-semibold text-black dark:text-white">
                    ${stats.total_revenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={20} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Growth</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">
                    +{stats.monthly_growth}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <div className="col-span-12">
            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
              <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                Recent Activity
              </h4>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 border border-stroke dark:border-strokedark rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-black dark:text-white">New company "TechCorp" registered</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 border border-stroke dark:border-strokedark rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-black dark:text-white">Company "StartupXYZ" activated</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 border border-stroke dark:border-strokedark rounded">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-black dark:text-white">Subscription updated for "GlobalTech"</p>
                    <p className="text-xs text-gray-500">6 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}