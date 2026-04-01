'use client';

import type { PostWithRelationships } from '@/lib/types';

import AudioPost from './AudioPost';
import DefaultPost from './DefaultPost';

import './style.scss';

type PostProps = Readonly<{
  post: PostWithRelationships;
}>;

const Post = ({ post }: PostProps) => {
  if (!post.content) {
    return <div />;
  }

  return post.postMeta.contentType === 'audio' ? (
    <AudioPost post={post} />
  ) : (
    <DefaultPost post={post} />
  );
};

export default Post;
