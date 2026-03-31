'use client';

import { type RefObject, useEffect } from 'react';

import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';
import withBasePath from '@/utils/withBasePath';

const useUrlOnScroll = (store: Store, pageRef: RefObject<HTMLDivElement | null>) => {
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);
  const currentTagId = useNavigationStore((state) => state.currentTagId);
  const activateScroll = useNavigationStore((state) => state.activateScroll);
  const scrollActivated = useNavigationStore((state) => state.scrollActivated);

  // Activate scroll tracking on real user interaction (not layout-induced scroll)
  useEffect(() => {
    const element = pageRef.current;
    if (!element) {
      return;
    }

    const handleUserScroll = () => {
      activateScroll();
      element.removeEventListener('wheel', handleUserScroll);
      element.removeEventListener('touchstart', handleUserScroll);
      element.removeEventListener('keydown', handleKeyScroll);
    };

    const handleKeyScroll = (event: Event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'PageDown' || key === 'PageUp' || key === ' ') {
        handleUserScroll();
      }
    };

    element.addEventListener('wheel', handleUserScroll, { passive: true });
    element.addEventListener('touchstart', handleUserScroll, { passive: true });
    element.addEventListener('keydown', handleKeyScroll);
    return () => {
      element.removeEventListener('wheel', handleUserScroll);
      element.removeEventListener('touchstart', handleUserScroll);
      element.removeEventListener('keydown', handleKeyScroll);
    };
  }, [activateScroll, pageRef]);

  // Update URL to /{categorySlug}/{tagSlug} as tags scroll into view
  useEffect(() => {
    if (!scrollActivated || !currentCategoryId) {
      return;
    }

    const category = store.categoryMap[currentCategoryId];
    if (!category) {
      return;
    }

    const tag = currentTagId ? store.tagMap[currentTagId] : null;
    const path = tag
      ? `/${category.slug}/${tag.slug}`
      : `/${category.slug}`;

    const nextUrl = `${window.location.origin}${withBasePath(path)}`;
    window.history.replaceState({}, '', nextUrl);
  }, [currentCategoryId, currentTagId, scrollActivated, store]);
};

export default useUrlOnScroll;
