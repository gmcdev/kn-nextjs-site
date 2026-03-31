'use client';

import parse from 'html-react-parser';

import type { InViewPostProps } from '.';

const DefaultPost = ({ inViewRef, post }: InViewPostProps) => {
  return (
    <article
      ref={inViewRef}
      className="post__default"
      itemScope
      itemType="http://schema.org/Article"
    >
      <div className="post__default__header">
        <div itemProp="headline" className="post__default--headline">
          {post.title ? parse(post.title) : null}
        </div>
        <div className="post__default--date">{post.postMeta.creationDate}</div>
      </div>

      <section className="post__default--article" itemProp="articleBody">
        {parse(post.content)}
      </section>
    </article>
  );
};

export default DefaultPost;
