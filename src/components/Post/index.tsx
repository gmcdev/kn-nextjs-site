'use client';

import { useInView } from 'react-intersection-observer';

import type { PostWithRelationships } from '@/lib/types';
import useNavigationStore from '@/stores/useNavigationStore';

import AudioPost from './AudioPost';
import DefaultPost from './DefaultPost';

import './style.scss';

type PostProps = Readonly<{
  post: PostWithRelationships;
}>;

export type InViewPostProps = PostProps &
  Readonly<{
    inViewRef: (node?: Element | null) => void;
  }>;

const Post = ({ post }: PostProps) => {
  const setCurrentPost = useNavigationStore((state) => state.setCurrentPost);

  const { ref } = useInView({
    onChange: (inView) => {
      if (inView) {
        setCurrentPost(post);
      }
    },
    threshold: 0.65,
  });

  if (!post.content) {
    return <div />;
  }

  return post.postMeta.contentType === 'audio' ? (
    <AudioPost post={post} inViewRef={ref} />
  ) : (
    <DefaultPost post={post} inViewRef={ref} />
  );
};

export default Post;
