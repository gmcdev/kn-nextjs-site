'use client';

import parse from 'html-react-parser';
import { useMemo } from 'react';

import PauseIcon from '@/icons/PauseIcon';
import PlayIcon from '@/icons/PlayIcon';
import useAudioStore from '@/stores/useAudioStore';
import useModalStore from '@/stores/useModalStore';
import { buildAudioTrack } from '@/utils/audio-manager';
import { CDN_URL } from '@/utils/constants';

import { useSiteData } from '../SiteDataProvider';

import type { PostWithRelationships } from '@/lib/types';

type AudioPostProps = Readonly<{
  post: PostWithRelationships;
}>;

const AudioPost = ({ post }: AudioPostProps) => {
  const { store } = useSiteData();
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const pause = useAudioStore((state) => state.pause);
  const play = useAudioStore((state) => state.play);
  const resume = useAudioStore((state) => state.resume);
  const openModal = useModalStore((state) => state.open);

  const audioRequest = useMemo(() => buildAudioTrack(store, post), [post, store]);
  const parsedTitle = useMemo(() => (post.title ? parse(post.title) : null), [post.title]);

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

  const handleThumbnailClick = () => {
    const tag = post.tagIds[0] ? store.tagMap[post.tagIds[0]] : null;
    if (tag) {
      openModal(post, tag);
    }
  };

  return (
    <article
      className={`post__audio ${isSelected ? 'post__audio--selected' : ''}`}
      itemScope
      itemType="http://schema.org/MusicRecording"
    >
      {audioRequest.thumb ? (
        <button
          aria-label="View artwork"
          className="post__audio--thumbnail"
          onClick={handleThumbnailClick}
        >
          <img
            alt={post.title || 'Track artwork'}
            className="post__audio--thumbnail-image"
            src={`${CDN_URL}${audioRequest.thumb}`}
          />
        </button>
      ) : null}

      <button className="post__audio--player" onClick={handleAudioClick}>
        <h1 itemProp="name" className="post__audio--headline">
          {parsedTitle}
        </h1>
        <div className="post__audio--date">{post.postMeta.creationDate}</div>
      </button>

      <button
        aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
        className={`post__audio--control ${isSelected ? 'post__audio--control-selected' : ''}`}
        onClick={handleAudioClick}
      >
        {isCurrentlyPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
    </article>
  );
};

export default AudioPost;
