'use client';

import Link from 'next/link';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SpeakerIcon from '@/icons/SpeakerIcon';
import { getRootCategory, orderTopCategories } from '@/lib/store';
import useAudioStore from '@/stores/useAudioStore';
import useNavigationStore from '@/stores/useNavigationStore';
import { buildAudioTrack, getOrderedAudioPostIds } from '@/utils/audio-manager';
import { SCROLL_COLLAPSE_THRESHOLD, SCROLL_EXPAND_THRESHOLD } from '@/utils/layout-constants';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

type HeaderProps = Readonly<{
  onMenuOpen: () => void;
  pageRef: RefObject<HTMLDivElement | null>;
}>;

const Header = ({ onMenuOpen, pageRef }: HeaderProps) => {
  const { siteScopes, store } = useSiteData();
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);
  const isCollapsed = useAudioStore((state) => state.collapsed);
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const play = useAudioStore((state) => state.play);
  const setCollapsed = useAudioStore((state) => state.setCollapsed);

  const categories = Object.values(store.categoryMap).filter((c) => !c.parentId);

  const orderedCategories = useMemo(() => {
    const current = currentCategoryId ? store.categoryMap[currentCategoryId] : undefined;
    const root = current ? getRootCategory(store, current) : undefined;
    return orderTopCategories(categories, root);
  }, [categories, currentCategoryId, store]);

  const orderedAudioPostIds = useMemo(() => getOrderedAudioPostIds(store, siteScopes), [siteScopes, store]);

  const handleAudioToggle = useCallback(() => {
    if (!currentTrack) {
      // Play the first available audio track
      for (const postId of orderedAudioPostIds) {
        const post = store.postMap[postId];
        if (post) {
          const track = buildAudioTrack(store, post);
          if (track) {
            play(track);
            return;
          }
        }
      }
    } else {
      setCollapsed(!isCollapsed);
    }
  }, [currentTrack, isCollapsed, orderedAudioPostIds, play, setCollapsed, store]);

  const hasScrolled = useRef(false);
  const [animClasses, setAnimClasses] = useState({
    bigLogo: 'header__logo__showBigLogo',
    header: 'header__showBigHeader',
    scrollLogo: 'header__logo-scroll__hideScrollLogo'
  });

  useEffect(() => {
    const pageRefElement = pageRef.current;
    const isCollapsedRef = { current: false };
    const handleScroll = () => {
      const scrollY = pageRefElement?.scrollTop ?? 0;
      if (!isCollapsedRef.current && scrollY > SCROLL_COLLAPSE_THRESHOLD) {
        isCollapsedRef.current = true;
        setAnimClasses({
          bigLogo: 'header__logo__hideBigLogo',
          header: 'header__hideBigHeader',
          scrollLogo: 'header__logo-scroll__showScrollLogo',
        });
        hasScrolled.current = true;
      } else if (isCollapsedRef.current && scrollY < SCROLL_EXPAND_THRESHOLD) {
        isCollapsedRef.current = false;
        setAnimClasses({
          bigLogo: 'header__logo__showBigLogo',
          header: 'header__showBigHeader',
          scrollLogo: 'header__logo-scroll__hideScrollLogo',
        });
      }
    };
    pageRefElement?.addEventListener('scroll', handleScroll);
    return () => {
      pageRefElement?.removeEventListener('scroll', handleScroll);
    };
  }, [pageRef]);

  return (
    <header className={`header ${animClasses.header}`}>
      <div className="header__bg" />
      <div className={`header__logo ${animClasses.bigLogo}`}>
        <Link href="/promoted">
          <img
            src="/site/images/kn_logo.png"
            alt="King Nitram & the Merry Universe"
            style={{ height: 145, width: 553 }}
          />
        </Link>
      </div>
      <div className={`header__logo-scroll ${animClasses.scrollLogo}`}>
        <Link href="/promoted">
          <img
            src="/site/images/kn_logo_mobile.png"
            alt="King Nitram & the Merry Universe"
            style={{ height: 28, width: 157 }}
          />
        </Link>
      </div>
      <div className="header__logo-mobile">
        <Link href="/promoted">
          <img
            src="/site/images/kn_logo_mobile.png"
            alt="King Nitram & the Merry Universe"
            style={{ height: 40, width: 217 }}
          />
        </Link>
        <div className="header__mobile-buttons">
          <button
            aria-label={currentTrack ? (isCollapsed ? 'Show player' : 'Hide player') : 'Play music'}
            className={`header__audio-button ${isPlaying ? 'header__audio-button--playing' : ''}`}
            onClick={handleAudioToggle}
          >
            <SpeakerIcon />
          </button>
          <button
            aria-label="Open navigation"
            className="header__menu-button"
            onClick={onMenuOpen}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <rect x="3" y="5" width="18" height="2" rx="1" />
              <rect x="3" y="11" width="18" height="2" rx="1" />
              <rect x="3" y="17" width="18" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>
      <div className="header__top-nav">
        <menu className="header__top-nav__menu">
          {orderedCategories.map((category) =>
            category ? (
              <li
                key={`menu-${category.slug}`}
                className={!category.isSelected ? 'header__top-nav__menu--tab' : 'header__top-nav__menu--tab-selected'}
              >
                <Link href={`/${category.slug}`}>{category.name.toUpperCase()}</Link>
              </li>
            ) : null
          )}
        </menu>
      </div>
    </header>
  );
};

export default Header;
