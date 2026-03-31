'use client';

import Link from 'next/link';
import type { PropsWithChildren } from 'react';

import type { Category } from '@/lib/types';

type CategoryAhrefProps = Readonly<PropsWithChildren<{
  category: Category;
}>>;

const CategoryAhref = ({ category, children }: CategoryAhrefProps) => {
  return (
    <Link href={`/${category.slug}`}>
      {children ?? category.name}
    </Link>
  );
};

export default CategoryAhref;
