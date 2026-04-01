import { getSiteData } from '@/lib/data';
import type { Metadata } from 'next';

import TagPageClient from '../TagPageClient';

type PostDeepLinkProps = Readonly<{
  params: Promise<{ categorySlug: string; postSlug: string; tagSlug: string }>;
}>;

export async function generateStaticParams() {
  const { siteScopes, store } = await getSiteData();

  const params: { categorySlug: string; postSlug: string; tagSlug: string }[] = [];

  const collectParams = (scope: { category: { slug: string }; children: typeof siteScopes; tags: { slug: string; postIds: string[] }[] }) => {
    if (scope.children.length > 0) {
      scope.children.forEach((child) => collectParams(child));
      return;
    }
    scope.tags.forEach((tag) => {
      tag.postIds.forEach((postId) => {
        const post = store.postMap[postId];
        if (post) {
          params.push({
            categorySlug: scope.category.slug,
            postSlug: post.slug,
            tagSlug: tag.slug,
          });
        }
      });
    });
  };

  siteScopes.forEach((scope) => collectParams(scope));
  return params;
}

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

export async function generateMetadata({ params }: PostDeepLinkProps): Promise<Metadata> {
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

const PostDeepLinkPage = async ({ params }: PostDeepLinkProps) => {
  const { categorySlug, postSlug, tagSlug } = await params;
  return (
    <TagPageClient
      categorySlug={categorySlug}
      initialPostSlug={postSlug}
      tagSlug={tagSlug}
    />
  );
};

export default PostDeepLinkPage;
