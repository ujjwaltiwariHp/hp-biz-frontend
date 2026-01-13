'use client';

import React, { useState, Suspense } from 'react';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loader from '../common/Loader';

import Sidebar from '../Sidebar/index';
import Header from '../Header/index';
import AnimatedBackground from '../Backgrounds/AnimatedBackground';
import GlassmorphicShapes from '../Backgrounds/GlassmorphicShapes';

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isInitialized } = useAuth();
  const pathname = usePathname();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated && !pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark min-h-screen">

      <AnimatedBackground />
      <GlassmorphicShapes />

      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-4 relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
