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
    const rootPath = `/companies/${companyId}`;

    // FIX 1: Correctly handle the Overview root path.
    if (href === rootPath) {
      // The Overview link is ONLY active if the pathname is exactly the root path.
      return pathname === href;
    }

    // For all sub-pages, check if the pathname starts with the item's href.
    // This ensures /invoices is active on /invoices/create, but is not relevant for the root.
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex lg:w-64 flex-shrink-0 flex-col rounded-lg shadow-default border border-stroke dark:border-strokedark bg-white dark:bg-boxdark overflow-hidden">

      {/* Sidebar Header */}
      <div className="bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark p-4 z-10">
        {/* Compact Styling: text-xs, tracking-tight */}
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">
          Navigation
        </p>
        {/* Compact Styling: text-sm */}
        <h3 className="text-sm font-semibold text-black dark:text-white mt-1">
          {company?.company_name || 'Company'}
        </h3>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  // FIX 2 & 3: Compact Styling (py-2 px-3, gap-2, text-xs) and smoother transition
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-in-out group ${
                    active
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
                  }`}
                >
                  <Icon size={16} /> {/* Compact Icon Size */}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer - Company Status */}
      <div className="border-t border-stroke dark:border-strokedark p-4 bg-white dark:bg-boxdark z-10">
        <div className="bg-gray-50 dark:bg-meta-4 rounded-lg p-3">
          {/* Compact Styling: text-xs */}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Company Status
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                company?.is_active ? 'bg-success' : 'bg-danger'
              }`}
            ></span>
            {/* Compact Styling: text-xs */}
            <span
              className={`font-semibold text-xs ${
                company?.is_active ? 'text-success' : 'text-danger'
              }`}
            >
              {company?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {company?.subscription_end_date && (
            <div className="mt-3 pt-3 border-t border-stroke dark:border-strokedark">
              {/* Compact Styling: text-xs */}
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Subscription
              </p>
              {/* Compact Styling: text-xxs or text-xs (using text-xs for readability here) */}
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