'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Activity,
  CreditCard,
  Settings,
} from 'lucide-react';

interface CompanySidebarProps {
  companyId: number;
  company: any;
}

export default function CompanySidebar({ companyId, company }: CompanySidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      label: 'Overview',
      icon: LayoutDashboard,
      href: `/companies/${companyId}`,
    },
    {
      label: 'Details',
      icon: FileText,
      href: `/companies/${companyId}/details`,
    },
    {
      label: 'Invoices',
      icon: CreditCard,
      href: `/companies/${companyId}/invoices`,
    },
    {
      label: 'Activity Logs',
      icon: Activity,
      href: `/companies/${companyId}/logs`,
    },
    {
      label: 'Subscription',
      icon: Settings,
      href: `/companies/${companyId}/subscriptions`,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="hidden lg:flex lg:w-64 flex-shrink-0 flex-col rounded-lg shadow-default border border-stroke dark:border-strokedark bg-white dark:bg-boxdark overflow-hidden">
      {/* Sidebar Header - Removed sticky top-0, border-b remains for separation */}
      <div className="bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark p-4 md:p-6 z-10">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Navigation
        </p>
        <h3 className="text-sm font-semibold text-black dark:text-white mt-2">
          {company?.company_name || 'Company'}
        </h3>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 md:px-6">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    active
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer - Company Status - Removed sticky bottom-0 */}
      <div className="border-t border-stroke dark:border-strokedark p-4 md:p-6 bg-white dark:bg-boxdark z-10">
        <div className="bg-gray-50 dark:bg-meta-4 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Company Status
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                company?.is_active ? 'bg-success' : 'bg-danger'
              }`}
            ></span>
            <span
              className={`font-semibold text-sm ${
                company?.is_active ? 'text-success' : 'text-danger'
              }`}
            >
              {company?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {company?.subscription_end_date && (
            <div className="mt-3 pt-3 border-t border-stroke dark:border-strokedark">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Subscription
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(company.subscription_end_date) < new Date() ? (
                  <span className="text-danger font-semibold">Expired</span>
                ) : (
                  <span className="text-success font-semibold">
                    Active ({Math.ceil(
                      (new Date(company.subscription_end_date).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days left)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}