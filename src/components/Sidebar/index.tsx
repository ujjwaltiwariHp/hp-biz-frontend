'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  CreditCard,
  ChevronLeft,
  LogOut,
  Activity,
  Users,
  LayoutDashboard,
  ClipboardList,
  User as ProfileIcon,
  FileText,
  Package,
  LucideIcon,
  Plus, // Imported Plus icon
  List, // Imported List icon
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Typography } from '@/components/common/Typography';
import SidebarDropdown from './SidebarDropdown';

interface MenuItem {
    label: string;
    route: string;
    icon: LucideIcon;
    requiredResource: string;
}

const getCompanyIdFromPath = (path: string): string | null => {
  const match = path.match(/^\/companies\/(\d+)/);
  return match ? match[1] : null;
};

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
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    setCompanyId(getCompanyIdFromPath(pathname));
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

  const filteredMenuItems = menuItems.filter(item =>
      checkPermission(permissions, item.requiredResource)
  );

  // 1. Companies Sub-menu Items
  const companySubMenuItems = [
    {
        label: 'Details',
        route: companyId ? `/companies/${companyId}` : '/companies',
        icon: ProfileIcon,
        isActive: companyId ? (pathname === `/companies/${companyId}` || pathname === `/companies/${companyId}/details`) : false,
    },
    {
        label: 'Subscriptions',
        route: companyId ? `/companies/${companyId}/subscriptions` : '/companies',
        icon: Package,
        isActive: companyId ? pathname.startsWith(`/companies/${companyId}/subscriptions`) : false,
    },
    {
        label: 'Invoices',
        route: companyId ? `/companies/${companyId}/invoices` : '/companies',
        icon: FileText,
        isActive: companyId ? pathname.startsWith(`/companies/${companyId}/invoices`) : false,
    },
    {
        label: 'Activity Logs',
        route: companyId ? `/companies/${companyId}/logs` : '/companies',
        icon: Activity,
        isActive: companyId ? pathname.startsWith(`/companies/${companyId}/logs`) : false,
    },
    // Added Create Company Item
    {
        label: 'Create Company',
        route: '/companies/create',
        icon: Plus,
        isActive: pathname === '/companies/create',
    },
  ];

  // 2. Subscriptions Sub-menu Items
  const subscriptionSubMenuItems = [
    {
        label: 'Package List',
        route: '/subscriptions',
        icon: List,
        isActive: pathname === '/subscriptions',
    },
    {
        label: 'Create Package',
        route: '/subscriptions/create',
        icon: Plus,
        isActive: pathname === '/subscriptions/create',
    }
  ];

  return (
    <aside
      className={`absolute left-0 top-0 z-9999 flex h-screen w-64 flex-col overflow-y-hidden bg-[#1c2434] duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-white group-hover:bg-sky-500 transition-all duration-300">
             <Building size={20} className="text-white transform group-hover:scale-110 transition-transform duration-300" />
          </div>
          <Typography
            as="span"
            variant="page-title"
            className="!text-white tracking-wider text-xl font-bold"
          >
            HP-BIZ
          </Typography>
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          className="lg:hidden text-white w-8 h-8 rounded-full flex items-center justify-center opacity-70
                     bg-white/10 hover:bg-white/20 transition-all duration-200"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-1">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          <ul className="mb-6 flex flex-col gap-2">
            {filteredMenuItems.map((item) => {

              // Render Companies as Dropdown
              if (item.route === '/companies') {
                return (
                  <SidebarDropdown
                    key={item.route}
                    icon={item.icon}
                    label={item.label}
                    items={companySubMenuItems}
                    defaultOpen={pathname.startsWith('/companies')}
                  />
                );
              }

              // Render Subscriptions as Dropdown (New)
              if (item.route === '/subscriptions') {
                return (
                  <SidebarDropdown
                    key={item.route}
                    icon={item.icon}
                    label={item.label}
                    items={subscriptionSubMenuItems}
                    defaultOpen={pathname.startsWith('/subscriptions')}
                  />
                );
              }

              const active = isActive(item.route);

              return (
                <li key={item.route}>
                  <Link
                    href={item.route}
                    className={`group relative flex items-center gap-3 rounded-lg py-2.5 px-4 font-medium duration-200 ease-in-out
                      ${active
                          ? 'bg-sky-500/20 text-white' // Active: Light Blue BG, White Text
                          : 'text-white hover:bg-white/5' // Inactive: White Text
                      }
                    `}
                  >
                    <item.icon
                        size={20}
                        className={`transition-colors duration-200 text-white`}
                    />
                    <span className="text-sm font-medium">{item.label}</span>

                    {/* Active Indicator Bar (Blue) */}
                    {active && (
                       <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-md bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          // Default: text-white. Hover: text-red-500 & bg-red-500/10
         className="flex w-full items-center gap-3 rounded-lg py-2.5 px-4 font-medium text-white duration-200 ease-in-out hover:bg-red-500/10 hover:text-red-500 group"
        >
          {/* Icon inherits color from parent (white -> red on hover) */}
          <LogOut size={20} className="transition-colors duration-200" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;