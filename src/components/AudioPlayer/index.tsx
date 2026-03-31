'use client';

import formatDuration from 'format-duration';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

import ArrowDown from '@/icons/ArrowDown';
import ArrowUp from '@/icons/ArrowUp';
import PauseIcon from '@/icons/PauseIcon';
import PlayIcon from '@/icons/PlayIcon';
import useAudioStore from '@/stores/useAudioStore';
import { CDN_URL } from '@/utils/constants';

import './style.scss';

const AudioPlayer = () => {
  const router = useRouter();
  const { currentTrack, isPlaying, pause, resume, setIsPlaying, setWaveSurfer } = useAudioStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('0:00');
  const [remainingTime, setRemainingTime] = useState<string>('0:00');

  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const waveformProgressRef = useRef<HTMLDivElement>(null);
  const currentTrackSrcRef = useRef<string | null>(null);

  const updateProgressUI = useCallback(
    (time?: number, duration?: number) => {
      if (!time || !duration) {
        return;
      }
      setCurrentTime(formatDuration(time * 1000));
      setRemainingTime(formatDuration((duration - time) * 1000));
      const containerRect = waveformContainerRef.current?.getBoundingClientRect();
      if (containerRect && waveformProgressRef.current) {
        const percentComplete = time / duration;
        waveformProgressRef.current.style.left = `${percentComplete * containerRect.width}px`;
      }
    },
    [],
  );

  // Initialize or update WaveSurfer when track changes
  useEffect(() => {
    if (!currentTrack?.src || !waveformRef.current) {
      return;
    }

    // Same track, no need to recreate
    if (currentTrackSrcRef.current === currentTrack.src) {
      return;
    }
    currentTrackSrcRef.current = currentTrack.src;

    // Destroy previous instance
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    const waveSurfer = WaveSurfer.create({
      autoplay: true,
      barGap: 4,
      barRadius: 5,
      barWidth: 10,
      container: waveformRef.current,
      cursorColor: '#ffff8f',
      cursorWidth: 3,
      progressColor: '#549528',
      url: currentTrack.src,
      waveColor: '#265f00',
    });

    waveSurfer.on('timeupdate', (time) => {
      updateProgressUI(time, waveSurfer.getDuration());
    });
    waveSurfer.on('seeking', (time) => {
      updateProgressUI(time, waveSurfer.getDuration());
    });
    waveSurfer.on('drag', (time) => {
      updateProgressUI(time, waveSurfer.getDuration());
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
  }, [currentTrack?.src, setIsPlaying, setWaveSurfer, updateProgressUI]);

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

  const { thumb, title } = currentTrack;
  const botClassName = `site-frame__bot${isCollapsed ? ' site-frame__bot--collapsed' : ''}`;

  return (
    <div className={botClassName}>
      <div className="music">
        {thumb ? (
          <button
            aria-label="Go to post"
            className="music__thumbnail"
            style={{ backgroundImage: `url(${CDN_URL}${thumb})` }}
            onClick={handleGotoPost}
          />
        ) : null}
        <div className="music__player">
          <button className="music__player-headline" onClick={handleGotoPost}>
            {title}
          </button>
          <div className="music__player--waveform" ref={waveformContainerRef}>
            <div ref={waveformRef} />
            <div className="music__player--waveform-mirror-fx" />
            <div
              className="music__player--waveform-progress"
              ref={waveformProgressRef}
              style={{ display: isPlaying ? 'block' : 'none' }}
            >
              <div className="music__player--waveform-progress-played">{currentTime}</div>
              <div className="music__player--waveform-progress-remaining">{remainingTime}</div>
            </div>
          </div>
        </div>
        <button aria-label={isPlaying ? 'Pause' : 'Play'} className="music__control" onClick={handlePlayPause}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="music__collapse-expand">
          <button aria-label={isCollapsed ? 'Expand player' : 'Collapse player'} className="music__collapse-expand--inner" onClick={toggleCollapseExpand}>
            {isCollapsed ? <ArrowUp /> : <ArrowDown />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
