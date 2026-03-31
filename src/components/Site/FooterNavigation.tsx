'use client';

import { useMemo } from 'react';

import type { SiteData, TagWithRelationships } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';
import { getRequestedScopes } from '@/utils/scope-manager';

import CategoryAhref from '../Breadcrumbs/CategoryAhref';
import TagAhref from '../Breadcrumbs/TagAhref';
import { useSiteData } from '../SiteDataProvider';

import './style.scss';

type FooterNavigationProps = Readonly<{
  categorySlug: string;
}>;

type TagNeighbors = {
  next: TagWithRelationships | null;
  previous: TagWithRelationships | null;
};

const getTagNeighbors = (scope: SiteData, tagId: string): TagNeighbors => {
  // Collect all tags across the scope and its children
  const allTags: { category: SiteData; tag: TagWithRelationships }[] = [];
  const collectTags = (currentScope: SiteData) => {
    if (currentScope.children.length > 0) {
      currentScope.children.forEach((child) => collectTags(child));
    }
    currentScope.tags.forEach((tag) => {
      allTags.push({ category: currentScope, tag });
    });
  };
  collectTags(scope);

  const currentIndex = allTags.findIndex((entry) => entry.tag.id === tagId);
  if (currentIndex === -1) {
    return { next: null, previous: null };
  }

  return {
    next: currentIndex < allTags.length - 1 ? allTags[currentIndex + 1].tag : null,
    previous: currentIndex > 0 ? allTags[currentIndex - 1].tag : null,
  };
};

const FooterNavigation = ({ categorySlug }: FooterNavigationProps) => {
  const { siteScopes, store } = useSiteData();
  const currentTagId = useNavigationStore((state) => state.currentTagId);
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);

  const scopeData = useMemo(() => {
    const category = Object.values(store.categoryMap).find((c) => c.slug === categorySlug);
    if (!category) {
      return null;
    }
    const resultScopes = getRequestedScopes(siteScopes, category);
    if (!resultScopes?.highestScope) {
      return null;
    }
    return resultScopes;
  }, [categorySlug, siteScopes, store]);

  const tagNeighbors = useMemo(() => {
    if (!scopeData?.highestScope || !currentTagId) {
      return { next: null, previous: null };
    }
    return getTagNeighbors(scopeData.highestScope, currentTagId);
  }, [currentTagId, scopeData]);

  const tagCategory = useMemo(() => {
    if (!currentCategoryId) {
      return null;
    }
    return store.categoryMap[currentCategoryId] ?? null;
  }, [currentCategoryId, store.categoryMap]);

  if (!scopeData) {
    return null;
  }

  const { highestScope, newerScope, olderScope } = scopeData;

  return (
    <div className="footer-navigation__newer-older">
      <div className="footer-navigation__newer-older--upper">
        {highestScope ? (
          <CategoryAhref category={highestScope.category}>
            <div className="footer-navigation__newer-older--link footer-navigation__newer-older--upper-link footer-navigation__round-upper">
              {highestScope.category.name}
            </div>
          </CategoryAhref>
        ) : null}
      </div>
      <div className="footer-navigation__newer-older--lower">
        <div className="footer-navigation__newer-older--half">
          {olderScope ? (
            <CategoryAhref category={olderScope.category}>
              <div className="footer-navigation__newer-older--link footer-navigation__newer-older--lower-link footer-navigation__newer-older--lower-tag footer-navigation__round-lower-right">
                &lt; {olderScope.category.name}
              </div>
            </CategoryAhref>
          ) : null}
          {tagNeighbors.previous && tagCategory ? (
            <TagAhref category={tagCategory} tag={tagNeighbors.previous}>
              <div className="footer-navigation__newer-older--link footer-navigation__newer-older--lower-link footer-navigation__newer-older--lower-post footer-navigation__round-lower-left">
                {tagNeighbors.previous.name}
              </div>
            </TagAhref>
          ) : null}
        </div>
        <div className="footer-navigation__newer-older--half">
          <div className="footer-navigation__relatives">
            {tagNeighbors.next && tagCategory ? (
              <TagAhref category={tagCategory} tag={tagNeighbors.next}>
                <div className="footer-navigation__newer-older--link footer-navigation__newer-older--lower-link footer-navigation__newer-older--lower-post footer-navigation__round-lower-right">
                  {tagNeighbors.next.name}
                </div>
              </TagAhref>
            ) : null}
          </div>
          {newerScope ? (
            <CategoryAhref category={newerScope.category}>
              <div className="footer-navigation__newer-older--link footer-navigation__newer-older--lower-link footer-navigation__newer-older--lower-tag-right footer-navigation__round-lower-left">
                {newerScope.category.name} &gt;
              </div>
            </CategoryAhref>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FooterNavigation;
