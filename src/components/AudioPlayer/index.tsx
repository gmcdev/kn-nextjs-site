'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

import ArrowDown from '@/icons/ArrowDown';
import PauseIcon from '@/icons/PauseIcon';
import PlayIcon from '@/icons/PlayIcon';
import SkipBackIcon from '@/icons/SkipBackIcon';
import SkipForwardIcon from '@/icons/SkipForwardIcon';
import SpeakerIcon from '@/icons/SpeakerIcon';
import useAudioStore from '@/stores/useAudioStore';
import { buildAudioTrack, getOrderedAudioPostIds } from '@/utils/audio-manager';
import { CDN_URL } from '@/utils/constants';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

const AudioPlayer = () => {
  const router = useRouter();
  const { siteScopes, store } = useSiteData();
  const { currentTrack, isPlaying, pause, play, resume, setIsPlaying, setWaveSurfer } = useAudioStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const currentTrackSrcRef = useRef<string | null>(null);

  const orderedAudioPostIds = useMemo(() => getOrderedAudioPostIds(store, siteScopes), [siteScopes, store]);

  const currentIndex = useMemo(() => {
    if (!currentTrack) {
      return -1;
    }
    return orderedAudioPostIds.indexOf(currentTrack.postId);
  }, [currentTrack, orderedAudioPostIds]);

  const playInDirection = useCallback(
    (startIndex: number, direction: 1 | -1) => {
      let index = startIndex;
      while (index >= 0 && index < orderedAudioPostIds.length) {
        const post = store.postMap[orderedAudioPostIds[index]];
        if (post) {
          const track = buildAudioTrack(store, post);
          if (track) {
            play(track);
            return;
          }
        }
        index += direction;
      }
    },
    [orderedAudioPostIds, play, store],
  );

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      playInDirection(currentIndex - 1, -1);
    }
  }, [currentIndex, playInDirection]);

  const handleNext = useCallback(() => {
    if (currentIndex < orderedAudioPostIds.length - 1) {
      playInDirection(currentIndex + 1, 1);
    }
  }, [currentIndex, orderedAudioPostIds.length, playInDirection]);

  useEffect(() => {
    if (!currentTrack?.src || !waveformRef.current) {
      return;
    }

    if (currentTrackSrcRef.current === currentTrack.src) {
      return;
    }
    currentTrackSrcRef.current = currentTrack.src;

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    const waveSurfer = WaveSurfer.create({
      autoplay: true,
      barGap: 2,
      barRadius: 3,
      barWidth: 3,
      container: waveformRef.current,
      cursorColor: '#ffff8f',
      cursorWidth: 2,
      height: 48,
      progressColor: '#549528',
      url: currentTrack.src,
      waveColor: '#265f00',
    });

    waveSurfer.on('play', () => {
      setIsPlaying(true);
    });
    waveSurfer.on('pause', () => {
      setIsPlaying(false);
    });
    waveSurfer.on('finish', () => {
      setIsPlaying(false);
      // Auto-advance: skip forward from current position, skipping unplayable posts
      const startIndex = orderedAudioPostIds.indexOf(currentTrack.postId) + 1;
      let index = startIndex;
      while (index < orderedAudioPostIds.length) {
        const nextPost = store.postMap[orderedAudioPostIds[index]];
        if (nextPost) {
          const nextTrack = buildAudioTrack(store, nextPost);
          if (nextTrack) {
            play(nextTrack);
            return;
          }
        }
        index++;
      }
    });

    waveSurferRef.current = waveSurfer;
    setWaveSurfer(waveSurfer);

    return () => {
      waveSurfer.destroy();
      waveSurferRef.current = null;
      setWaveSurfer(null);
    };
  }, [currentTrack?.src, currentTrack?.postId, orderedAudioPostIds, play, setIsPlaying, setWaveSurfer, store]);

  const handlePlayPause = () => {
    if (!waveSurferRef.current) {
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleGotoPost = () => {
    if (currentTrack?.link) {
      router.push(currentTrack.link);
    }
  };

  const toggleCollapseExpand = () => {
    setIsCollapsed((previous) => !previous);
  };

  if (!currentTrack) {
    return null;
  }

  const { postId, thumb, title } = currentTrack;
  const postDate = store.postMap[postId]?.postMeta.creationDate;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < orderedAudioPostIds.length - 1;

  return (
    <div className={`audio-player ${isCollapsed ? 'audio-player--collapsed' : ''}`}>
      {/* Mobile collapse handle — always visible */}
      <div className="audio-player__handle">
        <button
          aria-label={isCollapsed ? 'Expand player' : 'Collapse player'}
          className="audio-player__handle-button"
          onClick={toggleCollapseExpand}
        >
          {isCollapsed ? <SpeakerIcon /> : <ArrowDown />}
        </button>
      </div>

      <div className="audio-player__body">
        {/* Artwork with transport overlay */}
        <div className="audio-player__artwork-container">
          {thumb ? (
            <button
              aria-label="Go to post"
              className="audio-player__artwork"
              style={{ backgroundImage: `url(${CDN_URL}${thumb})` }}
              onClick={handleGotoPost}
            />
          ) : null}
          <div className="audio-player__transport">
            <button
              aria-label="Previous track"
              className={`audio-player__transport-button ${!hasPrevious ? 'audio-player__transport-button--inactive' : ''}`}
              onClick={handlePrevious}
            >
              <SkipBackIcon />
            </button>
            <button
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="audio-player__transport-button audio-player__transport-button--play"
              onClick={handlePlayPause}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              aria-label="Next track"
              className={`audio-player__transport-button ${!hasNext ? 'audio-player__transport-button--inactive' : ''}`}
              onClick={handleNext}
            >
              <SkipForwardIcon />
            </button>
          </div>
        </div>

        {/* Info + waveform */}
        <div className="audio-player__info">
          <button className="audio-player__title" onClick={handleGotoPost}>
            {title}
          </button>
          {postDate ? (
            <div className="audio-player__date">{postDate}</div>
          ) : null}
          <div className="audio-player__waveform">
            <div ref={waveformRef} />
            <div className="audio-player__waveform-mirror-fx" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
