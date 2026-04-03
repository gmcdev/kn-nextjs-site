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
  const category = store.categoryBySlug[categorySlug];

  const description = category ? `${category.name} — art and music by King Nitram` : undefined;

  const firstPostWithImage = category?.postIds
    .map((id) => store.postMap[id])
    .find((post) => post?.cdnFeaturedImage);

  return {
    description,
    openGraph: {
      description,
      images: firstPostWithImage?.cdnFeaturedImage
        ? [{ alt: firstPostWithImage.cdnFeaturedImage.altText, url: firstPostWithImage.cdnFeaturedImage.sourceUrl }]
        : undefined,
      title: category?.name,
    },
    title: category?.name ?? 'King Nitram',
  };
}

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { categorySlug } = await params;
  return <CategoryPageClient categorySlug={categorySlug} />;
};

export default CategoryPage;
