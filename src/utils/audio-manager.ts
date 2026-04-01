import parse from 'html-react-parser';

import type { AudioTrack } from '@/stores/useAudioStore';
import type { PostWithRelationships, SiteData, Store } from '@/lib/types';

import { getPostUri } from '@/components/Breadcrumbs/functions/getPostUri';
import { getLeafCategory } from '@/lib/store';
import { CDN_URL } from '@/utils/constants';
import withBasePath from '@/utils/withBasePath';

export const buildAudioTrack = (store: Store, post: PostWithRelationships): AudioTrack | null => {
  const postContentElements = parse(post.content);
  if (typeof postContentElements === 'string' || !Array.isArray(postContentElements)) {
    return null;
  }
  const audioElement = postContentElements.find(
    (element) => typeof element !== 'string' && element.props?.className === 'wp-block-audio',
  );
  if (!audioElement || typeof audioElement === 'string') {
    return null;
  }

  const audioUrl = audioElement.props.children?.props?.src;
  const audioPath = audioUrl && URL.canParse(audioUrl)
    ? new URL(audioUrl).pathname
    : audioUrl;

  const { sourceUrl } = post.cdnFeaturedImage ?? {};
  const thumbUrl = sourceUrl && URL.canParse(sourceUrl) ? new URL(sourceUrl).pathname : sourceUrl;

  const category = getLeafCategory(store, post);
  const postUri = category ? getPostUri(category, post) : undefined;

  return {
    link: postUri ? withBasePath(postUri) : undefined,
    postId: post.id,
    src: audioPath ? `${CDN_URL}${audioPath}` : '',
    thumb: thumbUrl,
    title: post.title,
  };
};

export const getOrderedAudioPostIds = (store: Store, siteScopes: SiteData[]): string[] => {
  const postIds: string[] = [];

  const collectFromScope = (scope: SiteData) => {
    if (scope.children.length > 0) {
      scope.children.forEach((child) => collectFromScope(child));
    }
    scope.tags.forEach((tag) => {
      tag.postIds.forEach((postId) => {
        const post = store.postMap[postId];
        if (post?.postMeta.contentType === 'audio') {
          postIds.push(postId);
        }
      });
    });
  };

  siteScopes.forEach((scope) => collectFromScope(scope));
  return postIds;
};
