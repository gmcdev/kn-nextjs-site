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

  // Tracks only the tag elements currently intersecting the scroll container.
  // Eliminates querySelectorAll + getBoundingClientRect on every element each frame.
  const visibleTagsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Reset the URL dedup guard when scroll tracking reactivates (e.g., after navigation)
  useEffect(() => {
    if (!scrollActivated) {
      lastUrlUpdateRef.current = null;
    }
  }, [scrollActivated]);

  // Maintain the set of currently-visible tag elements via IntersectionObserver.
  // Attached once on mount so it doesn't depend on scroll activation state.
  useEffect(() => {
    const container = pageRef.current;
    if (!container) {
      return;
    }

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
      { root: container, threshold: 0 },
    );

    const tagElements = container.querySelectorAll<HTMLElement>('[data-tag-id]');
    tagElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pageRef]);

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

  // Find the topmost visible tag and update current tag/category/URL.
  // Only iterates the small set of currently-intersecting elements (typically 2–5),
  // not all tag elements in the DOM.
  const updateCurrentTag = useCallback(() => {
    const container = pageRef.current;
    if (!container) {
      return;
    }

    const containerTop = container.getBoundingClientRect().top;
    let bestElement: HTMLElement | null = null;
    let bestDistance = Infinity;

    for (const element of visibleTagsRef.current.values()) {
      const rect = element.getBoundingClientRect();
      const relativeTop = rect.top - containerTop;

      if (relativeTop >= 0) {
        if (relativeTop < bestDistance) {
          bestDistance = relativeTop;
          bestElement = element;
        }
      } else if (rect.bottom - containerTop > 0) {
        const distance = -relativeTop;
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
  }, [pageRef, setCurrentCategoryId, setCurrentTagId, store]);

  // Listen for scroll events after user interaction activates tracking.
  // Throttled via rAF to avoid layout work on every scroll event.
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
