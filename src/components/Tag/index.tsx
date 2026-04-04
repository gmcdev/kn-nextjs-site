'use client';

import type { PostWithRelationships, SiteData, TagWithRelationships } from '@/lib/types';

import useModalStore from '@/stores/useModalStore';

import Breadcrumbs from '../Breadcrumbs';
import TagAhref from '../Breadcrumbs/TagAhref';
import Post from '../Post';
import { useSiteData } from '../SiteDataProvider';
import VirtualizedItem from '../VirtualizedItem';

import { useMediaSize } from '../MediaListener';

import TagGrid from './TagGrid';
import TagList from './TagList';
import TagNavigation from './TagNavigation';

import './style.scss';

type DisplayMode = 'grid' | 'list';

type TagProps = Readonly<{
  post?: PostWithRelationships;
  rootCategorySlug?: string;
  scope?: SiteData;
  tag?: TagWithRelationships;
}>;

const Tag = ({ post, rootCategorySlug, scope, tag }: TagProps) => {
  const { store } = useSiteData();
  const mediaSize = useMediaSize();
  const openModal = useModalStore((state) => state.open);

  const isMusicCategory = rootCategorySlug === 'music';
  const displayMode: DisplayMode = isMusicCategory
    ? 'list'
    : mediaSize === 'large' ? 'grid' : 'list';

  // single-post mode
  if (post) {
    const postContentType = post.postMeta.contentType;
    const postTag = store.tagMap[post.tagIds[0]];

    const handlePostClick = () => {
      if (postTag) {
        openModal(post, postTag);
      }
    };

    return (
      <div className="tag" key={postTag?.id}>
        <div className="tag__header">
          <div className="tag__header-breadcrumbs">
            <Breadcrumbs store={store} post={post} />
          </div>
          <h2 className="tag__header-name-inactive">{postTag?.name}</h2>
        </div>
        <div className={`tag__${postContentType}-posts`}>
          <div className={`tag__${postContentType}-post`} key={post.id}>
            {postContentType === 'audio' ? (
              <Post post={post} />
            ) : (
              <button className="tag__post-button" onClick={handlePostClick}>
                <Post post={post} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // tag mode
  if (!scope || !tag) {
    return null;
  }

  const tagPost = store.postMap[tag.postIds[0]];
  if (!tagPost) {
    return null;
  }

  const contentType = tagPost.postMeta.contentType;

  return (
    <div className="tag" data-tag-slug={tag.slug} data-tag-id={tag.id} data-category-id={scope.category.id}>
      <div className="tag__header">
        <div className="tag__header-breadcrumbs">
          <Breadcrumbs store={store} post={tagPost} />
        </div>
        <TagAhref category={scope.category} tag={tag}>
          <h2 className="tag__header-name">{tag.name}</h2>
        </TagAhref>
        {displayMode === 'list' ? (
          <TagNavigation contentType={contentType} tag={tag} />
        ) : null}
      </div>
      <VirtualizedItem initialHeight={500}>
        {displayMode === 'grid' ? (
          <TagGrid contentType={contentType} tag={tag} />
        ) : (
          <TagList contentType={contentType} tag={tag} />
        )}
      </VirtualizedItem>
    </div>
  );
};

export default Tag;
