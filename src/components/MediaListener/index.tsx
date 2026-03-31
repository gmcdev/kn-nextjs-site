'use client';

import { type Dispatch, type SetStateAction, createContext, useContext, useLayoutEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';

const QUERY_LARGE = '1024px';
const QUERY_MEDIUM = '968px';
const QUERY_SMALL = '780px';

type MediaSize = 'small' | 'medium' | 'large';

const MediaContext = createContext<MediaSize>('large');

const buildMatcher = (
  query: string,
  value: MediaSize,
  setMedia: Dispatch<SetStateAction<MediaSize>>,
) => {
  const matcher = window.matchMedia(`(max-width: ${query})`);
  const handler = (event: MediaQueryList | MediaQueryListEvent) => {
    if (event.matches) {
      setMedia(value);
    }
  };

  matcher.addEventListener('change', handler);
  handler(matcher);

  return () => {
    matcher.removeEventListener('change', handler);
  };
};

type MediaListenerProps = Readonly<PropsWithChildren>;

const MediaListener = ({ children }: MediaListenerProps) => {
  const [media, setMedia] = useState<MediaSize>('large');

  useLayoutEffect(() => {
    const cleanupLarge = buildMatcher(QUERY_LARGE, 'large', setMedia);
    const cleanupMedium = buildMatcher(QUERY_MEDIUM, 'medium', setMedia);
    const cleanupSmall = buildMatcher(QUERY_SMALL, 'small', setMedia);

    return () => {
      cleanupLarge();
      cleanupMedium();
      cleanupSmall();
    };
  }, []);

  return <MediaContext.Provider value={media}>{children}</MediaContext.Provider>;
};

export default MediaListener;

export const useMediaSize = () => {
  return useContext(MediaContext);
};
