'use client';

import parse from 'html-react-parser';
import { useMemo } from 'react';

import PauseIcon from '@/icons/PauseIcon';
import PlayIcon from '@/icons/PlayIcon';
import useAudioStore from '@/stores/useAudioStore';
import useModalStore from '@/stores/useModalStore';
import { CDN_URL } from '@/utils/constants';
import withBasePath from '@/utils/withBasePath';

import findCategoryByPost from '../Breadcrumbs/functions/findCategoryByPost';
import { getPostUri } from '../Breadcrumbs/functions/getPostUri';
import { useSiteData } from '../SiteDataProvider';

import type { InViewPostProps } from '.';

const AudioPost = ({ inViewRef, post }: InViewPostProps) => {
  const { store } = useSiteData();
  const { currentTrack, isPlaying, pause, play, resume } = useAudioStore();
  const openModal = useModalStore((state) => state.open);

  const audioRequest = useMemo(() => {
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

    const category = findCategoryByPost(store, post);
    const postUri = category ? getPostUri(category, post) : undefined;

    return {
      link: postUri ? withBasePath(postUri) : undefined,
      postId: post.id,
      src: audioPath ? `${CDN_URL}${audioPath}` : '',
      thumb: thumbUrl,
      title: post.title,
    };
  }, [post, store]);

  if (!audioRequest) {
    return null;
  }

  const isSelected = currentTrack?.postId === post.id;
  const isCurrentlyPlaying = isSelected && isPlaying;

  const handleAudioClick = () => {
    if (!isSelected) {
      play(audioRequest);
    } else if (isCurrentlyPlaying) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <button
      className={`post__audio ${isSelected ? 'post__audio--selected' : ''}`}
      ref={inViewRef}
      onClick={handleAudioClick}
    >
      {audioRequest.thumb ? (
        <div
          className="post__audio--thumbnail"
          style={{ backgroundImage: `url(${CDN_URL}${audioRequest.thumb})` }}
          onClick={(event) => {
            event.stopPropagation();
            const tag = post.tagIds[0] ? store.tagMap[post.tagIds[0]] : null;
            if (tag) {
              openModal(post, tag);
            }
          }}
        />
      ) : null}

      <div className="post__audio--player">
        <div itemProp="headline" className="post__audio--headline">
          {post.title ? parse(post.title) : null}
        </div>
        <div className="post__audio--date">{post.postMeta.creationDate}</div>
      </div>

      <div
        className={`post__audio--control ${isSelected ? 'post__audio--control-selected' : ''}`}
      >
        {isCurrentlyPlaying ? <PauseIcon /> : <PlayIcon />}
      </div>
    </button>
  );
};

export default AudioPost;
