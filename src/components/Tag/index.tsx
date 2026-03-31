'use client';

import { useInView } from 'react-intersection-observer';

import type { PostWithRelationships, SiteData, TagWithRelationships } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';

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
  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);

  const { ref: tagInViewRef } = useInView({
    onChange: (inView) => {
      if (inView && scope && tag) {
        setCurrentCategoryId(scope.category.id);
        setCurrentTagId(tag.id);
      }
    },
    threshold: 0.1,
  });

  const isMusicCategory = rootCategorySlug === 'music';
  const displayMode: DisplayMode = isMusicCategory
    ? 'list'
    : mediaSize === 'large' ? 'grid' : 'list';

  // single-post mode
  if (post) {
    const postContentType = post.postMeta.contentType;
    const postTag = store.tagMap[post.tagIds[0]];
    return (
      <div className="tag" key={postTag?.id}>
        <div className="tag__header">
          <div className="tag__header-breadcrumbs">
            <Breadcrumbs store={store} post={post} />
          </div>
          <div className="tag__header-name-inactive">{postTag?.name}</div>
        </div>
        <div className={`tag__${postContentType}-posts`}>
          <div className={`tag__${postContentType}-post`} key={post.id}>
            <Post post={post} />
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
    <div className="tag" data-tag-slug={tag.slug} ref={tagInViewRef}>
      <div className="tag__header">
        <div className="tag__header-breadcrumbs">
          <Breadcrumbs store={store} post={tagPost} />
        </div>
        <TagAhref category={scope.category} tag={tag}>
          <div className="tag__header-name">{tag.name}</div>
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
