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
  ClipboardList
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
    label: string;
    route: string;
    icon: React.FC<any>;
    // Required backend permission resource to view this item
    requiredResource: string;
}

// Helper function to check permissions (logic is contained in the hook, but replicated here for safety)
const checkPermission = (permissions: Record<string, string[]>, resource: string): boolean => {
    // If user has "all: crud" access, allow everything
    if (permissions.all && permissions.all.includes('crud')) {
        return true;
    }
    // Check if the resource is defined and includes 'view' or 'crud'
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
    route: '/invoices', // Assuming you will implement this route next
    icon: ClipboardList,
    requiredResource: 'invoices', // Permission to view invoices
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
    requiredResource: 'super_admins', // Permission to manage other admins
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

  // Do not render anything until authentication status and permissions are initialized
  if (!isInitialized || !isAuthenticated) {
      return null;
  }

  // Filter menu items based on the user's fetched permissions
  const filteredMenuItems = menuItems.filter(item =>
      checkPermission(permissions, item.requiredResource)
  );


  return (
    <aside
      // Changed width to w-64 (from w-72.5) for a slightly smaller, more professional look
      className={`absolute left-0 top-0 z-9999 flex h-screen w-64 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header/Logo */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 border-b border-gray-800 dark:border-gray-700">
        <Link href="/dashboard" className="text-white text-xl font-bold tracking-wider">
          HP-BIZ SA
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          className="block lg:hidden text-white hover:text-primary transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-4 flex-1">
          <h3 className="mb-4 ml-4 text-sm font-semibold text-gray-500 uppercase">MENU</h3>
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
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {filteredMenuItems.length === 0 && (
              <p className="text-sm text-gray-500 p-4 text-center">No permissions granted.</p>
          )}
        </nav>

        {/* Logout Button at the Bottom */}
        <div className="mt-auto p-4 border-t border-gray-800 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg py-3 px-4 font-medium text-danger transition-colors hover:bg-danger/10 dark:hover:bg-danger/20"
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