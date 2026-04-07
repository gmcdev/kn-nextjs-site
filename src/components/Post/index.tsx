'use client';

import type { PostWithRelationships } from '@/lib/types';

import AudioPost from './AudioPost';
import DefaultPost from './DefaultPost';
import VideoPost from './VideoPost';

import './style.scss';

type PostProps = Readonly<{
  post: PostWithRelationships;
}>;

const Post = ({ post }: PostProps) => {
  if (!post.content) {
    return <div />;
  }

  if (post.postMeta.contentType === 'audio') {
    return <AudioPost post={post} />;
  }
  if (post.postMeta.contentType === 'video') {
    return <VideoPost post={post} />;
  }
  return <DefaultPost post={post} />;
};

export default Post;
