import type {
  Category,
  CdnFeaturedImage,
  PostWithRelationships,
  TagWithRelationships,
} from './types';

const GRAPHQL_ENDPOINT = 'https://kingnitram.com/admin/graphql';
const PAGE_SIZE = 100;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function fetchGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
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

      return json.data as T;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`GraphQL fetch attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`, error);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Unreachable');
}

function isCdnFeaturedImage(value: unknown): value is CdnFeaturedImage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sourceUrl' in value &&
    'srcSet' in value &&
    'sizes' in value &&
    'altText' in value
  );
}

function parseCdnFeaturedImage(raw: unknown): CdnFeaturedImage | null {
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (isCdnFeaturedImage(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

// --- Categories ---

interface CategoriesResponse {
  categories: {
    nodes: {
      id: string;
      name: string;
      parentDatabaseId: number;
      parentId: string | null;
      posts: {
        nodes: { id: string }[];
      };
      slug: string;
    }[];
    pageInfo: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
  };
}

const CATEGORIES_QUERY = `
  query WpCategories($first: Int!, $after: String) {
    categories(first: $first, after: $after) {
      nodes {
        id
        parentId
        parentDatabaseId
        slug
        name
        posts(first: 100) {
          nodes {
            id
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export async function fetchCategories(): Promise<Category[]> {
  const allNodes: CategoriesResponse['categories']['nodes'] = [];
  let hasNextPage = true;
  let after: string | null = null;

  while (hasNextPage) {
    const data: CategoriesResponse = await fetchGraphQL<CategoriesResponse>(CATEGORIES_QUERY, {
      after,
      first: PAGE_SIZE,
    });
    allNodes.push(...data.categories.nodes);
    hasNextPage = data.categories.pageInfo.hasNextPage;
    after = data.categories.pageInfo.endCursor;
  }

  return allNodes
    .filter((node) => node.posts.nodes.length > 0)
    .map(({ parentId, posts, ...rest }) => ({
      ...rest,
      parentId: parentId ?? '',
      postIds: posts.nodes.map((post) => post.id),
    }));
}

// --- Tags ---

interface TagsResponse {
  tags: {
    nodes: {
      description: string | null;
      id: string;
      name: string;
      posts: {
        nodes: { id: string }[];
      };
      slug: string;
    }[];
    pageInfo: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
  };
}

const TAGS_QUERY = `
  query WpTags($first: Int!, $after: String) {
    tags(first: $first, after: $after) {
      nodes {
        description
        id
        name
        slug
        posts(first: 100) {
          nodes {
            id
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export async function fetchTags(): Promise<TagWithRelationships[]> {
  const allNodes: TagsResponse['tags']['nodes'] = [];
  let hasNextPage = true;
  let after: string | null = null;

  while (hasNextPage) {
    const data: TagsResponse = await fetchGraphQL<TagsResponse>(TAGS_QUERY, {
      after,
      first: PAGE_SIZE,
    });
    allNodes.push(...data.tags.nodes);
    hasNextPage = data.tags.pageInfo.hasNextPage;
    after = data.tags.pageInfo.endCursor;
  }

  return allNodes.map(({ description, posts, ...rest }) => ({
    ...rest,
    description: description ?? '',
    postIds: posts.nodes.map((post) => post.id),
  }));
}

// --- Posts ---

interface PostsResponse {
  posts: {
    nodes: {
      categories: {
        nodes: { id: string }[];
      };
      cdnFeaturedImageRaw: string | null;
      content: string;
      id: string;
      menuOrder: number;
      postMeta: {
        contentType: string;
        creationDate: string;
      };
      slug: string;
      tags: {
        nodes: { id: string }[];
      };
      title: string;
    }[];
    pageInfo: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
  };
}

const POSTS_QUERY = `
  query WpPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      nodes {
        categories {
          nodes {
            id
          }
        }
        cdnFeaturedImageRaw
        content
        id
        menuOrder
        postMeta {
          contentType
          creationDate
        }
        slug
        title
        tags {
          nodes {
            id
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export async function fetchPosts(): Promise<PostWithRelationships[]> {
  const allNodes: PostsResponse['posts']['nodes'] = [];
  let hasNextPage = true;
  let after: string | null = null;

  while (hasNextPage) {
    const data: PostsResponse = await fetchGraphQL<PostsResponse>(POSTS_QUERY, {
      after,
      first: PAGE_SIZE,
    });
    allNodes.push(...data.posts.nodes);
    hasNextPage = data.posts.pageInfo.hasNextPage;
    after = data.posts.pageInfo.endCursor;
  }

  return allNodes.map(({ categories, cdnFeaturedImageRaw, tags, title, ...rest }) => ({
    ...rest,
    categoryIds: categories.nodes.map((category) => category.id),
    cdnFeaturedImage: parseCdnFeaturedImage(cdnFeaturedImageRaw),
    tagIds: tags.nodes.map((tag) => tag.id),
    title: title === '' ? 'Untitled' : title,
  }));
}
