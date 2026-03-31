import { buildSiteScopes, generateStore, orderSiteScopes } from './store';
import type { Category, PostWithRelationships, SiteData, Store } from './types';
import { fetchCategories, fetchPosts, fetchTags } from './wordpress';

let cachedStore: Store | null = null;
let cachedSiteScopes: SiteData[] | null = null;

export async function getSiteData(): Promise<{ siteScopes: SiteData[]; store: Store }> {
  if (cachedStore && cachedSiteScopes) {
    return { siteScopes: cachedSiteScopes, store: cachedStore };
  }

  const [categories, tags, posts] = await Promise.all([
    fetchCategories(),
    fetchTags(),
    fetchPosts(),
  ]);

  console.log(
    `Fetched ${categories.length} categories, ${tags.length} tags, ${posts.length} posts`,
  );

  const store = generateStore({ categories, posts, tags });
  const siteScopes = orderSiteScopes(store, buildSiteScopes(store, tags));

  cachedStore = store;
  cachedSiteScopes = siteScopes;

  return { siteScopes, store };
}

export async function getStore(): Promise<Store> {
  const { store } = await getSiteData();
  return store;
}

export async function getSiteScopes(): Promise<SiteData[]> {
  const { siteScopes } = await getSiteData();
  return siteScopes;
}

export async function getPostBySlug(slug: string): Promise<PostWithRelationships | null> {
  const { store } = await getSiteData();
  const post = Object.values(store.postMap).find((p) => p.slug === slug);
  return post ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { store } = await getSiteData();
  const category = Object.values(store.categoryMap).find((c) => c.slug === slug);
  return category ?? null;
}
