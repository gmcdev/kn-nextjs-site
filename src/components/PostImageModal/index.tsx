'use client';

import parse from 'html-react-parser';
import { useRouter } from 'next/navigation';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

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
  const router = useRouter();
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
  const isNavigatingRef = useRef(false);
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

  // Update URL to /{categorySlug}/{tagSlug}/{postSlug} as user navigates
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

  // Keep the underlying page scrolled to the current tag as the modal navigates.
  useEffect(() => {
    if (!tag) {
      return;
    }
    const pageContainer = document.querySelector('.page-layout__page');
    if (!pageContainer) {
      return;
    }
    const tagElement = pageContainer.querySelector<HTMLElement>(`[data-tag-id="${tag.id}"]`);
    if (!tagElement) {
      return;
    }
    const containerTop = pageContainer.getBoundingClientRect().top;
    const tagTop = tagElement.getBoundingClientRect().top;
    pageContainer.scrollTo({
      behavior: 'smooth',
      top: pageContainer.scrollTop + (tagTop - containerTop),
    });
  }, [tag]);

  const close = useCallback(() => {
    if (tag && currentTagEntry) {
      const category = store.categoryMap[currentTagEntry.categoryId];
      if (category) {
        router.push(`/${category.slug}/${tag.slug}`);
      }
    }
    closeModal();
  }, [closeModal, currentTagEntry, router, store.categoryMap, tag]);

  const scrollToIndex = useCallback((index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) {
      return;
    }
    isNavigatingRef.current = true;
    carousel.scrollTo({ behavior: 'smooth', left: index * carousel.clientWidth });
    // Reset navigating flag after scroll settles
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 400);
  }, []);

  const jumpToTag = useCallback((tagEntry: { categoryId: string; tag: TagWithRelationships }, startIndex: number) => {
    setCurrentCategoryId(tagEntry.categoryId);
    setCurrentTagId(tagEntry.tag.id);
    switchTag(tagEntry.tag, startIndex);
  }, [setCurrentCategoryId, setCurrentTagId, switchTag]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1;
      goToIndex(nextIndex);
      scrollToIndex(nextIndex);
    } else if (currentTagIndex > 0) {
      const previousTagEntry = allTags[currentTagIndex - 1];
      const lastIndex = previousTagEntry.tag.postIds.length - 1;
      jumpToTag(previousTagEntry, lastIndex);
    }
  }, [allTags, currentIndex, currentTagIndex, goToIndex, jumpToTag, scrollToIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < postIds.length - 1) {
      const nextIndex = currentIndex + 1;
      goToIndex(nextIndex);
      scrollToIndex(nextIndex);
    } else if (currentTagIndex < allTags.length - 1) {
      const nextTagEntry = allTags[currentTagIndex + 1];
      jumpToTag(nextTagEntry, 0);
    }
  }, [allTags, currentIndex, currentTagIndex, goToIndex, jumpToTag, postIds.length, scrollToIndex]);

  // Boundary swipe: advance to the adjacent tag in the modal and navigate the
  // underlying page to that tag's route.
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

    // Suppress handleScroll so the scroll-snap reset to 0 during re-render
    // doesn't override the target index.
    isNavigatingRef.current = true;

    jumpToTag(targetEntry, startIndex);

    const category = store.categoryMap[targetEntry.categoryId];
    if (category) {
      router.push(`/${category.slug}/${targetEntry.tag.slug}`);
    }
  }, [allTags, currentTagIndex, jumpToTag, router, store.categoryMap]);

  // Sync currentIndex to scroll position as the user swipes. Uses the nearest
  // snap point so the dot updates as soon as the scroll crosses the midpoint.
  const handleScroll = useCallback(() => {
    if (isNavigatingRef.current) {
      return;
    }
    const carousel = carouselRef.current;
    if (!carousel || carousel.clientWidth === 0) {
      return;
    }
    const nextIndex = Math.round(carousel.scrollLeft / carousel.clientWidth);
    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < postIds.length) {
      goToIndex(nextIndex);
    }
  }, [currentIndex, goToIndex, postIds.length]);

  // Detect boundary swipes to navigate to previous/next tag.
  // We track peak displacement during touchmove rather than relying on the
  // touchend position, which can snap back due to scroll-container rubber-banding.
  const handleTouchStart = useCallback((event: ReactTouchEvent) => {
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
    if (!touchStart) {
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
    const SWIPE_THRESHOLD = 180;

    if (touchStart.atStart && touchStart.peakDelta > SWIPE_THRESHOLD) {
      handleBoundarySwipe('previous');
    } else if (touchStart.atEnd && touchStart.peakDelta < -SWIPE_THRESHOLD) {
      handleBoundarySwipe('next');
    }
  }, [handleBoundarySwipe]);

  // Detect boundary swipes from trackpad/Magic Mouse (wheel events, not touch).
  // Accumulates horizontal scroll delta while at a boundary, resets after a pause.
  const wheelDeltaRef = useRef(0);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!post || !carousel) {
      return;
    }

    const SWIPE_THRESHOLD = 500;

    const handleWheel = (event: WheelEvent) => {
      const atStart = currentIndex === 0;
      const atEnd = currentIndex === postIds.length - 1;
      if (!atStart && !atEnd) {
        wheelDeltaRef.current = 0;
        return;
      }

      // Accumulate horizontal delta (positive = scroll right = next)
      wheelDeltaRef.current += event.deltaX;

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      wheelTimeoutRef.current = setTimeout(() => {
        wheelDeltaRef.current = 0;
      }, 300);

      if (atStart && wheelDeltaRef.current < -SWIPE_THRESHOLD) {
        wheelDeltaRef.current = 0;
        handleBoundarySwipe('previous');
      } else if (atEnd && wheelDeltaRef.current > SWIPE_THRESHOLD) {
        wheelDeltaRef.current = 0;
        handleBoundarySwipe('next');
      }
    };

    carousel.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      carousel.removeEventListener('wheel', handleWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [currentIndex, handleBoundarySwipe, post, postIds.length]);

  // Scroll to correct position when modal opens or tag switches.
  useEffect(() => {
    if (post && carouselRef.current) {
      const carousel = carouselRef.current;
      requestAnimationFrame(() => {
        if (carousel.clientWidth > 0) {
          isNavigatingRef.current = true;
          carousel.scrollLeft = currentIndex * carousel.clientWidth;
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500);
        }
      });
    }
  }, [post, tag]); // Only on open or tag switch, not on index change

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
                  onClick={() => {
                    goToIndex(index);
                    scrollToIndex(index);
                  }}
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
          onScroll={handleScroll}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
        >
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

        <div className="post-image-modal__title">{currentPost?.title}</div>
      </div>
    </div>
  );
};

export default PostImageModal;
