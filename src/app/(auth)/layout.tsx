'use client';

import React from 'react';
import AuthLayout from '@/components/Layouts/AuthLayout';

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
