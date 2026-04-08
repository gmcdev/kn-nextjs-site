'use client';

import parse from 'html-react-parser';
import { useMemo } from 'react';

import parseLazyMedia from '@/utils/parseLazyMedia';

import type { PostWithRelationships } from '@/lib/types';

type DefaultPostProps = Readonly<{
  post: PostWithRelationships;
}>;

const DefaultPost = ({ post }: DefaultPostProps) => {
  const parsedTitle = useMemo(() => (post.title ? parse(post.title) : null), [post.title]);
  const parsedContent = useMemo(() => parse(post.content, parseLazyMedia), [post.content]);

  return (
    <article
      className="post__default"
      itemScope
      itemType="http://schema.org/Article"
    >
      <div className="post__default__header">
        <h1 itemProp="headline" className="post__default--headline">
          {parsedTitle}
        </h1>
        <div className="post__default--date">{post.postMeta.creationDate}</div>
      </div>

      <section className="post__default--article" itemProp="articleBody">
        {parsedContent}
      </section>
    </article>
  );
};

export default DefaultPost;
