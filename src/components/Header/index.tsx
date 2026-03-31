'use client';

import Link from 'next/link';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { orderTopCategories } from '@/lib/store';
import useNavigationStore from '@/stores/useNavigationStore';
import useSettingsStore from '@/stores/useSettingsStore';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

type HeaderProps = Readonly<{
  pageRef: RefObject<HTMLDivElement | null>;
}>;

const Header = ({ pageRef }: HeaderProps) => {
  const { store } = useSiteData();
  const currentPost = useNavigationStore((state) => state.currentPost);
  const { displayMode, setDisplayMode } = useSettingsStore();

  const categories = Object.values(store.categoryMap).filter((c) => !c.parentId);

  const orderedCategories = useMemo(() => {
    const postCategoryId = currentPost?.categoryIds.find(
      (categoryId: string) => !store.categoryMap[categoryId]?.parentId,
    );
    const postCategory = postCategoryId ? store.categoryMap[postCategoryId] : undefined;
    return orderTopCategories(categories, postCategory);
  }, [categories, currentPost, store.categoryMap]);

  const hasScrolled = useRef(false);
  const [animClasses, setAnimClasses] = useState({
    bigLogo: 'header__logo__showBigLogo',
    header: 'header__showBigHeader',
    scrollLogo: 'header__logo-scroll__hideScrollLogo',
  });

  useEffect(() => {
    const pageRefElement = pageRef.current;
    const handleScroll = () => {
      const scrollY = pageRefElement?.scrollTop ?? 0;
      if (scrollY > 140) {
        setAnimClasses({
          bigLogo: 'header__logo__hideBigLogo',
          header: 'header__hideBigHeader',
          scrollLogo: 'header__logo-scroll__showScrollLogo',
        });
        hasScrolled.current = true;
      } else if (hasScrolled.current) {
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
        <img
          src="/site/images/kn_logo.png"
          alt="King Nitram & the Merry Universe"
          style={{ height: 145, width: 553 }}
        />
      </div>
      <div className={`header__logo-scroll ${animClasses.scrollLogo}`}>
        <img
          src="/site/images/kn_logo_mobile.png"
          alt="King Nitram & the Merry Universe"
          style={{ height: 29, width: 157 }}
        />
      </div>
      <div className="header__logo-mobile">
        <img
          src="/site/images/kn_logo_mobile.png"
          alt="King Nitram & the Merry Universe"
          style={{ height: 40, width: 217 }}
        />
      </div>
      <div className="header__top-nav">
        <menu className="header__top-nav__menu">
          {orderedCategories.map((category) =>
            category ? (
              <li
                key={`menu-${category.slug}`}
                className={
                  !category.isSelected
                    ? 'header__top-nav__menu--tab'
                    : 'header__top-nav__menu--tab-selected'
                }
              >
                <Link href={`/${category.slug}`}>{category.name.toUpperCase()}</Link>
              </li>
            ) : null,
          )}
        </menu>
        <div className="header__top-nav__view-control">
          <button
            className={displayMode === 'grid' ? 'header__top-nav__view-control--active' : ''}
            onClick={() => setDisplayMode('grid')}
            aria-label="Grid view"
          >
            ▦
          </button>
          <button
            className={displayMode === 'list' ? 'header__top-nav__view-control--active' : ''}
            onClick={() => setDisplayMode('list')}
            aria-label="List view"
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
