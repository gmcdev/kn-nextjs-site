'use client';

import type { PostWithRelationships, Store } from '@/lib/types';

import CategoryAhref from './CategoryAhref';

import './style.scss';

type BreadcrumbsProps = Readonly<{
  post: PostWithRelationships;
  store: Store;
}>;

const Breadcrumbs = ({ post, store }: BreadcrumbsProps) => {
  const parentCategoryId = post.categoryIds.find(
    (categoryId) => store.categoryMap[categoryId]?.parentId === null || store.categoryMap[categoryId]?.parentId === '',
  );
  const parentCategory = parentCategoryId ? store.categoryMap[parentCategoryId] : null;

  const categoryIds = post.categoryIds.filter(
    (categoryId) => store.categoryMap[categoryId]?.parentId !== null && store.categoryMap[categoryId]?.parentId !== '',
  );
  const categories = categoryIds.map((categoryId) => store.categoryMap[categoryId]);

  const categoryLinks = categories.map((category, i) => (
    <div key={`breadcrumb-${category.slug}`}>
      <span>
        <CategoryAhref category={category} />
      </span>
      {i < categories.length - 1 ? <span> | </span> : null}
    </div>
  ));

  return (
    <div className="breadcrumbs">
      {parentCategory ? (
        <>
          <span>
            <CategoryAhref category={parentCategory} />
          </span>
          <span> &gt; </span>
        </>
      ) : null}
      <span>{categoryLinks}</span>
    </div>
  );
};

export default Breadcrumbs;
