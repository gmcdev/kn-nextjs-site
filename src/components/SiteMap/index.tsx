'use client';

import { useEffect, useRef, useState } from 'react';

import { getRootCategory } from '@/lib/store';
import type { Category, PostWithRelationships, SiteData, TagWithRelationships } from '@/lib/types';
import useModalStore from '@/stores/useModalStore';
import useNavigationStore from '@/stores/useNavigationStore';
import { SCROLL_COLLAPSE_THRESHOLD } from '@/utils/layout-constants';

import CategoryAhref from '../Breadcrumbs/CategoryAhref';
import TagAhref from '../Breadcrumbs/TagAhref';
import { getPostUri } from '../Breadcrumbs/functions/getPostUri';
import { useSiteData } from '../SiteDataProvider';

import './style.scss';

type SiteMapProps = Readonly<{
  pageRef: React.RefObject<HTMLDivElement | null>;
}>;

const SiteMap = ({ pageRef }: SiteMapProps) => {
  const { siteScopes, store } = useSiteData();
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);
  const currentTagId = useNavigationStore((state) => state.currentTagId);
  const setTagSwipeFor = useNavigationStore((state) => state.setTagSwipeFor);
  const openModal = useModalStore((state) => state.open);

  const [animClasses, setAnimClasses] = useState({ menu: '' });
  const isFixedRef = useRef(false);

  useEffect(() => {
    const pageElement = pageRef.current;
    if (!pageElement) {
      return;
    }
    const handleScroll = () => {
      const scrollY = pageElement.scrollTop;
      if (scrollY > SCROLL_COLLAPSE_THRESHOLD && !isFixedRef.current) {
        isFixedRef.current = true;
        setAnimClasses({ menu: 'site-map__fixed' });
      } else if (scrollY <= SCROLL_COLLAPSE_THRESHOLD && isFixedRef.current) {
        isFixedRef.current = false;
        setAnimClasses({ menu: 'site-map__relative' });
      }
    };
    pageElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      pageElement.removeEventListener('scroll', handleScroll);
    };
  }, [pageRef]);

  const updateTagSwipeMap = (
    _category: Category,
    tag: TagWithRelationships,
    _post: PostWithRelationships,
    tagPostsIdx: number,
  ) => {
    setTagSwipeFor(tag.id, tagPostsIdx);
  };

  const isCurrentCategory = (category: Category) => {
    if (!currentCategoryId) {
      return false;
    }
    // Walk up the parent chain from the tracked category
    let current: Category | undefined = store.categoryMap[currentCategoryId];
    while (current) {
      if (current.id === category.id) {
        return true;
      }
      current = current.parentId ? store.categoryMap[current.parentId] : undefined;
    }
    return false;
  };

  const isCurrentTag = (tag: TagWithRelationships) => {
    return tag.id === currentTagId;
  };


  const getCategoryJsx = (scope: SiteData, depth = 0) => {
    const { category, children, tags } = scope;
    const isCurrent = isCurrentCategory(category);
    return (
      <div key={category.id} className="site-map__outline--category">
        <div
          className={`site-map__outline--category-name${isCurrent ? ' site-map__outline--category-name-current' : ''}`}
          style={depth === 0 ? { marginTop: '10px' } : {}}
        >
          <CategoryAhref category={category} />
        </div>
        {!isCurrent ? null : children.length > 0 ? (
          <div className="site-map__outline--category-tags">
            {children.map((childScope) => getCategoryJsx(childScope, depth + 1))}
          </div>
        ) : (
          tags.map((tag) => getTagJsx(scope, tag))
        )}
      </div>
    );
  };

  const getTagJsx = (scope: SiteData, tag: TagWithRelationships) => {
    const { category } = scope;
    const isCurrent = isCurrentTag(tag);
    return (
      <div key={`${category.id}-${tag.id}`} className="site-map__outline--tag">
        {isCurrent ? (
          <>
            <TagAhref category={category} tag={tag}>
              <div className="site-map__outline--tag-name-current">{tag.name}</div>
            </TagAhref>
            <div className="site-map__outline--tag-posts">
              {tag.postIds.map((postId, tagPostsIdx) => {
                const post = store.postMap[postId];
                return getPostJsx(category, tag, post, tagPostsIdx);
              })}
            </div>
          </>
        ) : (
          <TagAhref category={category} tag={tag} />
        )}
      </div>
    );
  };

  const getPostJsx = (
    category: Category,
    tag: TagWithRelationships,
    post: PostWithRelationships,
    tagPostsIdx: number,
  ) => {
    const { srcSet } = post.cdnFeaturedImage ?? {};
    return (
      <div key={`${category.id}-${tag.id}-${post.id}`} className="site-map__outline--post">
        <button onClick={() => {
          updateTagSwipeMap(category, tag, post, tagPostsIdx);
          openModal(post, tag);
        }}>
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
  };

  return (
    <div className={`site-map ${animClasses.menu}`}>
      <div className="site-map__outline">{siteScopes.map((scope) => getCategoryJsx(scope))}</div>
    </div>
  );
};

export default SiteMap;
