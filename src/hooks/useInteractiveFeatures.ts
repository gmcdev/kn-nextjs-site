'use client';

import { usePathname } from 'next/navigation';
import type { RefObject } from 'react';
import { useEffect } from 'react';

import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';

import useTagTracking from './useTagTracking';

const useInteractiveFeatures = (pageRef: RefObject<HTMLDivElement | null>, store: Store) => {
  const pathname = usePathname();
  const resetScrollActivated = useNavigationStore((state) => state.resetScrollActivated);

  useEffect(() => {
    resetScrollActivated();
  }, [pathname, resetScrollActivated]);

  useTagTracking(pageRef, store);
};

export default useInteractiveFeatures;
