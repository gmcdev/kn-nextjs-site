'use client';

import type { TagWithRelationships } from '@/lib/types';
import useModalStore from '@/stores/useModalStore';

import { useSiteData } from '../../SiteDataProvider';

import './style.scss';

type TagGridProps = Readonly<{
  contentType: string;
  tag: TagWithRelationships;
}>;

const TagGrid = ({ contentType, tag }: TagGridProps) => {
  const gridHeight = (() => {
    if (tag.postIds.length > 4) {
      return '250px';
    } else if (tag.postIds.length === 4) {
      return '30vh';
    } else if (tag.postIds.length === 3) {
      return '40vh';
    } else if (tag.postIds.length === 2) {
      return '50vh';
    } else {
      return '80vh';
    }
  })();

  return (
    <div className="tag-grid">
      <div className={`tag-grid__${contentType}-posts`}>
        {tag.postIds.map((postId) => (
          <div
            className={`tag-grid__${contentType}-post`}
            key={postId}
            style={{ height: gridHeight }}
          >
            <TagGridItem postId={postId} tag={tag} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagGrid;

type TagGridItemProps = Readonly<{
  postId: string;
  tag: TagWithRelationships;
}>;

const TagGridItem = ({ postId, tag }: TagGridItemProps) => {
  const { store } = useSiteData();
  const open = useModalStore((state) => state.open);
  const post = store.postMap[postId];
  const { srcSet } = post.cdnFeaturedImage ?? {};

  if (!srcSet) {
    return null;
  }

  return (
    <button className="tag-grid__post-button" onClick={() => open(post, store.tagMap[tag.id] ?? tag)}>
      <img alt={post.cdnFeaturedImage?.altText ?? 'Post thumbnail'} loading="lazy" srcSet={srcSet} />
    </button>
  );
};
