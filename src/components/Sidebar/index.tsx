'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, ChevronLeft, LogOut } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { getMenuItems, MenuItem } from './menuItems'; // Import MenuItem type
import SidebarItem from './SidebarItem';
import { Typography } from '@/components/common/Typography';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

// Permission Helper
const checkPermission = (permissions: Record<string, string[]>, resource?: string): boolean => {
  if (!resource) return true;
  if (permissions.all?.includes('crud')) return true;
  const actions = permissions[resource];
  return !!(actions && (actions.includes('view') || actions.includes('crud')));
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { isInitialized, isAuthenticated, permissions } = useAuth();

  // State for Company ID and Open Menus
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // 1. Extract Company ID from URL
  useEffect(() => {
    const match = pathname.match(/^\/companies\/(\d+)/);
    setCompanyId(match ? match[1] : null);
  }, [pathname]);

  // 2. Auto-open menu based on current path (Initial Load)
  useEffect(() => {
    // Only if not already set (prevents overwriting user interactions)
    if (openMenus.length === 0) {
      if (pathname.includes('/companies')) setOpenMenus(['/companies']);
      if (pathname.includes('/subscriptions')) setOpenMenus(['/subscriptions']);
    }
  }, [pathname]);

  const handleToggle = (route: string) => {
    setOpenMenus((prev) =>
      prev.includes(route)
        ? prev.filter((item) => item !== route) // Close if open
        : [...prev, route] // Open if closed
    );
  };

  if (!isInitialized || !isAuthenticated) return null;

  // Generate and Filter Items
  const menuItems: MenuItem[] = getMenuItems(companyId);
  const filteredItems = menuItems.filter((item: MenuItem) =>
    checkPermission(permissions, item.requiredResource)
  );

  return (
    <aside
      className={`absolute left-0 top-0 z-50 flex h-screen w-72.5 flex-col overflow-y-hidden bg-[#1c2434] duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* --- Sidebar Header --- */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2 group">
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
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* --- Menu Items --- */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear flex-1 no-scrollbar">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
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

      {/* --- Footer --- */}
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