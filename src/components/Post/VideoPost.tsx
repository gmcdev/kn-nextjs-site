'use client';

import parse from 'html-react-parser';

import type { PostWithRelationships } from '@/lib/types';

type VideoPostProps = Readonly<{
  post: PostWithRelationships;
}>;

const VideoPost = ({ post }: VideoPostProps) => {
  const image = post.cdnFeaturedImage;
  return (
    <article
      className="post__default"
      itemScope
      itemType="http://schema.org/Article"
    >
      <div className="post__default__header">
        <h1 itemProp="headline" className="post__default--headline">
          {post.title ? parse(post.title) : null}
        </h1>
        <div className="post__default--date">{post.postMeta.creationDate}</div>
      </div>
      {image ? (
        <img
          alt={image.altText || post.title}
          className="post__video--thumbnail"
          loading="lazy"
          sizes={image.sizes}
          srcSet={image.srcSet}
        />
      ) : null}
    </article>
  );
};

export default VideoPost;
