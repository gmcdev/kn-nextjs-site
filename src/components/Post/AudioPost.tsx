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
  const { currentTrack, isPlaying, pause, play, resume } = useAudioStore();
  const openModal = useModalStore((state) => state.open);

  const audioRequest = useMemo(() => buildAudioTrack(store, post), [post, store]);

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
    <div
      className={`post__audio ${isSelected ? 'post__audio--selected' : ''}`}
    >
      {audioRequest.thumb ? (
        <button
          aria-label="View artwork"
          className="post__audio--thumbnail"
          style={{ backgroundImage: `url(${CDN_URL}${audioRequest.thumb})` }}
          onClick={handleThumbnailClick}
        />
      ) : null}

      <button className="post__audio--player" onClick={handleAudioClick}>
        <div itemProp="headline" className="post__audio--headline">
          {post.title ? parse(post.title) : null}
        </div>
        <div className="post__audio--date">{post.postMeta.creationDate}</div>
      </button>

      <button
        aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
        className={`post__audio--control ${isSelected ? 'post__audio--control-selected' : ''}`}
        onClick={handleAudioClick}
      >
        {isCurrentlyPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
    </div>
  );
};

export default AudioPost;
