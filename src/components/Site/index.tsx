'use client';

import type { ReactNode } from 'react';

import type { PostWithRelationships, SiteData } from '@/lib/types';

import Tag from '../Tag';

import FooterNavigation from './FooterNavigation';

type SiteProps = Readonly<{
  categorySlug: string;
  post?: PostWithRelationships;
  scope: SiteData;
}>;

const Site = ({ categorySlug, post, scope }: SiteProps) => {
  const getCategoryJsx = (currentScope: SiteData): ReactNode => {
    if (currentScope.children.length > 0) {
      return currentScope.children.map((childScope) => getCategoryJsx(childScope));
    }
    if (currentScope.tags.length > 0) {
      return currentScope.tags.map((tag) => (
        <Tag key={tag.id} tag={tag} scope={currentScope} />
      ));
    }
    return null;
  };

  return (
    <>
      <div className="feed-content">
        <div className="feed-content__inner">
          <div key={scope.category.id} className="feed-content__category">
            {post ? <Tag post={post} /> : getCategoryJsx(scope)}
          </div>
        </div>
      </div>
      <FooterNavigation categorySlug={categorySlug} />
    </>
  );
};

export default Site;
