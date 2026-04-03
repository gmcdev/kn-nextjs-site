import type { MetadataRoute } from 'next';

import { getSiteData } from '@/lib/data';
import { getLeafCategory } from '@/lib/store';

const BASE_URL = 'https://kingnitram.com/site';

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const { siteScopes, store } = await getSiteData();

  const entries: MetadataRoute.Sitemap = [];

  // Category pages
  Object.values(store.categoryMap).forEach((category) => {
    entries.push({
      changeFrequency: 'weekly',
      priority: 0.8,
      url: `${BASE_URL}/${category.slug}`,
    });
  });

  // Tag pages — only at leaf scopes
  const collectTagEntries = (scope: { category: { slug: string }; children: typeof siteScopes; tags: { slug: string }[] }) => {
    if (scope.children.length > 0) {
      scope.children.forEach((child) => collectTagEntries(child));
      return;
    }
    scope.tags.forEach((tag) => {
      entries.push({
        changeFrequency: 'weekly',
        priority: 0.6,
        url: `${BASE_URL}/${scope.category.slug}/${tag.slug}`,
      });
    });
  };
  siteScopes.forEach((scope) => collectTagEntries(scope));

  // Post pages
  Object.values(store.postMap).forEach((post) => {
    const leafCategory = getLeafCategory(store, post);
    entries.push({
      changeFrequency: 'monthly',
      priority: 0.5,
      url: `${BASE_URL}/${leafCategory.slug}/${post.slug}`,
    });
  });

  return entries;
};

export default sitemap;
