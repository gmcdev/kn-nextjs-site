/**
 * Verifies WordPress content is being fetched correctly.
 * Mirrors the fetch/store logic from src/lib/ without running a full Next.js build.
 * When WP_FRESH=1, fetches from WordPress and updates the local cache.
 *
 * Usage:
 *   node dev-ops/verify-content.mjs              # use existing cache
 *   WP_FRESH=1 node dev-ops/verify-content.mjs   # fetch fresh from WordPress + update cache
 *   WP_FRESH=1 node dev-ops/verify-content.mjs cars  # filter to one category
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GRAPHQL_ENDPOINT = 'https://kingnitram.com/admin/graphql';
const PAGE_SIZE = 100;
const CACHE_PATH = join(import.meta.dirname, '..', '.wp-cache.json');
const categoryFilter = process.argv[2] ?? null;

// --- Fetch ---

async function fetchGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    body: JSON.stringify({ query, variables }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function fetchAllPages(query, getNodes, getPageInfo) {
  const allNodes = [];
  let hasNextPage = true;
  let after = null;
  while (hasNextPage) {
    const data = await fetchGraphQL(query, { first: PAGE_SIZE, after });
    allNodes.push(...getNodes(data));
    ({ hasNextPage, endCursor: after } = getPageInfo(data));
  }
  return allNodes;
}

const CATEGORIES_QUERY = `
  query($first: Int!, $after: String) {
    categories(first: $first, after: $after) {
      nodes { id name slug parentId posts(first: 100) { nodes { id } } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const TAGS_QUERY = `
  query($first: Int!, $after: String) {
    tags(first: $first, after: $after) {
      nodes { description id name slug posts(first: 100) { nodes { id } } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

// Mirrors the full POSTS_QUERY in src/lib/wordpress.ts — must stay in sync.
const POSTS_QUERY = `
  query($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      nodes {
        categories { nodes { id } }
        cdnFeaturedImageRaw
        content
        id
        menuOrder
        postMeta { contentType creationDate isPromoted }
        slug
        tags { nodes { id } }
        title
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

function parseCdnFeaturedImage(raw) {
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && 'sourceUrl' in parsed && 'srcSet' in parsed && 'sizes' in parsed && 'altText' in parsed) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

// --- Load data ---

let categories, tags, posts;

const freshFetch = process.env.WP_FRESH === '1';

if (!freshFetch && existsSync(CACHE_PATH)) {
  ({ categories, tags, posts } = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')));
  console.log(`Using cache: ${categories.length} categories, ${tags.length} tags, ${posts.length} posts\n`);
} else {
  console.log('Fetching from WordPress...');
  const rawCategories = await fetchAllPages(CATEGORIES_QUERY, d => d.categories.nodes, d => d.categories.pageInfo);
  const rawTags = await fetchAllPages(TAGS_QUERY, d => d.tags.nodes, d => d.tags.pageInfo);
  const rawPosts = await fetchAllPages(POSTS_QUERY, d => d.posts.nodes, d => d.posts.pageInfo);

  categories = rawCategories
    .filter(c => c.posts.nodes.length > 0)
    .map(({ posts, parentId, ...rest }) => ({ ...rest, parentId: parentId ?? '', postIds: posts.nodes.map(p => p.id) }));

  tags = rawTags.map(({ posts, description, ...rest }) => ({
    ...rest,
    description: description ?? '',
    postIds: posts.nodes.map(p => p.id),
  }));

  posts = rawPosts.map(({ categories, cdnFeaturedImageRaw, postMeta, tags, title, ...rest }) => ({
    ...rest,
    categoryIds: categories.nodes.map(c => c.id),
    cdnFeaturedImage: parseCdnFeaturedImage(cdnFeaturedImageRaw),
    postMeta: {
      contentType: postMeta?.contentType ?? null,
      creationDate: postMeta?.creationDate ?? null,
      isPromoted: postMeta?.isPromoted === true || postMeta?.isPromoted === 'true',
    },
    tagIds: tags.nodes.map(t => t.id),
    title: title === '' ? 'Untitled' : title,
  }));

  writeFileSync(CACHE_PATH, JSON.stringify({ categories, posts, tags }));
  console.log(`Fetched: ${categories.length} categories, ${tags.length} tags, ${posts.length} posts (cache updated)\n`);
}

// --- Build store ---

const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));
const postMap = {};

posts.forEach(post => {
  const validCategoryIds = post.categoryIds.filter(id => categoryMap[id]);
  const validTagIds = post.tagIds.filter(id => tags.some(t => t.id === id));
  if (validCategoryIds.length === 0 || validTagIds.length === 0) {
    return;
  }
  postMap[post.id] = { ...post, categoryIds: validCategoryIds, tagIds: validTagIds };
});

const tagMap = {};
tags.forEach(tag => {
  const validPostIds = tag.postIds.filter(id => postMap[id]);
  if (validPostIds.length > 0) {
    tagMap[tag.id] = { ...tag, postIds: validPostIds };
  }
});

// --- Report ---

const topLevel = categories.filter(c => !c.parentId);
const children = categories.filter(c => c.parentId);

const filteredTopLevel = categoryFilter
  ? topLevel.filter(c => c.slug === categoryFilter)
  : topLevel;

if (filteredTopLevel.length === 0) {
  console.log(`No top-level category found matching "${categoryFilter}"`);
  process.exit(1);
}

filteredTopLevel.forEach(parent => {
  console.log(`\n== ${parent.name} (${parent.slug}) ==`);

  const subcategories = children.filter(c => c.parentId === parent.id);
  const scopes = subcategories.length > 0 ? subcategories : [parent];

  scopes.forEach(category => {
    const label = category.id === parent.id ? '  (top-level)' : `  ${category.name}`;
    console.log(label);

    const relevantTags = Object.values(tagMap).filter(tag =>
      tag.postIds.some(postId => {
        const post = postMap[postId];
        return post?.categoryIds.includes(category.id);
      })
    );

    if (relevantTags.length === 0) {
      console.log('    (no tags)');
      return;
    }

    relevantTags.forEach(tag => {
      const tagPosts = tag.postIds.filter(postId => {
        const post = postMap[postId];
        return post?.categoryIds.includes(category.id);
      });
      console.log(`    [${tagPosts.length} posts] ${tag.name}`);
    });
  });
});

// Report dropped posts
const droppedPosts = posts.filter(p => !postMap[p.id]);
if (droppedPosts.length > 0) {
  console.log(`\n-- ${droppedPosts.length} posts dropped (no valid category+tag match) --`);
  if (categoryFilter) {
    const relevantDropped = droppedPosts.filter(p =>
      p.categoryIds.some(id => {
        const cat = categoryMap[id];
        return cat && (cat.slug === categoryFilter || cat.slug.startsWith(categoryFilter + '-'));
      })
    );
    if (relevantDropped.length > 0) {
      console.log(`  ${relevantDropped.length} in "${categoryFilter}":`);
      relevantDropped.forEach(p => console.log(`    ${p.id} — ${p.title ?? '(untitled)'}`));
    }
  }
}
