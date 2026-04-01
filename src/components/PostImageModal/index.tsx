'use client';

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
  const { siteScopes, store } = useSiteData();
  const { close: closeModal, currentIndex, goToIndex, post, switchTag, tag } = useModalStore();
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);
  const setCurrentCategoryId = useNavigationStore((state) => state.setCurrentCategoryId);
  const setCurrentTagId = useNavigationStore((state) => state.setCurrentTagId);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  const { currentTrack, isPlaying, pause: pauseAudio, play: playAudio, resume: resumeAudio } = useAudioStore();

  const postIds = tag?.postIds ?? [];
  const currentPost = postIds[currentIndex] ? store.postMap[postIds[currentIndex]] : post;
  const cdnFeaturedImage = currentPost?.cdnFeaturedImage;
  const isAudioPost = currentPost?.postMeta.contentType === 'audio';
  const isCurrentTrack = currentTrack?.postId === currentPost?.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  // Update URL to /{categorySlug}/{tagSlug}/{postSlug} as user navigates
  useEffect(() => {
    if (!currentPost || !tag || !currentCategoryId) {
      return;
    }
    const category = store.categoryMap[currentCategoryId];
    if (!category) {
      return;
    }
    const path = `/${category.slug}/${tag.slug}/${currentPost.slug}`;
    replaceUrl(path);
  }, [currentCategoryId, currentPost, store.categoryMap, tag]);

  const close = useCallback(() => {
    // Revert URL to /{categorySlug}/{tagSlug}
    if (tag && currentCategoryId) {
      const category = store.categoryMap[currentCategoryId];
      if (category) {
        const path = `/${category.slug}/${tag.slug}`;
        replaceUrl(path);
      }
    }
    closeModal();
  }, [closeModal, currentCategoryId, store.categoryMap, tag]);

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

  const allTags = useMemo(() => collectAllTags(siteScopes), [siteScopes]);
  const currentTagIndex = useMemo(
    () => tag ? allTags.findIndex((entry) => entry.tag.id === tag.id) : -1,
    [allTags, tag],
  );

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

  // Detect scroll-snap settling to sync currentIndex
  const handleScroll = useCallback(() => {
    if (isNavigatingRef.current) {
      return;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const carousel = carouselRef.current;
      if (!carousel || carousel.clientWidth === 0) {
        return;
      }
      const nextIndex = Math.round(carousel.scrollLeft / carousel.clientWidth);
      if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < postIds.length) {
        goToIndex(nextIndex);
      }
    }, 100);
  }, [currentIndex, goToIndex, postIds.length]);

  // Scroll to initial position when modal opens
  useEffect(() => {
    if (post && carouselRef.current) {
      const carousel = carouselRef.current;
      // Wait for layout so clientWidth is accurate
      requestAnimationFrame(() => {
        if (carousel.clientWidth > 0) {
          isNavigatingRef.current = true;
          carousel.scrollLeft = currentIndex * carousel.clientWidth;
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 100);
        }
      });
    }
  }, [post, tag]); // Only on open, not on index change

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
        >
          {postIds.map((postId, index) => {
            const carouselPost = store.postMap[postId];
            const image = carouselPost?.cdnFeaturedImage;
            const isSlideAudio = carouselPost?.postMeta.contentType === 'audio';
            const isSlideCurrentTrack = currentTrack?.postId === postId;
            const isSlidePlaying = isSlideCurrentTrack && isPlaying;

            return (
              <div className="post-image-modal__slide" key={postId}>
                {image ? (
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
