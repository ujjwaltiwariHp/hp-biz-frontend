'use client';

import React, { useState, ReactNode } from 'react';

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
