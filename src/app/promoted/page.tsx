import type { Metadata } from 'next';

import PromotedPageClient from './PromotedPageClient';

export const metadata: Metadata = {
  description: 'Featured art and music by King Nitram',
  openGraph: {
    title: 'Promoted',
  },
  title: 'Promoted',
};

const PromotedPage = () => {
  return <PromotedPageClient />;
};

export default PromotedPage;
