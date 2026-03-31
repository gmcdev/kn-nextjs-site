import { getSiteData } from '@/lib/data';
import type { Metadata } from 'next';

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
  const { siteScopes, store } = await getSiteData();
  const category = Object.values(store.categoryMap).find((c) => c.slug === categorySlug);

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div>
      <h1>{category.name}</h1>
      <p>Category feed for {categorySlug}</p>
      <pre>{JSON.stringify({ postCount: category.postIds.length, scopeCount: siteScopes.length }, null, 2)}</pre>
    </div>
  );
};

export default CategoryPage;
