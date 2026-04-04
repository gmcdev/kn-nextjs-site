import { create } from 'zustand';
import type WaveSurfer from 'wavesurfer.js';

export type AudioTrack = {
  link?: string;
  postId: string;
  src: string;
  thumb?: string;
  title: string;
};

type AudioState = {
  collapsed: boolean;
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  waveSurfer: WaveSurfer | null;
};

type AudioActions = {
  pause: () => void;
  play: (track: AudioTrack) => void;
  resume: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setWaveSurfer: (waveSurfer: WaveSurfer | null) => void;
};

const useAudioStore = create<AudioState & AudioActions>((set, get) => ({
  collapsed: true,
  currentTrack: null,
  isPlaying: false,
  waveSurfer: null,

  pause: () => {
    const { waveSurfer } = get();
    if (waveSurfer) {
      waveSurfer.pause();
    }
    set({ isPlaying: false });
  },

  play: (track) => {
    set({ collapsed: false, currentTrack: track, isPlaying: true });
  },

  setCollapsed: (collapsed) => {
    set({ collapsed });
  },

  resume: () => {
    const { waveSurfer } = get();
    if (waveSurfer) {
      waveSurfer.play();
    }
    set({ isPlaying: true });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  setWaveSurfer: (waveSurfer) => {
    set({ waveSurfer });
  },
}));

export default useAudioStore;
