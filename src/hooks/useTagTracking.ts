'use client';

import { type RefObject, useCallback, useEffect, useRef } from 'react';

import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';
import { replaceUrl } from '@/utils/withBasePath';

const useTagTracking = (pageRef: RefObject<HTMLDivElement | null>, store: Store) => {
  const scrollActivated = useNavigationStore((state) => state.scrollActivated);
  const activateScroll = useNavigationStore((state) => state.activateScroll);
  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);
  const lastUrlUpdateRef = useRef<string | null>(null);

  // Reset the URL dedup guard when scroll tracking reactivates (e.g., after navigation)
  useEffect(() => {
    if (!scrollActivated) {
      lastUrlUpdateRef.current = null;
    }
  }, [scrollActivated]);

  // Activate scroll tracking on real user interaction (not layout-induced scroll)
  // Re-attach activation listeners whenever scrollActivated resets to false
  useEffect(() => {
    if (scrollActivated) {
      return;
    }

    const element = pageRef.current;
    if (!element) {
      return;
    }

    const handleUserScroll = () => {
      activateScroll();
    };

    const handleKeyScroll = (event: Event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'PageDown' || key === 'PageUp' || key === ' ') {
        activateScroll();
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
  }, [activateScroll, pageRef, scrollActivated]);

  // Find the topmost tag that hasn't scrolled past the container top
  const updateCurrentTag = useCallback(() => {
    const container = pageRef.current;
    if (!container) {
      return;
    }

    const tagElements = container.querySelectorAll<HTMLElement>('[data-tag-id]');
    const containerTop = container.getBoundingClientRect().top;

    let bestElement: HTMLElement | null = null;
    let bestDistance = Infinity;

    tagElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const relativeTop = rect.top - containerTop;

      if (relativeTop >= 0) {
        if (relativeTop < bestDistance) {
          bestDistance = relativeTop;
          bestElement = element;
        }
      } else if (rect.bottom - containerTop > 0) {
        const distance = -(relativeTop);
        if (bestDistance === Infinity || distance < bestDistance) {
          bestDistance = distance;
          bestElement = element;
        }
      }
    });

    if (bestElement !== null) {
      const tagId = (bestElement as HTMLElement).dataset.tagId;
      const categoryId = (bestElement as HTMLElement).dataset.categoryId;
      if (tagId) {
        setCurrentTagId(tagId);
      }
      if (categoryId) {
        setCurrentCategoryId(categoryId);

        const category = store.categoryMap[categoryId];
        const tag = tagId ? store.tagMap[tagId] : null;
        if (category) {
          const path = tag
            ? `/${category.slug}/${tag.slug}`
            : `/${category.slug}`;
          if (path !== lastUrlUpdateRef.current) {
            lastUrlUpdateRef.current = path;
            replaceUrl(path);
          }
        }
      }
    }
  }, [pageRef, setCurrentCategoryId, setCurrentTagId, store]);

  // Listen for scroll events after user interaction activates tracking.
  // Throttled via rAF to avoid expensive DOM queries on every scroll event.
  useEffect(() => {
    if (!scrollActivated) {
      return;
    }

    const container = pageRef.current;
    if (!container) {
      return;
    }

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updateCurrentTag();
          rafId = null;
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [pageRef, scrollActivated, updateCurrentTag]);
};

export default useTagTracking;
