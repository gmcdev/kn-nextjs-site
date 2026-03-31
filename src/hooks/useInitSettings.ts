'use client';

import { useEffect } from 'react';

import { useMediaSize } from '@/components/MediaListener';
import useSettingsStore from '@/stores/useSettingsStore';

const useInitSettings = () => {
  const mediaSize = useMediaSize();
  const { initDisplayMode, setDisplayMode } = useSettingsStore();

  // Init from localStorage on mount
  useEffect(() => {
    initDisplayMode();
  }, [initDisplayMode]);

  // Force list mode on small screens
  useEffect(() => {
    if (mediaSize === 'small') {
      setDisplayMode('list');
    }
  }, [mediaSize, setDisplayMode]);
};

export default useInitSettings;
