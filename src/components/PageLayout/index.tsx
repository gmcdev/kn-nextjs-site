'use client';

import { useCallback, useState } from 'react';
import type { PropsWithChildren, RefObject } from 'react';

import Header from '../Header';
import MobileDrawer from '../MobileDrawer';
import SiteMap from '../SiteMap';

import './style.scss';

type PageLayoutProps = Readonly<PropsWithChildren<{
  pageRef: RefObject<HTMLDivElement | null>;
}>>;

const PageLayout = ({ children, pageRef }: PageLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className="page-layout">
      <Header pageRef={pageRef} onMenuOpen={openDrawer} />
      <main className="page-layout__main">
        <SiteMap pageRef={pageRef} />
        <div className="page-layout__page" ref={pageRef}>
          <div className="page-layout__content">{children}</div>
          <footer>
            <div className="page-layout__content">© {new Date().getFullYear()} Greg Connell</div>
          </footer>
        </div>
        <div className="page-layout__scroll-shadow-bottom" />
      </main>
      <MobileDrawer isOpen={drawerOpen} onClose={closeDrawer} />
    </div>
  );
};

export default PageLayout;
