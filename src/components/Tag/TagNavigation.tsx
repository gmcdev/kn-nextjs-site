'use client';

import type { TagWithRelationships } from '@/lib/types';
import ArrowLeft from '@/icons/ArrowLeft';
import ArrowRight from '@/icons/ArrowRight';
import CircleIcon from '@/icons/CircleIcon';
import useNavigationStore from '@/stores/useNavigationStore';

type TagNavigationProps = Readonly<{
  contentType: string;
  tag: TagWithRelationships;
}>;

const TagNavigation = ({ contentType, tag }: TagNavigationProps) => {
  const { setTagSwipeFor, tagSwipeMap } = useNavigationStore();
  const currentPostIdx = tagSwipeMap[tag.id] ?? 0;

  const handlePostClick = (postIdx: number) => {
    setTagSwipeFor(tag.id, postIdx);
  };

  return contentType === 'audio' ? null : (
    <div className="tag-list__nav">
      <div className="tag-list__nav-inner">
        <button
          className={`tag-list__nav--left ${currentPostIdx === 0 ? 'tag-list__nav--inactive' : ''}`}
          onClick={() => handlePostClick(currentPostIdx - 1)}
        >
          <ArrowLeft />
        </button>
        <div className="tag-list__nav--posts">
          {tag.postIds.map((postId, idx) => (
            <button
              className={`tag-list__nav--post ${currentPostIdx === idx ? 'tag-list__nav--post-active' : ''}`}
              key={`tag-nav-${postId}`}
              onClick={() => handlePostClick(idx)}
            >
              <CircleIcon />
            </button>
          ))}
        </div>
        <button
          className={`tag-list__nav--right ${
            currentPostIdx === tag.postIds.length - 1 ? 'tag-list__nav--inactive' : ''
          }`}
          onClick={() => handlePostClick(currentPostIdx + 1)}
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default TagNavigation;
