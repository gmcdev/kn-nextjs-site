import { getSiteData } from '@/lib/data';
import { getLeafCategory } from '@/lib/store';
import type { Metadata } from 'next';

import PostPageClient from './PostPageClient';

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

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { postSlug } = await params;
  const { store } = await getSiteData();
  const post = Object.values(store.postMap).find((p) => p.slug === postSlug);

  if (!post) {
    return { title: 'King Nitram' };
  }

  const description = post.content
    ? stripHtml(post.content).slice(0, 160)
    : post.postMeta.contentType;

  return {
    description,
    openGraph: {
      images: post.cdnFeaturedImage
        ? [{ alt: post.cdnFeaturedImage.altText, url: post.cdnFeaturedImage.sourceUrl }]
        : undefined,
      title: post.title,
      type: 'article',
    },
    title: post.title,
  };
}

const PostPage = async ({ params }: PostPageProps) => {
  const { categorySlug, postSlug } = await params;
  return <PostPageClient categorySlug={categorySlug} postSlug={postSlug} />;
};

export default PostPage;
