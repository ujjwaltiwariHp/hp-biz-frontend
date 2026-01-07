'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, X, LogOut } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { getMenuItems, MenuItem } from './menuItems';
import SidebarItem from './SidebarItem';
import { Typography } from '@/components/common/Typography';
import { useHydrated } from '@/hooks/useHydrated';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const checkPermission = (permissions: Record<string, string[]>, resource?: string): boolean => {
  if (!resource) return true;
  if (permissions.all?.includes('crud')) return true;
  const actions = permissions[resource];
  return !!(actions && (actions.includes('view') || actions.includes('crud')));
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { isInitialized, isAuthenticated, permissions } = useAuth();
  const isHydrated = useHydrated();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    const match = pathname.match(/^\/companies\/(\d+)/);
    setCompanyId(match ? match[1] : null);
  }, [pathname]);

  useEffect(() => {
    if (openMenus.length === 0) {
      if (pathname.includes('/companies')) setOpenMenus(['/companies']);
      if (pathname.includes('/subscriptions')) setOpenMenus(['/subscriptions']);
    }
  }, [pathname]);

  const handleToggle = (route: string) => {
    setOpenMenus((prev) => (prev.includes(route) ? [] : [route]));
  };

  if (!isHydrated) {
    return (
      <aside
        className={`absolute left-0 top-0 z-99999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-[#1c2434] duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Building size={24} />
            </div>
            <Typography as="span" variant="page-title" className="!text-white tracking-wider text-xl font-bold">
              HP-BIZ
            </Typography>
          </div>
        </div>
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear flex-1 no-scrollbar">
          <nav className="mt-2 py-2 px-4 lg:px-6">
            <ul className="mb-6 flex flex-col gap-1.5">
              {/* Placeholder items during hydration */}
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    );
  }

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const menuItems: MenuItem[] = getMenuItems(companyId);
  const filteredItems = menuItems.filter((item: MenuItem) =>
    checkPermission(permissions, item.requiredResource)
  );

  return (
    <aside
      className={`absolute left-0 top-0 z-99999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-[#1c2434] duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
             <Building size={24} />
          </div>
          <Typography as="span" variant="page-title" className="!text-white tracking-wider text-xl font-bold">
            HP-BIZ
          </Typography>
        </Link>

        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-white/70 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear flex-1 no-scrollbar">
        <nav className="mt-2 py-2 px-4 lg:px-6">
          <ul className="mb-6 flex flex-col gap-1.5">
            {filteredItems.map((item: MenuItem, index: number) => (
              <SidebarItem
                key={index}
                item={item}
                isOpen={openMenus.includes(item.route)}
                onToggle={handleToggle}
              />
            ))}
          </ul>
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => authService.logout()}
          className="flex w-full items-center gap-3 rounded-lg py-2.5 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;