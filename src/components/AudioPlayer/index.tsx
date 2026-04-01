'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

import ArrowDown from '@/icons/ArrowDown';
import ArrowUp from '@/icons/ArrowUp';
import PauseIcon from '@/icons/PauseIcon';
import PlayIcon from '@/icons/PlayIcon';
import SpeakerIcon from '@/icons/SpeakerIcon';
import useAudioStore from '@/stores/useAudioStore';
import { CDN_URL } from '@/utils/constants';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

const AudioPlayer = () => {
  const router = useRouter();
  const { store } = useSiteData();
  const { currentTrack, isPlaying, pause, resume, setIsPlaying, setWaveSurfer } = useAudioStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const currentTrackSrcRef = useRef<string | null>(null);

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
    });

    waveSurferRef.current = waveSurfer;
    setWaveSurfer(waveSurfer);

    return () => {
      waveSurfer.destroy();
      waveSurferRef.current = null;
      setWaveSurfer(null);
    };
  }, [currentTrack?.src, setIsPlaying, setWaveSurfer]);

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
        {/* Artwork with play/pause overlay */}
        <div className="audio-player__artwork-container">
          {thumb ? (
            <button
              aria-label="Go to post"
              className="audio-player__artwork"
              style={{ backgroundImage: `url(${CDN_URL}${thumb})` }}
              onClick={handleGotoPost}
            />
          ) : null}
          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="audio-player__play-pause"
            onClick={handlePlayPause}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
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
