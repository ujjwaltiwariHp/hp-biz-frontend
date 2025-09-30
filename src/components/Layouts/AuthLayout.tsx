'use client';

import React, { ReactNode } from 'react';
import AnimatedBackground from '@/components/Backgrounds/AnimatedBackground';
import GlassmorphicShapes from '@/components/Backgrounds/GlassmorphicShapes';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark min-h-screen">

      <AnimatedBackground />
      <GlassmorphicShapes />

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
