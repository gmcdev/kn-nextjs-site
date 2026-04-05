export type Category = {
  id: string;
  isSelected?: boolean;
  name: string;
  parentId: string;
  postIds: string[];
  slug: string;
};

export type Tag = {
  description: string;
  id: string;
  name: string;
  postIds: string[];
  slug: string;
};

export type TagWithRelationships = Tag & {
  postIds: string[];
};

export type PostMeta = {
  contentType: string;
  creationDate: string;
  isPromoted: boolean;
};

export type CdnFeaturedImage = {
  altText: string;
  sizes: string;
  sourceUrl: string;
  srcSet: string;
};

export type Post = {
  cdnFeaturedImage: CdnFeaturedImage | null;
  content: string;
  id: string;
  menuOrder: number;
  postMeta: PostMeta;
  slug: string;
  title: string;
};

export type PostRelationships = {
  categoryIds: string[];
  tagIds: string[];
};

export type PostWithRelationships = Post & PostRelationships;

export type CategoryMap = Record<string, Category>;
export type PostMap = Record<string, PostWithRelationships>;
export type TagMap = Record<string, TagWithRelationships>;

export type Store = {
  categoryBySlug: Record<string, Category>;
  categoryMap: CategoryMap;
  postBySlug: Record<string, PostWithRelationships>;
  postMap: PostMap;
  tagBySlug: Record<string, TagWithRelationships>;
  tagMap: TagMap;
};

export type SiteData = {
  category: Category;
  children: SiteData[];
  tags: TagWithRelationships[];
};
