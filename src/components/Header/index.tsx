'use client';

import Link from 'next/link';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { orderTopCategories } from '@/lib/store';
import useNavigationStore from '@/stores/useNavigationStore';

import { useSiteData } from '../SiteDataProvider';

import './style.scss';

type HeaderProps = Readonly<{
  pageRef: RefObject<HTMLDivElement | null>;
}>;

const Header = ({ pageRef }: HeaderProps) => {
  const { store } = useSiteData();
  const currentCategoryId = useNavigationStore((state) => state.currentCategoryId);

  const categories = Object.values(store.categoryMap).filter((c) => !c.parentId);

  const orderedCategories = useMemo(() => {
    // Walk up from the current category to find the root
    let rootCategory = currentCategoryId ? store.categoryMap[currentCategoryId] : undefined;
    while (rootCategory?.parentId && store.categoryMap[rootCategory.parentId]) {
      rootCategory = store.categoryMap[rootCategory.parentId];
    }
    return orderTopCategories(categories, rootCategory);
  }, [categories, currentCategoryId, store.categoryMap]);

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
      if (!isCollapsedRef.current && scrollY > 140) {
        isCollapsedRef.current = true;
        setAnimClasses({
          bigLogo: 'header__logo__hideBigLogo',
          header: 'header__hideBigHeader',
          scrollLogo: 'header__logo-scroll__showScrollLogo',
        });
        hasScrolled.current = true;
      } else if (isCollapsedRef.current && scrollY < 30) {
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
          style={{ height: 28, width: 157 }}
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
