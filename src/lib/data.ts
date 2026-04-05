import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildPromotedScopes, buildSiteScopes, generateStore, orderSiteScopes } from './store';
import type { Category, PostWithRelationships, SiteData, Store, TagWithRelationships } from './types';
import { fetchCategories, fetchPosts, fetchTags } from './wordpress';

const CACHE_PATH = join(process.cwd(), '.wp-cache.json');

type CachedData = {
  categories: Category[];
  posts: PostWithRelationships[];
  tags: TagWithRelationships[];
};

function readCache(): CachedData | null {
  if (!existsSync(CACHE_PATH)) {
    return null;
  }
  try {
    const raw = readFileSync(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as CachedData;
  } catch {
    return null;
  }
}

function writeCache(data: CachedData): void {
  writeFileSync(CACHE_PATH, JSON.stringify(data));
}

let cachedStore: Store | null = null;
let cachedSiteScopes: SiteData[] | null = null;
let cachedPromotedScopes: SiteData[] | null = null;

export async function getSiteData(): Promise<{ promotedScopes: SiteData[]; siteScopes: SiteData[]; store: Store }> {
  if (cachedStore && cachedSiteScopes && cachedPromotedScopes) {
    return { promotedScopes: cachedPromotedScopes, siteScopes: cachedSiteScopes, store: cachedStore };
  }

  const freshFetch = process.env.WP_FRESH === '1';
  const diskCache = freshFetch ? null : readCache();

  let categories: Category[];
  let tags: TagWithRelationships[];
  let posts: PostWithRelationships[];

  if (diskCache) {
    categories = diskCache.categories;
    tags = diskCache.tags;
    posts = diskCache.posts;
    console.log(
      `Loaded ${categories.length} categories, ${tags.length} tags, ${posts.length} posts from cache`,
    );
  } else {
    categories = await fetchCategories();
    tags = await fetchTags();
    posts = await fetchPosts();
    console.log(
      `Fetched ${categories.length} categories, ${tags.length} tags, ${posts.length} posts`,
    );
    writeCache({ categories, posts, tags });
  }

  const categoryFilter = process.env.WP_CATEGORY;
  if (categoryFilter) {
    const rootCategory = categories.find((c) => c.slug === categoryFilter);
    if (rootCategory) {
      const rootId = rootCategory.id;
      categories = categories.filter((c) => c.id === rootId || c.parentId === rootId);
      const categoryIds = new Set(categories.map((c) => c.id));
      posts = posts.filter((p) => p.categoryIds.some((id) => categoryIds.has(id)));
      const postIds = new Set(posts.map((p) => p.id));
      tags = tags.filter((t) => t.postIds.some((id) => postIds.has(id)));
      console.log(
        `Filtered to "${categoryFilter}": ${categories.length} categories, ${tags.length} tags, ${posts.length} posts`,
      );
    }
  }

  const store = generateStore({ categories, posts, tags });
  const siteScopes = orderSiteScopes(store, buildSiteScopes(store, tags));
  const promotedScopes = buildPromotedScopes(store, siteScopes);

  cachedStore = store;
  cachedSiteScopes = siteScopes;
  cachedPromotedScopes = promotedScopes;

  return { promotedScopes, siteScopes, store };
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
  return store.postBySlug[slug] ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { store } = await getSiteData();
  return store.categoryBySlug[slug] ?? null;
}
