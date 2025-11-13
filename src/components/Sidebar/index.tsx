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
  LogOut,
  Activity,
  Users,
  LayoutDashboard,
  ClipboardList,
  User as ProfileIcon,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Typography } from '@/components/common/Typography';

interface MenuItem {
    label: string;
    route: string;
    icon: React.FC<any>;
    requiredResource: string;
}

const checkPermission = (permissions: Record<string, string[]>, resource: string): boolean => {
    if (permissions.all && permissions.all.includes('crud')) {
        return true;
    }
    const allowedActions = permissions[resource];
    return allowedActions && (allowedActions.includes('view') || allowedActions.includes('crud'));
};

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: LayoutDashboard,
    requiredResource: 'dashboard',
  },
  {
    label: 'Companies',
    route: '/companies',
    icon: Building,
    requiredResource: 'companies',
  },
  {
    label: 'Subscriptions',
    route: '/subscriptions',
    icon: CreditCard,
    requiredResource: 'subscriptions',
  },
  {
    label: 'Invoices & Payments',
    route: '/invoices',
    icon: ClipboardList,
    requiredResource: 'invoices',
  },
  {
    label: 'Activity Logs',
    route: '/logs',
    icon: Activity,
    requiredResource: 'logging',
  },
  {
    label: 'Admin Management',
    route: '/settings',
    icon: Users,
    requiredResource: 'super_admins',
  },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { isInitialized, isAuthenticated, permissions } = useAuth();

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(route);
  };

  if (!isInitialized || !isAuthenticated) {
      return null;
  }

  const filteredMenuItems = menuItems.filter(item =>
      checkPermission(permissions, item.requiredResource)
  );


  return (
    <aside
      className={`absolute left-0 top-0 z-9999 flex h-screen w-64 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header/Logo */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 border-b border-gray-800 dark:border-gray-700">
        <Link href="/dashboard">
          <Typography
            as="span"
            variant="page-title"
            className="!text-white tracking-wider"
          >
            HP-BIZ
          </Typography>
        </Link>

        {/* Removed 'block' class to fix Tailwind conflict */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          className="lg:hidden text-white w-8 h-8 rounded-full flex items-center justify-center opacity-70
                     bg-gradient-to-r from-primary to-meta-4 hover:opacity-100 transition-all duration-200 shadow-lg"
        >
          <ChevronLeft size={16} className="text-white" />
        </button>
      </div>

      {/* Navigation */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-1">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-4">
          <ul className="mb-6 flex flex-col gap-1.5">
            {filteredMenuItems.map((item) => (
              <li key={item.route}>
                <Link
                  href={item.route}
                  className={`group relative flex items-center gap-2.5 rounded-lg py-3 px-4 font-medium duration-300 ease-in-out transition-colors
                    ${isActive(item.route)
                        ? 'bg-primary text-white dark:bg-primary dark:text-white shadow-md'
                        : 'text-bodydark1 hover:bg-gray-800 dark:hover:bg-meta-4'
                    }
                  `}
                >
                  <item.icon size={18} />
                  <Typography
                    as="span"
                    variant="body1"
                    className="text-inherit"
                  >
                    {item.label}
                  </Typography>
                </Link>
              </li>
            ))}
          </ul>
          {filteredMenuItems.length === 0 && (
              <Typography
                as="p"
                variant="body1"
                className="text-gray-500 dark:text-gray-400 p-4 text-center"
              >
                No permissions granted.
              </Typography>
          )}
        </nav>
      </div>

      {/* Logout at the Bottom */}
      <div className="p-4 border-t border-gray-800 dark:border-gray-700">
        <button
          onClick={handleLogout}
         className="mt-2 flex w-full items-center  gap-2.5 rounded-lg py-3 px-4 font-bold text-danger text-lg transition-colors hover:bg-danger/10 dark:hover:bg-danger/20"

        >
          <LogOut size={18} />
          <Typography
            as="span"
            variant="body"
            className="text-inherit text-base"
          >
            Logout
          </Typography>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;