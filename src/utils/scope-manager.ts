import type { Category, PostWithRelationships, SiteData, Store } from '@/lib/types';

type RelativeScopes = {
  newerScope: SiteData | null;
  olderScope: SiteData | null;
  scope: SiteData;
};

export type Neighbors = {
  current?: PostWithRelationships;
  newer?: PostWithRelationships;
  older?: PostWithRelationships;
};

function findCategoryScope(
  categoryId: string,
  { newerScope, olderScope, scope }: RelativeScopes,
): RelativeScopes | null {
  if (scope.children.length > 0) {
    const matchedChildResult = scope.children.reduce<RelativeScopes | null>(
      (result, childScope, i) => {
        if (result) {
          return result;
        }
        return findCategoryScope(categoryId, {
          newerScope: i > 0 ? scope.children[i - 1] : null,
          olderScope: i < scope.children.length - 1 ? scope.children[i + 1] : null,
          scope: childScope,
        });
      },
      null,
    );
    if (matchedChildResult) {
      return matchedChildResult;
    }
  }
  return scope.category.id === categoryId
    ? { newerScope, olderScope, scope }
    : null;
}

type HighestScope = { highestScope?: SiteData } & RelativeScopes;

export function getRequestedScopes(
  siteScopes: SiteData[],
  category: Category,
): HighestScope | null {
  return siteScopes.reduce<HighestScope | null>((result, scope, i) => {
    if (result) {
      return result;
    }
    const foundScope = findCategoryScope(category.id, {
      newerScope: i > 0 ? siteScopes[i - 1] : null,
      olderScope: i < siteScopes.length - 1 ? siteScopes[i + 1] : null,
      scope,
    });
    if (foundScope) {
      return {
        highestScope: siteScopes[i],
        ...foundScope,
      };
    }
    return null;
  }, null);
}

export function getFirstPost(store: Store, scope: SiteData): PostWithRelationships {
  if (scope.children.length > 0) {
    return getFirstPost(store, scope.children[0]);
  }
  return store.postMap[scope.tags[0].postIds[0]];
}

export function getLastPost(store: Store, scope: SiteData): PostWithRelationships {
  if (scope.children.length > 0) {
    return getLastPost(store, scope.children[scope.children.length - 1]);
  }
  const lastTag = scope.tags[scope.tags.length - 1];
  return store.postMap[lastTag.postIds[lastTag.postIds.length - 1]];
}

function getTagPostNeighbors(
  store: Store,
  scope: SiteData,
  postId: string,
  relatives: Neighbors = {},
): Neighbors {
  return scope.tags.reduce((result, tag, tagIndex) => {
    const currentPostIndex = tag.postIds.findIndex((tagPostId) => tagPostId === postId);
    if (currentPostIndex === -1) {
      return result;
    }

    result.current = store.postMap[tag.postIds[currentPostIndex]];

    // newer post
    if (currentPostIndex > 0) {
      result.newer = store.postMap[tag.postIds[currentPostIndex - 1]];
    } else if (tagIndex > 0) {
      let newerTagIndex = tagIndex - 1;
      while (newerTagIndex >= 0 && !result.newer) {
        const newerTag = scope.tags[newerTagIndex];
        if (newerTag.postIds.length > 0) {
          result.newer = store.postMap[newerTag.postIds[newerTag.postIds.length - 1]];
        }
        newerTagIndex--;
      }
    }

    // older post
    if (currentPostIndex < tag.postIds.length - 1) {
      result.older = store.postMap[tag.postIds[currentPostIndex + 1]];
    } else if (tagIndex < scope.tags.length - 1) {
      let olderTagIndex = tagIndex + 1;
      while (olderTagIndex < scope.tags.length && !result.older) {
        const olderTag = scope.tags[olderTagIndex];
        if (olderTag.postIds.length > 0) {
          result.older = store.postMap[olderTag.postIds[0]];
        }
        olderTagIndex++;
      }
    }

    return result;
  }, relatives);
}

export function getPostNeighbors(
  store: Store,
  scope: SiteData,
  postId: string,
  relatives: Neighbors = {},
): Neighbors {
  if (scope.children.length > 0) {
    for (const [i, childScope] of scope.children.entries()) {
      relatives = getTagPostNeighbors(store, childScope, postId, relatives);
      if (relatives.current) {
        if (!relatives.newer && i > 0) {
          relatives.newer = getLastPost(store, scope.children[i - 1]);
        }
        if (!relatives.older && i < scope.children.length - 1) {
          relatives.older = getFirstPost(store, scope.children[i + 1]);
        }
        return relatives;
      }
    }
  }
  return getTagPostNeighbors(store, scope, postId, relatives);
}
