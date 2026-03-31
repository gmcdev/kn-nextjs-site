'use client';

import { useMemo } from 'react';

import { getFirstPost, getLastPost } from '@/utils/scope-manager';
import { getPostNeighbors, getRequestedScopes } from '@/utils/scope-manager';

import CategoryAhref from '../Breadcrumbs/CategoryAhref';
import PostAhref from '../Breadcrumbs/PostAhref';
import { useSiteData } from '../SiteDataProvider';

import './style.scss';

type FooterNavigationProps = Readonly<{
  categorySlug: string;
}>;

const FooterNavigation = ({ categorySlug }: FooterNavigationProps) => {
  const { siteScopes, store } = useSiteData();

  const scopeData = useMemo(() => {
    const category = Object.values(store.categoryMap).find((c) => c.slug === categorySlug);
    if (!category) {
      return null;
    }
    const resultScopes = getRequestedScopes(siteScopes, category);
    if (!resultScopes?.highestScope) {
      return null;
    }
    const firstPost = getFirstPost(store, resultScopes.scope);
    const firstPostRelatives = firstPost
      ? getPostNeighbors(store, resultScopes.highestScope, firstPost.id)
      : {};
    const lastPost = getLastPost(store, resultScopes.scope);
    const lastPostRelatives = lastPost
      ? getPostNeighbors(store, resultScopes.highestScope, lastPost.id)
      : {};
    return {
      ...resultScopes,
      firstPostRelatives,
      lastPostRelatives,
    };
  }, [categorySlug, siteScopes, store]);

  if (!scopeData) {
    return null;
  }

  const { firstPostRelatives, highestScope, lastPostRelatives, newerScope, olderScope } = scopeData;

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
          {lastPostRelatives?.older ? (
            <PostAhref store={store} post={lastPostRelatives.older}>
              <div className="footer-navigation__newer-older--link footer-navigation__newer-older--lower-link footer-navigation__newer-older--lower-post footer-navigation__round-lower-left">
                {lastPostRelatives.older.title ?? 'Previous Post'}
              </div>
            </PostAhref>
          ) : null}
        </div>
        <div className="footer-navigation__newer-older--half">
          <div className="footer-navigation__relatives">
            {firstPostRelatives?.newer ? (
              <PostAhref store={store} post={firstPostRelatives.newer}>
                <div className="footer-navigation__newer-older--link footer-navigation__newer-older--lower-link footer-navigation__newer-older--lower-post footer-navigation__round-lower-right">
                  {firstPostRelatives.newer.title ?? 'Next Post'}
                </div>
              </PostAhref>
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
