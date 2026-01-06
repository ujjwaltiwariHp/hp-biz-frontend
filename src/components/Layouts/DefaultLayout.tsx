'use client';

import React, { useState, Suspense } from 'react';

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

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark min-h-screen">
      {/* Background components with hydration guards to prevent SSR/CSR mismatch */}
      <AnimatedBackground />
      <GlassmorphicShapes />

      <div className="flex h-screen overflow-hidden">
        <Suspense fallback={
          <aside className="absolute left-0 top-0 z-99999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-[#1c2434] duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0">
            <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-white/10">
              <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          </aside>
        }>
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </Suspense>

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Suspense fallback={
            <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
              <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </header>
          }>
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </Suspense>

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
