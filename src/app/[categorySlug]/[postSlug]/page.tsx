import { getSiteData } from '@/lib/data';
import { getLeafCategory } from '@/lib/store';
import type { Metadata } from 'next';

type PostPageProps = Readonly<{
  params: Promise<{ categorySlug: string; postSlug: string }>;
}>;

export async function generateStaticParams() {
  const { store } = await getSiteData();
  return Object.values(store.postMap).map((post) => {
    const leafCategory = getLeafCategory(store, post);
    return {
      categorySlug: leafCategory.slug,
      postSlug: post.slug,
    };
  });
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { postSlug } = await params;
  const { store } = await getSiteData();
  const post = Object.values(store.postMap).find((p) => p.slug === postSlug);

  if (!post) {
    return { title: 'King Nitram' };
  }

  return {
    description: post.postMeta.contentType,
    openGraph: post.cdnFeaturedImage
      ? { images: [{ url: post.cdnFeaturedImage.sourceUrl }] }
      : undefined,
    title: `${post.title} — King Nitram`,
  };
}

const PostPage = async ({ params }: PostPageProps) => {
  const { categorySlug, postSlug } = await params;
  const { siteScopes, store } = await getSiteData();
  const post = Object.values(store.postMap).find((p) => p.slug === postSlug);

  if (!post) {
    return <div>Post not found</div>;
  }

  const leafCategory = getLeafCategory(store, post);

  return (
    <div>
      <h1>{post.title}</h1>
      <p>Category: {categorySlug} | Leaf: {leafCategory.slug}</p>
      <p>Scopes: {siteScopes.length}</p>
    </div>
  );
};

export default PostPage;
