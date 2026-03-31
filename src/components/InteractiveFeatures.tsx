'use client';

import type { RefObject } from 'react';

import useDeepLink from '@/hooks/useDeepLink';
import useUrlOnScroll from '@/hooks/useUrlOnScroll';
import type { SiteData, Store } from '@/lib/types';

type InteractiveFeaturesProps = Readonly<{
  pageRef: RefObject<HTMLDivElement | null>;
  scope: SiteData;
  store: Store;
}>;

const InteractiveFeatures = ({ pageRef, scope, store }: InteractiveFeaturesProps) => {
  useUrlOnScroll(store, pageRef);
  useDeepLink({ pageRef, scope, store });
  return null;
};

export default InteractiveFeatures;
