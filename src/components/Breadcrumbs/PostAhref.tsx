'use client';

import Link from 'next/link';
import type { PropsWithChildren } from 'react';

import type { PostWithRelationships, Store } from '@/lib/types';

import findCategoryByPost from './functions/findCategoryByPost';
import { getPostUri } from './functions/getPostUri';

type PostAhrefProps = Readonly<PropsWithChildren<{
  post: PostWithRelationships;
  store: Store;
}>>;

const PostAhref = ({ children, post, store }: PostAhrefProps) => {
  const category = findCategoryByPost(store, post);
  return category ? (
    <Link href={getPostUri(category, post)}>
      {children ?? post.title}
    </Link>
  ) : null;
};

export default PostAhref;
