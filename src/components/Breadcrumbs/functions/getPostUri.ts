import type { Category, PostWithRelationships } from '@/lib/types';

export const getPostUri = (category: Category, post: PostWithRelationships): string => {
  return `/${category.slug}/${post.slug}`;
};
