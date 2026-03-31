'use client';

import { usePathname } from 'next/navigation';
import type { RefObject } from 'react';
import { useEffect } from 'react';

import useTagTracking from '@/hooks/useTagTracking';
import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';

type InteractiveFeaturesProps = Readonly<{
  pageRef: RefObject<HTMLDivElement | null>;
  store: Store;
}>;

const InteractiveFeatures = ({ pageRef, store }: InteractiveFeaturesProps) => {
  const pathname = usePathname();
  const resetScrollActivated = useNavigationStore((state) => state.resetScrollActivated);

  useEffect(() => {
    resetScrollActivated();
  }, [pathname, resetScrollActivated]);

  useTagTracking(pageRef, store);
  return null;
};

export default InteractiveFeatures;
