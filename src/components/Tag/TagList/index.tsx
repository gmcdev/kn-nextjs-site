'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import type { TagWithRelationships } from '@/lib/types';
import useRefFunction from '@/hooks/useRefFunction';
import useModalStore from '@/stores/useModalStore';
import useNavigationStore from '@/stores/useNavigationStore';

import Post from '../../Post';
import { useSiteData } from '../../SiteDataProvider';

import './style.scss';

type TagListProps = Readonly<{
  contentType: string;
  tag: TagWithRelationships;
}>;

const TagList = ({ contentType, tag }: TagListProps) => {
  const { store } = useSiteData();
  const openModal = useModalStore((state) => state.open);
  const setTagSwipeFor = useNavigationStore((state) => state.setTagSwipeFor);
  const nextPostIdx = useNavigationStore((state) => state.tagSwipeMap[tag.id]);

  // For non-audio carousels, only render the current slide and its immediate
  // neighbours. Empty placeholder divs at all other positions preserve the
  // correct scrollLeft snap offsets without mounting any React subtree.
  const currentPostIdx = nextPostIdx ?? 0;

  const tagPostsElementRef = useRef<HTMLDivElement>(null);
  const swipeDimensions = useSwipeDimensions(tagPostsElementRef);

  const currentPostIdxRef = useRef<number | undefined>(undefined);

  const [scrollEnded, setScrollEnded] = useState(false);
  const handleScrollEnd = useCallback(() => {
    setScrollEnded(true);
  }, []);
  useIsScrolling(tagPostsElementRef, handleScrollEnd);

  // Update the active dot as soon as the scroll crosses the midpoint of a slide.
  const handleScroll = useCallback(() => {
    const element = tagPostsElementRef.current;
    if (!element || !swipeDimensions) {
      return;
    }
    const nearestIndex = Math.round(element.scrollLeft / swipeDimensions.width);
    if (nearestIndex !== currentPostIdxRef.current && nearestIndex >= 0 && nearestIndex < tag.postIds.length) {
      // Update the ref so the programmatic-scroll effect doesn't fight native scroll.
      currentPostIdxRef.current = nearestIndex;
      setTagSwipeFor(tag.id, nearestIndex);
    }
  }, [setTagSwipeFor, swipeDimensions, tag]);

  useEffect(() => {
    const element = tagPostsElementRef.current;
    if (!element) {
      return;
    }
    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // iOS does not propagate vertical scroll from a nested overflow-x container to
  // its ancestor scroll container. Detect direction on touchmove and forward
  // vertical gestures to the page scroll container manually.
  useEffect(() => {
    const el = tagPostsElementRef.current;
    if (!el || contentType !== 'default') {
      return;
    }

    const scrollContainer = el.closest('.page-layout__page') as HTMLElement | null;
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let direction: 'horizontal' | 'vertical' | null = null;
    let rafId: number | null = null;
    const LOCK_THRESHOLD = 5;
    const FRICTION = 0.95;

    const cancelMomentum = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      cancelMomentum();
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      lastY = startY;
      lastTime = performance.now();
      velocity = 0;
      direction = null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      const now = performance.now();
      const dt = now - lastTime;
      const deltaFromLast = currentY - lastY;
      lastY = currentY;
      lastTime = now;

      if (direction === null) {
        const dx = Math.abs(currentX - startX);
        const dy = Math.abs(currentY - startY);
        if (dx > LOCK_THRESHOLD || dy > LOCK_THRESHOLD) {
          direction = dy > dx ? 'vertical' : 'horizontal';
        }
      }

      if (direction === 'vertical') {
        event.preventDefault();
        if (dt > 0) {
          velocity = deltaFromLast / dt;
        }
        if (scrollContainer) {
          scrollContainer.scrollTop -= deltaFromLast;
        }
      }
    };

    const onTouchEnd = () => {
      if (direction !== 'vertical' || !scrollContainer) {
        return;
      }
      // Pixels per frame at 60fps, decaying by FRICTION each frame
      let v = velocity * 16;
      const momentum = () => {
        if (Math.abs(v) < 0.5) {
          return;
        }
        scrollContainer.scrollTop -= v;
        v *= FRICTION;
        rafId = requestAnimationFrame(momentum);
      };
      rafId = requestAnimationFrame(momentum);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      cancelMomentum();
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [contentType]);

  const handleSetCurrentPost = useCallback(
    (nextPostIdx: number) => {
      currentPostIdxRef.current = nextPostIdx;
      setTagSwipeFor(tag.id, nextPostIdx);
      setScrollEnded(false);
    },
    [setTagSwipeFor, tag],
  );

  useEffect(() => {
    const tagPostsElement = tagPostsElementRef.current;
    if (!tagPostsElement || !swipeDimensions) {
      return;
    }

    const swipeIsUpdated = nextPostIdx !== currentPostIdxRef.current;

    if (scrollEnded) {
      const calculatedPostIdx = Math.round(tagPostsElement.scrollLeft / swipeDimensions.width);
      handleSetCurrentPost(calculatedPostIdx);
    } else if (swipeIsUpdated) {
      tagPostsElement.scrollLeft = nextPostIdx * swipeDimensions.width;
    }
  }, [handleSetCurrentPost, nextPostIdx, scrollEnded, swipeDimensions]);

  return (
    <div
      ref={tagPostsElementRef}
      className={`tag-list__${contentType}-posts`}
      style={{ height: swipeDimensions?.height }}
    >
      {tag.postIds.map((postId, index) => {
        const post = store.postMap[postId];
        const isInWindow = contentType === 'audio' || Math.abs(index - currentPostIdx) <= 1;
        return (
          <div className={`tag-list__${contentType}-post`} key={postId}>
            {isInWindow ? (
              contentType === 'audio' ? (
                <Post post={post} />
              ) : (
                <button className="tag-list__post-button" onClick={() => openModal(post, store.tagMap[tag.id] ?? tag)}>
                  <Post post={post} />
                </button>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default TagList;

const useSwipeDimensions = (tagPostsElementRef: RefObject<HTMLDivElement | null>) => {
  const [swipeDimensions, setSwipeDimensions] = useState<{ height: number; width: number }>();

  useEffect(() => {
    if (tagPostsElementRef.current && !swipeDimensions?.height) {
      const tagPostsElement = tagPostsElementRef.current;
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries.length !== 0 && entries[0].target) {
          const rect = entries[0].target.getBoundingClientRect();
          if (rect.height > 0) {
            setSwipeDimensions({ height: rect.height, width: rect.width });
          }
        }
      });
      resizeObserver.observe(tagPostsElement);
      return () => {
        resizeObserver.unobserve(tagPostsElement);
        resizeObserver.disconnect();
      };
    }
  }, [swipeDimensions?.height, tagPostsElementRef]);

  return swipeDimensions;
};

const useIsScrolling = (
  elementRef: RefObject<HTMLDivElement | null>,
  onScrollEnd: () => void,
  delay = 150,
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onScrollEndRef = useRefFunction(onScrollEnd);

  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current;

      const onScroll = () => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => onScrollEndRef(), delay);
      };

      element.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        element.removeEventListener('scroll', onScroll);
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [delay, elementRef, onScrollEndRef]);
};
