'use client';

import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';

export default function PrimaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
