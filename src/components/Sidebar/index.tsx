'use client';

import React, { useState } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
    label: string;
    route: string;
    icon: React.FC<any>;
    requiredResource: string;
    isDropdown?: boolean;
    subItems?: Omit<MenuItem, 'isDropdown' | 'subItems' | 'icon'>[];
}

// Helper to check user permissions
const checkPermission = (permissions: Record<string, string[]>, resource: string): boolean => {
    if (permissions?.all && permissions.all.includes('crud')) {
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
    isDropdown: true,
    subItems: [
      {
        label: 'Admin Roles',
        route: '/settings/admin-roles',
        requiredResource: 'super_admin_roles',
      },
      {
        label: 'Billing Settings',
        route: '/settings/billing',
        requiredResource: 'billing_settings',
      },
    ]
  },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { isInitialized, isAuthenticated, permissions } = useAuth();

  // State for managing dropdown open/close status
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Initialize dropdown state based on current path
  React.useEffect(() => {
    const activeDropdown = menuItems.find(item =>
      item.isDropdown && item.subItems?.some(sub => pathname.startsWith(sub.route))
    );
    if (activeDropdown) {
      setOpenDropdown(activeDropdown.route);
    }
  }, [pathname]);


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

  // List of standard items that pass permission check
  const standardMenuItems = menuItems.filter(item =>
      !item.isDropdown && checkPermission(permissions, item.requiredResource)
  );

  // Filter sub-items based on their permissions
  const filterSubItems = (subItems: MenuItem['subItems']): Omit<MenuItem, 'isDropdown' | 'subItems' | 'icon'>[] => {
      if (!subItems) return [];
      // NOTE: We cast the return type here to ensure array purity for the consuming map.
      return subItems.filter(sub => checkPermission(permissions, sub.requiredResource)) as Omit<MenuItem, 'isDropdown' | 'subItems' | 'icon'>[];
  };


  return (
    <aside
      className={`absolute left-0 top-0 z-9999 flex h-screen w-64 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header/Logo */}
      <div className="flex items-center justify-between gap-2 px-4 py-4 lg:py-5 border-b border-gray-800 dark:border-gray-700">
        <Link href="/dashboard" className="text-white text-lg font-bold tracking-wider">
          HP-BIZ
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          className="block lg:hidden text-white hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Navigation */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-1">
        <nav className="mt-4 py-3 px-3 lg:mt-7 lg:px-3">
          <ul className="mb-6 flex flex-col gap-1">
            {/* Render standard menu items */}
            {standardMenuItems.map((item) => (
              <li key={item.route}>
                <Link
                  href={item.route}
                  className={`group relative flex items-center gap-2.5 rounded-lg py-2.5 px-3 text-sm font-medium duration-300 ease-in-out transition-colors
                    ${isActive(item.route)
                        ? 'bg-primary text-white dark:bg-primary shadow-md'
                        : 'text-bodydark1 hover:bg-gray-800 dark:hover:bg-meta-4'
                    }
                  `}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              </li>
            ))}


            {/* Render Dropdown Items */}
            {menuItems.map((item) => {
              if (!item.isDropdown) return null;

              // Ensure item.subItems is treated as an array of objects for mapping
              const subItems = filterSubItems(item.subItems);

              const shouldRenderDropdown = subItems.length > 0;

              if (!shouldRenderDropdown) return null;

              const isOpen = openDropdown === item.route;

              const activeDropdownStyle = subItems.some(sub => isActive(sub.route))
                ? 'bg-primary text-white dark:bg-meta-4'
                : 'text-bodydark1';

              return (
                <li key={item.route}>
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : item.route)}
                    className={`group relative flex w-full items-center justify-between rounded-lg py-2.5 px-3 text-sm font-medium duration-300 ease-in-out transition-all
                      ${activeDropdownStyle}
                      hover:bg-gray-800 hover:text-white dark:hover:bg-meta-4
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                       <item.icon size={16} />
                       {item.label}
                    </span>
                    <ChevronDown size={14} className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    style={{ maxHeight: isOpen ? `${subItems.length * 40}px` : '0px' }}
                    className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  >
                    <ul className="mt-2 pl-6 flex flex-col gap-1">
                      {subItems.map(sub => {
                        // The sub-items are guaranteed to be valid objects thanks to filterSubItems
                        return (
                          <li key={sub.route}>
                            <Link
                              href={sub.route}
                              className={`group relative flex items-center gap-2.5 rounded py-2 px-3 text-xs font-medium duration-300 ease-in-out transition-colors
                                ${isActive(sub.route)
                                    ? 'bg-primary text-white dark:bg-primary shadow-sm'
                                    : 'text-bodydark1 hover:bg-gray-800 dark:hover:bg-meta-4'
                                }
                              `}
                            >
                              • {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
          {standardMenuItems.length === 0 && menuItems.filter(i => i.isDropdown && filterSubItems(i.subItems).length > 0).length === 0 && (
              <p className="text-xs text-gray-500 p-4 text-center">No permissions granted.</p>
          )}
        </nav>
      </div>

      {/* Logout/Profile at the Bottom */}
      <div className="p-3 border-t border-gray-800 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg py-2.5 px-3 text-sm font-bold text-danger transition-colors hover:bg-danger/10 dark:hover:bg-danger/20"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;