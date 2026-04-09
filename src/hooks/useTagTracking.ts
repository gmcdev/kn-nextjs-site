'use client';

import { useCallback, useEffect, useRef } from 'react';

import type { Store } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';
import { replaceUrl } from '@/utils/withBasePath';

const useTagTracking = (store: Store) => {
  const scrollActivated = useNavigationStore((state) => state.scrollActivated);
  const activateScroll = useNavigationStore((state) => state.activateScroll);
  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);
  const lastUrlUpdateRef = useRef<string | null>(null);

  // Tracks only the tag elements currently intersecting the viewport.
  const visibleTagsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Reset the URL dedup guard when scroll tracking reactivates (e.g., after navigation)
  useEffect(() => {
    if (!scrollActivated) {
      lastUrlUpdateRef.current = null;
    }
  }, [scrollActivated]);

  // Maintain the set of currently-visible tag elements via IntersectionObserver.
  // root: null means the viewport is the intersection root.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const tagId = (entry.target as HTMLElement).dataset.tagId;
          if (!tagId) {
            return;
          }
          if (entry.isIntersecting) {
            visibleTagsRef.current.set(tagId, entry.target as HTMLElement);
          } else {
            visibleTagsRef.current.delete(tagId);
          }
        });
      },
      { root: null, threshold: 0 },
    );

    const tagElements = document.querySelectorAll<HTMLElement>('[data-tag-id]');
    tagElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Activate scroll tracking on real user interaction (not layout-induced scroll)
  useEffect(() => {
    if (scrollActivated) {
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

    window.addEventListener('wheel', handleUserScroll, { passive: true });
    window.addEventListener('touchstart', handleUserScroll, { passive: true });
    window.addEventListener('keydown', handleKeyScroll);
    return () => {
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchstart', handleUserScroll);
      window.removeEventListener('keydown', handleKeyScroll);
    };
  }, [activateScroll, scrollActivated]);

  // Find the topmost visible tag and update current tag/category/URL.
  const updateCurrentTag = useCallback(() => {
    let bestElement: HTMLElement | null = null;
    let bestDistance = Infinity;

    for (const element of visibleTagsRef.current.values()) {
      const rect = element.getBoundingClientRect();

      if (rect.top >= 0) {
        if (rect.top < bestDistance) {
          bestDistance = rect.top;
          bestElement = element;
        }
      } else if (rect.bottom > 0) {
        const distance = -rect.top;
        if (bestDistance === Infinity || distance < bestDistance) {
          bestDistance = distance;
          bestElement = element;
        }
      }
    }

    if (bestElement !== null) {
      const tagId = bestElement.dataset.tagId;
      const categoryId = bestElement.dataset.categoryId;
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
  }, [setCurrentCategoryId, setCurrentTagId, store]);

  // Listen for scroll events after user interaction activates tracking.
  // Throttled via rAF to avoid layout work on every scroll event.
  useEffect(() => {
    if (!scrollActivated) {
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

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrollActivated, updateCurrentTag]);
};

export default useTagTracking;
