'use client';

import type { TagWithRelationships } from '@/lib/types';

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
            <TagGridItem postId={postId} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagGrid;

type TagGridItemProps = Readonly<{
  postId: string;
}>;

const TagGridItem = ({ postId }: TagGridItemProps) => {
  const { store } = useSiteData();
  const post = store.postMap[postId];
  const { srcSet } = post.cdnFeaturedImage ?? {};
  return srcSet ? <img alt="Post thumbnail" srcSet={srcSet} /> : null;
};
