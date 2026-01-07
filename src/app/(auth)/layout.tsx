'use client';

import React from 'react';

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}