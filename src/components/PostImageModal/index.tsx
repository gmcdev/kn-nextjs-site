'use client';

import parse from 'html-react-parser';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import ArrowLeft from '@/icons/ArrowLeft';
import ArrowRight from '@/icons/ArrowRight';
import CircleIcon from '@/icons/CircleIcon';
import PauseIcon from '@/icons/PauseIcon';
import PlayIcon from '@/icons/PlayIcon';
import SkipBackIcon from '@/icons/SkipBackIcon';
import SkipForwardIcon from '@/icons/SkipForwardIcon';
import { collectAllTags } from '@/lib/store';
import type { TagWithRelationships } from '@/lib/types';
import useAudioStore from '@/stores/useAudioStore';
import useModalStore from '@/stores/useModalStore';
import useNavigationStore from '@/stores/useNavigationStore';
import { buildAudioTrack } from '@/utils/audio-manager';
import { replaceUrl } from '@/utils/withBasePath';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

const PostImageModal = () => {
  const { siteScopes, store } = useSiteData();
  const closeModal = useModalStore((state) => state.close);
  const currentIndex = useModalStore((state) => state.currentIndex);
  const goToIndex = useModalStore((state) => state.goToIndex);
  const post = useModalStore((state) => state.post);
  const switchTag = useModalStore((state) => state.switchTag);
  const tag = useModalStore((state) => state.tag);
  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const pauseAudio = useAudioStore((state) => state.pause);
  const playAudio = useAudioStore((state) => state.play);
  const resumeAudio = useAudioStore((state) => state.resume);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselInnerRef = useRef<HTMLDivElement>(null);
  const preModalUrlRef = useRef<string | null>(null);
  const touchStartRef = useRef<{ x: number; atStart: boolean; atEnd: boolean; peakDelta: number } | null>(null);

  const postIds = tag?.postIds ?? [];
  const currentPost = postIds[currentIndex] ? store.postMap[postIds[currentIndex]] : post;
  const isCurrentTrack = currentTrack?.postId === currentPost?.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const allTags = useMemo(() => collectAllTags(siteScopes), [siteScopes]);
  const currentTagEntry = useMemo(
    () => tag ? allTags.find((entry) => entry.tag.id === tag.id) : undefined,
    [allTags, tag],
  );
  const currentTagIndex = useMemo(
    () => currentTagEntry ? allTags.indexOf(currentTagEntry) : -1,
    [allTags, currentTagEntry],
  );

  // Capture the URL at the moment the modal opens so it can be restored on close.
  useEffect(() => {
    if (post && preModalUrlRef.current === null) {
      preModalUrlRef.current = window.location.href;
    } else if (!post) {
      preModalUrlRef.current = null;
    }
  }, [post]);

  // Update URL to /{categorySlug}/{tagSlug}/{postSlug} as user navigates.
  // Uses replaceState so the underlying page never navigates or scrolls.
  useEffect(() => {
    if (!currentPost || !tag || !currentTagEntry) {
      return;
    }
    const category = store.categoryMap[currentTagEntry.categoryId];
    if (!category) {
      return;
    }
    const path = `/${category.slug}/${tag.slug}/${currentPost.slug}`;
    replaceUrl(path);
  }, [currentPost, currentTagEntry, store.categoryMap, tag]);

  const close = useCallback(() => {
    if (preModalUrlRef.current) {
      window.history.replaceState({}, '', preModalUrlRef.current);
    }
    closeModal();
  }, [closeModal]);

  // Position the carousel at the correct slide immediately (no animation) when the
  // modal opens or the tag switches. useLayoutEffect fires synchronously after the
  // DOM commit before paint, so the first frame always shows the right slide.
  // currentIndex is intentionally excluded from deps — it holds the correct target
  // value on every tag-switch render because switchTag sets both atomically.
  useLayoutEffect(() => {
    const inner = carouselInnerRef.current;
    if (post && inner) {
      inner.style.transition = 'none';
      inner.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  }, [post, tag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to a slide within the current tag with a smooth CSS transition.
  const navigateTo = useCallback((index: number) => {
    goToIndex(index);
    const inner = carouselInnerRef.current;
    if (inner) {
      inner.style.transition = 'transform 0.3s ease';
      inner.style.transform = `translateX(-${index * 100}%)`;
    }
  }, [goToIndex]);

  const jumpToTag = useCallback((tagEntry: { categoryId: string; tag: TagWithRelationships }, startIndex: number) => {
    setCurrentCategoryId(tagEntry.categoryId);
    setCurrentTagId(tagEntry.tag.id);
    switchTag(tagEntry.tag, startIndex);
  }, [setCurrentCategoryId, setCurrentTagId, switchTag]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      navigateTo(currentIndex - 1);
    } else if (currentTagIndex > 0) {
      const previousTagEntry = allTags[currentTagIndex - 1];
      const lastIndex = previousTagEntry.tag.postIds.length - 1;
      jumpToTag(previousTagEntry, lastIndex);
    }
  }, [allTags, currentIndex, currentTagIndex, jumpToTag, navigateTo]);

  const goToNext = useCallback(() => {
    if (currentIndex < postIds.length - 1) {
      navigateTo(currentIndex + 1);
    } else if (currentTagIndex < allTags.length - 1) {
      const nextTagEntry = allTags[currentTagIndex + 1];
      jumpToTag(nextTagEntry, 0);
    }
  }, [allTags, currentIndex, currentTagIndex, jumpToTag, navigateTo, postIds.length]);

  const handleBoundarySwipe = useCallback((direction: 'next' | 'previous') => {
    const targetEntry = direction === 'previous'
      ? currentTagIndex > 0 ? allTags[currentTagIndex - 1] : null
      : currentTagIndex < allTags.length - 1 ? allTags[currentTagIndex + 1] : null;

    if (!targetEntry) {
      return;
    }

    const startIndex = direction === 'previous'
      ? targetEntry.tag.postIds.length - 1
      : 0;

    jumpToTag(targetEntry, startIndex);
  }, [allTags, currentTagIndex, jumpToTag]);

  const handleTouchStart = useCallback((event: ReactTouchEvent) => {
    if (event.touches.length > 1 || (window.visualViewport?.scale ?? 1) > 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStartRef.current = {
      atEnd: currentIndex === postIds.length - 1,
      atStart: currentIndex === 0,
      peakDelta: 0,
      x: touch.clientX,
    };
  }, [currentIndex, postIds.length]);

  const handleTouchMove = useCallback((event: ReactTouchEvent) => {
    const touchStart = touchStartRef.current;
    if (!touchStart || event.touches.length > 1 || (window.visualViewport?.scale ?? 1) > 1) {
      return;
    }
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    if (Math.abs(deltaX) > Math.abs(touchStart.peakDelta)) {
      touchStart.peakDelta = deltaX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const touchStart = touchStartRef.current;
    touchStartRef.current = null;
    if (!touchStart) {
      return;
    }
    const BOUNDARY_THRESHOLD = 180;
    const WITHIN_THRESHOLD = 50;

    if (touchStart.atStart && touchStart.peakDelta > BOUNDARY_THRESHOLD) {
      handleBoundarySwipe('previous');
    } else if (touchStart.atEnd && touchStart.peakDelta < -BOUNDARY_THRESHOLD) {
      handleBoundarySwipe('next');
    } else if (!touchStart.atStart && touchStart.peakDelta > WITHIN_THRESHOLD) {
      goToPrevious();
    } else if (!touchStart.atEnd && touchStart.peakDelta < -WITHIN_THRESHOLD) {
      goToNext();
    }
  }, [goToNext, goToPrevious, handleBoundarySwipe]);

  // Detect swipes from trackpad/Magic Mouse (wheel events, not touch).
  // Accumulates horizontal scroll delta, resets after a pause, and enforces a
  // post-navigation cooldown so trailing momentum events don't trigger extra slides.
  const wheelDeltaRef = useRef(0);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wheelCooldownRef = useRef(false);
  const wheelCooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!post || !carousel) {
      return;
    }

    const WITHIN_THRESHOLD = 150;
    const BOUNDARY_THRESHOLD = 1000;

    const navigate = (action: () => void) => {
      wheelDeltaRef.current = 0;
      wheelCooldownRef.current = true;
      action();
      if (wheelCooldownTimeoutRef.current) {
        clearTimeout(wheelCooldownTimeoutRef.current);
      }
      wheelCooldownTimeoutRef.current = setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 600);
    };

    const handleWheel = (event: WheelEvent) => {
      if (wheelCooldownRef.current) {
        return;
      }

      const atStart = currentIndex === 0;
      const atEnd = currentIndex === postIds.length - 1;

      // Accumulate horizontal delta (positive = scroll right = next)
      wheelDeltaRef.current += event.deltaX;

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      wheelTimeoutRef.current = setTimeout(() => {
        wheelDeltaRef.current = 0;
      }, 150);

      if (atStart && wheelDeltaRef.current < -BOUNDARY_THRESHOLD) {
        navigate(() => handleBoundarySwipe('previous'));
      } else if (atEnd && wheelDeltaRef.current > BOUNDARY_THRESHOLD) {
        navigate(() => handleBoundarySwipe('next'));
      } else if (!atEnd && wheelDeltaRef.current > WITHIN_THRESHOLD) {
        navigate(goToNext);
      } else if (!atStart && wheelDeltaRef.current < -WITHIN_THRESHOLD) {
        navigate(goToPrevious);
      }
    };

    carousel.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      carousel.removeEventListener('wheel', handleWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      // wheelCooldownTimeoutRef is intentionally not cleared here — it must survive
      // effect re-runs (triggered by currentIndex changing after navigation) so the
      // post-navigation cooldown continues across the re-render.
    };
  }, [currentIndex, goToNext, goToPrevious, handleBoundarySwipe, post, postIds.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    },
    [close, goToNext, goToPrevious],
  );

  useEffect(() => {
    if (post) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, post]);

  const isAtAbsoluteStart = currentIndex === 0 && currentTagIndex <= 0;
  const isAtAbsoluteEnd = currentIndex === postIds.length - 1 && currentTagIndex >= allTags.length - 1;

  if (!post || !tag) {
    return null;
  }

  return (
    <div className="post-image-modal" onClick={close}>
      <button className="post-image-modal__close" onClick={close} aria-label="Close">
        ✕
      </button>

      <div
        className="post-image-modal__content"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="post-image-modal__header">
          <div className="post-image-modal__tag-name">{tag.name}</div>
          <div className="post-image-modal__nav">
            <button
              className={`post-image-modal__nav-arrow ${isAtAbsoluteStart ? 'post-image-modal__nav-arrow--inactive' : ''}`}
              onClick={goToPrevious}
              aria-label="Previous"
            >
              <ArrowLeft />
            </button>
            <div className="post-image-modal__nav-dots">
              {postIds.map((postId, index) => (
                <button
                  className={`post-image-modal__nav-dot ${index === currentIndex ? 'post-image-modal__nav-dot--active' : ''}`}
                  key={postId}
                  onClick={() => navigateTo(index)}
                  aria-label={`Go to post ${index + 1}`}
                >
                  <CircleIcon />
                </button>
              ))}
            </div>
            <button
              className={`post-image-modal__nav-arrow ${isAtAbsoluteEnd ? 'post-image-modal__nav-arrow--inactive' : ''}`}
              onClick={goToNext}
              aria-label="Next"
            >
              <ArrowRight />
            </button>
          </div>
        </div>

        <div
          className="post-image-modal__carousel"
          ref={carouselRef}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
        >
          <div className="post-image-modal__carousel-inner" ref={carouselInnerRef}>
            {postIds.map((postId, index) => {
              const carouselPost = store.postMap[postId];
              const image = carouselPost?.cdnFeaturedImage;
              const isSlideAudio = carouselPost?.postMeta.contentType === 'audio';
              const isSlideVideo = carouselPost?.postMeta.contentType === 'video';
              const isSlideCurrentTrack = currentTrack?.postId === postId;
              const isSlidePlaying = isSlideCurrentTrack && isPlaying;

              return (
                <div className="post-image-modal__slide" key={postId}>
                  {isSlideVideo ? (
                    <div className="post-image-modal__video-content">
                      {carouselPost?.content ? parse(carouselPost.content) : null}
                    </div>
                  ) : image ? (
                    <img
                      alt={image.altText || carouselPost.title}
                      className="post-image-modal__image"
                      draggable={false}
                      sizes="95vw"
                      srcSet={image.srcSet}
                    />
                  ) : null}
                  {isSlideAudio && index === currentIndex ? (
                    <div className="post-image-modal__audio-transport">
                      <button
                        aria-label="Previous track"
                        className={`post-image-modal__audio-button ${isAtAbsoluteStart ? 'post-image-modal__audio-button--inactive' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          goToPrevious();
                        }}
                      >
                        <SkipBackIcon />
                      </button>
                      <button
                        aria-label={isSlidePlaying ? 'Pause' : 'Play'}
                        className="post-image-modal__audio-button post-image-modal__audio-button--play"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!isSlideCurrentTrack) {
                            const track = buildAudioTrack(store, carouselPost);
                            if (track) {
                              playAudio(track);
                            }
                          } else if (isSlidePlaying) {
                            pauseAudio();
                          } else {
                            resumeAudio();
                          }
                        }}
                      >
                        {isSlidePlaying ? <PauseIcon /> : <PlayIcon />}
                      </button>
                      <button
                        aria-label="Next track"
                        className={`post-image-modal__audio-button ${isAtAbsoluteEnd ? 'post-image-modal__audio-button--inactive' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          goToNext();
                        }}
                      >
                        <SkipForwardIcon />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="post-image-modal__title">{currentPost?.title}</div>
      </div>
    </div>
  );
};

export default PostImageModal;
