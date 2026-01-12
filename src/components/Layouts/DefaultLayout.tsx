'use client';

import React, { useState, Suspense } from 'react';

import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('../Sidebar/index'), {
  ssr: false,
  loading: () => (
    <aside className="absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0">
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <div className="h-10 w-32 bg-gray-800/50 rounded animate-pulse" />
      </div>
    </aside>
  )
});

const Header = dynamic(() => import('../Header/index'), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse" />
      </div>
    </header>
  )
});
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
