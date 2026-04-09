'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Category, SiteData, TagWithRelationships } from '@/lib/types';
import useModalStore from '@/stores/useModalStore';
import useNavigationStore from '@/stores/useNavigationStore';
import { SCROLL_COLLAPSE_THRESHOLD } from '@/utils/layout-constants';

import CategoryAhref from '../Breadcrumbs/CategoryAhref';
import TagAhref from '../Breadcrumbs/TagAhref';
import { useMediaSize } from '../MediaListener';
import { useSiteData } from '../SiteDataProvider';

import './style.scss';

const SiteMap = () => {
  const mediaSize = useMediaSize();
  const { siteScopes } = useSiteData();
  const [animClasses, setAnimClasses] = useState({ menu: '' });
  const isFixedRef = useRef(false);

  useEffect(() => {
    if (mediaSize === 'small' || mediaSize === 'medium') {
      return;
    }
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > SCROLL_COLLAPSE_THRESHOLD && !isFixedRef.current) {
        isFixedRef.current = true;
        setAnimClasses({ menu: 'site-map__fixed' });
      } else if (scrollY <= SCROLL_COLLAPSE_THRESHOLD && isFixedRef.current) {
        isFixedRef.current = false;
        setAnimClasses({ menu: 'site-map__relative' });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mediaSize]);

  if (mediaSize === 'small' || mediaSize === 'medium') {
    return null;
  }

  return (
    <div className={`site-map ${animClasses.menu}`}>
      <div className="site-map__outline">
        {siteScopes.map((scope) => (
          <SiteMapCategoryItem depth={0} key={scope.category.id} scope={scope} />
        ))}
      </div>
    </div>
  );
};

export default SiteMap;

type SiteMapCategoryItemProps = Readonly<{
  depth: number;
  scope: SiteData;
}>;

// Only re-renders when this specific category transitions between current/not-current.
const SiteMapCategoryItem = ({ depth, scope }: SiteMapCategoryItemProps) => {
  const { store } = useSiteData();

  const isCurrent = useNavigationStore(
    useCallback(
      (state) => {
        if (!state.currentCategoryId) {
          return false;
        }
        let current: Category | undefined = store.categoryMap[state.currentCategoryId];
        while (current) {
          if (current.id === scope.category.id) {
            return true;
          }
          current = current.parentId ? store.categoryMap[current.parentId] : undefined;
        }
        return false;
      },
      [scope.category.id, store.categoryMap],
    ),
  );

  return (
    <div className="site-map__outline--category">
      <div
        className={`site-map__outline--category-name${isCurrent ? ' site-map__outline--category-name-current' : ''}`}
        style={depth === 0 ? { marginTop: '10px' } : {}}
      >
        <CategoryAhref category={scope.category} />
      </div>
      {!isCurrent ? null : scope.children.length > 0 ? (
        <div className="site-map__outline--category-tags">
          {scope.children.map((childScope) => (
            <SiteMapCategoryItem depth={depth + 1} key={childScope.category.id} scope={childScope} />
          ))}
        </div>
      ) : (
        scope.tags.map((tag) => (
          <SiteMapTagItem key={`${scope.category.id}-${tag.id}`} scope={scope} tag={tag} />
        ))
      )}
    </div>
  );
};

type SiteMapTagItemProps = Readonly<{
  scope: SiteData;
  tag: TagWithRelationships;
}>;

// Only re-renders when this specific tag transitions between current/not-current.
const SiteMapTagItem = ({ scope, tag }: SiteMapTagItemProps) => {
  const { store } = useSiteData();
  const openModal = useModalStore((state) => state.open);
  const setTagSwipeFor = useNavigationStore((state) => state.setTagSwipeFor);
  const isCurrent = useNavigationStore((state) => state.currentTagId === tag.id);

  if (!isCurrent) {
    return (
      <div className="site-map__outline--tag">
        <TagAhref category={scope.category} tag={tag} />
      </div>
    );
  }

  return (
    <div className="site-map__outline--tag">
      <TagAhref category={scope.category} tag={tag}>
        <div className="site-map__outline--tag-name-current">{tag.name}</div>
      </TagAhref>
      <div className="site-map__outline--tag-posts">
        {tag.postIds.map((postId, tagPostsIdx) => {
          const post = store.postMap[postId];
          const { srcSet } = post.cdnFeaturedImage ?? {};
          return (
            <div key={`${scope.category.id}-${tag.id}-${post.id}`} className="site-map__outline--post">
              <button
                onClick={() => {
                  setTagSwipeFor(tag.id, tagPostsIdx);
                  openModal(post, tag);
                }}
              >
                <div className="site-map__outline--post-inner">
                  {srcSet ? (
                    <img
                      alt="Post thumbnail"
                      className="site-map__outline--post-thumbnail"
                      sizes="40px"
                      srcSet={srcSet}
                    />
                  ) : null}
                  <div className="site-map__outline--post-name">{post.title}</div>
                  <div className="site-map__outline--post-indicator">►</div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
