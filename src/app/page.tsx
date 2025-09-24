'use client';

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import CardDataStats from '@/components/CardDataStats';
import { Building, Users, UserCheck, UserX } from 'lucide-react';

export default function Home() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: companyService.getDashboard,
    select: (data) => data.data.stats,
  });

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error loading dashboard</h2>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const stats = dashboardData || {
    total_companies: 0,
    active_companies: 0,
    inactive_companies: 0,
    new_companies_this_month: 0,
  };

  return (
    <DefaultLayout>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats
          title="Total Companies"
          total={stats.total_companies.toString()}
          rate="0%"
          levelUp
        >
          <Building className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>

        <CardDataStats
          title="Active Companies"
          total={stats.active_companies.toString()}
          rate="0%"
          levelUp
        >
          <UserCheck className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>

        <CardDataStats
          title="Inactive Companies"
          total={stats.inactive_companies.toString()}
          rate="0%"
          levelDown
        >
          <UserX className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>

        <CardDataStats
          title="New This Month"
          total={stats.new_companies_this_month.toString()}
          rate="0%"
          levelUp
        >
          <Users className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
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
      </div>
    </DefaultLayout>
  );
}