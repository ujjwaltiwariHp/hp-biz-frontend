'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/common/Loader';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after login
    router.push('/dashboard');
  }, [router]);

  return null;
}