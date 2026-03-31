import { getSiteData } from '@/lib/data';
import type { Metadata } from 'next';

import CategoryPageClient from './CategoryPageClient';

type CategoryPageProps = Readonly<{
  params: Promise<{ categorySlug: string }>;
}>;

export async function generateStaticParams() {
  const { store } = await getSiteData();
  return Object.values(store.categoryMap).map((category) => ({
    categorySlug: category.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const { store } = await getSiteData();
  const category = Object.values(store.categoryMap).find((c) => c.slug === categorySlug);

  return {
    title: category ? `${category.name} — King Nitram` : 'King Nitram',
  };
}

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { categorySlug } = await params;
  return <CategoryPageClient categorySlug={categorySlug} />;
};

export default CategoryPage;
