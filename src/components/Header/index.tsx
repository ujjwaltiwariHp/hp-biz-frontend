'use client';

import Link from 'next/link';
import { Menu, Bell } from 'lucide-react';
import DropdownUser from './DropdownUser';
import DarkModeSwitcher from './DarkModeSwitcher';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/notification.service';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const { data: notificationStats } = useQuery({
    queryKey: ['superAdminNotificationsStats'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60000,
  });

  const unreadCount = notificationStats?.unread_count || 0;

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

        <div className="hidden sm:block">
          <h1 className="text-title-md2 font-semibold text-black dark:text-white">
            Super Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <DarkModeSwitcher />

            <li>
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
              >
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 z-10 inline-flex items-center justify-center rounded-full bg-meta-1 p-1 text-xs font-medium text-white ring-2 ring-white dark:ring-boxdark">
                    {unreadCount}
                  </span>
                )}
                <Bell className="w-5 h-5" />
              </Link>
            </li>
          </ul>
          <DropdownUser />
        </div>
      </div>
    </header>
  );
};

export default Header;