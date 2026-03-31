import type { PostWithRelationships, Store } from '@/lib/types';

const findCategoryByPost = (store: Store, post: PostWithRelationships) => {
  const parentCategoryId = post.categoryIds.find(
    (categoryId) => store.categoryMap[categoryId]?.parentId,
  );
  return parentCategoryId ? store.categoryMap[parentCategoryId] : null;
};

export default findCategoryByPost;
