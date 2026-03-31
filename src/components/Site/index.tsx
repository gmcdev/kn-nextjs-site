'use client';

import type { ReactNode } from 'react';

import type { Category, PostWithRelationships, SiteData, Store } from '@/lib/types';

import { useSiteData } from '../SiteDataProvider';
import Tag from '../Tag';

import FooterNavigation from './FooterNavigation';

const getRootCategorySlug = (store: Store, category: Category): string => {
  let current = category;
  while (current.parentId && store.categoryMap[current.parentId]) {
    current = store.categoryMap[current.parentId];
  }
  return current.slug;
};

type SiteProps = Readonly<{
  categorySlug: string;
  post?: PostWithRelationships;
  scope: SiteData;
}>;

const Site = ({ categorySlug, post, scope }: SiteProps) => {
  const { store } = useSiteData();
  const rootCategorySlug = getRootCategorySlug(store, scope.category);

  const getCategoryJsx = (currentScope: SiteData): ReactNode => {
    if (currentScope.children.length > 0) {
      return currentScope.children.map((childScope) => getCategoryJsx(childScope));
    }
    if (currentScope.tags.length > 0) {
      return currentScope.tags.map((tag) => (
        <Tag key={tag.id} tag={tag} scope={currentScope} rootCategorySlug={rootCategorySlug} />
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
