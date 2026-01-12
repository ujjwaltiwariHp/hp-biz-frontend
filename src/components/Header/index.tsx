'use client';

import Link from 'next/link';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import DropdownUser from './DropdownUser';
import DarkModeSwitcher from './DarkModeSwitcher';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/notification.service';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { companyService } from '@/services/company.service';
import { useSSE } from '@/hooks/useSSE';
import { useSSEContext } from '@/context/SSEContext';
import { useHydrated } from '@/hooks/useHydrated';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const { subscribe } = useSSEContext();
  const [isBlinking, setIsBlinking] = useState(false);
  const isHydrated = useHydrated();

  const { data: notificationStats, refetch: refetchStats } = useQuery({
    queryKey: ['notifications', 'unreadCount', true],
    queryFn: async () => {
      const result = await notificationService.getSuperAdminUnreadCount();
      return result;
    },
    select: (data) => {
      const responsePayload = data as any;
      const actualPayload = responsePayload?.data || responsePayload;
      const count = actualPayload?.stats?.unread_notifications || actualPayload?.unread_count || 0;
      return count;
    },
    refetchInterval: 300000,
  });

  useSSE('new_sa_notification', ['notifications', 'unreadCount', true]);

  useEffect(() => {
    const unsubscribe = subscribe('new_sa_notification', () => {
      setIsBlinking(true);
    });
    return () => unsubscribe();
  }, [subscribe]);

  const unreadCount = notificationStats || 0;
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; href?: string }>>([]);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
  }, [unreadCount]);

  useEffect(() => {
    refetchStats();
  }, [refetchStats]);

  useEffect(() => {
    const companyIdMatch = pathname.match(/\/companies\/(\d+)/);
    const companyId = companyIdMatch ? parseInt(companyIdMatch[1]) : null;

    let newBreadcrumbs: Array<{ label: string; href?: string }> = [
      { label: 'Dashboard', href: '/dashboard' },
    ];

    if (pathname === '/dashboard') {
      newBreadcrumbs = [{ label: 'Dashboard' }];
    } else if (pathname === '/companies') {
      newBreadcrumbs.push({ label: 'Companies' });
    } else if (pathname.startsWith('/companies/create')) {
      newBreadcrumbs.push(
        { label: 'Companies', href: '/companies' },
        { label: 'Create Company' }
      );
    } else if (companyId && pathname.startsWith(`/companies/${companyId}`)) {
      newBreadcrumbs.push(
        { label: 'Companies', href: '/companies' },
        { label: companyName || `Company #${companyId}`, href: `/companies/${companyId}` }
      );

      if (pathname.includes('/details')) {
        newBreadcrumbs.push({ label: 'Details' });
      } else if (pathname.includes('/invoices')) {
        newBreadcrumbs.push({ label: 'Invoices' });
      } else if (pathname.includes('/logs')) {
        newBreadcrumbs.push({ label: 'Activity Logs' });
      } else if (pathname.includes('/subscriptions')) {
        newBreadcrumbs.push({ label: 'Subscriptions' });
      }
    } else if (pathname === '/subscriptions') {
      newBreadcrumbs.push({ label: 'Subscriptions' });
    } else if (pathname.startsWith('/subscriptions/')) {
      newBreadcrumbs.push(
        { label: 'Subscriptions', href: '/subscriptions' },
        { label: pathname.includes('/create') ? 'Create Package' : 'Edit Package' }
      );
    } else if (pathname === '/invoices') {
      newBreadcrumbs.push({ label: 'Invoices' });
    } else if (pathname === '/logs') {
      newBreadcrumbs.push({ label: 'Activity Logs' });
    } else if (pathname.startsWith('/logs/')) {
      newBreadcrumbs.push(
        { label: 'Activity Logs', href: '/logs' },
        { label: pathname.includes('/all') ? 'All Logs' : pathname.includes('/system') ? 'System Logs' : 'Company Logs' }
      );
    } else if (pathname === '/notifications') {
      newBreadcrumbs.push({ label: 'Notifications' });
    } else if (pathname === '/settings') {
      newBreadcrumbs.push({ label: 'Settings' });
    }

    setBreadcrumbs(newBreadcrumbs);
  }, [pathname, companyName]);

  useEffect(() => {
    const companyIdMatch = pathname.match(/\/companies\/(\d+)/);
    const companyId = companyIdMatch ? parseInt(companyIdMatch[1]) : null;

    if (companyId && pathname.startsWith(`/companies/${companyId}`) && !pathname.includes('/create')) {
      companyService
        .getCompany(companyId)
        .then((response) => {
          setCompanyName(response.data.company.company_name);
        })
        .catch((error) => {
          console.error('Failed to fetch company:', error);
        });
    }
  }, [pathname]);

  // Always render header structure to prevent layout shift
  // Content will be populated after hydration
  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <Menu />
          </button>

          <Link className="block flex-shrink-0 lg:hidden" href="/">
            <span className="text-xl font-bold">Admin</span>
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {isHydrated && breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight size={16} className="text-gray-400 dark:text-gray-600 mx-1" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-black dark:text-white">
                    {crumb.label}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {isHydrated ? <DarkModeSwitcher /> : <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />}

            <li>
              <Link
                href="/notifications"
                onClick={() => setIsBlinking(false)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
              >
                {isHydrated && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 z-10 inline-flex items-center justify-center rounded-full bg-meta-1 p-1 text-xs font-medium text-white ring-2 ring-white dark:ring-boxdark min-w-[20px] h-5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <Bell className={`w-5 h-5 ${isHydrated && isBlinking ? 'animate-bell text-primary' : ''}`} />
              </Link>
            </li>
          </ul>
          {isHydrated ? <DropdownUser /> : <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />}
        </div>
      </div>
    </header>
  );
};

export default Header;