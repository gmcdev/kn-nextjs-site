'use client';

import Link from 'next/link';
import type { PropsWithChildren } from 'react';

import type { Category, TagWithRelationships } from '@/lib/types';

type TagAhrefProps = Readonly<PropsWithChildren<{
  category: Category;
  tag: TagWithRelationships;
}>>;

const TagAhref = ({ category, children, tag }: TagAhrefProps) => {
  return (
    <Link href={`/${category.slug}?t=${tag.slug}`}>
      {children ?? tag.name}
    </Link>
  );
};

export default TagAhref;
