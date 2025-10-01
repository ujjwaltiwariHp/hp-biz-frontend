'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Building,
  CreditCard,
  Settings,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { authService } from '@/services/auth.service';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const menuItems = [
  {
    label: 'Dashboard',
    route: '/',
    icon: Home,
  },
  {
    label: 'Companies',
    route: '/companies',
    icon: Building,
  },
  {
    label: 'Subscriptions',
    route: '/subscriptions',
    icon: CreditCard,
  },
  {
    label: 'Settings',
    route: '/settings',
    icon: Settings,
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <aside
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <Link href="/" className="text-white text-xl font-bold">
          Admin Panel
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          className="block lg:hidden text-white"
        >
          <ChevronLeft />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          <div>
            <ul className="mb-6 flex flex-col gap-1.5">
              {menuItems.map((item) => (
                <li key={item.route}>
                  <Link
                    href={item.route}
                    className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                      pathname === item.route && 'bg-graydark dark:bg-meta-4'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mt-auto p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;