'use client';

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import type { TagWithRelationships } from '@/lib/types';
import useRefFunction from '@/hooks/useRefFunction';
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
  const { setTagSwipeFor, tagSwipeMap } = useNavigationStore();
  const nextPostIdx = tagSwipeMap[tag.id];

  const tagPostsElementRef = useRef<HTMLDivElement>(null);
  const swipeDimensions = useSwipeDimensions(tagPostsElementRef);

  const currentPostIdxRef = useRef<number | undefined>(undefined);

  const [scrollEnded, setScrollEnded] = useState(false);
  const handleScrollEnd = useCallback(() => {
    setScrollEnded(true);
  }, []);
  useIsScrolling(tagPostsElementRef, handleScrollEnd);

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
      {tag.postIds.map((postId) => (
        <div className={`tag-list__${contentType}-post`} key={postId}>
          <Post post={store.postMap[postId]} />
        </div>
      ))}
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
