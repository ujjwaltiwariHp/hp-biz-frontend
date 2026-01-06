'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if component has hydrated on the client
 * Prevents SSR/CSR mismatches by returning false during SSR and initial render
 */
export function useHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
