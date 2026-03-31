'use client';

import { type RefObject, useEffect } from 'react';

import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';
import withBasePath from '@/utils/withBasePath';

const useUrlOnScroll = (store: Store, pageRef: RefObject<HTMLDivElement | null>) => {
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);
  const currentPost = useNavigationStore((state) => state.currentPost);
  const activateScroll = useNavigationStore((state) => state.activateScroll);
  const scrollActivated = useNavigationStore((state) => state.scrollActivated);

  // Activate scroll tracking when user actually scrolls
  useEffect(() => {
    const element = pageRef.current;
    if (!element) {
      return;
    }

    const handleScroll = () => {
      activateScroll();
      element.removeEventListener('scroll', handleScroll);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [activateScroll, pageRef]);

  // Update URL as category/tag/post changes after scroll
  useEffect(() => {
    if (!scrollActivated) {
      return;
    }

    // If we have a current post (list view, after scroll), use post-level URL
    if (currentPost) {
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
      return;
    }

    // Otherwise update to category-level URL
    if (currentCategoryId) {
      const category = store.categoryMap[currentCategoryId];
      if (category) {
        const nextUrl = `${window.location.origin}${withBasePath(`/${category.slug}`)}`;
        window.history.replaceState({}, '', nextUrl);
      }
    }
  }, [currentCategoryId, currentPost, scrollActivated, store]);
};

export default useUrlOnScroll;
