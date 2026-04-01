'use client';

import { useCallback, useEffect, useRef } from 'react';

import ArrowLeft from '@/icons/ArrowLeft';
import ArrowRight from '@/icons/ArrowRight';
import CircleIcon from '@/icons/CircleIcon';
import useModalStore from '@/stores/useModalStore';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

const PostImageModal = () => {
  const { store } = useSiteData();
  const { close, currentIndex, goToIndex, post, tag } = useModalStore();
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  const postIds = tag?.postIds ?? [];
  const currentPost = postIds[currentIndex] ? store.postMap[postIds[currentIndex]] : post;
  const cdnFeaturedImage = currentPost?.cdnFeaturedImage;

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

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1;
      goToIndex(nextIndex);
      scrollToIndex(nextIndex);
    }
  }, [currentIndex, goToIndex, scrollToIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < postIds.length - 1) {
      const nextIndex = currentIndex + 1;
      goToIndex(nextIndex);
      scrollToIndex(nextIndex);
    }
  }, [currentIndex, goToIndex, postIds.length, scrollToIndex]);

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
      carouselRef.current.scrollLeft = currentIndex * carouselRef.current.clientWidth;
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
              className={`post-image-modal__nav-arrow ${currentIndex === 0 ? 'post-image-modal__nav-arrow--inactive' : ''}`}
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
              className={`post-image-modal__nav-arrow ${currentIndex === postIds.length - 1 ? 'post-image-modal__nav-arrow--inactive' : ''}`}
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
          {postIds.map((postId) => {
            const carouselPost = store.postMap[postId];
            const image = carouselPost?.cdnFeaturedImage;
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
