'use client';

import type { PropsWithChildren } from 'react';
import { useRef } from 'react';

import Header from '../Header';
import SiteMap from '../SiteMap';

import './style.scss';

type PageLayoutProps = Readonly<PropsWithChildren>;

const PageLayout = ({ children }: PageLayoutProps) => {
  const pageRef = useRef<HTMLDivElement>(null);

  return (
    <div className="page-layout">
      <Header pageRef={pageRef} />
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
    </div>
  );
};

export default PageLayout;
