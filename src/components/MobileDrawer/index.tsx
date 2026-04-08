'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getRootCategory } from '@/lib/store';
import type { Category, SiteData, TagWithRelationships } from '@/lib/types';
import useModalStore from '@/stores/useModalStore';
import useNavigationStore from '@/stores/useNavigationStore';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

type MobileDrawerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const { siteScopes, store } = useSiteData();
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);
  const currentTagId = useNavigationStore((state) => state.currentTagId);
  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);
  const openModal = useModalStore((state) => state.open);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Auto-expand the active category chain when drawer opens
  useEffect(() => {
    if (!isOpen || !currentCategoryId) {
      return;
    }
    const idsToExpand = new Set<string>();
    let current: Category | undefined = store.categoryMap[currentCategoryId];
    while (current) {
      idsToExpand.add(current.id);
      current = current.parentId ? store.categoryMap[current.parentId] : undefined;
    }
    // Also expand the current tag
    if (currentTagId) {
      idsToExpand.add(currentTagId);
    }
    setExpandedIds(idsToExpand);
  }, [currentCategoryId, currentTagId, isOpen, store.categoryMap]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handlePostClick = useCallback((categoryId: string, post: { id: string }, tag: TagWithRelationships) => {
    setCurrentCategoryId(categoryId);
    setCurrentTagId(tag.id);
    const fullPost = store.postMap[post.id];
    if (fullPost) {
      openModal(fullPost, tag);
    }
    onClose();
  }, [onClose, openModal, setCurrentCategoryId, setCurrentTagId, store.postMap]);

  const currentRootSlug = useMemo(() => {
    if (!currentCategoryId) {
      return null;
    }
    const current = store.categoryMap[currentCategoryId];
    return current ? getRootCategory(store, current).slug : null;
  }, [currentCategoryId, store]);

  const renderScope = (scope: SiteData, depth: number) => {
    const { category, children, tags } = scope;
    const isExpanded = expandedIds.has(category.id);
    const isCurrentRoot = category.slug === currentRootSlug;
    const isCurrentCategory = category.id === currentCategoryId;
    const hasChildren = children.length > 0;
    const hasTags = tags.length > 0;
    const isExpandable = hasChildren || hasTags;

    return (
      <div className="mobile-drawer__item" key={category.id}>
        <div className="mobile-drawer__row">
          {isExpandable ? (
            <button
              className={`mobile-drawer__toggle ${isCurrentRoot ? 'mobile-drawer__toggle--current' : ''}`}
              onClick={() => toggleExpanded(category.id)}
            >
              <svg className={`mobile-drawer__chevron ${isExpanded ? 'mobile-drawer__chevron--open' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={isCurrentCategory ? 'mobile-drawer__label--active' : ''}>
                {category.name}
              </span>
            </button>
          ) : (
            <Link
              className={`mobile-drawer__link ${isCurrentCategory ? 'mobile-drawer__link--active' : ''}`}
              href={`/${category.slug}`}
              onClick={onClose}
            >
              {category.name}
            </Link>
          )}
        </div>
        {isExpanded ? (
          <div className="mobile-drawer__children">
            {hasChildren
              ? children.map((child) => renderScope(child, depth + 1))
              : tags.map((tag) => renderTag(category, tag))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderTag = (category: Category, tag: TagWithRelationships) => {
    const isExpanded = expandedIds.has(tag.id);
    const isCurrent = tag.id === currentTagId;

    return (
      <div className="mobile-drawer__item" key={`${category.id}-${tag.id}`}>
        <div className="mobile-drawer__row">
          <button
            className="mobile-drawer__toggle"
            onClick={() => toggleExpanded(tag.id)}
          >
            <svg className={`mobile-drawer__chevron ${isExpanded ? 'mobile-drawer__chevron--open' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={isCurrent ? 'mobile-drawer__label--tag-active' : 'mobile-drawer__label--tag'}>
              {tag.name}
            </span>
          </button>
        </div>
        {isExpanded ? (
          <div className="mobile-drawer__children">
            {tag.postIds.map((postId) => {
              const post = store.postMap[postId];
              if (!post) {
                return null;
              }
              return (
                <button
                  className="mobile-drawer__post"
                  key={postId}
                  onClick={() => handlePostClick(category.id, post, tag)}
                >
                  {post.cdnFeaturedImage ? (
                    <img
                      alt={post.cdnFeaturedImage.altText || post.title}
                      className="mobile-drawer__post-thumbnail"
                      loading="lazy"
                      sizes="48px"
                      srcSet={post.cdnFeaturedImage.srcSet}
                    />
                  ) : null}
                  <span className="mobile-drawer__post-title">{post.title}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <div
        className={`mobile-drawer__backdrop ${isOpen ? 'mobile-drawer__backdrop--visible' : ''}`}
        onClick={onClose}
      />
      <nav className={`mobile-drawer ${isOpen ? 'mobile-drawer--open' : ''}`}>
        <div className="mobile-drawer__content">
          {siteScopes.map((scope) => renderScope(scope, 0))}
        </div>
      </nav>
    </>
  );
};

export default MobileDrawer;
