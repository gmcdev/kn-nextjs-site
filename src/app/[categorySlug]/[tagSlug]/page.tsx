import { getSiteData } from '@/lib/data';
import { getLeafCategory } from '@/lib/store';
import type { Metadata } from 'next';

import PostPageClient from './PostPageClient';
import TagPageClient from './TagPageClient';

type SlugPageProps = Readonly<{
  params: Promise<{ categorySlug: string; tagSlug: string }>;
}>;

export async function generateStaticParams() {
  const { siteScopes, store } = await getSiteData();

  // Post params: /{leafCategory}/{postSlug}
  const postParams = Object.values(store.postMap).map((post) => {
    const leafCategory = getLeafCategory(store, post);
    return {
      categorySlug: leafCategory.slug,
      tagSlug: post.slug,
    };
  });

  // Tag params: /{categorySlug}/{tagSlug} — only at leaf scopes (no children)
  const tagParams: { categorySlug: string; tagSlug: string }[] = [];
  const collectTagParams = (scope: { category: { slug: string }; children: typeof siteScopes; tags: { slug: string }[] }) => {
    if (scope.children.length > 0) {
      scope.children.forEach((child) => collectTagParams(child));
      return;
    }
    scope.tags.forEach((tag) => {
      tagParams.push({
        categorySlug: scope.category.slug,
        tagSlug: tag.slug,
      });
    });
  };
  siteScopes.forEach((scope) => collectTagParams(scope));

  // Filter out any entries with missing slugs and deduplicate
  const seen = new Set<string>();
  return [...postParams, ...tagParams].filter((entry) => {
    if (!entry.categorySlug || !entry.tagSlug) {
      return false;
    }
    const key = `${entry.categorySlug}/${entry.tagSlug}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const { categorySlug, tagSlug } = await params;
  const { store } = await getSiteData();

  // Check if it's a tag
  const tag = Object.values(store.tagMap).find((t) => t.slug === tagSlug);
  if (tag) {
    const category = Object.values(store.categoryMap).find((c) => c.slug === categorySlug);
    return {
      description: `${tag.name} — ${category?.name ?? ''} by King Nitram`,
      openGraph: { title: tag.name },
      title: tag.name,
    };
  }

  // Otherwise it's a post
  const post = Object.values(store.postMap).find((p) => p.slug === tagSlug);
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

const SlugPage = async ({ params }: SlugPageProps) => {
  const { categorySlug, tagSlug } = await params;
  const { store } = await getSiteData();

  // Check if the slug matches a tag
  const tag = Object.values(store.tagMap).find((t) => t.slug === tagSlug);
  if (tag) {
    return <TagPageClient categorySlug={categorySlug} tagSlug={tagSlug} />;
  }

  return <PostPageClient categorySlug={categorySlug} postSlug={tagSlug} />;
};

export default SlugPage;
