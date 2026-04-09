'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';

import useTagTracking from './useTagTracking';

const useInteractiveFeatures = (store: Store) => {
  const pathname = usePathname();
  const resetScrollActivated = useNavigationStore((state) => state.resetScrollActivated);

  useEffect(() => {
    resetScrollActivated();
  }, [pathname, resetScrollActivated]);

  useTagTracking(store);
};

export default useInteractiveFeatures;
