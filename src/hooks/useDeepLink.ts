'use client';

import { useEffect, useRef } from 'react';

import type { SiteData, Store, TagWithRelationships } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';

type UseDeepLinkParams = Readonly<{
  pageRef: React.RefObject<HTMLDivElement | null>;
  scope: SiteData;
  store: Store;
}>;

const useDeepLink = ({ pageRef, scope, store }: UseDeepLinkParams) => {
  const activateScroll = useNavigationStore((state) => state.activateScroll);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const tagDeepLink = params.get('t');

    if (!tagDeepLink || !scope.tags.length) {
      return;
    }

    // Collect preceding tags + the target tag
    let linkedTag: TagWithRelationships | null = null;
    const precedingTags: TagWithRelationships[] = [];
    for (const tag of scope.tags) {
      if (tag.slug === tagDeepLink) {
        linkedTag = tag;
        break;
      }
      precedingTags.push(tag);
    }

    if (!linkedTag) {
      return;
    }

    // Activate scroll so the IO-driven currentPost updates take effect
    activateScroll();

    // Sequential scroll hack: rapidly scroll to each preceding tag
    // to force virtualized items to render and provide accurate measurements
    const scrollContainer = pageRef.current;
    if (!scrollContainer) {
      return;
    }

    const tags = [...precedingTags, linkedTag];
    tags.forEach((tag, i) => {
      setTimeout(() => {
        const tagElement = scrollContainer.querySelector(`[data-tag-slug="${tag.slug}"]`);
        if (tagElement) {
          const rect = tagElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          scrollContainer.scrollTo({
            behavior: 'smooth',
            left: 0,
            top: scrollContainer.scrollTop + rect.top - containerRect.top,
          });
        }
      }, 50 * i);
    });
  }, [activateScroll, pageRef, scope, store]);
};

export default useDeepLink;
