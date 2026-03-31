'use client';

import { useEffect, useRef } from 'react';

import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';
import withBasePath from '@/utils/withBasePath';

const useUrlOnScroll = (store: Store) => {
  const currentPost = useNavigationStore((state) => state.currentPost);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip the first render to avoid overwriting the initial URL/deep-link
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    if (!currentPost) {
      return;
    }

    const leafCategoryId = currentPost.categoryIds.find(
      (categoryId) => store.categoryMap[categoryId]?.parentId,
    );
    const leafCategory = leafCategoryId ? store.categoryMap[leafCategoryId] : null;
    const fallbackCategory = store.categoryMap[currentPost.categoryIds[0]];

    const path = leafCategory
      ? `/${leafCategory.slug}/${currentPost.slug}`
      : `/${fallbackCategory?.slug}`;

    const nextUrl = `${window.location.origin}${withBasePath(path)}`;

    window.history.replaceState({}, '', nextUrl);
  }, [currentPost, store]);
};

export default useUrlOnScroll;
