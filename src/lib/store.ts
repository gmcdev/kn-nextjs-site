import type {
  Category,
  CategoryMap,
  PostMap,
  PostWithRelationships,
  SiteData,
  Store,
  TagMap,
  TagWithRelationships,
} from './types';

type RemainingItem = {
  category: Category;
  tag: TagWithRelationships;
};

const CATEGORY_ORDER_BY_SLUG = ['art', 'music', 'cars', 'writing', 'misc'];

// --- Store Generation ---

export function generateStore({
  categories,
  posts,
  tags,
}: {
  categories: Category[];
  posts: PostWithRelationships[];
  tags: TagWithRelationships[];
}): Store {
  const categoryMap: CategoryMap = {};
  const categoryBySlug: Record<string, Category> = {};
  categories.forEach((category) => {
    categoryMap[category.id] = category;
    categoryBySlug[category.slug] = category;
  });

  const postMap: PostMap = {};
  const postBySlug: Record<string, PostWithRelationships> = {};
  posts.forEach((post) => {
    postMap[post.id] = post;
    postBySlug[post.slug] = post;
  });

  const tagMap: TagMap = {};
  const tagBySlug: Record<string, TagWithRelationships> = {};
  tags.forEach((tag) => {
    tagMap[tag.id] = tag;
    tagBySlug[tag.slug] = tag;
  });

  return { categoryBySlug, categoryMap, postBySlug, postMap, tagBySlug, tagMap };
}

// --- Site Scopes ---

const scopeHasCategory = (siteScopes: SiteData[], categoryId: string) =>
  siteScopes.find((scope) => scope.category.id === categoryId);

const filterFromRemainingItems = (
  category: Category,
  tag: TagWithRelationships,
  remainingItems: RemainingItem[],
) => {
  const index = remainingItems.findIndex(
    (item) => item.category.id === category.id && item.tag.id === tag.id,
  );
  if (index !== -1) {
    remainingItems.splice(index, 1);
  }
};

const applyTagToCategory = (
  siteScopes: SiteData[],
  category: Category,
  tag: TagWithRelationships,
  remainingItems: RemainingItem[],
): SiteData[] => {
  filterFromRemainingItems(category, tag, remainingItems);
  const existingItem = scopeHasCategory(siteScopes, category.id);
  if (existingItem) {
    const hasTag = existingItem.tags.find((categoryTag) => categoryTag.id === tag.id);
    if (!hasTag) {
      existingItem.tags.push(tag);
    }
    return siteScopes;
  }
  return [
    ...siteScopes,
    {
      category,
      children: [],
      tags: [tag],
    },
  ];
};

const appendTagAndPostPerCategoryHierarchy = (
  siteScopes: SiteData[],
  category: Category,
  tag: TagWithRelationships,
  remainingItems: RemainingItem[],
): SiteData[] | undefined => {
  const isTopLevelCategory = !category.parentId;
  if (isTopLevelCategory) {
    return applyTagToCategory(siteScopes, category, tag, remainingItems);
  }
  const parentCategory = scopeHasCategory(siteScopes, category.parentId);
  if (parentCategory) {
    parentCategory.children = applyTagToCategory(
      parentCategory.children,
      category,
      tag,
      remainingItems,
    );
    return siteScopes;
  }
  for (const scopeCategory of siteScopes) {
    const branch = appendTagAndPostPerCategoryHierarchy(
      scopeCategory.children,
      category,
      tag,
      remainingItems,
    );
    if (branch) {
      return [
        ...siteScopes,
        {
          ...scopeCategory,
          children: [...scopeCategory.children, branch],
        },
      ] as SiteData[];
    }
  }
  return undefined;
};

export function buildSiteScopes(store: Store, tags: TagWithRelationships[]): SiteData[] {
  let siteScopes: SiteData[] = [];
  const remainingItems: RemainingItem[] = [];

  tags.forEach((tag) => {
    tag.postIds.forEach((postId) => {
      const post = store.postMap[postId];
      if (!post) {
        return;
      }
      post.categoryIds.forEach((categoryId) => {
        const category = store.categoryMap[categoryId];
        if (!category) {
          return;
        }
        const result = appendTagAndPostPerCategoryHierarchy(
          siteScopes,
          category,
          tag,
          remainingItems,
        );
        if (result) {
          siteScopes = result;
        } else {
          remainingItems.push({ category, tag });
        }
      });
    });
  });

  let madeProgress = true;
  while (remainingItems.length > 0 && madeProgress) {
    const currentLength = remainingItems.length;
    [...remainingItems].forEach((item) => {
      appendTagAndPostPerCategoryHierarchy(siteScopes, item.category, item.tag, remainingItems);
    });
    madeProgress = currentLength !== remainingItems.length;
  }

  return orderSiteDataCategories(siteScopes);
}

// --- Ordering ---

function orderSiteDataCategories(siteScopes: SiteData[]): SiteData[] {
  return CATEGORY_ORDER_BY_SLUG.reduce((acc, slug) => {
    const siteScope = siteScopes.find((scope) => scope.category.slug === slug);
    if (siteScope) {
      acc.push(siteScope);
    }
    return acc;
  }, [] as SiteData[]);
}

function orderSiteScopeCategories(siteScopes: SiteData[]): SiteData[] {
  return siteScopes.sort((a, b) => {
    if (a.category.name < b.category.name) {
      return 1;
    }
    if (a.category.name > b.category.name) {
      return -1;
    }
    return 0;
  });
}

function orderCategoryTags(tags: TagWithRelationships[]): TagWithRelationships[] {
  return tags.sort((a, b) => (a.description ?? '').localeCompare(b.description ?? ''));
}

function orderPosts(posts: PostWithRelationships[]): PostWithRelationships[] {
  return posts.sort((a, b) => a.menuOrder - b.menuOrder);
}

function orderTagPosts(store: Store, tag: TagWithRelationships): TagWithRelationships {
  const posts = orderPosts(tag.postIds.map((postId) => store.postMap[postId]));
  return {
    ...tag,
    postIds: posts.map((post) => post.id),
  };
}

function orderSiteData(store: Store, siteData: SiteData): SiteData {
  const children = siteData.children.length > 0
    ? orderSiteScopeCategories(
        siteData.children.map((child) => orderSiteData(store, child)),
      )
    : [];

  const tags = orderCategoryTags(siteData.tags).map((tag) => orderTagPosts(store, tag));

  return { ...siteData, children, tags };
}

export function orderSiteScopes(store: Store, siteScopes: SiteData[]): SiteData[] {
  return siteScopes.map((siteData) => orderSiteData(store, siteData));
}

// --- Category Route Helpers ---

export function getLeafCategory(store: Store, post: PostWithRelationships): Category {
  const postCategories = post.categoryIds.map((id) => store.categoryMap[id]);

  const topLevel: Category[] = [];
  const children: Category[] = [];
  postCategories.forEach((category) => {
    if (!category.parentId) {
      topLevel.push(category);
    } else {
      children.push(category);
    }
  });

  const ordered = [...topLevel, ...children];
  const branch: Category[] = [ordered[0]];

  for (let i = 1; i < ordered.length; i++) {
    const category = ordered[i];
    const parentIndex = branch.findIndex((c) => c.id === category.parentId);
    if (parentIndex !== -1) {
      branch.splice(parentIndex + 1, 0, category);
    }
  }

  return branch[branch.length - 1];
}

export function orderTopCategories(categories: Category[], currentCategory?: Category): (Category | undefined)[] {
  return CATEGORY_ORDER_BY_SLUG.map((slug) => {
    const category = categories.find((c) => c.slug === slug);
    if (category) {
      return {
        ...category,
        isSelected: category.slug === currentCategory?.slug,
      };
    }
    return undefined;
  });
}

// --- Shared Utilities ---

export function getRootCategory(store: Store, category: Category): Category {
  let current = category;
  while (current.parentId && store.categoryMap[current.parentId]) {
    current = store.categoryMap[current.parentId];
  }
  return current;
}

export function collectAllTags(siteScopes: SiteData[]): { categoryId: string; tag: TagWithRelationships }[] {
  const result: { categoryId: string; tag: TagWithRelationships }[] = [];
  const walk = (scope: SiteData) => {
    if (scope.children.length > 0) {
      scope.children.forEach((child) => walk(child));
    }
    scope.tags.forEach((tag) => {
      result.push({ categoryId: scope.category.id, tag });
    });
  };
  siteScopes.forEach((scope) => walk(scope));
  return result;
}
